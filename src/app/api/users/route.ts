import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // For this prototype, we mock getting the active user (User ID 1)
    const activeUser = await prisma.user.findUnique({
      where: { id: 1 },
      include: {
        ridesOffered: {
          include: { driver: true },
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

    if (!activeUser) {
      return NextResponse.json({ error: "Active user not found. Please run /api/seed" }, { status: 404 });
    }

    return NextResponse.json(activeUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
