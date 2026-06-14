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

    // 2. Intelligent Matchmaking — destination-first scoring
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

    // Helper: extract meaningful keywords from a location string
    const STOP_WORDS = new Set(["the","to","in","of","and","a","an","at","for","on","is"]);
    function extractKeywords(text: string): string[] {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w));
    }

    const requestToKeywords = extractKeywords(to);
    const requestFromKeywords = extractKeywords(from);

    // Score each ride
    const scored = potentialRides.map((ride: any) => {
      const rideToKeywords = extractKeywords(ride.to);
      const rideFromKeywords = extractKeywords(ride.from);

      // Destination match score (most important)
      let destScore = 0;
      for (const kw of requestToKeywords) {
        if (rideToKeywords.some(rk => rk.includes(kw) || kw.includes(rk))) {
          destScore += 10;
        }
      }

      // Origin match score (bonus)
      let originScore = 0;
      for (const kw of requestFromKeywords) {
        if (rideFromKeywords.some(rk => rk.includes(kw) || kw.includes(rk))) {
          originScore += 3;
        }
      }

      // Area proximity score (tiebreaker)
      let proximityScore = 0;
      if (user.lat !== null && user.lng !== null && ride.driver.lat !== null && ride.driver.lng !== null && ride.driver.radius !== null) {
        const distance = calculateDistance(user.lat!, user.lng!, ride.driver.lat, ride.driver.lng);
        if (distance <= ride.driver.radius) {
          proximityScore = 2;
        }
      }

      return { ride, score: destScore + originScore + proximityScore, destScore };
    });

    // Only return rides that have at least some destination keyword match
    const matches = scored
      .filter(s => s.destScore > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.ride);

    return NextResponse.json({
      request: rideRequest,
      matches
    });
  } catch (error) {
    console.error("Requests POST error:", error);
    return NextResponse.json({ error: "Failed to create ride request" }, { status: 500 });
  }
}
