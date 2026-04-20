export const otpTemplate = (otp, minutes) => `
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
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:40px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🔐</div>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">Verify Your Email</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Security code inside</p>
            </td>
          </tr>
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
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">Enter this code in the verification field to complete your request.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <div style="background:#fef2f2;border-radius:10px;padding:16px;display:inline-block;">
                <p style="margin:0;font-size:13px;color:#991b1b;">🛡️ Don't share this code with anyone. Our team will never ask for it.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">If you didn't request this, please ignore this email.</p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#d1d5db;">&copy; ${new Date().getFullYear()} EventPro. All rights reserved.</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
          <tr><td height="20"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center;">
              <div style="font-size:56px;margin-bottom:12px;">🎟️</div>
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">Your Ticket Confirmed!</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">booking id: ${data.bookingId}</p>
            </td>
          </tr>
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
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#4b5563;">Please show this email or present your booking ID at the event entrance for verification.</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">Need help? Contact support@eventpro.com</p>
            </td>
          </tr>
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

export const eventReminderTemplate = (data) => `
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
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;text-align:center;">
              <div style="font-size:56px;margin-bottom:12px;">⏰</div>
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">Don't Forget!</h1>
              <p style="margin:8px 0 0 0;font-size:18px;color:rgba(255,255,255,0.95);">${data.eventName}</p>
            </td>
          </tr>
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
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#4b5563;">See you at the event!</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">This is a reminder for your upcoming booking.</p>
            </td>
          </tr>
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

export const welcomeTemplate = (userName, email) => `
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
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:48px 32px;text-align:center;">
              <div style="font-size:64px;margin-bottom:16px;">🎉</div>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;">Welcome to EventPro!</h1>
              <p style="margin:8px 0 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Your adventure starts here</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;">Hi ${userName || 'there'},</p>
              <p style="margin:0 0 24px 0;font-size:16px;color:#4b5563;line-height:1.6;">Thank you for joining EventPro! We're excited to have you as part of our community of event lovers.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Explore Events</a>
                  </td>
                </tr>
              </table>
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

export const passwordResetTemplate = (resetLink, userName) => `
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
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:48px 32px;text-align:center;">
              <div style="font-size:64px;margin-bottom:16px;">🔐</div>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;">Reset Your Password</h1>
              <p style="margin:8px 0 0 0;font-size:16px;color:rgba(255,255,255,0.9);">Security matters</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;">Hi ${userName || 'there'},</p>
              <p style="margin:0 0 24px 0;font-size:16px;color:#4b5563;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#991b1b;">⏱️ This link will expire in 1 hour.</p>
                <p style="margin:8px 0 0 0;font-size:14px;color:#991b1b;">If you didn't request this, please ignore this email or contact support.</p>
              </div>
            </td>
          </tr>
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

export const eventConfirmationTemplate = (data) => `
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

export const newMessageTemplate = (data) => `
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

export const bookingConfirmationTemplate = (data) => `
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

export const cartAbandonmentTemplate = (data) => `
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

export const eventUpdateTemplate = (data) => `
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

export const ticketPurchaseTemplate = (data) => `
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

export const EMAIL_TEMPLATES = {
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