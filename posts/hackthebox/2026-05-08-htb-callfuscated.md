---
title: HTB - Callfuscated
date: 2026-05-08
event: Hack The Box
folder: hackthebox
tags: reverse, htb
---

# HTB - Callfuscated

## Summary

- Category: Reverse
- Difficulty: Medium
- Goal: recover the flag from an obfuscated call graph

## Static Analysis

The binary hides direct control flow behind small dispatcher functions. A quick first pass is to list strings, imports, and suspicious cross references.

```bash
file callfuscated
strings -a callfuscated | head
objdump -d callfuscated | less
```

## Dynamic Trace

Run the target with a debugger and break around the comparison routine. Keep input short until the validation path is mapped.

```gdb
break *main
run
disassemble
```

## Exploit Path

After flattening the call table, the validation routine becomes a byte-by-byte transform. Rebuild the inverse transform in a solve script.

```python
target = [0x31, 0x62, 0x79]
flag = bytes((value ^ 0x13) for value in target)
print(flag)
```

## Flag

```text
HTB{replace_with_real_flag}
```
