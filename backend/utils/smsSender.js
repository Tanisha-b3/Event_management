import twilio from 'twilio';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client = null;
let twilioNumber = null;

// Initialize Twilio client if credentials are available
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    twilioNumber = TWILIO_PHONE_NUMBER;
    console.log('Twilio SMS initialized');
  } catch (err) {
    console.error('Twilio initialization error:', err.message);
  }
}

const sendSMS = async ({ to, body }) => {
  const phoneNumber = `+91${to}`;
console.log(`Preparing to send SMS to ${phoneNumber}`);
  // If Twilio is configured, send via Twilio
  if (client && twilioNumber) {
    try {
      const message = await client.messages.create({
        body,
        from: twilioNumber,
        to: phoneNumber
      });
      console.log(`SMS sent via Twilio: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error('Twilio SMS error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Otherwise, log the SMS (for development)
  console.log(`===== SMS (Development) =====`);
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${body}`);
  console.log(`=============================`);

  return {
    success: true,
    sid: `dev_${Date.now()}`,
    development: true
  };
};

const sendVerificationSMS = async (phone, otp) => {
  const message = `Your EventPro verification code is: ${otp}. This code expires in 5 minutes.`;
  return sendSMS({ to: phone, body: message });
};

const sendLoginOTP = async (phone, otp) => {
  const message = `Your EventPro login code is: ${otp}. This code expires in 5 minutes. Don't share this with anyone.`;
  return sendSMS({ to: phone, body: message });
};

const sendEventReminderSMS = async (phone, eventName, date) => {
  const message = `Reminder: "${eventName}" is coming up on ${date}. Don't forget! - EventPro`;
  return sendSMS({ to: phone, body: message });
};

export default {
  sendSMS,
  sendVerificationSMS,
  sendLoginOTP,
  sendEventReminderSMS
};