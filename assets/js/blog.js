(function () {
  const events = window.CTF_EVENTS || [];
  const eventMap = new Map(events.map((event) => [event.slug, event]));
  const page = document.body.dataset.page;
  const fallbackEvent = {
    slug: "uncategorized",
    name: "Uncategorized",
    date: "",
    summary: "Writeups without an assigned CTF event."
  };
  let posts = visiblePosts(window.CTF_POSTS || []);
  let redrawHome = null;

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

  function eventButton(event) {
    const button = document.createElement("button");
    button.className = "event-filter";
    button.type = "button";
    button.dataset.event = event.slug;
    button.textContent = event.name;
    return button;
  }

  function closePostMenus(except = null) {
    document.querySelectorAll(".post-menu.is-open").forEach((menu) => {
      if (menu !== except) {
        menu.classList.remove("is-open");
      }
    });
  }

  function createPostMenu(post) {
    const menu = document.createElement("div");
    menu.className = "post-menu owner-control";

    const trigger = document.createElement("button");
    trigger.className = "post-menu-trigger";
    trigger.type = "button";
    trigger.title = "Post actions";
    trigger.setAttribute("aria-label", "Post actions");
    trigger.innerHTML = "&#8942;";

    const list = document.createElement("div");
    list.className = "post-menu-list";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "post-menu-item";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      window.location.href = `editor.html?edit=${encodeURIComponent(post.slug)}`;
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "post-menu-item danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      deletePublishedPost(post);
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = menu.classList.contains("is-open");
      closePostMenus(menu);
      menu.classList.toggle("is-open", !isOpen);
    });

    list.addEventListener("click", (event) => event.stopPropagation());
    list.append(edit, remove);
    menu.append(trigger, list);
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

  function renderHome() {
    const eventList = document.querySelector("#event-list");
    const search = document.querySelector("#post-search");
    const filters = document.querySelector("#tag-filters");
    const eventFilters = document.querySelector("#event-filters");
    let activeTag = "all";
    let activeEvent = "all";

    function drawFilters() {
      const allTags = [...new Set(posts.flatMap((post) => post.tags))].sort();
      const visibleEvents = events.filter((event) => posts.some((post) => post.event === event.slug));

      if (activeTag !== "all" && !allTags.includes(activeTag)) {
        activeTag = "all";
      }

      if (activeEvent !== "all" && !visibleEvents.some((event) => event.slug === activeEvent)) {
        activeEvent = "all";
      }

      filters.innerHTML = "";
      const allButton = tagElement("all", true);
      allButton.classList.toggle("is-active", activeTag === "all");
      filters.appendChild(allButton);
      allTags.forEach((tag) => {
        const button = tagElement(tag, true);
        button.classList.toggle("is-active", activeTag === tag);
        filters.appendChild(button);
      });

      eventFilters.innerHTML = "";
      const allEventsButton = eventButton({ slug: "all", name: "All CTFs" });
      allEventsButton.classList.toggle("is-active", activeEvent === "all");
      eventFilters.appendChild(allEventsButton);
      visibleEvents.forEach((event) => {
        const button = eventButton(event);
        button.classList.toggle("is-active", activeEvent === event.slug);
        eventFilters.appendChild(button);
      });

    }

    function draw() {
      drawFilters();
      const term = search.value.trim().toLowerCase();
      const visible = posts.filter((post) => {
        const event = eventForPost(post);
        const haystack = [post.title, post.summary, post.date, event.name, event.slug, ...post.tags].join(" ").toLowerCase();
        const matchesText = !term || haystack.includes(term);
        const matchesTag = activeTag === "all" || post.tags.includes(activeTag);
        const matchesEvent = activeEvent === "all" || post.event === activeEvent;
        return matchesText && matchesTag && matchesEvent;
      });

      eventList.innerHTML = "";

      if (!visible.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No writeups found.";
        eventList.appendChild(empty);
        return;
      }

      const grouped = new Map();
      visible.forEach((post) => {
        const event = eventForPost(post);
        if (!grouped.has(event.slug)) {
          grouped.set(event.slug, { event, posts: [] });
        }
        grouped.get(event.slug).posts.push(post);
      });

      grouped.forEach((group) => {
        const section = document.createElement("section");
        section.className = "event-card";
        section.id = `event-${group.event.slug}`;

        const header = document.createElement("header");
        header.className = "event-card-head";
        header.innerHTML = `
          <div>
            <p class="folder-path">posts/${group.event.slug}/</p>
            <h3>${group.event.name}</h3>
            <p>${group.event.summary}</p>
          </div>
          <span>${group.posts.length} writeup${group.posts.length > 1 ? "s" : ""}</span>
        `;

        const list = document.createElement("ol");
        list.className = "post-list";
        group.posts.forEach((post) => list.appendChild(createPostCard(post)));

        section.append(header, list);
        eventList.appendChild(section);
      });
    }

    eventFilters.addEventListener("click", (event) => {
      const button = event.target.closest(".event-filter");
      if (!button) {
        return;
      }

      activeEvent = button.dataset.event;
      draw();
    });

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".tag-button");
      if (!button) {
        return;
      }

      activeTag = button.dataset.tag;
      draw();
    });

    search.addEventListener("input", draw);
    redrawHome = draw;
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

  function assertLocalWriteSupport() {
    if (!window.showDirectoryPicker) {
      throw new Error("Delete needs Chrome, Edge, or Brave with local folder write access.");
    }
  }

  async function pickProjectRoot() {
    assertLocalWriteSupport();
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

  function cloneEntries(value) {
    return JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
  }

  function formatPostsFile(nextEvents, nextPosts) {
    return `window.CTF_EVENTS = ${JSON.stringify(nextEvents, null, 2)};\n\nwindow.CTF_POSTS = ${JSON.stringify(nextPosts, null, 2)};\n`;
  }

  async function removePostFromIndex(root, postSlug) {
    const assetsJs = await ensureDirectory(root, ["assets", "js"]);
    const nextEvents = cloneEntries(window.CTF_EVENTS);
    const nextPosts = cloneEntries(window.CTF_POSTS).filter((post) => post.slug !== postSlug);
    await writeTextFile(assetsJs, "posts.js", formatPostsFile(nextEvents, nextPosts));
    window.CTF_POSTS = nextPosts;
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
      const root = await pickProjectRoot();
      await removePostFromIndex(root, post.slug);

      let removedMarkdown = false;
      try {
        removedMarkdown = await removeFile(root, post.file);
      } catch {
        removedMarkdown = false;
      }

      rememberDeletedSlug(post.slug);
      posts = posts.filter((item) => item.slug !== post.slug);

      if (page === "home" && redrawHome) {
        redrawHome();
      }

      if (page === "post") {
        showDeletedPost(post, removedMarkdown);
      }

      const markdownStatus = removedMarkdown ? "Markdown file deleted." : "Post index updated, but the Markdown file was not found.";
      window.alert(`${markdownStatus} Run git add, git commit, and git push to update the public site.`);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      window.alert(error.message || "Delete failed.");
    }
  }

  document.addEventListener("click", () => closePostMenus());

  if (page === "home") {
    renderHome();
  }

  if (page === "post") {
    renderPost();
  }
})();
