import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { cookies } from "next/headers";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("userId");
    
    let rider = null;
    if (userIdCookie) {
      rider = await prisma.user.findUnique({ where: { id: parseInt(userIdCookie.value) } });
    }

    const rides = await prisma.ride.findMany({
      where: {
        ...(from ? { from: { contains: from } } : {}),
        ...(to ? { to: { contains: to } } : {}),
      },
      include: {
        driver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let filteredRides = rides;

    // Apply Geofencing if the active user is a BOOKER and has coordinates
    if (rider && rider.role === "BOOKER" && rider.lat !== null && rider.lng !== null) {
      filteredRides = rides.filter(ride => {
        const driver = ride.driver;
        if (driver.lat === null || driver.lng === null || driver.radius === null) {
          return false;
        }
        
        const distance = calculateDistance(rider.lat!, rider.lng!, driver.lat, driver.lng);
        return distance <= driver.radius;
      });
    }

    return NextResponse.json(filteredRides);
  } catch (error) {
    console.error("Rides GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driverId, from, to, time, price, totalSeats, destLat, destLng } = body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(driverId) } });
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: "Only verified users can offer rides" }, { status: 403 });
    }

    const seats = parseInt(totalSeats);

    const ride = await prisma.ride.create({
      data: {
        driverId: parseInt(driverId),
        from,
        to,
        time,
        price,
        availableSeats: seats,
        destLat: destLat ? parseFloat(destLat) : null,
        destLng: destLng ? parseFloat(destLng) : null,
      },
      include: {
        driver: true,
      }
    });

    return NextResponse.json(ride);
  } catch (error) {
    console.error("Rides POST error:", error);
    return NextResponse.json({ error: "Failed to create ride" }, { status: 500 });
  }
}
