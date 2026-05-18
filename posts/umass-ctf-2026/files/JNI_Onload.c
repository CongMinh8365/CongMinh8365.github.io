__int64 __fastcall JNI_OnLoad(__int64 a1)
{
  int v1; // ecx
  __int64 result; // rax
  unsigned int v3; // ebx
  char *v4; // rsi
  __int64 v5; // rbx
  char *v6; // rsi
  char *v7; // rax
  char *v8; // rax
  char *v9; // rcx
  char *v10; // rcx
  char v11; // [rsp+26h] [rbp-FAh]
  char v12; // [rsp+28h] [rbp-F8h] BYREF
  char v13; // [rsp+29h] [rbp-F7h] BYREF
  void *v14; // [rsp+38h] [rbp-E8h]
  char v15; // [rsp+40h] [rbp-E0h] BYREF
  char v16; // [rsp+41h] [rbp-DFh] BYREF
  void *v17; // [rsp+50h] [rbp-D0h]
  _QWORD v18[2]; // [rsp+58h] [rbp-C8h] BYREF
  void *v19; // [rsp+68h] [rbp-B8h]
  _QWORD v20[2]; // [rsp+70h] [rbp-B0h] BYREF
  void *v21; // [rsp+80h] [rbp-A0h]
  _QWORD v22[2]; // [rsp+88h] [rbp-98h] BYREF
  void *v23; // [rsp+98h] [rbp-88h]
  struct timespec v24; // [rsp+A0h] [rbp-80h] BYREF
  void *ptr; // [rsp+B0h] [rbp-70h]
  __int64 v26; // [rsp+B8h] [rbp-68h] BYREF
  struct timespec tp; // [rsp+C0h] [rbp-60h] BYREF
  __int64 (__fastcall *v28)(); // [rsp+D0h] [rbp-50h]
  char *v29; // [rsp+D8h] [rbp-48h]
  char *v30; // [rsp+E0h] [rbp-40h]
  __int64 (__fastcall *v31)(); // [rsp+E8h] [rbp-38h]
  char *v32; // [rsp+F0h] [rbp-30h]
  char *v33; // [rsp+F8h] [rbp-28h]
  __int64 (__fastcall *v34)(); // [rsp+100h] [rbp-20h]
  unsigned __int64 v35; // [rsp+110h] [rbp-10h]

  v35 = __readfsqword(0x28u);
  v26 = 0;
  v1 = (*(__int64 (__fastcall **)(__int64, __int64 *, __int64))(*(_QWORD *)a1 + 48LL))(a1, &v26, 65542);
  result = 0xFFFFFFFFLL;
  if ( !v1 )
  {
    sub_20FA0();
    clock_gettime(0, &tp);
    clock_gettime(2, &v24);
    v22[0] = tp.tv_nsec ^ ((unsigned __int64)LODWORD(tp.tv_sec) << 13);
    v20[0] = v24.tv_nsec ^ ((unsigned __int64)LODWORD(v24.tv_sec) << 13);
    v18[0] = (v22[0] | ~v22[0]) + 1LL;
    dword_585F0 = LODWORD(v24.tv_nsec)
                ^ (LODWORD(v24.tv_sec) << 13)
                ^ LODWORD(v20[0])
                ^ ((LODWORD(tp.tv_nsec) ^ (LODWORD(tp.tv_sec) << 13)
                  | ~(LODWORD(tp.tv_nsec) ^ (LODWORD(tp.tv_sec) << 13)))
                 + 1);
    v3 = v26 ^ a1;
    v11 = byte_13CBC[(v3 >> 15) & 7]
        ^ byte_13CD4[(v3 >> 15) & 7]
        ^ byte_13CAC[(v3 >> 12) & 7]
        ^ byte_13CCC[(v3 >> 12) & 7]
        ^ byte_13CB4[(v3 >> 9) & 7]
        ^ byte_13CC4[(v3 >> 9) & 7]
        ^ *((_BYTE *)&qword_58570 + ((v3 >> 6) & 7))
        ^ *((_BYTE *)&qword_58560 + (((unsigned __int8)v26 ^ (unsigned __int8)a1) & 7))
        ^ *((_BYTE *)&qword_58568 + ((((unsigned int)v26 ^ (unsigned int)a1) >> 3) & 7));
    sub_20FE0((unsigned __int8)(byte_13D10[(v11 + 1) & 0x13] ^ byte_13CF0[v11 & 0x13]));
    sub_21000(&v24, &unk_13D30, 16, 71);
    sub_21000(v22, &unk_13D40, 40, 71);
    sub_21000(v20, &unk_13D68, 14, 71);
    sub_21000(v18, &unk_13D76, 14, 71);
    sub_21000(&v15, &unk_13D90, 18, 71);
    sub_21000(&v12, &unk_13DB0, 22, 71);
    if ( (v24.tv_sec & 1) != 0 )
      v4 = (char *)ptr;
    else
      v4 = (char *)&v24.tv_sec + 1;
    v5 = (*(__int64 (__fastcall **)(__int64, char *))(*(_QWORD *)v26 + 48LL))(v26, v4);
    if ( v5 && !(*(unsigned __int8 (__fastcall **)(__int64))(*(_QWORD *)v26 + 1824LL))(v26) )
      goto LABEL_13;
    (*(void (__fastcall **)(__int64))(*(_QWORD *)v26 + 136LL))(v26);
    if ( (v22[0] & 1) != 0 )
      v6 = (char *)v23;
    else
      v6 = (char *)v22 + 1;
    v5 = (*(__int64 (__fastcall **)(__int64, char *))(*(_QWORD *)v26 + 48LL))(v26, v6);
    if ( (*(unsigned __int8 (__fastcall **)(__int64))(*(_QWORD *)v26 + 1824LL))(v26) )
      (*(void (__fastcall **)(__int64))(*(_QWORD *)v26 + 136LL))(v26);
    if ( v5 )
    {
LABEL_13:
      if ( (v20[0] & 1) != 0 )
        v7 = (char *)v21;
      else
        v7 = (char *)v20 + 1;
      tp.tv_sec = (__time_t)v7;
      if ( (v12 & 1) != 0 )
        v8 = (char *)v14;
      else
        v8 = &v13;
      tp.tv_nsec = (__syscall_slong_t)v8;
      v28 = sub_210F0;
      if ( (v18[0] & 1) != 0 )
        v9 = (char *)v19;
      else
        v9 = (char *)v18 + 1;
      v29 = v9;
      v30 = v8;
      v31 = sub_21280;
      if ( (v15 & 1) != 0 )
        v10 = (char *)v17;
      else
        v10 = &v16;
      v32 = v10;
      v33 = v8;
      v34 = sub_213B0;
      (*(void (__fastcall **)(__int64, __int64, struct timespec *, __int64))(*(_QWORD *)v26 + 1720LL))(v26, v5, &tp, 3);
      if ( (*(unsigned __int8 (__fastcall **)(__int64))(*(_QWORD *)v26 + 1824LL))(v26) )
        (*(void (__fastcall **)(__int64))(*(_QWORD *)v26 + 136LL))(v26);
    }
    if ( (v12 & 1) != 0 )
    {
      operator delete(v14);
      if ( (v15 & 1) == 0 )
      {
LABEL_29:
        if ( (v18[0] & 1) == 0 )
          goto LABEL_30;
        goto LABEL_38;
      }
    }
    else if ( (v15 & 1) == 0 )
    {
      goto LABEL_29;
    }
    operator delete(v17);
    if ( (v18[0] & 1) == 0 )
    {
LABEL_30:
      if ( (v20[0] & 1) == 0 )
        goto LABEL_31;
      goto LABEL_39;
    }
LABEL_38:
    operator delete(v19);
    if ( (v20[0] & 1) == 0 )
    {
LABEL_31:
      if ( (v22[0] & 1) == 0 )
        goto LABEL_32;
      goto LABEL_40;
    }
LABEL_39:
    operator delete(v21);
    if ( (v22[0] & 1) == 0 )
    {
LABEL_32:
      if ( (v24.tv_sec & 1) == 0 )
        return 65542;
LABEL_33:
      operator delete(ptr);
      return 65542;
    }
LABEL_40:
    operator delete(v23);
    if ( (v24.tv_sec & 1) == 0 )
      return 65542;
    goto LABEL_33;
  }
  return result;
}