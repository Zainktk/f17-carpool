import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(to: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Carpool <onboarding@resend.dev>', // Free tier Resend limit
      to: [to],
      subject: 'Verify your F17 Carpool account',
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

    if (error) {
      console.error('Resend API Error:', error);
      console.log(`[FALLBACK] Verification OTP for ${to} is: ${otp}`);
      return false;
    } else {
      console.log('Email sent:', data);
      return true;
    }
  } catch (error) {
    console.error("Error sending OTP email via Resend:", error);
    // Fallback log for development
    console.log(`[FALLBACK] Verification OTP for ${to} is: ${otp}`);
    return false;
  }
}
