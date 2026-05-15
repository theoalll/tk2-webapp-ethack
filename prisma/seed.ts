import { PrismaClient, Role, EnrollmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  const student = await prisma.user.create({
    data: {
      email: "mahasiswa@student.ui.ac.id",
      password,
      name: "Budi Santoso",
      nim: "2106751234",
      gpa: 3.78,
      role: Role.STUDENT,
    },
  });

  await prisma.user.create({
    data: {
      email: "asdos@student.ui.ac.id",
      password,
      name: "Siti Rahmawati",
      nim: "2106755678",
      gpa: 3.92,
      role: Role.ASSISTANT_LECTURER,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@siak.ui.ac.id",
      password,
      name: "Dr. Ahmad Fauzi, S.Kom., M.Kom.",
      nim: "1975001122",
      gpa: 4.0,
      role: Role.ADMIN,
    },
  });

  const flag = process.env.FLAG || "CTF{race_condition_in_academic_workflow}";

  const courses = [
    {
      code: "MK001",
      name: "Matematika Diskrit",
      credits: 3,
      lecturer: "Prof. Dr. Ir. Hj. Dewi Sartika, M.Sc.",
      schedule: "Senin, 07:30 - 09:10",
      description:
        "Mata kuliah ini membahas konsep dasar matematika diskrit yang meliputi logika matematika, himpunan, relasi dan fungsi, induksi matematika, kombinatorial, dan teori graf.",
    },
    {
      code: "MK002",
      name: "Algoritma dan Pemrograman",
      credits: 4,
      lecturer: "Dr. Eng. Rudi Hartono, S.T., M.T.",
      schedule: "Senin, 09:30 - 12:10",
      description:
        "Mata kuliah ini memperkenalkan konsep algoritma dan implementasinya menggunakan bahasa pemrograman. Meliputi struktur kontrol, array, fungsi, dan rekursi.",
    },
    {
      code: "MK003",
      name: "Struktur Data",
      credits: 3,
      lecturer: "Dr. Maya Indriati, S.Kom., M.Kom.",
      schedule: "Selasa, 07:30 - 09:10",
      description:
        "Mata kuliah ini membahas berbagai struktur data fundamental termasuk linked list, stack, queue, tree, graph, dan hash table beserta kompleksitas algoritmanya.",
    },
    {
      code: "MK004",
      name: "Basis Data",
      credits: 3,
      lecturer: "Dr. Ir. Bambang Wijaya, M.T.",
      schedule: "Selasa, 09:30 - 11:10",
      description:
        "Mata kuliah ini mencakup konsep sistem basis data, model data relasional, SQL, normalisasi, transaction processing, dan manajemen basis data.",
    },
    {
      code: "MK005",
      name: "Jaringan Komputer",
      credits: 3,
      lecturer: "Prof. Dr. Tri Wahyu Utami, S.T., M.T.",
      schedule: "Rabu, 07:30 - 09:10",
      description:
        "Mata kuliah ini membahas arsitektur jaringan komputer, model OSI dan TCP/IP, routing, switching, dan protokol jaringan.",
    },
    {
      code: "MK006",
      name: "Sistem Operasi",
      credits: 3,
      lecturer: "Dr. Eko Prasetyo, S.Kom., M.Kom.",
      schedule: "Rabu, 09:30 - 11:10",
      description:
        "Mata kuliah ini mencakup manajemen proses, sinkronisasi, manajemen memori, sistem file, dan I/O pada sistem operasi modern.",
    },
    {
      code: "MK007",
      name: "Rekayasa Perangkat Lunak",
      credits: 3,
      lecturer: "Dr. Ratna Sari Dewi, S.T., M.T.",
      schedule: "Kamis, 07:30 - 09:10",
      description:
        "Mata kuliah ini membahas metodologi pengembangan perangkat lunak, analisis kebutuhan, perancangan, implementasi, pengujian, dan pemeliharaan.",
    },
    {
      code: "MK008",
      name: "Kecerdasan Buatan",
      credits: 3,
      lecturer: "Dr. Ir. Agus Setiawan, M.Sc.",
      schedule: "Kamis, 09:30 - 11:10",
      description:
        "Mata kuliah ini memperkenalkan konsep dan teknik kecerdasan buatan termasuk machine learning, neural networks, natural language processing, dan computer vision.",
    },
    {
      code: "MK009",
      name: "Keamanan Informasi",
      credits: 3,
      lecturer: "Dr. Indra Budi, S.Kom., M.Kom.",
      schedule: "Jumat, 07:30 - 09:10",
      description:
        "Mata kuliah ini membahas aspek keamanan informasi, kriptografi, keamanan jaringan, ethical hacking, dan kebijakan keamanan.",
    },
    {
      code: "MK010",
      name: "Grafika Komputer",
      credits: 3,
      lecturer: "Dr. Dian Permata Sari, S.T., M.T.",
      schedule: "Jumat, 09:30 - 11:10",
      description:
        "Mata kuliah ini mencakup dasar-dasar grafika komputer, rendering pipeline, transformasi geometri, shading, dan pemrograman grafis.",
    },
    {
      code: "MK011",
      name: "Pemrograman Web",
      credits: 3,
      lecturer: "Dr. Adi Nugroho, S.Kom., M.Kom.",
      schedule: "Senin, 13:00 - 14:40",
      description:
        "Mata kuliah ini membahas pengembangan aplikasi web modern menggunakan berbagai teknologi front-end dan back-end.",
    },
    {
      code: "MK012",
      name: "Komputasi Awan",
      credits: 3,
      lecturer: "Prof. Dr. Ir. Hendra Gunawan, M.T.",
      schedule: "Selasa, 13:00 - 14:40",
      description:
        "Mata kuliah ini mencakup konsep cloud computing, virtualisasi, layanan cloud, dan deployment aplikasi terdistribusi.",
    },
    {
      code: "MK013",
      name: "Data Mining",
      credits: 3,
      lecturer: "Dr. Fitriana Dewi, S.T., M.T.",
      schedule: "Rabu, 13:00 - 14:40",
      description:
        "Mata kuliah ini membahas teknik ekstraksi pengetahuan dari data besar menggunakan metode klasifikasi, clustering, association rules, dan anomaly detection.",
    },
    {
      code: "MK014",
      name: "Interaksi Manusia dan Komputer",
      credits: 3,
      lecturer: "Dr. Haryanto, S.Kom., M.Kom.",
      schedule: "Kamis, 13:00 - 14:40",
      description:
        "Mata kuliah ini mempelajari prinsip-prinsip desain antarmuka pengguna, usability testing, dan evaluasi interaksi manusia-komputer.",
    },
    {
      code: "MK015",
      name: "Metodologi Penelitian",
      credits: 2,
      lecturer: "Prof. Dr. Ir. Sri Mulyani, M.Sc.",
      schedule: "Jumat, 13:00 - 14:40",
      description:
        "Mata kuliah ini membahas metodologi penelitian ilmiah, perumusan masalah, studi literatur, pengumpulan dan analisis data, serta penulisan karya ilmiah.",
    },
  ];

  const courseRecords = [];
  for (const course of courses) {
    const record = await prisma.course.create({ data: course });
    courseRecords.push(record);
  }

  const dummyCourse = await prisma.course.create({
    data: {
      code: "MK000",
      name: "Olahraga Prestasi",
      credits: 6,
      lecturer: "Dr. Agung Prasetyo, S.Pd., M.Pd.",
      schedule: "Sabtu, 06:00 - 10:00",
      description:
        "Mata kuliah ini merupakan program pembinaan olahraga prestasi bagi mahasiswa yang tergabung dalam unit kegiatan mahasiswa olahraga. Mata kuliah ini dapat diambil sebagai pilihan bebas.",
      isDummy: true,
    },
  });

  const hiddenCourse = await prisma.course.create({
    data: {
      code: "CSCTF999",
      name: "Seminar Khusus Keamanan Nasional",
      credits: 24,
      lecturer: "-",
      schedule: "Jadwal Diklasifikasikan",
      description:
        "[AKSES TERBATAS] Mata kuliah ini merupakan seminar khusus yang membahas topik-topik keamanan nasional dan siber. Hanya mahasiswa yang terdaftar yang dapat mengakses detail perkuliahan.",
      isHidden: true,
      flag: flag,
    },
  });

  await prisma.enrollment.createMany({
    data: [
      { userId: student.id, courseId: courseRecords[0].id, status: EnrollmentStatus.ENROLLED },
      { userId: student.id, courseId: courseRecords[2].id, status: EnrollmentStatus.ENROLLED },
      { userId: student.id, courseId: courseRecords[3].id, status: EnrollmentStatus.ENROLLED },
      { userId: student.id, courseId: courseRecords[4].id, status: EnrollmentStatus.ENROLLED },
      { userId: student.id, courseId: dummyCourse.id, status: EnrollmentStatus.ENROLLED },
    ],
  });

  console.log("Seed completed successfully!");
  console.log("\n--- Accounts ---");
  console.log("Mahasiswa: mahasiswa@student.ui.ac.id / password123");
  console.log("Asisten Dosen: asdos@student.ui.ac.id / password123");
  console.log("Admin: admin@siak.ui.ac.id / password123");
  console.log("\nMahasiswa initial enrollment: 18 SKS (includes MK000 - Olahraga Prestasi 6 SKS)");
  console.log(`Hidden course (24 SKS) flag: ${flag}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
