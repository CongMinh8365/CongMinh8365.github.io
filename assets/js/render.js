(function () {
  const slugCounts = new Map();

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/<[^>]*>/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  }

  function uniqueSlug(value) {
    const base = slugify(value);
    const count = slugCounts.get(base) || 0;
    slugCounts.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  }

  function stripFrontMatter(markdown) {
    return markdown.replace(/^---[\s\S]*?---\s*/, "");
  }

  function fallbackMarkdown(markdown) {
    const escaped = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .split(/\n{2,}/)
      .map((block) => /<h[1-3]|<pre|<ul|<ol|<blockquote/.test(block) ? block : `<p>${block.replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  }

  function renderMarkdown(markdown) {
    slugCounts.clear();

    if (window.marked) {
      const renderer = new marked.Renderer();

      renderer.heading = function (text, level) {
        const raw = typeof text === "string" ? text : text.text || "";
        const id = uniqueSlug(raw);
        return `<h${level} id="${id}">${raw}</h${level}>`;
      };

      marked.setOptions({
        breaks: true,
        gfm: true,
        renderer,
        highlight(code, language) {
          if (!window.hljs) {
            return code;
          }

          if (language && hljs.getLanguage(language)) {
            return hljs.highlight(code, { language }).value;
          }

          return hljs.highlightAuto(code).value;
        }
      });

      const parsed = marked.parse(stripFrontMatter(markdown));
      return window.DOMPurify ? DOMPurify.sanitize(parsed, { ADD_ATTR: ["target"] }) : parsed;
    }

    return fallbackMarkdown(stripFrontMatter(markdown));
  }

  function addCodeCopyButtons(root) {
    root.querySelectorAll("pre").forEach((pre) => {
      const codeBlock = pre.querySelector("code");
      if (window.hljs && codeBlock && !codeBlock.dataset.highlighted) {
        try {
          hljs.highlightElement(codeBlock);
        } catch {
          // Keep rendering even when a language label is not supported.
        }
      }

      if (pre.querySelector(".copy-code")) {
        return;
      }

      const button = document.createElement("button");
      button.className = "copy-code";
      button.type = "button";
      button.textContent = "copy";
      button.addEventListener("click", async () => {
        const code = codeBlock?.innerText || "";
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "copied";
          window.setTimeout(() => {
            button.textContent = "copy";
          }, 1400);
        } catch {
          button.textContent = "error";
        }
      });

      pre.appendChild(button);
    });
  }

  function buildToc(root, target) {
    if (!target) {
      return;
    }

    const headings = [...root.querySelectorAll("h2, h3")];
    target.innerHTML = "";

    if (!headings.length) {
      const empty = document.createElement("span");
      empty.className = "empty-state";
      empty.textContent = "No headings";
      target.appendChild(empty);
      return;
    }

    headings.forEach((heading) => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.className = heading.tagName === "H3" ? "depth-3" : "depth-2";
      target.appendChild(link);
    });
  }

  window.CTFRender = {
    renderMarkdown,
    stripFrontMatter,
    addCodeCopyButtons,
    buildToc
  };
})();
