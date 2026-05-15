import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: id } },
  });

  const isEnrolled = !!enrollment;

  if (course.isHidden && !isEnrolled) {
    return NextResponse.json(
      { error: "Akses ditolak. Anda tidak terdaftar pada mata kuliah ini." },
      { status: 403 }
    );
  }

  const courseData = {
    ...course,
    flag: course.isHidden && isEnrolled ? course.flag : undefined,
    isEnrolled,
    enrollmentStatus: enrollment?.status || null,
  };

  return NextResponse.json(courseData);
}
