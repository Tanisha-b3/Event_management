import Ticket from '../models/Ticket.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN_SECRET });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN_SECRET,
    accessToken: oAuth2Client.getAccessToken()
  }
});

const generateReminderHtml = (ticket, userName, hoursUntil) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:500px;margin:40px auto;background:linear-gradient(135deg,#fef3c7,#fde68a);padding:2rem;border-radius:1rem;">
    <div style="text-align:center;font-size:48px;margin-bottom:1rem;">⏰</div>
    <h2 style="color:#b45309;margin:0 0 1rem 0;text-align:center;">Don't Forget! ${ticket.eventName}</h2>
    <div style="background:white;padding:1.5rem;border-radius:0.75rem;margin-bottom:1rem;">
      <p style="margin:0 0 0.75rem 0;font-size:1.1rem;"><strong>📅 ${new Date(ticket.eventDate).toLocaleString()}</strong></p>
      <p style="margin:0 0 0.5rem 0;"><strong>📍 Location:</strong> ${ticket.eventLocation}</p>
      <p style="margin:0 0 0.5rem 0;"><strong>🎫 Ticket Type:</strong> ${ticket.ticketType}</p>
      <p style="margin:0 0 0.5rem 0;"><strong>🎟️ Quantity:</strong> ${ticket.quantity}</p>
      <p style="margin:0;"><strong>🔖 Booking ID:</strong> <span style="color:#b45309;font-weight:bold;">${ticket.bookingId}</span></p>
    </div>
    <p style="text-align:center;color:#92400e;font-size:1.1rem;margin:0 0 1rem 0;">
      ⏱️ Event starts in <strong>${hoursUntil} hours</strong> - See you there!
    </p>
    <p style="text-align:center;font-size:0.875rem;color:#a16207;">This is a reminder because you booked a ticket for this event.</p>
    <div style="text-align:center;margin-top:1.5rem;">
      <span style="font-size:0.875rem;color:#92400e;">EventPro Team</span>
    </div>
  </div>
</body>
</html>
`;

const REMINDER_HOURS_BEFORE = [24, 2];

async function checkAndSendReminders() {
  // console.log('[ReminderScheduler] Checking for upcoming events...');
  
  try {
    const now = new Date();
    const reminderResults = [];
    
    for (const hoursBefore of REMINDER_HOURS_BEFORE) {
      const windowStart = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
      const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);
      
      const tickets = await Ticket.find({
        eventDate: { $gte: windowStart, $lt: windowEnd },
        isCancelled: false,
        reminderSent: { $ne: true }
      }).populate('userId', 'name email');
      
      for (const ticket of tickets) {
        try {
          const eventDate = new Date(ticket.eventDate);
          const hoursUntilEvent = Math.round((eventDate - now) / (1000 * 60 * 60));
          
          const userEmail = ticket.userEmail || (ticket.userId?.email);
          const userName = ticket.userName || (ticket.userId?.name) || 'Event Attendee';
          
          const mailOptions = {
            from: process.env.EMAIL,
            to: userEmail,
            subject: `Reminder: ${ticket.eventName} is in ${hoursUntilEvent} hours!`,
            html: generateReminderHtml(ticket, userName, hoursUntilEvent)
          };
          
          await transporter.sendMail(mailOptions);
          
          ticket.reminderSent = true;
          ticket.reminderSentAt = new Date();
          await ticket.save();
          
          reminderResults.push({
            bookingId: ticket.bookingId,
            email: userEmail,
            hoursBefore: hoursUntilEvent
          });
          
          // console.log(`[ReminderScheduler] Sent reminder for ${ticket.eventName} to ${userEmail}`);
        } catch (emailError) {
          console.error(`[ReminderScheduler] Failed to send reminder for ticket ${ticket.bookingId}:`, emailError.message);
        }
      }
    }
    
    // console.log(`[ReminderScheduler] Completed. Sent ${reminderResults.length} reminders.`);
    return reminderResults;
  } catch (error) {
    console.error('[ReminderScheduler] Error:', error.message);
  }
}

function startReminderScheduler(intervalMs = 60 * 60 * 1000) {
  // console.log(`[ReminderScheduler] Starting (interval: ${intervalMs / 60000} minutes)...`);
  
  checkAndSendReminders();
  
  const interval = setInterval(checkAndSendReminders, intervalMs);
  
  return () => {
    // console.log('[ReminderScheduler] Stopping...');
    clearInterval(interval);
  };
}

export default { checkAndSendReminders, startReminderScheduler };