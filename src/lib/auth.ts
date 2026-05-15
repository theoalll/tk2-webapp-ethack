import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = await verifyJWT(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        nim: true,
        gpa: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
