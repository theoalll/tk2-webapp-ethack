import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "Course ID wajib diisi" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { course: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Anda tidak terdaftar di mata kuliah ini" }, { status: 404 });
  }

  if (enrollment.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "IRS sudah disubmit. Tidak dapat menghapus mata kuliah." },
      { status: 409 }
    );
  }

  await prisma.enrollment.delete({
    where: { id: enrollment.id },
  });

  return NextResponse.json({
    success: true,
    message: `Berhasil menghapus ${enrollment.course.code} - ${enrollment.course.name}`,
  });
}
