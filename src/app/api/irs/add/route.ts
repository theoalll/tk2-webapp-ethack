import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMaxSKS } from "@/lib/sks";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "Course ID wajib diisi" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Mata kuliah tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Anda sudah terdaftar di mata kuliah ini" }, { status: 409 });
  }

  const submittedCount = await prisma.enrollment.count({
    where: { userId: user.id, status: "SUBMITTED" },
  });
  if (submittedCount > 0) {
    return NextResponse.json({ error: "IRS sudah disubmit. Tidak dapat menambahkan mata kuliah." }, { status: 409 });
  }

  if (course.isHidden) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasOverloaded: true },
    });

    if (!userRecord?.hasOverloaded) {
      return NextResponse.json(
        {
          error:
            "Mata kuliah ini hanya dapat didaftarkan melalui mekanisme overloading SKS. "
        },
        { status: 400 }
      );
    }

    await prisma.enrollment.create({
      data: { userId: user.id, courseId, status: "ENROLLED" },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${course.code} - ${course.name}`,
      currentSKS: null,
      maxSKS: computeMaxSKS(user.gpa),
    });
  }

  const maxSKS = computeMaxSKS(user.gpa);

  const currentEnrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ENROLLED" },
    include: { course: true },
  });
  const currentSKS = currentEnrollments.reduce((sum, e) => sum + e.course.credits, 0);

  if (currentSKS + course.credits > maxSKS) {
    return NextResponse.json(
      { error: `Batas SKS terlampaui. SKS saat ini: ${currentSKS}, maksimal: ${maxSKS}` },
      { status: 400 }
    );
  }

  await prisma.enrollment.create({
    data: { userId: user.id, courseId, status: "ENROLLED" },
  });

  const updatedEnrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ENROLLED" },
    include: { course: true },
  });
  const actualTotal = updatedEnrollments.reduce((sum, e) => sum + e.course.credits, 0);

  if (actualTotal > maxSKS) {
    await prisma.user.update({
      where: { id: user.id },
      data: { hasOverloaded: true },
    });
  }

  return NextResponse.json({
    success: true,
    message: `Berhasil menambahkan ${course.code} - ${course.name}`,
    currentSKS: actualTotal,
    maxSKS,
  });
}
