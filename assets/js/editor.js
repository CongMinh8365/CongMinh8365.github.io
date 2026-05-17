(function () {
  const storageKey = "ctf-writeups-editor-v1";
  const input = document.querySelector("#markdown-input");
  const preview = document.querySelector("#markdown-preview");
  const title = document.querySelector("#writeup-title");
  const date = document.querySelector("#writeup-date");
  const tags = document.querySelector("#writeup-tags");
  const summary = document.querySelector("#writeup-summary");
  const eventName = document.querySelector("#writeup-event");
  const folderSlug = document.querySelector("#writeup-folder");
  const saveState = document.querySelector("#save-state");
  const suggestedPath = document.querySelector("#suggested-path");
  const wordCount = document.querySelector("#word-count");
  const cursorPosition = document.querySelector("#cursor-position");
  const grid = document.querySelector("#editor-grid");
  const importFile = document.querySelector("#import-file");
  const eventEntry = document.querySelector("#event-entry");
  const postEntry = document.querySelector("#post-entry");
  let lastAutoFolder = "";

  const defaultMarkdown = `# HTB - Challenge Name

## Summary
- Category:
- Difficulty:
- Flag:

## Recon
\`\`\`bash
nmap -sC -sV target
\`\`\`

## Vulnerability
Explain the bug, primitive, or cryptographic weakness.

## Exploit
\`\`\`python
print("solve script goes here")
\`\`\`

## Lessons Learned
- Keep notes short and reproducible.
`;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "writeup";
  }

  function syncFolderFromEvent() {
    const nextFolder = slugify(eventName.value || "ctf-event");
    if (!folderSlug.value || folderSlug.value === lastAutoFolder) {
      folderSlug.value = nextFolder;
    }
    lastAutoFolder = nextFolder;
  }

  function stateFromForm() {
    return {
      title: title.value,
      date: date.value,
      tags: tags.value,
      summary: summary.value,
      event: eventName.value,
      folder: folderSlug.value,
      markdown: input.value
    };
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(stateFromForm()));
    saveState.textContent = "saved locally";
    updateSuggestedPath();
  }

  function render() {
    preview.innerHTML = window.CTFRender.renderMarkdown(input.value);
    window.CTFRender.addCodeCopyButtons(preview);
    const words = input.value.trim().split(/\s+/).filter(Boolean).length;
    wordCount.textContent = `${words} words`;
    updateSuggestedPath();
    updateGeneratedEntries();
  }

  function scheduleSave() {
    saveState.textContent = "saving...";
    window.clearTimeout(scheduleSave.timer);
    scheduleSave.timer = window.setTimeout(() => {
      save();
      render();
    }, 220);
  }

  function load() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        title.value = data.title || "HTB - Challenge Name";
        date.value = data.date || today();
        tags.value = data.tags || "reverse, htb";
        summary.value = data.summary || "Short summary shown on the homepage.";
        eventName.value = data.event || "Hack The Box";
        folderSlug.value = data.folder || "hackthebox";
        input.value = data.markdown || defaultMarkdown;
      } catch {
        title.value = "HTB - Challenge Name";
        date.value = today();
        tags.value = "reverse, htb";
        summary.value = "Short summary shown on the homepage.";
        eventName.value = "Hack The Box";
        folderSlug.value = "hackthebox";
        input.value = defaultMarkdown;
      }
    } else {
      title.value = "HTB - Challenge Name";
      date.value = today();
      tags.value = "reverse, htb";
      summary.value = "Short summary shown on the homepage.";
      eventName.value = "Hack The Box";
      folderSlug.value = "hackthebox";
      input.value = defaultMarkdown;
    }

    lastAutoFolder = slugify(eventName.value || "ctf-event");
    render();
    save();
    updateCursor();
  }

  function wrapSelection(before, after = before, placeholder = "text") {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end) || placeholder;
    input.setRangeText(`${before}${selected}${after}`, start, end, "select");
    input.focus();
    scheduleSave();
  }

  function prefixLines(prefix) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const finalEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, finalEnd);
    const replaced = block
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    input.setRangeText(replaced, lineStart, finalEnd, "select");
    input.focus();
    scheduleSave();
  }

  function insertBlock(block) {
    const start = input.selectionStart;
    const needsBreak = start > 0 && input.value[start - 1] !== "\n";
    input.setRangeText(`${needsBreak ? "\n\n" : ""}${block}`, start, input.selectionEnd, "end");
    input.focus();
    scheduleSave();
  }

  function exportFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function frontMatter() {
    const normalizedTags = tags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(", ");

    const folder = slugify(folderSlug.value || eventName.value || "ctf-event");
    return `---\ntitle: ${title.value}\ndate: ${date.value}\nevent: ${eventName.value}\nfolder: ${folder}\ntags: ${normalizedTags}\nsummary: ${summary.value}\n---\n\n`;
  }

  function updateSuggestedPath() {
    const folder = slugify(folderSlug.value || eventName.value || "ctf-event");
    const filename = `${date.value || today()}-${slugify(title.value)}.md`;
    suggestedPath.textContent = `suggested: posts/${folder}/${filename}`;
  }

  function postPath() {
    const folder = slugify(folderSlug.value || eventName.value || "ctf-event");
    const filename = `${date.value || today()}-${slugify(title.value)}.md`;
    return `posts/${folder}/${filename}`;
  }

  function tagArray() {
    return tags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function jsString(value) {
    return JSON.stringify(value || "");
  }

  function updateGeneratedEntries() {
    const folder = slugify(folderSlug.value || eventName.value || "ctf-event");
    const eventTitle = eventName.value || "CTF Event";
    const eventYear = (date.value || today()).slice(0, 4);
    const eventSummary = `${eventTitle} writeups.`;
    const postSummary = summary.value || `Writeup for ${title.value || "challenge"}.`;

    eventEntry.value = `{
  slug: ${jsString(folder)},
  name: ${jsString(eventTitle)},
  date: ${jsString(eventYear)},
  summary: ${jsString(eventSummary)}
}`;

    postEntry.value = `{
  slug: ${jsString(slugify(title.value))},
  title: ${jsString(title.value || "Challenge Name")},
  date: ${jsString(date.value || today())},
  event: ${jsString(folder)},
  tags: ${JSON.stringify(tagArray())},
  summary: ${jsString(postSummary)},
  file: ${jsString(postPath())}
}`;
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const previous = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1200);
    } catch {
      button.textContent = "Copy failed";
    }
  }

  function updateCursor() {
    const before = input.value.slice(0, input.selectionStart);
    const lines = before.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPosition.textContent = `Ln ${line}, Col ${col}`;
  }

  document.querySelector(".toolbar").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const view = button.dataset.view;

    if (view) {
      grid.classList.remove("view-write", "view-preview");
      if (view !== "split") {
        grid.classList.add(`view-${view}`);
      }
      document.querySelectorAll("[data-view]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      return;
    }

    const actions = {
      heading: () => prefixLines("## "),
      bold: () => wrapSelection("**", "**", "bold"),
      italic: () => wrapSelection("*", "*", "italic"),
      code: () => wrapSelection("`", "`", "code"),
      quote: () => prefixLines("> "),
      link: () => wrapSelection("[", "](https://example.com)", "link"),
      image: () => insertBlock("![alt text](https://example.com/image.png)\n"),
      ul: () => prefixLines("- "),
      ol: () => prefixLines("1. "),
      task: () => prefixLines("- [ ] "),
      table: () => insertBlock("| Column | Value |\n| --- | --- |\n| key | value |\n"),
      fence: () => insertBlock("```bash\ncommand\n```\n"),
      hr: () => insertBlock("---\n")
    };

    actions[action]?.();
  });

  document.querySelector("#import-button").addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) {
      return;
    }

    input.value = await file.text();
    title.value = file.name.replace(/\.(md|markdown)$/i, "");
    scheduleSave();
  });

  document.querySelector("#export-md").addEventListener("click", () => {
    const filename = `${date.value || today()}-${slugify(title.value)}.md`;
    exportFile(`${frontMatter()}${input.value}`, filename, "text/markdown");
  });

  document.querySelector("#export-html").addEventListener("click", () => {
    const html = `<!doctype html>\n<meta charset="utf-8">\n<title>${title.value}</title>\n${preview.innerHTML}`;
    exportFile(html, `${slugify(title.value)}.html`, "text/html");
  });

  document.querySelector("#copy-event-entry").addEventListener("click", (event) => {
    copyText(eventEntry.value, event.currentTarget);
  });

  document.querySelector("#copy-post-entry").addEventListener("click", (event) => {
    copyText(postEntry.value, event.currentTarget);
  });

  [input, title, date, tags, summary, folderSlug].forEach((element) => {
    element.addEventListener("input", scheduleSave);
  });

  eventName.addEventListener("input", () => {
    syncFolderFromEvent();
    scheduleSave();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      input.setRangeText("  ", input.selectionStart, input.selectionEnd, "end");
      scheduleSave();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      wrapSelection("**", "**", "bold");
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      wrapSelection("*", "*", "italic");
    }
  });

  input.addEventListener("keyup", updateCursor);
  input.addEventListener("click", updateCursor);
  input.addEventListener("select", updateCursor);

  load();
})();
