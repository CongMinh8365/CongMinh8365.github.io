# CTF Write-ups

Static GitHub Pages blog for CTF writeups.

## What The Site Supports

- Event-based folders for CTF competitions.
- Markdown writeups.
- Download links for challenge files, solve scripts, archives, APKs, binaries, etc.
- Images in writeups.
- Code highlighting through Highlight.js.
- Local autosave in the browser editor.
- Public read-only site with owner controls hidden by default.

## Project Structure

```text
index.html
post.html
editor.html
guide.html
assets/
  css/style.css
  js/posts.js
  js/blog.js
  js/render.js
  js/editor.js
posts/
  hackthebox/
    2026-05-08-htb-callfuscated.md
    files/
    images/
```

## Event / CTF

`Event / CTF` is the big folder for a competition or platform.

Examples:

```text
UMass CTF 2026      -> posts/umass-ctf-2026/
TAMUctf 2026        -> posts/tamuctf-2026/
Hack The Box        -> posts/hack-the-box/
```

You no longer need to type `Folder slug`. The editor generates it automatically from `Event / CTF`.

## Assets

For each event folder, use:

```text
posts/<event-slug>/files/
posts/<event-slug>/images/
```

In Markdown:

```md
[challenge binary](files/batcave_license_checker)
[solve script](files/solve.py)
![IDA screenshot](images/ida-main.png)
```

The reader automatically resolves those paths when the post is shown on `post.html`.

The editor inserts these Markdown links. In Chrome, Edge, or Brave on localhost, `Upload local` also copies assets selected during the current editor session into the right local folders.

`Insert images` shows a local preview immediately from the selected image. The final public site still needs the image file to exist under `posts/<event-slug>/images/`.

If you close or reload the editor before uploading, re-attach the asset files or copy them manually. Browser autosave stores text only, not the real selected files.

## Code Highlighting

Use fenced code blocks:

````md
```python
print("solve")
```

```c
int main(void) {
  return 0;
}
```

```bash
python solve.py
```
````

Common languages such as Python, JavaScript, Bash, C, C++, Java, Go, Rust, PHP, Ruby, JSON, YAML, HTML, CSS, SQL, and HTTP are highlighted by Highlight.js.

## Autosave

The editor autosaves the current draft to browser `localStorage` after edits. You can close the browser or shut down the machine and continue later from the same browser profile.

Autosave is only a draft cache, not a Git commit. Click `Upload local` when a writeup is ready, or export the `.md` file and publish manually.

## Publish A Writeup

1. Open `editor.html` locally.
2. Fill `Title`, `Date`, `Tags`, and `Event / CTF`.
3. Write the Markdown.
4. Add assets with `Attach files` or `Insert images` if needed.
5. Set `Homepage summary` if the generated summary is not what you want. This text is only shown on the homepage card.
6. Click `Upload local`.
7. Choose the project root folder, for example `D:\Cong Minh\Blog CTF`.
8. The editor writes the Markdown file, copies current-session assets, and updates `assets/js/posts.js`.
9. Commit and push:

```powershell
git add .
git commit -m "Add writeup"
git push
```

GitHub Pages will redeploy automatically after the push.

If `Upload local` is not available in your browser, use `Export .md`, copy assets manually, then paste the generated entries into `assets/js/posts.js`.

To delete a published post locally, open `editor.html`, click `Delete post`, enter the post slug, choose the project root folder, then commit and push the deletion.

## Deploy On GitHub Pages

For the clean URL:

```text
https://<username>.github.io/
```

the repository must be named:

```text
<username>.github.io
```

Then enable Pages:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. Save and wait a few minutes.

## Owner Mode

Owner controls are visible automatically on:

```text
http://127.0.0.1:5500/
http://localhost:5500/
```

On the public site, visitors do not see `Editor`, `Guide`, or `New writeup`.

Enable owner controls in your browser:

```text
https://<username>.github.io/?owner=1
```

Disable them:

```text
https://<username>.github.io/?owner=0
```

This is only UI hiding. Real write access is still controlled by GitHub repo permissions.

## Local Preview

```powershell
cd "D:\Công Minh\Blog CTF"
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500/
```
