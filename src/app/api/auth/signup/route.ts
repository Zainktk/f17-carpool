import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, society, carModel, carColor, licensePlate, lat, lng, radius } = body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        society,
        carModel: role === "OFFERER" ? carModel : null,
        carColor: role === "OFFERER" ? carColor : null,
        licensePlate: role === "OFFERER" ? licensePlate : null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        radius: role === "OFFERER" && radius ? parseFloat(radius) : null,
        isVerified: false,
        otp,
        otpExpiresAt
      }
    });

    // Send the OTP via email
    await sendOTPEmail(email, otp);

    // We do NOT set the cookie yet. Verification happens on the next screen.
    return NextResponse.json({ message: "OTP sent to email", email });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
