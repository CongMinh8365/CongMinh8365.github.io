---
title: Lego Clicker
date: 2026-04-13
event: UMass CTF 2026
tags: reverse
---

# Lego Clicker

## Tổng quan
- Category: Reverse
- Difficulty: Hard
- Flag: `UMASS{br1ck_by_br1ck_y0u_r3ach3d_th3_t0p}`

## Mô tả
- File: [LegoClicker_umass.apk](files/LegoClicker_umass.apk)

Hackers have taken over and corrupted your beloved Lego Clicker game, can you reclaim the top of the leaderboard? Note: There are fake flags throughout the challenge which should be obvious to tell based on contents.

## Phân tích
Đây là file apk, để mở nó ta cần dùng trình giả lập Android, như trong bài này ta dùng NoxPlayer. Giao diện khi mở lên có thể thấy là 1 game dạng cày cuốc, người chơi bấm liên tục vào cục gạch để nâng điểm, sau đó dùng điểm mua các loại buildings khác nhau và các skills để tốc độ nâng điểm tăng nhanh hơn. Bấm vào ô Score thì thấy Top 1 đang có 1 nghìn tỷ điểm. Do đề bài hỏi rằng "can you reclaim the top of the leaderboard?" nên rõ ràng mục tiêu của ta là cần đạt hơn 1 nghìn tỷ điểm để vượt qua Top 1.

<img width="1240" height="716" alt="image" src="https://github.com/user-attachments/assets/166b7ee8-2142-4b29-9d47-915706fc9e6b" />

<img width="1240" height="716" alt="image" src="https://github.com/user-attachments/assets/30b6ee5d-2c5d-4df0-b3ae-0b0314d78f9c" />

Nhưng chắc chắn chẳng ai rảnh ngồi chơi để đạt 1 nghìn tỷ điểm cả! Sử dụng `JADX` để mở game lên, xem mục `AndroidManifest.xml` thì ta thấy đoạn code sau:

<img width="1361" height="548" alt="image" src="https://github.com/user-attachments/assets/0ed828a7-7a23-4403-8907-9d3d2c634a48" />

MA có vẻ là viết tắt cho MainActivity, do đó mục tiếp theo ta cần xem là `com.example.LegoClicker`. Mở lên ta thấy có nhiều mục có tên khá vô nghĩa như SA, AA, LA,... nhưng bên cạnh đó có 2 cái tên đáng lưu ý `FlagEngine` và `SessionValidator`. Trước tiên mở `FlagEngine` lên xem, ta thấy cấu trúc của nó khá rõ ràng với các hàm xử lý tính toán điểm số:

<img width="1366" height="670" alt="image" src="https://github.com/user-attachments/assets/9a75ee83-29ea-432e-8ec4-4523e60dabe5" />

- Hàm `b(double d)`: Kiểm tra số điểm của người chơi và trả về các mốc level (1 đến 5).
- Hàm `c(int i)`: Gắn nhãn cho các level đó, tương ứng từ `NOVICE` (Tân binh) đến `LEGEND` (Huyền thoại).
- Hàm `d(double d)`: Thực hiện các phép toán Bitwise (XOR, Shift) phức tạp để băm (hash) điểm số.
- Hàm `e(int i)`: Một vòng lặp giải mã XOR cơ bản trên mảng byte tĩnh `kLabelEnc`.

Đây khả năng cao là bẫy Fake Flag của tác giả! Bởi hãy nhìn lại vào hàm `b()`: Ngưỡng điểm cao nhất mà `FlagEngine` xử lý chỉ dừng lại ở 1.000.000 điểm, trong khi mục tiêu của ta là cần phải vượt qua 1 nghìn tỷ điểm của người đứng đầu. Nghĩa là hàm này chỉ phục vụ cho việc cấp rank và nhả cờ cho những người chơi ở "đáy" bảng xếp hạng.

Tiếp theo ta kiểm tra hàm `SessionValidator`:
```java
package com.example.LegoClicker;
public final class SessionValidator {
    public static final boolean a;

    /* JADX INFO: compiled from: r8-map-id-51b54c9e59b63e0fb0abe04daff984b4fb85d07ef3fcb7973595bce215c10515 */
    public static final class SessionToken {
        public long mask() {
            return 0L;
        }
    }

    static {
        boolean z = false;
        try {
            int[] iArr = {86, 95, 93, 85, 89, 85, 72, 95};
            char[] cArr = new char[8];
            for (int i = 0; i < 8; i++) {
                cArr[i] = (char) (iArr[i] ^ 58);
            }
            System.loadLibrary(new String(cArr));
            z = true;
        } catch (Throwable unused) {
        }
        a = z;
    }

    public static String a(long j, long j2) {
        if (!a) {
            return "";
        }
        try {
            SessionToken sessionToken = new SessionToken();
            int[] iArr = {47, 37, 50, 63, 30, 46, 53, 63, 55, 31, 61, 63, 52, 57};
            char[] cArr = new char[14];
            for (int i = 0; i < 14; i++) {
                cArr[i] = (char) (iArr[i] ^ 92);
            }
            String str = new String(cArr);
            Class cls = Long.TYPE;
            return (String) SessionValidator.class.getDeclaredMethod(str, cls, cls).invoke(null, Long.valueOf(j + sessionToken.mask()), Long.valueOf(j2 + sessionToken.mask()));
        } catch (Throwable unused) {
            return "";
        }
    }

    public static native String refreshTileMap(long j, long j2);
    @Deprecated
    public static native String syncBrickCache(long j, long j2);
    @Deprecated
    public static native String validateBrickToken(long j, long j2);
}
```
Ngay khi class được gọi, khối lệnh `static` sẽ chạy đầu tiên. Ở đây, tác giả không gọi tên thư viện một cách trực tiếp mà giấu nó dưới mảng số nguyên `iArr`, sau đó đem XOR từng phần tử với số `58`. Kết quả thu được chính là chuỗi `legocore`. Hệ thống sẽ gọi `System.loadLibrary("legocore")` để nạp file `liblegocore.so` vào bộ nhớ và gán biến `boolean a = true`. Đáng chú ý đây có bẫy **Lazy Load** cực kì khó chịu. File `liblegocore.so` sẽ ko tồn tại trong RAM ngay khi mở game, mà nó chỉ được nạp vào khi hệ thống gọi đến class `SessionValidator` khi người chơi đạt mốc 1.000.000 điểm ở hàm `FlagEngine.b`. 

Tiếp theo là hàm xử lý chính. Lần này mảng `iArr` được XOR với key `92`. Đem giải mã, ta thu được chuỗi `syncBrickCache`. Đây là tên 1 hàm nhưng tác giả không gọi thẳng nó mà thay vào đó, tác giả sử dụng `Java Reflection (getDeclaredMethod().invoke())` để gọi một cách gián tiếp thông qua chuỗi string vừa giải mã.

Cuối cùng, ta nhìn thấy 3 khai báo hàm C/C++:
```java
public static native String refreshTileMap(long j, long j2);
public static native String syncBrickCache(long j, long j2);
public static native String validateBrickToken(long j, long j2);
```
Ta thấy rằng để lấy được Flag, mục tiêu là phải gọi được hàm `syncBrickCache`. Hàm này yêu cầu truyền vào biến `j` là số điểm khổng lồ ta muốn ép vào hệ thống và biến `j2` là mã xác thực tương ứng với số điểm `j` đó. Đây là cơ chế Anti-Cheat của game: Tầng Java sẽ băm điểm số thành token `j2` rồi gửi xuống, hệ thống C/C++ bên dưới sẽ kiểm chứng lại để đảm bảo người chơi không tùy ý sửa điểm bằng Memory Editor (như Cheat Engine).

Tuy nhiên, thuật toán kiểm chứng tính hợp lệ của cặp `(j, j2)` này, cũng như logic tạo ra Flag thật, hoàn toàn bị che giấu đằng sau từ khóa `native`. Theo cấu trúc chuẩn của một file APK, các thư viện native được biên dịch sẵn sẽ nằm trong thư mục `Resources`. Mở nó ra, đi vào thư mục `lib`, ta có thể thấy game hỗ trợ rất nhiều kiến trúc CPU khác nhau (arm64-v8a, armeabi-v7a, x86, x86_64). Vì ta chạy game trên giả lập NoxPlayer thường sử dụng x86_64, ta sẽ đi vào thư mục `x86_64`.

Tại đây ta nhìn thấy file `liblegocore.so`. Dùng IDA mở file này lên, đi vào hàm [JNI_Onload](files/JNI_Onload.c), ta thấy đoạn code đã tiết lộ 2 hành động chính của hệ thống:
1. Giải mã động: Hàng loạt lệnh gọi hàm `sub_21000` được sử dụng để giải mã tên class (`SessionValidator`) và tên các hàm `native` ngay trong lúc chạy, nhằm qua mặt công cụ phân tích tĩnh.
2. Dynamic Register: Nhìn vào dòng lệnh có chứa offset `1720LL`. Trong cấu trúc JNIEnv, index của hàm `RegisterNatives` là 215 (215 * 8 = 1720). Tác giả đã dùng lệnh này để ngầm liên kết 3 hàm native bên Java vào 3 hàm C/C++ vô danh: `sub_210F0`, `sub_21280`, và `sub_213B0`.

Ta đi vào hàm đầu tiên `sub_210F0`:
```C
__int64 __fastcall sub_210F0(__int64 a1, __int64 a2, unsigned int a3, unsigned int a4)
{

........................... (khởi tạo các biến)

  v17 = __readfsqword(0x28u);
  if ( !(unsigned __int8)sub_21D40(a3) )
  {
    sub_21D60(&v14);
    if ( (v14 & 1) != 0 )
      v6 = v16;
    else
      v6 = v15;
    goto LABEL_10;
  }
  sub_20FE0(a3 ^ a4);
  if ( (unsigned __int8)sub_21E80() )
  {
    sub_21EA0(&v14);
    if ( (v14 & 1) != 0 )
      v6 = v16;
    else
      v6 = v15;
LABEL_10:
    result = (*(__int64 (__fastcall **)(__int64, _BYTE *))(*(_QWORD *)a1 + 1336LL))(a1, v6);
    goto LABEL_15;
  }
  sub_21F60(&v14);
  sub_22110(&v11, &v14);
  if ( (v11 & 1) != 0 )
    v7 = (char *)ptr;
  else
    v7 = &v12;
  result = (*(__int64 (__fastcall **)(__int64, char *))(*(_QWORD *)a1 + 1336LL))(a1, v7);
  if ( (v11 & 1) != 0 )
  {
    v9 = result;
    operator delete(ptr);
    result = v9;
  }
LABEL_15:
  if ( (v14 & 1) != 0 )
  {
    v10 = result;
    operator delete(v16);
    return v10;
  }
  return result;
}
```
Ngay khi bước vào hàm, tác giả có 1 lệnh kiểm tra `if ( !(unsigned __int8)sub_21D40(a3) )`. Nhìn vào hàm `sub_21D40`: `return ((a1 * (a1 + 1)) & 1) == 0;` ta phân tích 1 chút: Tích của hai số tự nhiên liên tiếp `a1 * (a1 + 1)` luôn luôn là một số chẵn. Một số chẵn khi đem AND với 1 thì chắc chắn bằng 0. Lệnh if lại có dấu ! đằng trước khiến code sẽ luôn trả về False => Cái nhánh if này vĩnh viễn không bao giờ được chạy. Hàm `sub_21D60` bên trong chỉ là **Dead Code**

Tiếp theo là 1 lệnh kiểm tra nữa: `if ( (unsigned __int8)sub_21E80() )`. Đi vào hàm `sub_21E80` ta thấy:
```C
char sub_21E80()
{
  if ( (unsigned __int8)sub_22210() )
    return 1;
  else
    return sub_223C0();
}
```
Hàm này có lệnh rẽ nhánh để gọi 2 hàm khác nhau:
- `sub_22210`: Hàm này dùng fopen đọc 1 file, sau đó dùng fgets đọc từng dòng và strncmp để tìm trường `TracerPid`. Nếu giá trị này khác 0, nghĩa là có người đang Debug app.
- `sub_223C0`: Hàm này cũng dùng fopen đọc một file khác, rồi dùng `strstr` liên tục để lùng sục các từ khóa nhạy cảm. Nó đang tìm xem trong bộ nhớ có nạp các file .so của frida, xposed hay magisk không.

Nếu 1 trong 2 hàm báo động, `sub_21E80` trả về 1 (True). Luồng thực thi lập tức gọi `sub_21EA0`. Nhìn vào `sub_21EA0`, ta thấy nó tạo ra một mảng dài 34 bytes bằng các phép XOR liên hoàn. Giải mã ra ta sẽ thu được cờ rác `BHREV{f4k3_fl4g_n1c3_try_d3bugger}`
```C
_QWORD *__fastcall sub_21EA0(_QWORD *a1)
{
  __int64 v2; // rax
  char *v3; // rdi
  char v4; // r8
  unsigned __int64 i; // rcx
  char *v6; // rax

  v2 = operator new(0x28u);
  a1[2] = v2;
  *a1 = 41;
  a1[1] = 34;
  *(_OWORD *)(v2 + 16) = 0;
  *(_OWORD *)v2 = 0;
  *(_DWORD *)(v2 + 31) = 0;
  v3 = (char *)&unk_1526F;
  v4 = 0;
  for ( i = 0; i != 34; ++i )
  {
    v6 = (char *)a1 + 1;
    if ( (*(_BYTE *)a1 & 1) != 0 )
      v6 = (char *)a1[2];
    v6[i] = byte_15280[i] ^ v4 ^ v3[-7 * (i / 7)];
    ++v3;
    v4 += 29;
  }
  return a1;
}
```
Từ đó ta có kết luận `sub_21E80()` chính là hàm Anti-debug. Nếu ta vượt qua bẫy Anti-debug này và đi xuống dưới, ta sẽ thấy hàm `sub_21F60`:
```C
_QWORD *__fastcall sub_21F60(_QWORD *a1)
{
  _OWORD *v1; // rax
  __int64 i; // r14
  unsigned __int16 j; // ax
  int v4; // ecx
  char *v5; // rcx
  unsigned __int8 v7; // [rsp+1h] [rbp-29h]

  v1 = (_OWORD *)operator new(0x30u);
  a1[2] = v1;
  *a1 = 49;
  a1[1] = 41;
  *(_OWORD *)((char *)v1 + 26) = 0;
  v1[1] = 0;
  *v1 = 0;
  for ( i = 0; i != 41; ++i )
  {
    v7 = sub_20310((unsigned int)i);
    for ( j = -8531; ; j = -12162 )
    {
      while ( 1 )
      {
        while ( 1 )
        {
          v4 = j;
          j = -16657;
          if ( v4 <= 53373 )
            break;
          if ( v4 == 53374 )
          {
            v7 ^= *((_BYTE *)&dword_585F0 + (i & 3));
          }
          else if ( v4 == 61453 )
          {
            v7 = qword_58590(v7, (unsigned int)i);
            j = -21267;
          }
          else
          {
            v7 = qword_58578(v7, (unsigned int)i);
            j = -16162;
          }
        }
        if ( v4 <= 49373 )
          break;
        if ( v4 == 49374 )
        {
          v7 = qword_58580(v7, (unsigned int)i);
          j = -13570;
        }
        else
        {
          v7 = qword_58588(v7, (unsigned int)i);
          j = -4083;
        }
      }
      if ( v4 != 44269 )
        break;
      v7 = qword_58598(v7, (unsigned int)i);
    }
    v5 = (char *)a1 + 1;
    if ( (*(_BYTE *)a1 & 1) != 0 )
      v5 = (char *)a1[2];
    v5[i] = v7;
  }
  return a1;
}
```
Đây mới chính là hàm tạo Flag thật. Hàm này khởi tạo một mảng dài 41 bytes, bên trong nó là 4 vòng lặp `for/while` với các lệnh `if/else` nhảy loạn xạ giữa các hằng số -16657, 53374,... Đây là kĩ thuật **Control Flow Flattening**. Nó kết hợp với biến `dword_585F0` (chứa thời gian `clock_gettime` lấy từ `JNI_OnLoad`) để XOR và nhào nặn ra Flag thật. Cuối cùng, `sub_22110` lại được gọi để in Flag ra.

## Hướng giải
Do hàm `sub_21F60` phụ thuộc vào thời gian, ta không thể phân tích tĩnh được nữa (thật ra là không phát hiện ra biến thời gian về sau bị triệt tiêu =))). Ta sẽ sử dụng Frida phân tích động. Chiến thuật là ép Anti-Debug trả về 0 và ép chính hàm `syncBrickCache` (`sub_21F60`) tự động chạy để nhả Flag thật ra.

Chiến thuật cụ thể gồm 4 bước:

**Bước 1: Giả lập thuật toán băm Checksum**  
Trên Leaderboard, Top 1 đang có 1 nghìn tỷ điểm. Ta sẽ nã hẳn 1 triệu tỷ điểm vào hệ thống để đè bẹp Top 1. Tuy nhiên ta không thể gửi trực tiếp điểm đó. Dựa vào thuật toán băm điểm số (hàm `d(double)`) ở class `FlagEngine` trên tầng Java, ta cần viết một script Python mô phỏng lại các phép tính này để lấy mã Checksum `j2` hợp lệ. Kết quả thu được là `4521136641424654587`.
```python
import struct

def double_to_raw_long_bits(d):
    return struct.unpack('Q', struct.pack('d', d))[0]

def get_checksum(score):
    kTierBlob = [68576273936416768, 33514703552512, 167772160000, 1048576000, 0]
    jDoubleToRawLongBits = double_to_raw_long_bits(score)
    
    index = int(4 & jDoubleToRawLongBits)
    j = jDoubleToRawLongBits ^ kTierBlob[index]
    
    j2 = (j ^ (j >> 30)) * (-4658895280553007687 & 0xFFFFFFFFFFFFFFFF)
    j2 &= 0xFFFFFFFFFFFFFFFF
    
    # Ép kiểu về số nguyên có dấu 64-bit chuẩn Java
    res = j2 ^ (j2 >> 31)
    if res & 0x8000000000000000:
        res -= 0x10000000000000000
    return res

target_score = 1000000000000000 
print(f"Mã Checksum (j2) cho {target_score} điểm: {get_checksum(target_score)}")
```
**Bước 2: Cưỡng chế nạp thư viện (Bypass Lazy Load)**  
Quay lại class `SessionValidator`, game áp dụng Lazy Load: File `liblegocore.so` chỉ được nạp vào RAM khi class này được khởi tạo. Nếu thư viện chưa được nạp, Frida sẽ không thể tìm thấy offset để hook. Ta phải dùng lệnh `Class.forName (Java Reflection)` trong Frida để ép máy ảo Android chạy khối lệnh `static` và nạp file `.so` ngay lập tức.

**Bước 3: Vượt Anti-Debug**  
Một khi `liblegocore.so` đã nằm trong bộ nhớ, ta dùng Frida hook thẳng vào offset `0x21E80` (tọa độ hàm Anti-Debug `sub_21E80()` tìm được ở trên). Bằng cách ghi đè kết quả trả về `(retval.replace(ptr(0)))`, ta đánh lừa hệ thống rằng môi trường hoàn toàn sạch sẽ, không có dấu vết của Debugger.

**Bước 4: Ép điểm số & Đoạt cờ**  
Ta dùng Frida gọi trực tiếp hàm native `syncBrickCache`, truyền vào số điểm 1 triệu tỷ và mã Checksum của nó `4521136641424654587`. Hệ thống sẽ tự động chui vào và nhả cờ thật.

### Script giải: [hook.js](files/hook.js)

<img width="1001" height="435" alt="image" src="https://github.com/user-attachments/assets/14a6d93f-156d-433e-9995-c6251609a634" />

## FLAG: 
```bash
UMASS{br1ck_by_br1ck_y0u_r3ach3d_th3_t0p}
```