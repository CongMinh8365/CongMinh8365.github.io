(function () {
  let events = window.CTF_EVENTS || [];
  let eventMap = new Map(events.map((event) => [event.slug, event]));
  let posts = visiblePosts(window.CTF_POSTS || []);
  const page = document.body.dataset.page;
  const pageSize = 6;
  const fallbackEvent = {
    slug: "uncategorized",
    name: "Uncategorized",
    date: "",
    summary: "Writeups without an assigned CTF event."
  };
  let redrawCurrentView = null;

  function deletedSlugs() {
    try {
      return new Set(JSON.parse(localStorage.getItem("ctf-deleted-post-slugs") || "[]"));
    } catch {
      return new Set();
    }
  }

  function rememberDeletedSlug(slug) {
    try {
      const slugs = deletedSlugs();
      slugs.add(slug);
      localStorage.setItem("ctf-deleted-post-slugs", JSON.stringify([...slugs]));
    } catch {
      // Local UI hiding is best-effort only.
    }
  }

  function visiblePosts(source) {
    const hidden = deletedSlugs();
    return [...source]
      .filter((post) => !hidden.has(post.slug))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function applyIndex(nextEvents, nextPosts) {
    window.CTF_EVENTS = nextEvents;
    window.CTF_POSTS = nextPosts;
    events = nextEvents;
    eventMap = new Map(events.map((event) => [event.slug, event]));
    posts = visiblePosts(nextPosts);
  }

  function formatDate(value) {
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  }

  function tagElement(tag, isButton = false) {
    const element = document.createElement(isButton ? "button" : "span");
    element.className = isButton ? "tag-button" : "tag";
    element.textContent = tag;
    if (isButton) {
      element.type = "button";
      element.dataset.tag = tag;
    }
    return element;
  }

  function eventForPost(post) {
    return eventMap.get(post.event) || fallbackEvent;
  }

  function postsForEvent(eventSlug) {
    return posts.filter((post) => post.event === eventSlug);
  }

  function eventGroups() {
    return events
      .map((event) => {
        const eventPosts = postsForEvent(event.slug);
        const latest = eventPosts[0]?.date || event.date || "";
        return { event, posts: eventPosts, latest };
      })
      .filter((group) => group.posts.length)
      .sort((a, b) => b.latest.localeCompare(a.latest));
  }

  function closePostMenus(except = null) {
    document.querySelectorAll(".post-menu.is-open").forEach((menu) => {
      if (menu !== except) {
        menu.classList.remove("is-open");
      }
    });
  }

  function menuShell(label) {
    const menu = document.createElement("div");
    menu.className = "post-menu owner-control";

    const trigger = document.createElement("button");
    trigger.className = "post-menu-trigger";
    trigger.type = "button";
    trigger.title = label;
    trigger.setAttribute("aria-label", label);
    trigger.innerHTML = "&#8942;";

    const list = document.createElement("div");
    list.className = "post-menu-list";

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = menu.classList.contains("is-open");
      closePostMenus(menu);
      menu.classList.toggle("is-open", !isOpen);
    });

    list.addEventListener("click", (event) => event.stopPropagation());
    menu.append(trigger, list);
    return { menu, list };
  }

  function menuItem(label, danger = false) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = danger ? "post-menu-item danger" : "post-menu-item";
    item.textContent = label;
    return item;
  }

  function createPostMenu(post) {
    const { menu, list } = menuShell("Post actions");
    const edit = menuItem("Edit");
    const remove = menuItem("Delete", true);

    edit.addEventListener("click", () => {
      window.location.href = `editor.html?edit=${encodeURIComponent(post.slug)}`;
    });

    remove.addEventListener("click", () => deletePublishedPost(post));
    list.append(edit, remove);
    return menu;
  }

  function createEventMenu(event) {
    const { menu, list } = menuShell("CTF actions");
    const edit = menuItem("Edit");
    const remove = menuItem("Delete", true);

    edit.addEventListener("click", () => editPublishedEvent(event));
    remove.addEventListener("click", () => deletePublishedEvent(event));
    list.append(edit, remove);
    return menu;
  }

  function createPostCard(post) {
    const item = document.createElement("li");
    item.className = "post-card";

    const date = document.createElement("time");
    date.className = "post-date";
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);

    const body = document.createElement("div");
    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
    link.textContent = post.title;
    title.appendChild(link);

    const summary = document.createElement("p");
    summary.textContent = post.summary || "Writeup notes and challenge files.";

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    post.tags.forEach((tag) => tagRow.appendChild(tagElement(tag)));

    body.append(title, summary, tagRow);
    item.append(date, body, createPostMenu(post));
    return item;
  }

  function createEventCard(group) {
    const section = document.createElement("section");
    section.className = "event-card event-summary-card";
    section.id = `event-${group.event.slug}`;

    const link = document.createElement("a");
    link.className = "event-card-link";
    link.href = `index.html?event=${encodeURIComponent(group.event.slug)}`;
    link.innerHTML = `
      <p class="folder-path">posts/${group.event.slug}/</p>
      <h3>${group.event.name}</h3>
      <p>${group.event.summary || "CTF writeups."}</p>
    `;

    const count = document.createElement("span");
    count.textContent = `${group.posts.length} writeup${group.posts.length > 1 ? "s" : ""}`;

    const header = document.createElement("header");
    header.className = "event-card-head";
    header.append(link, count);
    section.append(header, createEventMenu(group.event));
    return section;
  }

  function drawTagFilters(filters, allTags, activeTag) {
    filters.innerHTML = "";
    const allButton = tagElement("all", true);
    allButton.classList.toggle("is-active", activeTag === "all");
    filters.appendChild(allButton);

    allTags.forEach((tag) => {
      const button = tagElement(tag, true);
      button.classList.toggle("is-active", activeTag === tag);
      filters.appendChild(button);
    });
  }

  function renderPagination(target, totalPages, currentPage, onPageChange) {
    target.innerHTML = "";
    if (totalPages <= 1) {
      return;
    }

    const wrap = document.createElement("nav");
    wrap.className = "pager";
    wrap.setAttribute("aria-label", "CTF pages");

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "<";
    previous.disabled = currentPage === 1;
    previous.addEventListener("click", () => onPageChange(currentPage - 1));
    wrap.appendChild(previous);

    for (let index = 1; index <= totalPages; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(index);
      button.classList.toggle("is-active", index === currentPage);
      button.addEventListener("click", () => onPageChange(index));
      wrap.appendChild(button);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = ">";
    next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => onPageChange(currentPage + 1));
    wrap.appendChild(next);
    target.appendChild(wrap);
  }

  function paginationHost() {
    let host = document.querySelector("#event-pagination");
    if (!host) {
      host = document.createElement("div");
      host.id = "event-pagination";
      document.querySelector("#event-list").after(host);
    }
    return host;
  }

  function setPostsTitle(title, kicker = "published") {
    document.querySelector("#posts-title").textContent = title;
    const sectionKicker = document.querySelector(".posts-workspace .terminal-kicker");
    if (sectionKicker) {
      sectionKicker.textContent = kicker;
    }
  }

  function renderHome() {
    const eventList = document.querySelector("#event-list");
    const search = document.querySelector("#post-search");
    const filters = document.querySelector("#tag-filters");
    const eventFilters = document.querySelector("#event-filters");
    const pager = paginationHost();
    let activeTag = "all";
    let currentPage = 1;

    setPostsTitle("CTF Events");
    search.placeholder = "search CTF events";
    eventFilters.innerHTML = "";

    function filteredGroups() {
      const term = search.value.trim().toLowerCase();
      return eventGroups().filter((group) => {
        const haystack = [
          group.event.name,
          group.event.summary,
          group.event.slug,
          ...group.posts.flatMap((post) => [post.title, post.summary, ...post.tags])
        ].join(" ").toLowerCase();
        const matchesText = !term || haystack.includes(term);
        const matchesTag = activeTag === "all" || group.posts.some((post) => post.tags.includes(activeTag));
        return matchesText && matchesTag;
      });
    }

    function draw() {
      const groups = filteredGroups();
      const allTags = [...new Set(posts.flatMap((post) => post.tags))].sort();
      if (activeTag !== "all" && !allTags.includes(activeTag)) {
        activeTag = "all";
      }
      drawTagFilters(filters, allTags, activeTag);

      const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      const pageGroups = groups.slice((currentPage - 1) * pageSize, currentPage * pageSize);
      eventList.innerHTML = "";
      eventList.className = "event-list event-overview-list";

      if (!pageGroups.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No CTF events found.";
        eventList.appendChild(empty);
      } else {
        pageGroups.forEach((group) => eventList.appendChild(createEventCard(group)));
      }

      renderPagination(pager, totalPages, currentPage, (pageNumber) => {
        currentPage = pageNumber;
        draw();
      });
    }

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".tag-button");
      if (!button) {
        return;
      }
      activeTag = button.dataset.tag;
      currentPage = 1;
      draw();
    });

    search.addEventListener("input", () => {
      currentPage = 1;
      draw();
    });

    redrawCurrentView = draw;
    draw();
  }

  function renderEventDetail(eventSlug) {
    const eventList = document.querySelector("#event-list");
    const search = document.querySelector("#post-search");
    const filters = document.querySelector("#tag-filters");
    const eventFilters = document.querySelector("#event-filters");
    const pager = paginationHost();
    const event = eventMap.get(eventSlug);
    let activeTag = "all";

    pager.innerHTML = "";
    eventList.className = "event-list";
    eventFilters.innerHTML = `<a class="back-link" href="index.html">← all CTFs</a>`;

    if (!event) {
      setPostsTitle("CTF not found");
      eventList.innerHTML = "<p class=\"empty-state\">No CTF event is configured for this URL.</p>";
      return;
    }

    setPostsTitle(event.name, "ctf");
    search.placeholder = "search challenges";

    function draw() {
      const term = search.value.trim().toLowerCase();
      const eventPosts = postsForEvent(event.slug);
      const allTags = [...new Set(eventPosts.flatMap((post) => post.tags))].sort();
      if (activeTag !== "all" && !allTags.includes(activeTag)) {
        activeTag = "all";
      }
      drawTagFilters(filters, allTags, activeTag);

      const visible = eventPosts.filter((post) => {
        const haystack = [post.title, post.summary, post.date, ...post.tags].join(" ").toLowerCase();
        const matchesText = !term || haystack.includes(term);
        const matchesTag = activeTag === "all" || post.tags.includes(activeTag);
        return matchesText && matchesTag;
      });

      eventList.innerHTML = "";
      const section = document.createElement("section");
      section.className = "event-card event-detail-card";
      section.appendChild(createEventMenu(event));

      const header = document.createElement("header");
      header.className = "event-card-head";
      header.innerHTML = `
        <div>
          <p class="folder-path">posts/${event.slug}/</p>
          <h3>${event.name}</h3>
          <p>${event.summary || "CTF writeups."}</p>
        </div>
        <span>${eventPosts.length} writeup${eventPosts.length > 1 ? "s" : ""}</span>
      `;

      const list = document.createElement("ol");
      list.className = "post-list";
      visible.forEach((post) => list.appendChild(createPostCard(post)));
      section.append(header, list);
      eventList.appendChild(section);

      if (!visible.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No writeups found in this CTF.";
        list.appendChild(empty);
      }
    }

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".tag-button");
      if (!button) {
        return;
      }
      activeTag = button.dataset.tag;
      draw();
    });

    search.addEventListener("input", draw);
    redrawCurrentView = draw;
    draw();
  }

  async function renderPost() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug") || posts[0]?.slug;
    const post = posts.find((item) => item.slug === slug) || posts[0];
    const header = document.querySelector(".post-header");
    const title = document.querySelector("#post-title");
    const date = document.querySelector("#post-date");
    const eventLabel = document.querySelector("#post-event");
    const tags = document.querySelector("#post-tags");
    const content = document.querySelector("#post-content");
    const toc = document.querySelector("#toc");

    if (!post) {
      title.textContent = "Post not found";
      content.innerHTML = "<p>No posts are configured.</p>";
      return;
    }

    document.title = `${post.title} | CTF Write-ups`;
    title.textContent = post.title;
    date.textContent = formatDate(post.date);
    const postEvent = eventForPost(post);
    eventLabel.textContent = `posts/${postEvent.slug}/ - ${postEvent.name}`;
    tags.innerHTML = "";
    post.tags.forEach((tag) => tags.appendChild(tagElement(tag)));
    header.appendChild(createPostMenu(post));

    try {
      const response = await fetch(post.file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const markdown = await response.text();
      const basePath = post.file.split("/").slice(0, -1).join("/");
      content.innerHTML = window.CTFRender.renderMarkdown(markdown, {
        basePath: basePath ? `${basePath}/` : ""
      });
      const repeatedTitle = content.querySelector("h1");
      if (repeatedTitle && repeatedTitle.textContent.trim().toLowerCase() === post.title.trim().toLowerCase()) {
        repeatedTitle.remove();
      }
      window.CTFRender.addCodeCopyButtons(content);
      window.CTFRender.buildToc(content, toc);
    } catch (error) {
      content.innerHTML = `<p>Could not load <code>${post.file}</code>.</p>`;
      toc.innerHTML = "";
    }
  }

  async function pickProjectRoot() {
    const root = await window.showDirectoryPicker({
      id: "ctf-writeups-project",
      mode: "readwrite"
    });

    try {
      await root.getFileHandle("index.html");
      await root.getDirectoryHandle("assets");
    } catch {
      throw new Error("Please choose the project root folder, for example D:\\Cong Minh\\Blog CTF.");
    }

    return root;
  }

  async function ensureDirectory(root, parts) {
    let directory = root;
    for (const part of parts.filter(Boolean)) {
      directory = await directory.getDirectoryHandle(part, { create: true });
    }
    return directory;
  }

  async function getDirectory(root, parts) {
    let directory = root;
    for (const part of parts.filter(Boolean)) {
      directory = await directory.getDirectoryHandle(part);
    }
    return directory;
  }

  async function writeTextFile(directory, filename, content) {
    const handle = await directory.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function removeFile(root, relativePath) {
    const parts = String(relativePath || "").split("/").filter(Boolean);
    const filename = parts.pop();
    if (!filename) {
      return false;
    }

    const directory = await getDirectory(root, parts);
    await directory.removeEntry(filename);
    return true;
  }

  async function removeDirectory(root, relativePath) {
    const parts = String(relativePath || "").split("/").filter(Boolean);
    const dirname = parts.pop();
    if (!dirname) {
      return false;
    }

    const directory = await getDirectory(root, parts);
    await directory.removeEntry(dirname, { recursive: true });
    return true;
  }

  function cloneEntries(value) {
    return JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
  }

  function formatPostsFile(nextEvents, nextPosts) {
    return `window.CTF_EVENTS = ${JSON.stringify(nextEvents, null, 2)};\n\nwindow.CTF_POSTS = ${JSON.stringify(nextPosts, null, 2)};\n`;
  }

  async function writeIndex(nextEvents, nextPosts, options = {}) {
    const postsJs = formatPostsFile(nextEvents, nextPosts);
    if (window.showDirectoryPicker) {
      const root = await pickProjectRoot();
      const assetsJs = await ensureDirectory(root, ["assets", "js"]);
      await writeTextFile(assetsJs, "posts.js", postsJs);

      for (const file of options.deleteFiles || []) {
        try {
          await removeFile(root, file);
        } catch {
          // File may already be gone.
        }
      }

      for (const directory of options.deleteDirs || []) {
        try {
          await removeDirectory(root, directory);
        } catch {
          // Directory may already be gone.
        }
      }
    } else {
      let response;
      try {
        response = await fetch("/__write-index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postsJs,
            deleteFiles: options.deleteFiles || [],
            deleteDirs: options.deleteDirs || []
          })
        });
      } catch {
        throw new Error("Run `python server.py` before using Edit or Delete.");
      }

      if (!response.ok) {
        throw new Error("This local server cannot edit files. Stop it, run `python server.py`, then try again.");
      }
    }

    applyIndex(nextEvents, nextPosts);
  }

  function showDeletedPost(post, removedMarkdown) {
    const title = document.querySelector("#post-title");
    const tags = document.querySelector("#post-tags");
    const content = document.querySelector("#post-content");
    const toc = document.querySelector("#toc");
    title.textContent = "Post deleted locally";
    tags.innerHTML = "";
    content.innerHTML = `<p><strong>${post.title}</strong> was removed from your local post index${removedMarkdown ? " and its Markdown file was deleted" : ""}. Run <code>git add .</code>, <code>git commit</code>, and <code>git push</code> to publish the deletion.</p>`;
    toc.innerHTML = "";
  }

  async function deletePublishedPost(post) {
    closePostMenus();
    const confirmed = window.confirm(`Delete "${post.title}" locally? This removes it from assets/js/posts.js and deletes its Markdown file.`);
    if (!confirmed) {
      return;
    }

    try {
      const nextEvents = cloneEntries(window.CTF_EVENTS);
      const nextPosts = cloneEntries(window.CTF_POSTS).filter((item) => item.slug !== post.slug);
      await writeIndex(nextEvents, nextPosts, { deleteFiles: [post.file] });
      rememberDeletedSlug(post.slug);

      if (page === "post") {
        showDeletedPost(post, true);
      } else if (redrawCurrentView) {
        redrawCurrentView();
      }

      window.alert("Post deleted locally. Run git add, git commit, and git push to update the public site.");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      window.alert(error.message || "Delete failed.");
    }
  }

  async function editPublishedEvent(event) {
    closePostMenus();
    const name = window.prompt("CTF name", event.name);
    if (!name) {
      return;
    }
    const summary = window.prompt("CTF summary", event.summary || `${name} writeups.`);
    if (summary === null) {
      return;
    }

    try {
      const nextEvents = cloneEntries(window.CTF_EVENTS).map((item) => {
        if (item.slug !== event.slug) {
          return item;
        }
        return { ...item, name: name.trim(), summary: summary.trim() || `${name.trim()} writeups.` };
      });
      const nextPosts = cloneEntries(window.CTF_POSTS);
      await writeIndex(nextEvents, nextPosts);
      if (redrawCurrentView) {
        redrawCurrentView();
      }
      window.alert("CTF updated locally. Run git add, git commit, and git push to update the public site.");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      window.alert(error.message || "Edit failed.");
    }
  }

  async function deletePublishedEvent(event) {
    closePostMenus();
    const eventPosts = postsForEvent(event.slug);
    const confirmed = window.confirm(`Delete the whole CTF "${event.name}" locally, including ${eventPosts.length} writeup(s) and the folder posts/${event.slug}/?`);
    if (!confirmed) {
      return;
    }

    try {
      const nextEvents = cloneEntries(window.CTF_EVENTS).filter((item) => item.slug !== event.slug);
      const nextPosts = cloneEntries(window.CTF_POSTS).filter((post) => post.event !== event.slug);
      await writeIndex(nextEvents, nextPosts, { deleteDirs: [`posts/${event.slug}`] });

      if (new URLSearchParams(window.location.search).get("event") === event.slug) {
        window.location.href = "index.html";
        return;
      }

      if (redrawCurrentView) {
        redrawCurrentView();
      }
      window.alert("CTF deleted locally. Run git add, git commit, and git push to update the public site.");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      window.alert(error.message || "Delete failed.");
    }
  }

  document.addEventListener("click", () => closePostMenus());

  if (page === "home") {
    const eventSlug = new URLSearchParams(window.location.search).get("event");
    if (eventSlug) {
      renderEventDetail(eventSlug);
    } else {
      renderHome();
    }
  }

  if (page === "post") {
    renderPost();
  }
})();
