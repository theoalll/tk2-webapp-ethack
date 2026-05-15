# SIAK Next Gen - CTF Web Challenge

> **Kategori:** Web Exploitation - Business Logic Vulnerability
> **Tingkat Kesulitan:** Menengah
> **Tema:** Race Condition pada Sistem Akademik Universitas

## Challenge Overview

SIAK Next Gen adalah simulasi sistem informasi akademik universitas modern yang memungkinkan mahasiswa untuk melakukan perencanaan studi (IRS/KRS). Aplikasi ini dibangun menggunakan teknologi web modern dan dirancang untuk terlihat seperti sistem produksi sungguhan.

Tujuan challenge ini adalah mengeksploitasi **race condition** pada endpoint penambahan mata kuliah untuk mendaftar pada mata kuliah rahasia dan mendapatkan flag.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Bahasa:** TypeScript
- **ORM:** Prisma ORM
- **Database:** PostgreSQL
- **Styling:** TailwindCSS
- **Autentikasi:** JWT (httpOnly cookies)
- **Containerization:** Docker & Docker Compose

## Features

- Autentikasi SSO mahasiswa, asisten dosen, dan admin
- Dashboard akademik dengan informasi IP, SKS, dan status IRS
- Katalog mata kuliah lengkap dengan detail
- Sistem registrasi IRS (tambah/hapus mata kuliah)
- Submit IRS final
- Mata kuliah hidden dengan flag

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│                   Next.js App Router                        │
├──────────────┬──────────────────────────────┬───────────────┤
│   /login     │  /dashboard /courses /irs    │  /api/*       │
│  (Halaman)   │     (Halaman Terproteksi)    │  (Endpoint)   │
├──────────────┴──────────────────────────────┴───────────────┤
│                     Prisma ORM                              │
├─────────────────────────────────────────────────────────────┤
│                     PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm atau yarn

### Docker Deployment

```bash
git clone https://github.com/theoalll/tk2-webapp-ethack.git
cd tk2-webapp-ethack

# Build dan jalankan dengan Docker Compose
docker compose up --build -d
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Local Development

```bash
# Clone repository
git clone https://github.com/theoalll/tk2-webapp-ethack.git
cd tk2-webapp-ethack

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi database lokal Anda

# Setup database
npx prisma migrate dev --name init
npx prisma db seed

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.


### Manual Build & Start

```bash
npm run build
npm start
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Mahasiswa | mahasiswa@student.ui.ac.id | password123 |
| Asisten Dosen | asdos@student.ui.ac.id | password123 |
| Admin | admin@siak.ui.ac.id | password123 |

### Student Initial State

| Attribute | Value |
|-----------|-------|
| Nama | Budi Santoso |
| NIM | 2106751234 |
| IP Semester | 3.78 |
| SKS Saat Ini | 18 (dari 5 mata kuliah, termasuk MK000 6 SKS) |
| Maksimal SKS | 24 (IP >= 3.5) |
| Mata Kuliah Dummy | MK000 - Olahraga Prestasi (6 SKS, dapat di-drop) |
| Mata Kuliah Hidden | CSCTF999 - Seminar Khusus Keamanan Nasional (24 SKS) |

## Production Deployment

Untuk deployment production, pastikan:

1. Gunakan environment variables yang aman
2. Ubah `JWT_SECRET` dengan string acak yang panjang
3. Gunakan koneksi database yang aman
4. Aktifkan HTTPS
5. Nonaktifkan debug mode

```bash
# Production dengan Docker
docker compose up -d

# Atau manual
npm run build
NODE_ENV=production JWT_SECRET=<rahasia> DATABASE_URL=<url> npm start
```
