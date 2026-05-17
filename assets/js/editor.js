(function () {
  const storageKey = "ctf-writeups-editor-v1";
  const input = document.querySelector("#markdown-input");
  const preview = document.querySelector("#markdown-preview");
  const title = document.querySelector("#writeup-title");
  const date = document.querySelector("#writeup-date");
  const tags = document.querySelector("#writeup-tags");
  const eventName = document.querySelector("#writeup-event");
  const saveState = document.querySelector("#save-state");
  const suggestedPath = document.querySelector("#suggested-path");
  const wordCount = document.querySelector("#word-count");
  const cursorPosition = document.querySelector("#cursor-position");
  const grid = document.querySelector("#editor-grid");
  const importFile = document.querySelector("#import-file");
  const eventEntry = document.querySelector("#event-entry");
  const postEntry = document.querySelector("#post-entry");
  const assetHint = document.querySelector("#asset-hint");
  const assetList = document.querySelector("#asset-list");
  const assetFileInput = document.querySelector("#asset-file-input");
  const assetImageInput = document.querySelector("#asset-image-input");
  const assetPreviewMap = {};

  const defaultMarkdown = `# HTB - Challenge Name

## Summary
- Category:
- Difficulty:
- Flag:

## Files
- [challenge file](files/challenge.zip)
- [solve script](files/solve.py)

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

  function slugify(value, fallback = "writeup") {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || fallback;
  }

  function eventSlug() {
    return slugify(eventName.value, "ctf-event");
  }

  function writeupFilename() {
    return `${date.value || today()}-${slugify(title.value)}.md`;
  }

  function postPath() {
    return `posts/${eventSlug()}/${writeupFilename()}`;
  }

  function stateFromForm() {
    return {
      title: title.value,
      date: date.value,
      tags: tags.value,
      event: eventName.value,
      markdown: input.value
    };
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(stateFromForm()));
    saveState.textContent = "saved locally";
    updateSuggestedPath();
  }

  function render() {
    preview.innerHTML = window.CTFRender.renderMarkdown(input.value, {
      basePath: `posts/${eventSlug()}/`,
      assetMap: assetPreviewMap
    });
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

  function parseFrontMatter(markdown) {
    const match = markdown.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) {
      return {};
    }

    return match[1].split("\n").reduce((data, line) => {
      const separator = line.indexOf(":");
      if (separator === -1) {
        return data;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      data[key] = value;
      return data;
    }, {});
  }

  function load() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        title.value = data.title || "HTB - Challenge Name";
        date.value = data.date || today();
        tags.value = data.tags || "reverse, htb";
        eventName.value = data.event || "Hack The Box";
        input.value = data.markdown || defaultMarkdown;
      } catch {
        setDefaults();
      }
    } else {
      setDefaults();
    }

    render();
    save();
    updateCursor();
  }

  function setDefaults() {
    title.value = "HTB - Challenge Name";
    date.value = today();
    tags.value = "reverse, htb";
    eventName.value = "Hack The Box";
    input.value = defaultMarkdown;
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
    const normalizedTags = tagArray().join(", ");
    return `---\ntitle: ${title.value}\ndate: ${date.value}\nevent: ${eventName.value}\ntags: ${normalizedTags}\n---\n\n`;
  }

  function updateSuggestedPath() {
    const eventFolder = eventSlug();
    suggestedPath.textContent = `suggested: posts/${eventFolder}/${writeupFilename()}`;
    assetHint.textContent = `Put downloadable files in posts/${eventFolder}/files/ and images in posts/${eventFolder}/images/.`;
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

  function inferSummary(markdown) {
    const cleaned = window.CTFRender.stripFrontMatter(markdown)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#-]/g, " ");

    const line = cleaned
      .split("\n")
      .map((item) => item.trim())
      .find((item) => item && !/^h?tb\s*-/i.test(item) && item.length > 18);

    const summary = line || `Writeup for ${title.value || "challenge"}.`;
    return summary.length > 150 ? `${summary.slice(0, 147)}...` : summary;
  }

  function updateGeneratedEntries() {
    const folder = eventSlug();
    const eventTitle = eventName.value || "CTF Event";
    const eventYear = (date.value || today()).slice(0, 4);

    eventEntry.value = `{
  slug: ${jsString(folder)},
  name: ${jsString(eventTitle)},
  date: ${jsString(eventYear)},
  summary: ${jsString(`${eventTitle} writeups.`)}
}`;

    postEntry.value = `{
  slug: ${jsString(slugify(title.value))},
  title: ${jsString(title.value || "Challenge Name")},
  date: ${jsString(date.value || today())},
  event: ${jsString(folder)},
  tags: ${JSON.stringify(tagArray())},
  summary: ${jsString(inferSummary(input.value))},
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

  function safeFileName(name) {
    const dot = name.lastIndexOf(".");
    const base = dot === -1 ? name : name.slice(0, dot);
    const ext = dot === -1 ? "" : name.slice(dot).toLowerCase();
    return `${slugify(base, "asset")}${ext.replace(/[^a-z0-9.]/g, "")}`;
  }

  function addAssetItem(file, folder, markdown) {
    const item = document.createElement("li");
    const path = `posts/${eventSlug()}/${folder}/${safeFileName(file.name)}`;
    item.innerHTML = `<span>${file.name}</span><code>${path}</code>`;
    item.title = "Copy this file into the shown path before pushing to GitHub.";
    assetList.appendChild(item);
    insertBlock(markdown);
  }

  async function attachAssets(files, folder) {
    for (const file of [...files]) {
      const filename = safeFileName(file.name);
      const label = file.name.replace(/\.[^.]+$/, "");
      if (folder === "images") {
        const dataUrl = await fileToDataUrl(file);
        assetPreviewMap[`images/${filename}`] = dataUrl;
        assetPreviewMap[`posts/${eventSlug()}/images/${filename}`] = dataUrl;
      }

      const markdown = folder === "images"
        ? `![${label}](images/${filename})\n`
        : `- [${file.name}](files/${filename})\n`;
      addAssetItem(file, folder, markdown);
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function imageSrcFromHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.querySelector("img")?.getAttribute("src") || "";
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
      image: () => insertBlock("![alt text](images/screenshot.png)\n"),
      ul: () => prefixLines("- "),
      ol: () => prefixLines("1. "),
      task: () => prefixLines("- [ ] "),
      table: () => insertBlock("| Column | Value |\n| --- | --- |\n| key | value |\n"),
      fence: () => insertBlock("```python\nprint(\"solve script goes here\")\n```\n"),
      hr: () => insertBlock("---\n")
    };

    actions[action]?.();
  });

  document.querySelector("#import-button").addEventListener("click", () => importFile.click());
  document.querySelector("#attach-files").addEventListener("click", () => assetFileInput.click());
  document.querySelector("#attach-images").addEventListener("click", () => assetImageInput.click());

  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) {
      return;
    }

    const markdown = await file.text();
    const metadata = parseFrontMatter(markdown);
    input.value = markdown;
    title.value = metadata.title || file.name.replace(/\.(md|markdown)$/i, "");
    date.value = metadata.date || date.value || today();
    tags.value = metadata.tags || tags.value;
    eventName.value = metadata.event || eventName.value;
    scheduleSave();
  });

  assetFileInput.addEventListener("change", () => {
    attachAssets(assetFileInput.files, "files");
  });

  assetImageInput.addEventListener("change", () => {
    attachAssets(assetImageInput.files, "images");
  });

  input.addEventListener("paste", async (event) => {
    const clipboard = event.clipboardData;
    if (!clipboard) {
      return;
    }

    const htmlImage = imageSrcFromHtml(clipboard.getData("text/html"));
    if (htmlImage) {
      event.preventDefault();
      insertBlock(`![pasted image](${htmlImage})\n`);
      return;
    }

    const imageFiles = [...clipboard.files].filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    for (const file of imageFiles) {
      const dataUrl = await fileToDataUrl(file);
      insertBlock(`![pasted image](${dataUrl})\n`);
    }
  });

  document.querySelector("#export-md").addEventListener("click", () => {
    exportFile(`${frontMatter()}${window.CTFRender.stripFrontMatter(input.value)}`, writeupFilename(), "text/markdown");
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

  [input, title, date, tags, eventName].forEach((element) => {
    element.addEventListener("input", scheduleSave);
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
  window.addEventListener("beforeunload", save);

  load();
})();
