import nodemailer from "nodemailer";

export async function sendOTPEmail(to: string, otp: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'zainktk1998@gmail.com', // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // The 16-letter app password
      },
    });

    const info = await transporter.sendMail({
      from: '"F17 Carpool" <zainktk1998@gmail.com>',
      to,
      subject: "Verify your F17 Carpool account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to F17 Carpool!</h2>
          <p>Please use the following OTP to verify your email address. It expires in 10 minutes.</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px;">
            <h1 style="margin: 0; color: #3b82f6; letter-spacing: 5px;">${otp}</h1>
          </div>
        </div>
      `,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP email via Gmail:", error);
    // Fallback log for development
    console.log(`[FALLBACK] Verification OTP for ${to} is: ${otp}`);
    return false;
  }
}
