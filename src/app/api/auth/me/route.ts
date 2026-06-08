import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("userId");

    if (!userIdCookie) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const userId = parseInt(userIdCookie.value);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ridesOffered: {
          include: { 
            driver: true,
            bookings: { include: { rider: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        bookings: {
          include: {
            ride: { include: { driver: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't send password to the client
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
