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
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("userId");
    
    let driver = null;
    if (userIdCookie) {
      driver = await prisma.user.findUnique({ where: { id: parseInt(userIdCookie.value) } });
    }

    const requests = await prisma.rideRequest.findMany({
      where: {
        status: "OPEN"
      },
      include: {
        rider: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let filteredRequests = requests;

    // Apply Geofencing if the active user is a DRIVER
    if (driver && driver.role === "OFFERER" && driver.lat !== null && driver.lng !== null && driver.radius !== null) {
      filteredRequests = requests.filter((req: any) => {
        const rider = req.rider;
        if (rider.lat === null || rider.lng === null) {
          return false;
        }
        
        const distance = calculateDistance(rider.lat, rider.lng, driver.lat!, driver.lng!);
        return distance <= driver.radius!;
      });
    }

    return NextResponse.json(filteredRequests);
  } catch (error) {
    console.error("Requests GET error:", error);
    return NextResponse.json({ error: "Failed to fetch passenger requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { riderId, from, to, time } = body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(riderId) } });
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: "Only verified users can post ride requests" }, { status: 403 });
    }

    // 1. Create the Request
    const rideRequest = await prisma.rideRequest.create({
      data: {
        riderId: parseInt(riderId),
        from,
        to,
        time
      },
      include: {
        rider: true,
      }
    });

    // 2. Intelligent Matchmaking
    // Find rides that match 'from' or 'to' loosely, and where driver is within radius
    const potentialRides = await prisma.ride.findMany({
      where: {
        availableSeats: { gt: 0 }
      },
      include: {
        driver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let matches = potentialRides;

    // Geofencing match
    if (user.lat !== null && user.lng !== null) {
      matches = potentialRides.filter((ride: any) => {
        const driver = ride.driver;
        if (driver.lat === null || driver.lng === null || driver.radius === null) {
          return false;
        }
        const distance = calculateDistance(user.lat!, user.lng!, driver.lat, driver.lng);
        return distance <= driver.radius;
      });
    }

    return NextResponse.json({
      request: rideRequest,
      matches: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    console.error("Requests POST error:", error);
    return NextResponse.json({ error: "Failed to create ride request" }, { status: 500 });
  }
}
