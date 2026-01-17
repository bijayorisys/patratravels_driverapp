import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// 1. Initialize Twilio Client ONCE
const accountSid = process.env.SMS_ACCOUNT_SID;
const authToken = process.env.SMS_AUTH_TOKEN;
const senderNumber = process.env.SMS_SENDER_NUMBER;

// Safe initialization: Only create client if keys exist
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

if (!client) {
  console.warn("⚠️ SMS Service: Twilio credentials missing in .env. SMS will NOT be sent.");
} else {
  console.log("✅ SMS Service Ready (Twilio)");
}

/**
 * Reusable function to send ANY SMS
 * @param {string} to - Recipient Mobile Number (e.g., +919999999999)
 * @param {string} body - The actual text message to send
 */
export const sendSMS = async ({ to, body }) => {
  // 1. Validation: Skip if client isn't ready
  if (!client || !senderNumber) {
    console.warn(`SMS Skipped (No Config): "${body}" to ${to}`);
    return false;
  }

  try {
    // 2. Send Message
    const message = await client.messages.create({
      body: body,
      from: senderNumber,
      to: to
    });

    console.log(`📲 SMS Sent: ${message.sid} to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ SMS Failed:", error.message);
    // We return false so the calling function knows it failed, 
    // but we usually don't throw an error to prevent crashing the app.
    return false;
  }
};