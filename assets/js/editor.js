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
  const homepageSummary = document.querySelector("#homepage-summary");
  const assetHint = document.querySelector("#asset-hint");
  const assetList = document.querySelector("#asset-list");
  const assetFileInput = document.querySelector("#asset-file-input");
  const assetImageInput = document.querySelector("#asset-image-input");
  const assetPreviewMap = {};
  const attachedAssets = [];
  let editingPost = null;
  let pastedImageCounter = 0;

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
    const eventTitle = eventName.value.trim();
    const existing = (window.CTF_EVENTS || []).find((event) => event.name.toLowerCase() === eventTitle.toLowerCase());
    if (existing) {
      return existing.slug;
    }

    if (editingPost) {
      const originalEvent = (window.CTF_EVENTS || []).find((event) => event.slug === editingPost.event);
      if (originalEvent && originalEvent.name.toLowerCase() === eventTitle.toLowerCase()) {
        return editingPost.event;
      }
    }

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
      homepageSummary: homepageSummary.value,
      markdown: input.value,
      assets: serializableAssets()
    };
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateFromForm()));
      saveState.textContent = "saved locally";
    } catch {
      const lightweightState = stateFromForm();
      lightweightState.assets = [];
      localStorage.setItem(storageKey, JSON.stringify(lightweightState));
      saveState.textContent = "saved locally without image cache";
    }
    updateSuggestedPath();
  }

  function render() {
    syncAssetsWithMarkdown();
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

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const editSlug = params.get("edit");
    if (editSlug) {
      const post = (window.CTF_POSTS || []).find((item) => item.slug === editSlug);
      if (post) {
        await loadPublishedPost(post);
        return;
      }
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        title.value = data.title || "HTB - Challenge Name";
        date.value = data.date || today();
        tags.value = data.tags || "reverse, htb";
        eventName.value = data.event || "Hack The Box";
        homepageSummary.value = data.homepageSummary || "";
        input.value = data.markdown || defaultMarkdown;
        await restoreSavedAssets(data.assets || []);
      } catch {
        setDefaults();
      }
    } else {
      setDefaults();
    }

    const compacted = await compactEmbeddedDataImages();
    render();
    save();
    updateCursor();
    if (compacted) {
      saveState.textContent = "compacted pasted images";
    }
  }

  async function loadPublishedPost(post) {
    editingPost = { ...post };
    const event = (window.CTF_EVENTS || []).find((item) => item.slug === post.event);
    let status = "editing published writeup";
    title.value = post.title || "Challenge Name";
    date.value = post.date || today();
    tags.value = (post.tags || []).join(", ");
    eventName.value = event?.name || post.event || "CTF Event";
    homepageSummary.value = post.summary || "";

    try {
      const response = await fetch(`${post.file}?v=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      input.value = await response.text();
    } catch {
      input.value = defaultMarkdown;
      status = "could not load published markdown";
    }

    const compacted = await compactEmbeddedDataImages();
    render();
    save();
    updateCursor();
    saveState.textContent = compacted ? "compacted pasted images" : status;
  }

  function setDefaults() {
    title.value = "HTB - Challenge Name";
    date.value = today();
    tags.value = "reverse, htb";
    eventName.value = "Hack The Box";
    homepageSummary.value = "";
    input.value = defaultMarkdown;
  }

  function resetAssetState() {
    attachedAssets.length = 0;
    Object.keys(assetPreviewMap).forEach((key) => delete assetPreviewMap[key]);
    assetList.innerHTML = "";
    assetFileInput.value = "";
    assetImageInput.value = "";
  }

  function resetDraft(status = "saved locally") {
    localStorage.removeItem(storageKey);
    resetAssetState();
    editingPost = null;
    setDefaults();
    render();
    save();
    updateCursor();
    saveState.textContent = status;
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
    assetHint.textContent = `Upload local copies current-session assets into posts/${eventFolder}/files/ and posts/${eventFolder}/images/. Re-attach files after a browser reload.`;
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
    const body = window.CTFRender.stripFrontMatter(markdown);
    const descriptionMatch = body.match(/^##\s+Description\s*\n([\s\S]*?)(?=\n##\s+|\s*$)/im);
    const source = descriptionMatch ? descriptionMatch[1] : body;
    const cleaned = source
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#-]/g, " ");

    const line = cleaned
      .split("\n")
      .map((item) => item.trim())
      .find((item) => {
        if (!item || item.length <= 18) {
          return false;
        }

        return !/^(?:h?tb\s*-|category\s*:|difficulty\s*:|flag\s*:|files?\s*$|summary\s*$)/i.test(item);
      });

    const summary = homepageSummary.value.trim() || line || `Writeup for ${title.value || "challenge"}.`;
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

  function currentEventEntry() {
    const eventTitle = eventName.value || "CTF Event";
    const existing = (window.CTF_EVENTS || []).find((event) => event.slug === eventSlug());
    if (existing) {
      return existing;
    }

    return {
      slug: eventSlug(),
      name: eventTitle,
      date: (date.value || today()).slice(0, 4),
      summary: `${eventTitle} writeups.`
    };
  }

  function currentPostEntry() {
    return {
      slug: slugify(title.value),
      title: title.value || "Challenge Name",
      date: date.value || today(),
      event: eventSlug(),
      tags: tagArray(),
      summary: inferSummary(input.value),
      file: postPath()
    };
  }

  function cloneEntries(value) {
    return JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
  }

  function upsertBySlug(items, nextItem) {
    const index = items.findIndex((item) => item.slug === nextItem.slug);
    if (index === -1) {
      items.push(nextItem);
      return items;
    }

    items[index] = { ...items[index], ...nextItem };
    return items;
  }

  function formatPostsFile(events, posts) {
    return `window.CTF_EVENTS = ${JSON.stringify(events, null, 2)};\n\nwindow.CTF_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
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

  async function writeBlobFile(directory, filename, blob) {
    const handle = await directory.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
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

  async function updatePostsIndex(root, postMode = "upsert", postSlug = "") {
    const assetsJs = await ensureDirectory(root, ["assets", "js"]);
    let events = cloneEntries(window.CTF_EVENTS);
    let posts = cloneEntries(window.CTF_POSTS);

    if (postMode === "delete") {
      posts = posts.filter((post) => post.slug !== postSlug);
    } else {
      ({ events, posts } = nextPublishedIndex());
    }

    await writeTextFile(assetsJs, "posts.js", formatPostsFile(events, posts));
    window.CTF_EVENTS = events;
    window.CTF_POSTS = posts;
  }

  function nextPublishedIndex() {
    const events = cloneEntries(window.CTF_EVENTS);
    let posts = cloneEntries(window.CTF_POSTS);
    if (editingPost) {
      posts = posts.filter((post) => post.slug !== editingPost.slug);
    }
    upsertBySlug(events, currentEventEntry());
    upsertBySlug(posts, currentPostEntry());
    return { events, posts };
  }

  async function blobToBase64(blob) {
    const dataUrl = await fileToDataUrl(blob);
    return dataUrl.split(",", 2)[1] || "";
  }

  async function serializeAssets(assets) {
    const serialized = [];
    for (const asset of assets) {
      serialized.push({
        folder: asset.folder,
        filename: asset.filename,
        contentBase64: await blobToBase64(asset.file)
      });
    }
    return serialized;
  }

  async function uploadWithDirectoryPicker(root, markdown, assetsToUpload) {
    const postDirectory = await ensureDirectory(root, ["posts", eventSlug()]);
    await writeTextFile(postDirectory, writeupFilename(), markdown);

    for (const asset of assetsToUpload) {
      const assetDirectory = await ensureDirectory(root, ["posts", eventSlug(), asset.folder]);
      await writeBlobFile(assetDirectory, asset.filename, asset.file);
    }

    await updatePostsIndex(root);
    if (editingPost && editingPost.file !== postPath()) {
      try {
        await removeFile(root, editingPost.file);
      } catch {
        // The old Markdown path may already have been moved or deleted.
      }
    }
  }

  async function uploadWithLocalHelper(markdown, assetsToUpload) {
    const { events, posts } = nextPublishedIndex();
    const payload = {
      eventSlug: eventSlug(),
      writeupFilename: writeupFilename(),
      markdown,
      postsJs: formatPostsFile(events, posts),
      oldFile: editingPost && editingPost.file !== postPath() ? editingPost.file : "",
      assets: await serializeAssets(assetsToUpload)
    };

    let response;
    try {
      response = await fetch("/__upload-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error("Brave is blocking direct folder write access. Keep this page open, stop the old server, run `python server.py`, then click Upload local again.");
    }

    if (!response.ok) {
      throw new Error("This server cannot receive Upload local. Keep this page open, stop the old server, run `python server.py`, then click Upload local again.");
    }

    window.CTF_EVENTS = events;
    window.CTF_POSTS = posts;
  }

  async function uploadLocal() {
    save();
    render();
    const button = document.querySelector("#upload-local");
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Uploading...";
    saveState.textContent = "uploading locally...";

    try {
      const assetsToUpload = syncAssetsWithMarkdown();
      const markdown = `${frontMatter()}${window.CTFRender.stripFrontMatter(input.value)}`;
      if (window.showDirectoryPicker) {
        const root = await pickProjectRoot();
        await uploadWithDirectoryPicker(root, markdown, assetsToUpload);
      } else {
        await uploadWithLocalHelper(markdown, assetsToUpload);
      }
      resetDraft("uploaded locally; draft reset");
      window.alert("Uploaded locally. Run git add, git commit, and git push to publish it to congminh8365.github.io.");
    } catch (error) {
      if (error.name === "AbortError") {
        saveState.textContent = "upload canceled";
      } else {
        saveState.textContent = "upload failed";
        window.alert(error.message || "Upload failed.");
      }
    } finally {
      button.disabled = false;
      button.textContent = previousText;
    }
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
    const safeBase = String(base || "asset")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_.-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "asset";
    return `${safeBase}${ext.replace(/[^a-z0-9.]/g, "")}`;
  }

  function extensionForImageType(type) {
    const normalized = String(type || "").toLowerCase();
    const extensions = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/bmp": ".bmp"
    };
    return extensions[normalized] || ".png";
  }

  function dataUrlType(dataUrl) {
    return String(dataUrl).match(/^data:([^;,]+)/i)?.[1] || "image/png";
  }

  function compactTimestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate())
    ].join("") + "-" + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("");
  }

  function nextPastedImageName(type = "image/png") {
    pastedImageCounter += 1;
    const suffix = pastedImageCounter > 1 ? `-${pastedImageCounter}` : "";
    return `pasted-${compactTimestamp()}${suffix}${extensionForImageType(type)}`;
  }

  function rememberAttachedAsset(file, folder, filename) {
    const existingIndex = attachedAssets.findIndex((asset) => asset.folder === folder && asset.filename === filename);
    if (existingIndex !== -1) {
      attachedAssets.splice(existingIndex, 1);
    }
    attachedAssets.push({ file, folder, filename, label: file.nameLabel || file.name || filename, dataUrl: file.dataUrl || "" });
  }

  function mapImagePreview(filename, dataUrl) {
    assetPreviewMap[`images/${filename}`] = dataUrl;
    assetPreviewMap[`posts/${eventSlug()}/images/${filename}`] = dataUrl;
  }

  function assetKey(folder, filename) {
    return `${folder}/${filename}`;
  }

  function normalizeAssetPath(path) {
    const cleanPath = String(path || "").trim().replace(/^\.?\//, "");
    const match = cleanPath.match(/(?:^|\/)(images|files)\/([^)\s"'<>]+)/i);
    if (!match) {
      return "";
    }
    return assetKey(match[1].toLowerCase(), match[2]);
  }

  function referencedAssetKeys() {
    const references = new Set();
    const markdown = input.value;
    const markdownLinks = /!?\[[^\]]*]\(([^)]+)\)/g;
    const htmlAssets = /\b(?:src|href)=["']([^"']+)["']/gi;
    let match;

    while ((match = markdownLinks.exec(markdown))) {
      const normalized = normalizeAssetPath(match[1]);
      if (normalized) {
        references.add(normalized);
      }
    }

    while ((match = htmlAssets.exec(markdown))) {
      const normalized = normalizeAssetPath(match[1]);
      if (normalized) {
        references.add(normalized);
      }
    }

    return references;
  }

  function rebuildAssetList(assets) {
    assetList.innerHTML = "";
    assets.forEach((asset) => {
      addAssetRow({ name: asset.label || asset.file.name || asset.filename }, asset.folder, asset.filename);
    });
  }

  function syncAssetsWithMarkdown() {
    const references = referencedAssetKeys();
    const activeAssets = attachedAssets.filter((asset) => references.has(assetKey(asset.folder, asset.filename)));
    attachedAssets.splice(0, attachedAssets.length, ...activeAssets);

    Object.keys(assetPreviewMap).forEach((key) => {
      const normalized = normalizeAssetPath(key);
      if (normalized && !references.has(normalized)) {
        delete assetPreviewMap[key];
      }
    });

    rebuildAssetList(activeAssets);
    return activeAssets;
  }

  function serializableAssets() {
    return attachedAssets
      .filter((asset) => asset.folder === "images" && asset.dataUrl)
      .map((asset) => ({
        folder: asset.folder,
        filename: asset.filename,
        label: asset.label || asset.filename,
        dataUrl: asset.dataUrl
      }));
  }

  function addAssetRow(file, folder, filename) {
    const item = document.createElement("li");
    const path = `posts/${eventSlug()}/${folder}/${filename}`;
    item.innerHTML = `<span>${file.name || filename}</span><code>${path}</code>`;
    item.title = "Copy this file into the shown path before pushing to GitHub.";
    assetList.appendChild(item);
  }

  function addAssetItem(file, folder, markdown, filename = safeFileName(file.name)) {
    insertBlock(markdown);
    syncAssetsWithMarkdown();
  }

  async function attachAssets(files, folder) {
    for (const file of [...files]) {
      const filename = safeFileName(file.name);
      const label = file.name.replace(/\.[^.]+$/, "");
      rememberAttachedAsset(file, folder, filename);

      if (folder === "images") {
        const dataUrl = await fileToDataUrl(file);
        file.dataUrl = dataUrl;
        mapImagePreview(filename, dataUrl);
      }

      const markdown = folder === "images"
        ? `![${label}](images/${filename})\n`
        : `- [${file.name}](files/${filename})\n`;
      addAssetItem(file, folder, markdown, filename);
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

  async function dataUrlToFile(dataUrl, filename) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || dataUrlType(dataUrl) });
  }

  async function addPastedImage(dataUrl, alt = "pasted image") {
    const filename = nextPastedImageName(dataUrlType(dataUrl));
    const file = await dataUrlToFile(dataUrl, filename);
    file.dataUrl = dataUrl;
    file.nameLabel = alt || filename;
    rememberAttachedAsset(file, "images", filename);
    mapImagePreview(filename, dataUrl);
    addAssetItem({ name: alt || filename }, "images", `![${alt || "pasted image"}](images/${filename})\n`, filename);
  }

  async function restoreSavedAssets(assets) {
    for (const asset of assets) {
      if (!asset?.dataUrl || !asset?.filename || asset.folder !== "images") {
        continue;
      }

      const file = await dataUrlToFile(asset.dataUrl, asset.filename);
      file.dataUrl = asset.dataUrl;
      file.nameLabel = asset.label || asset.filename;
      rememberAttachedAsset(file, "images", asset.filename);
      mapImagePreview(asset.filename, asset.dataUrl);
    }
  }

  async function compactEmbeddedDataImages() {
    const pattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi;
    const matches = [...input.value.matchAll(pattern)];
    if (!matches.length) {
      return false;
    }

    let nextMarkdown = input.value;
    for (const match of matches) {
      const alt = match[1] || "pasted image";
      const dataUrl = match[2];
      const filename = nextPastedImageName(dataUrlType(dataUrl));
      const file = await dataUrlToFile(dataUrl, filename);
      file.dataUrl = dataUrl;
      file.nameLabel = alt;
      rememberAttachedAsset(file, "images", filename);
      mapImagePreview(filename, dataUrl);
      nextMarkdown = nextMarkdown.replace(match[0], `![${alt}](images/${filename})`);
    }

    input.value = nextMarkdown;
    return true;
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
  document.querySelector("#upload-local").addEventListener("click", uploadLocal);
  document.querySelector("#new-draft").addEventListener("click", () => {
    if (window.confirm("Clear this draft and start a new writeup?")) {
      resetDraft("new draft ready");
    }
  });

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
      if (/^data:image\//i.test(htmlImage)) {
        await addPastedImage(htmlImage);
      } else {
        insertBlock(`![pasted image](${htmlImage})\n`);
      }
      return;
    }

    const imageFiles = [...clipboard.files].filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    for (const file of imageFiles) {
      const dataUrl = await fileToDataUrl(file);
      await addPastedImage(dataUrl);
    }
  });

  document.querySelector("#export-md").addEventListener("click", () => {
    exportFile(`${frontMatter()}${window.CTFRender.stripFrontMatter(input.value)}`, writeupFilename(), "text/markdown");
  });

  document.querySelector("#copy-event-entry").addEventListener("click", (event) => {
    copyText(eventEntry.value, event.currentTarget);
  });

  document.querySelector("#copy-post-entry").addEventListener("click", (event) => {
    copyText(postEntry.value, event.currentTarget);
  });

  [input, title, date, tags, eventName, homepageSummary].forEach((element) => {
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
