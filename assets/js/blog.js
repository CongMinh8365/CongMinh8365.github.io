(function () {
  const events = window.CTF_EVENTS || [];
  const eventMap = new Map(events.map((event) => [event.slug, event]));
  const posts = [...(window.CTF_POSTS || [])].sort((a, b) => b.date.localeCompare(a.date));
  const page = document.body.dataset.page;
  const fallbackEvent = {
    slug: "uncategorized",
    name: "Uncategorized",
    date: "",
    summary: "Writeups without an assigned CTF event."
  };

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
    summary.textContent = post.summary;

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    post.tags.forEach((tag) => tagRow.appendChild(tagElement(tag)));

    body.append(title, summary, tagRow);
    item.append(date, body);
    return item;
  }

  function renderHome() {
    const eventList = document.querySelector("#event-list");
    const search = document.querySelector("#post-search");
    const filters = document.querySelector("#tag-filters");
    const eventFilters = document.querySelector("#event-filters");
    const allTags = [...new Set(posts.flatMap((post) => post.tags))].sort();
    const visibleEvents = events.filter((event) => posts.some((post) => post.event === event.slug));
    let activeTag = "all";
    let activeEvent = "all";

    const allButton = tagElement("all", true);
    allButton.classList.add("is-active");
    filters.appendChild(allButton);

    allTags.forEach((tag) => filters.appendChild(tagElement(tag, true)));

    const allEventsButton = eventButton({ slug: "all", name: "All CTFs" });
    allEventsButton.classList.add("is-active");
    eventFilters.appendChild(allEventsButton);
    visibleEvents.forEach((event) => eventFilters.appendChild(eventButton(event)));

    function draw() {
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
      eventFilters.querySelectorAll(".event-filter").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      draw();
    });

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".tag-button");
      if (!button) {
        return;
      }

      activeTag = button.dataset.tag;
      filters.querySelectorAll(".tag-button").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      draw();
    });

    search.addEventListener("input", draw);
    draw();
  }

  async function renderPost() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug") || posts[0]?.slug;
    const post = posts.find((item) => item.slug === slug) || posts[0];
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

    try {
      const response = await fetch(post.file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const markdown = await response.text();
      content.innerHTML = window.CTFRender.renderMarkdown(markdown);
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

  if (page === "home") {
    renderHome();
  }

  if (page === "post") {
    renderPost();
  }
})();
