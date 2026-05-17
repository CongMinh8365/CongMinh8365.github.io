---
title: ImaginaryCTF 2025 - Auth Bypass
date: 2026-04-22
event: ImaginaryCTF 2025
folder: imaginaryctf-2025
tags: web, auth
---

# ImaginaryCTF 2025 - Auth Bypass

## Summary

- Category: Web
- Bug class: broken authorization
- Impact: access to another user's note

## Request Diff

Capture the normal request first, then remove or replay identity-bearing values.

```http
GET /api/notes/42 HTTP/1.1
Host: target.local
Cookie: session=...
```

## Checks

- Change numeric IDs.
- Change UUIDs copied from page source.
- Remove role fields from JSON bodies.
- Replay the request with a fresh account.

## Proof

```bash
curl -i -H "Cookie: session=$COOKIE" \
  https://target.local/api/notes/42
```

## Fix Notes

Authorization should be enforced server-side on every object read and write. UI-only hiding is not a control.
