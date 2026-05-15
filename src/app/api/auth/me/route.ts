import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeMaxSKS } from "@/lib/sks";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
  });

  const enrolled = enrollments.filter((e) => e.status === "ENROLLED");
  const submitted = enrollments.filter((e) => e.status === "SUBMITTED");
  const currentSKS = enrolled.reduce((sum, e) => sum + e.course.credits, 0);
  const submittedSKS = submitted.reduce((sum, e) => sum + e.course.credits, 0);
  const maxSKS = computeMaxSKS(user.gpa);

  const userData = {
    ...user,
    gpa: user.gpa,
    currentSKS,
    submittedSKS,
    maxSKS,
    enrollmentCount: enrolled.length,
    submittedCount: submitted.length,
    isSubmitted: submitted.length > 0,
  };

  return NextResponse.json(userData);
}
