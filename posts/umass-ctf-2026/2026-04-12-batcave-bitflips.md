---
title: Batcave Bitflips
date: 2026-04-12
event: UMass CTF 2026
tags: Reverse
---

# Batcave Bitflips

## Summary
- Category: Reverse
- Difficulty: Medium
- Flag: `UMASS{__p4tche5_0n_p4tche$__#}`

## Description
- [batcave_license_checker](files/batcave_license_checker)

Batman's new state-of-the-art AI agent has deleted all of the source code to the Batcave license verification program! There's an old debug version lying around, but that thing has been hit by more cosmic rays than Superman!

## Analysis
Chạy thử file, ta thấy chương trình yêu cầu nhập input, sau đó in ra màn hình mã hash của input và verify nó:

<img width="720" height="200" alt="image" src="https://github.com/user-attachments/assets/19dc463a-1d5c-422a-b81c-142c3af10f26" />
   
Mở IDA lên, tìm đến hàm `main` của chương trình, ta thu được đoạn code sau:
```C
int __fastcall main(int argc, const char **argv, const char **envp)
{
  FILE *stream; // [rsp+10h] [rbp-60h]
  char *ptr; // [rsp+18h] [rbp-58h]
  _QWORD v6[4]; // [rsp+20h] [rbp-50h] BYREF
  char s[8]; // [rsp+40h] [rbp-30h] BYREF
  __int64 v8; // [rsp+48h] [rbp-28h]
  __int64 v9; // [rsp+50h] [rbp-20h]
  __int64 v10; // [rsp+58h] [rbp-18h]
  char v11; // [rsp+60h] [rbp-10h]
  unsigned __int64 v12; // [rsp+68h] [rbp-8h]

  v12 = __readfsqword(0x28u);
  *(_QWORD *)s = 0;
  v8 = 0;
  v9 = 0;
  v10 = 0;
  v11 = 0;
  memset(v6, 0, sizeof(v6));
  puts("=================================================================================");
  puts("_-_-_-_-_-_-_-_-_-_-_- BATCAVE LICENSE VERIFICATION (Beta) _-_-_-_-_-_-_-_-_-_-_-");
  puts("=================================================================================\n");
  stream = fdopen(0, "r");
  if ( !stream )
    exit(1);
  printf("ENTER LICENSE KEY: ");
  if ( !fgets(s, 33, stream) )
    exit(1);
  v11 = 0;
  puts("COMPUTING...");
  hash((__int64)s, (__int64)v6);
  ptr = bytes_to_hex((__int64)v6, 0x20u);
  printf("HASHED KEY: %s\n", ptr);
  free(ptr);
  puts("VERIFYING...");
  if ( !verify(v6) )
  {
    puts("INVALID LICENSE - PLEASE CONTACT ALFRED");
    exit(1);
  }
  puts("LICENSE GOOD - DECRYPTING BAT DATA...");
  decrypt_flag((__int64)v6);
  printf("FLAG: %s\n", FLAG);
  return 0;
}
```
Logic hàm `main` rất rõ ràng: Input ta nhập được lưu vào biến `s`, biến `s` sau đó được đưa vào hàm `hash()` để băm và trả về biến `v6`. Tiếp tục biến `v6` được đổi từ byte sang hex và đưa vào hàm `verify()`, nếu thành công sẽ chạy hàm `decrypt_flag()` và in ra FLAG trên màn hình.

Đi vào hàm `verify()` xem logic kiểm tra là gì, ta thu được như sau:
```C
_BOOL8 __fastcall verify(const void *a1)
{
  return memcmp(a1, &EXPECTED, 0x20u) == 0;
}
```
Nó làm 1 việc rất đơn giản: So sánh `v6` (input sau khi hash) với mảng `EXPECTED` => Ta không cần quan tâm hàm `hash()` hoạt động như nào nữa, vì chắc chắn đến đây `v6` phải có giá trị giống mảng `EXPECTED` thì mới verify thành công và chạy hàm `decrypt_flag()`

Tiếp tục xem hàm `decrypt_flag()`:
```C
__int64 __fastcall decrypt_flag(__int64 a1)
{
  __int64 result; // rax
  int i; // [rsp+14h] [rbp-4h]

  for ( i = 0; i <= 31; ++i )
  {
    result = i;
    FLAG[i] ^= *(_BYTE *)(i % 32 + a1);
  }
  return result;
}
```
Lệnh `FLAG[i] ^= *(_BYTE *)(i % 32 + a1)` thực chất là `FLAG[i] = FLAG[i] ^ a1[i]`, mà `a1` chính là `v6` chứa giá trị giống mảng `EXPECTED`.

=> Logic hàm `decrypt_flag()` đơn giản là lấy 2 mảng `FLAG[]` và `EXPECTED[]` đem xor tương ứng từng phần tử với nhau và ghi đè lại vào mảng `FLAG[]`

Trích xuất giá trị 2 mảng đó, ta thu được:
```
EXPECTED = [0x3B, 0x54, 0x75, 0x1A, 0x24, 0x06, 0xAF, 0x05, 0x77, 0x80, 0x47, 0xC5, 0xE4, 0x83, 0xD3, 0x48, 0xCB, 0x87, 0x30, 0xDE, 0x1A, 0x91, 0x45, 0xAB, 0x15, 0xC7, 0x9B, 0x22, 0x04, 0x02, 0x2B, 0xEE]
FLAG     = [0x6E, 0x19, 0x34, 0x49, 0x77, 0x7D, 0xF0, 0x5A, 0x07, 0xB4, 0x33, 0xA6, 0x8C, 0xE6, 0xE6, 0x17, 0xFB, 0xE9, 0x6F, 0xAE, 0x2E, 0xE5, 0x26, 0xC3, 0x70, 0xE3, 0xC4, 0x7D, 0x27, 0x7F, 0x2B, 0x00]
```
XOR tương ứng từng phần tử của 2 mảng với nhau, sau đó chuyển sang kí tự ASCII, ta sẽ thu được flag.

## FLAG: `UMASS{__p4tche5_0n_p4tche$__#}`
