import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rideId = parseInt(searchParams.get("rideId") || "0");
  const otherUserId = parseInt(searchParams.get("otherUserId") || "0");

  if (!rideId || !otherUserId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("userId");
    if (!userIdCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const myId = parseInt(userIdCookie.value);

    const messages = await prisma.message.findMany({
      where: {
        rideId,
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("userId");
    if (!userIdCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const myId = parseInt(userIdCookie.value);
    
    const body = await request.json();
    const { rideId, receiverId, content } = body;

    if (!rideId || !receiverId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        rideId: parseInt(rideId),
        senderId: myId,
        receiverId: parseInt(receiverId),
        content
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
