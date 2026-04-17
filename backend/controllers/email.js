// Example email format for POST /api/email
// {
//   "to": "recipient@example.com",
//   "subject": "Your Event Confirmation",
//   "text": "Thank you for registering for our event!",
//   "html": "<h2>Thank you for registering!</h2><p>We look forward to seeing you at the event.</p>"
// }

// You can use either 'text' or 'html' or both. 'to' can be a single email or an array of emails
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);  
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN_SECRET });

// Configure transporter (use environment variables for real credentials)
const accessToken = oAuth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN_SECRET,
    accessToken: accessToken
  }
});


const EMAIL_TEMPLATES = {
  OTP: 'otp',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EVENT_CONFIRMATION: 'event_confirmation',
  TICKET_PURCHASE: 'ticket_purchase',
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATE: 'event_update',
  NEW_MESSAGE: 'new_message',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  CART_ABANDONMENT: 'cart_abandonment'
};

// HTML Template Generator
export const generateOTPTemplate = (otp, expiresInMinutes = 10, userName = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - EventPro</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      padding: 0;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: white;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #fbbf24;
    }
    .content {
      padding: 40px 32px;
    }
    .otp-box {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      padding: 32px;
      border-radius: 12px;
      text-align: center;
      margin: 24px 0;
      border: 1px solid #e5e7eb;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #4f46e5;
      background: white;
      display: inline-block;
      padding: 16px 32px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .timer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
      font-size: 14px;
      color: #92400e;
    }
    .button {
      display: inline-block;
      padding: 12px 28px;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin: 16px 0;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #4338ca;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background-color: #f9fafb;
      color: #9ca3af;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .social-links {
      margin-top: 16px;
    }
    .social-links a {
      color: #9ca3af;
      text-decoration: none;
      margin: 0 8px;
    }
    @media (max-width: 600px) {
      .container {
        margin: 16px;
      }
      .otp-code {
        font-size: 32px;
        letter-spacing: 4px;
        padding: 12px 24px;
      }
      .content {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Event<span>Pro</span></div>
    </div>
    
    <div class="content">
      <h2 style="margin-top: 0; color: #1f2937;">Verification Code</h2>
      
      ${userName ? `<p>Hello <strong>${userName}</strong>,</p>` : '<p>Hello,</p>'}
      <p>You requested a verification code for your EventPro account. Use the code below to complete your action:</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      
      <div class="timer">
        ⏰ This code will expire in <strong>${expiresInMinutes} minutes</strong>
      </div>
      
      <div class="warning">
        <strong>⚠️ Security Notice</strong><br>
        If you didn't request this code, please ignore this email or <a href="${process.env.FRONTEND_URL}/support" style="color: #f59e0b;">contact support</a> immediately.
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/verify?email=${encodeURIComponent(email)}" class="button">
          Verify Now →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <div class="social-links">
        <a href="${process.env.FRONTEND_URL}">Website</a> •
        <a href="${process.env.FRONTEND_URL}/support">Support</a> •
        <a href="${process.env.FRONTEND_URL}/privacy">Privacy</a>
      </div>
      <p style="margin-top: 16px;">&copy; 2024 EventPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const generateWelcomeTemplate = (userName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EventPro!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 48px 32px;
      text-align: center;
      color: white;
    }
    .welcome-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .content {
      padding: 40px 32px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 32px 0;
    }
    .feature {
      text-align: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="welcome-icon">🎉</div>
      <h1 style="margin: 0;">Welcome to EventPro!</h1>
    </div>
    <div class="content">
      <h2>Hello ${userName},</h2>
      <p>Thank you for joining EventPro! We're thrilled to have you on board. You're now part of a community that makes event management simple and enjoyable.</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📅</div>
          <strong>Create Events</strong>
          <p style="margin: 8px 0 0; font-size: 14px;">Set up events in minutes</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🎫</div>
          <strong>Sell Tickets</strong>
          <p style="margin: 8px 0 0; font-size: 14px;">Reach more attendees</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <strong>Track Analytics</strong>
          <p style="margin: 8px 0 0; font-size: 14px;">Monitor your success</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💬</div>
          <strong>Engage Attendees</strong>
          <p style="margin: 8px 0 0; font-size: 14px;">Build community</p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard →</a>
      </div>
      
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Need help? Check out our <a href="${process.env.FRONTEND_URL}/tutorials" style="color: #10b981;">getting started guide</a>
      </p>
    </div>
    <div class="footer">
      <p>We're here to help you succeed! 🚀</p>
      <p>&copy; 2024 EventPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;


// --- ENHANCED OTP TEMPLATE ---
const otpTemplate = (otp, minutes) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - EventPro</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:60px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px -5px rgba(99,102,241,0.3);">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:40px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🔐</div>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">Verify Your Email</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Security code inside</p>
            </td>
          </tr>
          <!-- OTP Display -->
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;border:2px dashed #a5b4fc;padding:24px;margin:8px 0;">
                <tr>
                  <td align="center">
                    <span style="font-size:36px;font-weight:800;color:#6366f1;letter-spacing:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${otp}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">Code valid for <strong style="color:#6366f1;">${minutes} minutes</strong></p>
            </td>
          </tr>
          <!-- Instructions -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">Enter this code in the verification field to complete your request.</p>
            </td>
          </tr>
          <!-- Security Notice -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <div style="background:#fef2f2;border-radius:10px;padding:16px;display:inline-block;">
                <p style="margin:0;font-size:13px;color:#991b1b;">🛡️ Don't share this code with anyone. Our team will never ask for it.</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">If you didn't request this, please ignore this email.</p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#d1d5db;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
            </td>
          </tr>
        </table>
        <!-- Bottom spacing -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
          <tr><td height="20"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- ENHANCED TICKET TEMPLATE ---
// const ticketTemplate = (data) => `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Your Ticket - EventPro</title>
// </head>
// <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
//     <tr>
//       <td align="center">
//         <!-- Main Card -->
//         <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 35px -5px rgba(0,0,0,0.15);">
//           <!-- Header -->
//           <tr>
//             <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 32px;text-align:center;position:relative;">
//               <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7);"></div>
//               <div style="font-size:52px;margin-bottom:10px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🎟️</div>
//               <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;">Your Ticket</h1>
//               <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Booking confirmed</p>
//             </td>
//           </tr>
//           <!-- Event Name -->
//           <tr>
//             <td style="padding:28px 32px 0;">
//               <h2 style="margin:0;font-size:22px;color:#1f2937;font-weight:700;text-align:center;line-height:1.4;">${data.event}</h2>
//             </td>
//           </tr>
//           <!-- Booking ID Badge -->
//           <tr>
//             <td style="padding:16px 32px 0;text-align:center;">
//               <table cellpadding="0" cellspacing="0" style="display:inline-block;background:#f5f3ff;border-radius:20px;padding:8px 20px;border:1px solid #e0e7ff;">
//                 <tr>
//                   <td style="font-size:12px;color:#6366f1;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Booking ID</td>
//                   <td style="padding-left:12px;font-size:14px;color:#1f2937;font-weight:700;">${data.bookingId}</td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//           <!-- Details Card -->
//           <tr>
//             <td style="padding:24px 32px;">
//               <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;overflow:hidden;">
//                 <!-- Date & Time -->
//                 <tr>
//                   <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
//                     <table width="100%" cellpadding="0" cellspacing="0">
//                       <tr>
//                         <td valign="top" style="width:44px;">
//                           <span style="font-size:22px;">📅</span>
//                         </td>
//                         <td>
//                           <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Date & Time</p>
//                           <p style="margin:4px 0 0 0;font-size:15px;color:#1f2937;font-weight:600;">${new Date(data.date).toLocaleString()}</p>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//                 <!-- Location -->
//                 <tr>
//                   <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
//                     <table width="100%" cellpadding="0" cellspacing="0">
//                       <tr>
//                         <td valign="top" style="width:44px;">
//                           <span style="font-size:22px;">📍</span>
//                         </td>
//                         <td>
//                           <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Location</p>
//                           <p style="margin:4px 0 0 0;font-size:15px;color:#1f2937;font-weight:600;">${data.location || 'TBA'}</p>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//                 <!-- Ticket Type -->
//                 <tr>
//                   <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
//                     <table width="100%" cellpadding="0" cellspacing="0">
//                       <tr>
//                         <td valign="top" style="width:44px;">
//                           <span style="font-size:22px;">🎫</span>
//                         </td>
//                         <td>
//                           <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Ticket Type</p>
//                           <p style="margin:4px 0 0 0;font-size:15px;color:#1f2937;font-weight:600;">${data.ticketType}</p>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//                 <!-- Quantity -->
//                 <tr>
//                   <td style="padding:16px 20px;">
//                     <table width="100%" cellpadding="0" cellspacing="0">
//                       <tr>
//                         <td valign="top" style="width:44px;">
//                           <span style="font-size:22px;">🎟️</span>
//                         </td>
//                         <td>
//                           <p style="margin:0;font-size:12px;color:#6b7280;text-transform:upperercase;letter-spacing:0.5px;">Quantity</p>
//                           <p style="margin:4px 0 0 0;font-size:15px;color:#1f2937;font-weight:600;">${data.qty} ticket${data.qty > 1 ? 's' : ''}</p>
//                         </td>
//                         <td align="right">
//                           <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total</p>
//                           <p style="margin:4px 0 0 0;font-size:18px;color:#6366f1;font-weight:800;">$${((data.price || 0) * (data.qty || 1)).toFixed(2)}</p>
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//           <!-- Instructions -->
//           <tr>
//             <td style="padding:0 32px 24px;text-align:center;">
//               <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">Show this email or present your booking ID at the venue entrance for verification.</p>
//             </td>
//           </tr>
//           <!-- Help Note -->
//           <tr>
//             <td style="padding:0 32px 24px;text-align:center;">
//               <div style="background:#fefce8;border-radius:10px;padding:14px 18px;display:inline-block;">
//                 <p style="margin:0;font-size:12px;color:#92400e;">💡 Need help? Contact support or check our FAQ</p>
//               </div>
//             </td>
//           </tr>
//           <!-- Footer -->
//           <tr>
//             <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
//               <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Reply to this email or contact support</p>
//               <p style="margin:6px 0 0 0;font-size:11px;color:#d1d5db;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
//             </td>
//           </tr>
//         </table>
//         <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
//           <tr><td height="20"></td></tr>
//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>
// `;

export const sendEmail = async (req, res) => {
  const { to, subject, text, html, template, templateData } = req.body;

  if (!to || !subject || (!text && !html && !template)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and either text, html, or template' });
  }

  let finalHtml = html;
  if (template === 'otp' && templateData) {
    finalHtml = otpTemplate(templateData.otp, templateData.minutes || 5);
  }
  if (template === 'ticket' && templateData) {
    finalHtml = ticketTemplate(templateData);
  }
  if (template === 'event_reminder' && templateData) {
    finalHtml = eventReminderTemplate(templateData);
  }
  if (template === 'welcome' && templateData) {
    finalHtml = welcomeTemplate(templateData.userName, templateData.email);
  }
  if (template === 'password_reset' && templateData) {
    finalHtml = passwordResetTemplate(templateData.resetLink, templateData.userName);
  }
  if (template === 'event_confirmation' && templateData) {
    finalHtml = eventConfirmationTemplate(templateData);
  }
  if (template === 'new_message' && templateData) {
    finalHtml = newMessageTemplate(templateData);
  }
  if (template === 'booking_confirmation' && templateData) {
    finalHtml = bookingConfirmationTemplate(templateData);
  }
  if (template === 'cart_abandonment' && templateData) {
    finalHtml = cartAbandonmentTemplate(templateData);
  }
  if (template === 'event_update' && templateData) {
    finalHtml = eventUpdateTemplate(templateData);
  }
  if (template === 'ticket_purchase' && templateData) {
    finalHtml = ticketPurchaseTemplate(templateData);
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to,
      subject,
      text,
      html: finalHtml
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Failed to send email', err);
    res.status(500).json({ message: 'Failed to send email' }); 
  }
};

// --- ENHANCED TICKET EMAIL TEMPLATE ---
export const ticketTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket - EventPro</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center;">
              <div style="font-size:56px;margin-bottom:12px;">🎟️</div>
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">Your Ticket Confirmed!</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">booking id: ${data.bookingId}</p>
            </td>
          </tr>
          <!-- Event Details -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px 0;font-size:22px;color:#1f2937;font-weight:600;">${data.event}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">📅 Date & Time</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${new Date(data.date).toLocaleString()}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">📍 Location</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${data.location || 'TBA'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">🎫 Ticket Type</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${data.ticketType}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">🎟️ Quantity</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${data.qty} ticket${data.qty > 1 ? 's' : ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Total -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:20px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.9);">Total Paid</p>
                    <p style="margin:4px 0 0 0;font-size:28px;color:#ffffff;font-weight:700;">$${(data.price * data.qty).toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Instructions -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#4b5563;">Please show this email or present your booking ID at the event entrance for verification.</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">Need help? Contact support@eventpro.com</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- ENHANCED EVENT REMINDER TEMPLATE ---
const eventReminderTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder - EventPro</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.15);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;text-align:center;">
              <div style="font-size:56px;margin-bottom:12px;">⏰</div>
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">Don't Forget!</h1>
              <p style="margin:8px 0 0 0;font-size:18px;color:rgba(255,255,255,0.95);">${data.eventName}</p>
            </td>
          </tr>
          <!-- Countdown -->
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-radius:12px;padding:20px;border:2px solid #fbbf24;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0;font-size:14px;color:#92400e;">Event starts in</p>
                    <p style="margin:4px 0 0 0;font-size:36px;color:#b45309;font-weight:800;">${data.hoursUntil} hours</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Event Details -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">📅 Date & Time</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${new Date(data.eventDate).toLocaleString()}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">📍 Location</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${data.eventLocation}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">🎟️ Your Booking</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:500;">${data.ticketType} × ${data.quantity}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0;font-size:14px;color:#6b7280;">🔖 Booking ID</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#b45309;font-weight:600;">${data.bookingId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#4b5563;">See you at the event!</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">This is a reminder for your upcoming booking.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#fefce8;text-align:center;border-top:1px solid #fbbf24;">
              <p style="margin:0;font-size:12px;color:#92400e;">&copy; ${new Date().getFullYear()} EventPro</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- ENHANCED WELCOME TEMPLATE ---
const welcomeTemplate = (userName, email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome - EventPro</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:48px 32px;text-align:center;">
              <div style="font-size:64px;margin-bottom:16px;">🎉</div>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;">Welcome to EventPro!</h1>
              <p style="margin:8px 0 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Your adventure starts here</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;">Hi ${userName || 'there'},</p>
              <p style="margin:0 0 24px 0;font-size:16px;color:#4b5563;line-height:1.6;">Thank you for joining EventPro! We're excited to have you as part of our community of event lovers.</p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Explore Events</a>
                  </td>
                </tr>
              </table>
              <!-- Features -->
              <h3 style="margin:32px 0 16px 0;font-size:16px;color:#1f2937;font-weight:600;">What you can do with EventPro:</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <strong style="font-size:20px;">🔍</strong> <span style="margin-left:8px;color:#1f2937;">Discover amazing events</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <strong style="font-size:20px;">🎟️</strong> <span style="margin-left:8px;color:#1f2937;">Book tickets easily</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <strong style="font-size:20px;">❤️</strong> <span style="margin-left:8px;color:#1f2937;">Save events you love</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <strong style="font-size:20px;">💬</strong> <span style="margin-left:8px;color:#1f2937;">Connect with organizers</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- ENHANCED PASSWORD RESET TEMPLATE ---
const passwordResetTemplate = (resetLink, userName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - EventPro</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:48px 32px;text-align:center;">
              <div style="font-size:64px;margin-bottom:16px;">🔐</div>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;">Reset Your Password</h1>
              <p style="margin:8px 0 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Security matters</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;">Hi ${userName || 'there'},</p>
              <p style="margin:0 0 24px 0;font-size:16px;color:#4b5563;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#991b1b;">⏱️ This link will expire in 1 hour.</p>
                <p style="margin:8px 0 0 0;font-size:14px;color:#991b1b;">If you didn't request this, please ignore this email or contact support.</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- ENHANCED EVENT CONFIRMATION TEMPLATE ---
const eventConfirmationTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">✅</div>
    <h1 style="margin:0;font-size:28px;">Event Confirmed!</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">Your event has been created successfully.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px 0;font-size:18px;color:#1f2937;">${data.eventName}</h3>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${new Date(data.eventDate).toLocaleString()}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📍 Location:</strong> ${data.eventLocation || 'TBA'}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🎫 Ticket Price:</strong> $${data.price || 0}</p>
      <p style="margin:0;color:#4b5563;"><strong>📊 Available Tickets:</strong> ${data.availableTickets || 'Unlimited'}</p>
    </div>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;

const newMessageTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">💬</div>
    <h1 style="margin:0;font-size:28px;">New Message</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#1f2937;margin-bottom:16px;">Hi ${data.recipientName || 'there'},</p>
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">You have a new message from <strong>${data.senderName || 'an organizer'}</strong>:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <p style="margin:0;color:#1f2937;font-style:italic;">"${data.message || 'Check your inbox for more details.'}"</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/messages" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;font-weight:600;">View Message</a>
    </div>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;

const bookingConfirmationTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">🎟️</div>
    <h1 style="margin:0;font-size:28px;">Booking Confirmed!</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#1f2937;margin-bottom:24px;">Hi ${data.userName || 'there'},</p>
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">Your booking is confirmed. Here are your ticket details:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px 0;font-size:18px;color:#1f2937;">${data.eventName}</h3>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${new Date(data.eventDate).toLocaleString()}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📍 Location:</strong> ${data.eventLocation || 'TBA'}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🎫 Ticket Type:</strong> ${data.ticketType || 'General'}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🎟️ Quantity:</strong> ${data.quantity || 1}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🔖 Booking ID:</strong> <span style="color:#6366f1;font-weight:bold;">${data.bookingId}</span></p>
      <p style="margin:0;color:#4b5563;"><strong>💰 Total Paid:</strong> $${(data.price * data.quantity).toFixed(2)}</p>
    </div>
    <p style="font-size:14px;color:#6b7280;">Please bring this email or your booking ID to the event entrance.</p>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;

const cartAbandonmentTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">🛒</div>
    <h1 style="margin:0;font-size:28px;">Forgot Something?</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#1f2937;margin-bottom:24px;">Hi ${data.userName || 'there'},</p>
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">You left items in your cart. Don't miss out on these events!</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      ${(data.items || []).map(item => `
        <div style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 4px 0;font-weight:600;color:#1f2937;">${item.eventName}</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">${item.ticketType} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      `).join('')}
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart" style="display:inline-block;padding:14px 32px;background:#f59e0b;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Complete Your Purchase</a>
    </div>
    <p style="font-size:14px;color:#6b7280;">Tickets are limited, so book now to secure your spot!</p>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;

const eventUpdateTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#ec4899,#db2777);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">📢</div>
    <h1 style="margin:0;font-size:28px;">Event Update</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">Important update for an event you're attending:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px 0;font-size:18px;color:#1f2937;">${data.eventName}</h3>
      ${data.oldDate !== data.newDate ? `<p style="margin:0 0 8px 0;color:#4b5563;"><strong>📅 New Date:</strong> ${new Date(data.newDate).toLocaleString()}</p>` : ''}
      ${data.newLocation ? `<p style="margin:0 0 8px 0;color:#4b5563;"><strong>📍 Location:</strong> ${data.newLocation}</p>` : ''}
      ${data.message ? `<p style="margin:0;color:#4b5563;"><strong>Message:</strong> ${data.message}</p>` : ''}
    </div>
    <p style="font-size:14px;color:#6b7280;">If you have any questions, please contact the event organizer.</p>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;

const ticketPurchaseTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:48px 32px;text-align:center;color:white;">
    <div style="font-size:64px;margin-bottom:16px;">🎫</div>
    <h1 style="margin:0;font-size:28px;">Purchase Successful!</h1>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:16px;color:#1f2937;margin-bottom:24px;">Hi ${data.userName || 'there'},</p>
    <p style="font-size:16px;color:#4b5563;margin-bottom:24px;">Thank you for your purchase! Here are your ticket details:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px 0;font-size:18px;color:#1f2937;">${data.eventName}</h3>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${new Date(data.eventDate).toLocaleString()}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>📍 Location:</strong> ${data.eventLocation || 'TBA'}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🎫 Ticket Type:</strong> ${data.ticketType || 'General'}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🎟️ Quantity:</strong> ${data.quantity || 1}</p>
      <p style="margin:0 0 8px 0;color:#4b5563;"><strong>🔖 Booking ID:</strong> <span style="color:#22c55e;font-weight:bold;">${data.bookingId}</span></p>
      <p style="margin:0;color:#4b5563;"><strong>💰 Total:</strong> $${(data.price * data.quantity).toFixed(2)}</p>
    </div>
    <p style="font-size:14px;color:#6b7280;">Please bring your booking ID to the event for verification.</p>
  </div>
  <div style="padding:24px;background:#f9fafb;text-align:center;color:#6b7280;font-size:12px;">
    <p>&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
  </div>
</div>
`;