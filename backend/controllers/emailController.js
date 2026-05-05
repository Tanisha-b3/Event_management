import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import {
  otpTemplate,
  ticketTemplate,
  eventReminderTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  eventConfirmationTemplate,
  newMessageTemplate,
  bookingConfirmationTemplate,
  cartAbandonmentTemplate,
  eventUpdateTemplate,
  ticketPurchaseTemplate
} from '../utils/emailTemplates.js';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({ 
  refresh_token: process.env.REFRESH_TOKEN_SECRET 
});

// ✅ This function is called by nodemailer before every send
const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    oAuth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error('❌ Failed to get access token:', err.message);
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

// ✅ Transporter created once, but token is fetched fresh every send
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN_SECRET,
    accessToken: getAccessToken  // ✅ function reference, not a value
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready');
  }
});

// ─────────────────────────────────────────────
// Template generator
// ─────────────────────────────────────────────
const generateHtml = (template, templateData) => {
  const templates = {
    otp: () => otpTemplate(templateData.otp, templateData.minutes || 5),
    ticket: () => ticketTemplate(templateData),
    event_reminder: () => eventReminderTemplate(templateData),
    welcome: () => welcomeTemplate(templateData.userName, templateData.email),
    password_reset: () => passwordResetTemplate(templateData.resetLink, templateData.userName),
    event_confirmation: () => eventConfirmationTemplate(templateData),
    new_message: () => newMessageTemplate(templateData),
    booking_confirmation: () => bookingConfirmationTemplate(templateData),
    cart_abandonment: () => cartAbandonmentTemplate(templateData),
    event_update: () => eventUpdateTemplate(templateData),
    ticket_purchase: () => ticketPurchaseTemplate(templateData),
  };

  return templates[template]?.() || null;
};

// ─────────────────────────────────────────────
// Core email sender
// ─────────────────────────────────────────────
export const queueEmail = async (data) => {
  const { to, subject, text, html, template, templateData } = data;

  if (!to || !subject || (!text && !html && !template)) {
    throw new Error('Missing required fields: to, subject, and either text, html, or template');
  }

  const finalHtml = html || generateHtml(template, templateData);

  const mailOptions = {
    from: `"Event Management" <${process.env.EMAIL}>`,
    to,
    subject,
    ...(text && { text }),
    html: finalHtml
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────
export const sendEmail = async (req, res) => {
  const { to, subject, text, html, template, templateData } = req.body;

  if (!to || !subject || (!text && !html && !template)) {
    return res.status(400).json({ 
      message: 'Missing required fields: to, subject, and either text, html, or template' 
    });
  }

  try {
    await queueEmail({ to, subject, text, html, template, templateData });
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Failed to send email:', err.message);
    res.status(500).json({ 
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};