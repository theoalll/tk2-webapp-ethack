import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMaxSKS } from "@/lib/sks";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrolled = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ENROLLED" },
    include: { course: true },
  });

  if (enrolled.length === 0) {
    return NextResponse.json({ error: "Tidak ada mata kuliah yang dipilih" }, { status: 400 });
  }

  const totalSKS = enrolled.reduce((sum, e) => sum + e.course.credits, 0);
  const maxSKS = computeMaxSKS(user.gpa);

  if (totalSKS > maxSKS) {
    return NextResponse.json(
      {
        error: `Batas SKS terlampaui. Total SKS: ${totalSKS}, maksimal: ${maxSKS}. Silakan hapus beberapa mata kuliah terlebih dahulu.`,
      },
      { status: 400 }
    );
  }

  const ids = enrolled.map((e) => e.id);
  await prisma.enrollment.updateMany({
    where: { id: { in: ids } },
    data: { status: "SUBMITTED" },
  });

  return NextResponse.json({
    success: true,
    message: "IRS berhasil disubmit!",
    totalSKS,
    maxSKS,
  });
}
