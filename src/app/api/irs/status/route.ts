import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMaxSKS } from "@/lib/sks";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { createdAt: "asc" },
  });

  const enrolled = enrollments.filter((e) => e.status === "ENROLLED");
  const submitted = enrollments.filter((e) => e.status === "SUBMITTED");

  const totalSKS = enrollments.reduce((sum, e) => sum + e.course.credits, 0);
  const currentSKS = enrolled.reduce((sum, e) => sum + e.course.credits, 0);
  const maxSKS = computeMaxSKS(user.gpa);

  return NextResponse.json({
    enrollments,
    totalSKS,
    currentSKS,
    maxSKS,
    isSubmitted: submitted.length > 0,
    submittedAt: submitted[0]?.createdAt || null,
  });
}
