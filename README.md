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

The homepage shows CTF events first. Click an event to open its writeup list. Each event page then shows the challenge writeups for that event.

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

Markdown files live directly inside the event folder. Assets are shared inside that event folder, so pasted screenshots use timestamped names to avoid collisions. For manually attached files, use descriptive names such as `phantom-channel-solve.py` if two writeups in the same event might use the same filename.

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

1. Start the local helper server:

```powershell
python server.py
```

2. Open `editor.html` locally.
3. Fill `Title`, `Date`, `Tags`, and `Event / CTF`.
4. Write the Markdown.
5. Add assets with `Attach files` or `Insert images` if needed.
6. Set `Homepage summary` if the generated summary is not what you want. This text is only shown on the homepage card.
7. Click `Upload local`.
8. If the browser asks for a folder, choose the project root, for example `D:\Cong Minh\Blog CTF`.
9. The editor writes the Markdown file, copies current-session assets, and updates `assets/js/posts.js`.
10. Commit and push:

```powershell
git add .
git commit -m "Add writeup"
git push
```

GitHub Pages will redeploy automatically after the push.

If `Upload local` says the browser cannot write to folders, stop the old server and run `python server.py`, then click `Upload local` again.

To edit or delete a published post locally, use the three-dot menu on the homepage post card or inside the post page. `Edit` opens the post in the editor. `Delete` removes it from `assets/js/posts.js` and deletes its Markdown file locally. After either action, commit and push.

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
python server.py
```

Open:

```text
http://127.0.0.1:5500/
```
