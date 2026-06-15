import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rideId, riderId } = body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(riderId) } });
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: "Only verified users can book rides" }, { status: 403 });
    }

    // Run transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      const ride = await tx.ride.findUnique({
        where: { id: parseInt(rideId) },
        include: { driver: true }
      });

      if (!ride || ride.availableSeats <= 0) {
        throw new Error("Ride not available");
      }

      // Check if already booked
      const existing = await tx.booking.findFirst({
        where: { rideId: parseInt(rideId), riderId: parseInt(riderId) }
      });

      if (existing) {
        throw new Error("Already booked this ride");
      }

      const booking = await tx.booking.create({
        data: {
          rideId: parseInt(rideId),
          riderId: parseInt(riderId),
        },
        include: {
          ride: true,
          rider: true,
        }
      });

      // Update seats
      await tx.ride.update({
        where: { id: parseInt(rideId) },
        data: { availableSeats: ride.availableSeats - 1 }
      });

      // Send push notification to the driver
      if (ride.driver && ride.driver.pushSubscription) {
        import("@/lib/webPush").then(({ sendPushNotification }) => {
          sendPushNotification(ride.driver!.pushSubscription!, {
            title: "New Ride Booking!",
            body: `${booking.rider.name} has booked a seat on your ride.`,
            url: "/activity"
          });
        });
      }

      return booking;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to book ride" }, { status: 400 });
  }
}
