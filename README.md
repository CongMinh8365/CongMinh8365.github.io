# CTF Write-ups

Static GitHub Pages blog for CTF writeups. The site has:

- dark terminal-style UI
- pixel title
- event/folder grouping by CTF competition
- post search
- tag filters
- Markdown reader with outline
- code highlighting and copy buttons
- HackMD/GitHub-style local Markdown editor

Open `guide.html` for the full usage guide.

## Structure

```text
.
├── index.html
├── post.html
├── editor.html
├── guide.html
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── posts.js
│       ├── blog.js
│       ├── render.js
│       └── editor.js
└── posts/
    ├── hackthebox/
    └── imaginaryctf-2025/
```

Each CTF event should have a folder under `posts/`. Each writeup is a Markdown file inside that folder.

## Add A CTF Event

Edit `assets/js/posts.js` and add an entry to `window.CTF_EVENTS`:

```js
{
  slug: "imaginaryctf-2025",
  name: "ImaginaryCTF 2025",
  date: "2025",
  summary: "Writeups for ImaginaryCTF 2025."
}
```

The `slug` should match the folder name in `posts/`.

## Add A Writeup

1. Open `editor.html`.
2. Write or import Markdown.
3. Fill in `Summary`, `Event / CTF`, and `Folder slug`.
4. Export the `.md` file.
5. Put the file into `posts/<folder-slug>/`.
6. Copy the generated `window.CTF_POSTS` entry from the editor and paste it into `assets/js/posts.js`.
7. If the event is new, copy the generated `window.CTF_EVENTS` entry too.

Example:

```js
{
  slug: "my-new-writeup",
  title: "My New Writeup",
  date: "2026-05-17",
  event: "imaginaryctf-2025",
  tags: ["web", "sqli"],
  summary: "Short summary for the homepage.",
  file: "posts/imaginaryctf-2025/2026-05-17-my-new-writeup.md"
}
```

## Deploy On GitHub Pages

1. Create a GitHub repository named `<username>.github.io` if you want the clean URL `https://<username>.github.io/`.
2. Push these files to that repository. If you use another repository name, the URL will usually be `https://<username>.github.io/<repository-name>/`.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select your branch and `/root` folder.

## Read-Only Public Site

Visitors cannot change your repository from GitHub Pages. The public navigation only links to posts and GitHub.

Owner controls are visible automatically on `localhost` and `127.0.0.1`, so you still see `Editor`, `Guide`, and `New writeup` while working locally. On the deployed site, public visitors do not see those controls.

To enable owner controls in your own deployed browser, open the site once with `?owner=1`. To hide them again, open it with `?owner=0`.

For a stricter read-only deploy, keep `editor.html`, `guide.html`, and `assets/js/editor.js` only on your local machine or a private branch, and publish only the reader files to the GitHub Pages branch.

## Local Preview

Serve the folder over HTTP so `post.html` can load Markdown files:

```bash
python -m http.server 5500
```

Then open `http://127.0.0.1:5500/`.
