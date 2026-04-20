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
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN_SECRET });

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

const generateHtml = (template, templateData) => {
  if (template === 'otp' && templateData) {
    return otpTemplate(templateData.otp, templateData.minutes || 5);
  }
  if (template === 'ticket' && templateData) {
    return ticketTemplate(templateData);
  }
  if (template === 'event_reminder' && templateData) {
    return eventReminderTemplate(templateData);
  }
  if (template === 'welcome' && templateData) {
    return welcomeTemplate(templateData.userName, templateData.email);
  }
  if (template === 'password_reset' && templateData) {
    return passwordResetTemplate(templateData.resetLink, templateData.userName);
  }
  if (template === 'event_confirmation' && templateData) {
    return eventConfirmationTemplate(templateData);
  }
  if (template === 'new_message' && templateData) {
    return newMessageTemplate(templateData);
  }
  if (template === 'booking_confirmation' && templateData) {
    return bookingConfirmationTemplate(templateData);
  }
  if (template === 'cart_abandonment' && templateData) {
    return cartAbandonmentTemplate(templateData);
  }
  if (template === 'event_update' && templateData) {
    return eventUpdateTemplate(templateData);
  }
  if (template === 'ticket_purchase' && templateData) {
    return ticketPurchaseTemplate(templateData);
  }
  return null;
};

export const queueEmail = async (data) => {
  const { to, subject, text, html, template, templateData } = data;

  if (!to || !subject || (!text && !html && !template)) {
    throw new Error('Missing required fields: to, subject, and either text, html, or template');
  }

  let finalHtml = html || generateHtml(template, templateData);

  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text,
    html: finalHtml
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmail = async (req, res) => {
  const { to, subject, text, html, template, templateData } = req.body;

  if (!to || !subject || (!text && !html && !template)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and either text, html, or template' });
  }

  try {
    await queueEmail({ to, subject, text, html, template, templateData });
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Failed to send email', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
};