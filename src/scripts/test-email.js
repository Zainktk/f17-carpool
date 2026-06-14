require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log("Using Pass:", process.env.GMAIL_APP_PASSWORD);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'zainktk1998@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"F17 Carpool Test" <zainktk1998@gmail.com>',
      to: 'zainktk1998@gmail.com',
      subject: 'Test Email',
      text: 'If you get this, the app password works!',
    });
    console.log("Success! Message ID:", info.messageId);
  } catch (err) {
    console.error("Failed to send:", err);
  }
}
test();
