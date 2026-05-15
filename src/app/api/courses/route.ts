import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
  });

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const submittedStatus = enrollments.some((e) => e.status === "SUBMITTED");

  const coursesWithStatus = courses.map((course) => ({
    ...course,
    flag: undefined,
    isEnrolled: enrolledCourseIds.has(course.id),
    canEnroll: !submittedStatus,
  }));

  return NextResponse.json(coursesWithStatus);
}
