const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail SMTP with App Password
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send event registration confirmation email
 * @param {Object} options { toEmail, studentName, eventTitle, eventDate, eventTime, eventVenue, eventOrganizer }
 */
const sendRegistrationEmail = async ({ toEmail, studentName, eventTitle, eventDate, eventTime, eventVenue, eventOrganizer }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Service] Info: EMAIL_USER/EMAIL_PASS not configured. Skipping confirmation email to ${toEmail}.`);
    return false;
  }

  const mailOptions = {
    from: `"College Event Hub" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎟️ Registration Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px;">
          <h2 style="color: #4f46e5; margin: 0;">College Event Hub</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Registration Confirmation</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Great news! Your spot for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Event Details:</h3>
            <p style="margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
            <p style="margin: 5px 0;"><strong>Venue:</strong> ${eventVenue}</p>
            <p style="margin: 5px 0;"><strong>Organized By:</strong> ${eventOrganizer}</p>
          </div>

          <p>Please log in to your <a href="${process.env.APP_URL || 'http://localhost:8080'}/student-dashboard.html" style="color: #4f46e5;">Student Dashboard</a> to view your check-in QR code.</p>
        </div>
        <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px; color: #9ca3af; font-size: 12px;">
          &copy; 2026 College Event Hub. All rights reserved.
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Confirmation email sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Error sending registration email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Send registration cancellation email
 * @param {Object} options { toEmail, studentName, eventTitle }
 */
const sendCancellationEmail = async ({ toEmail, studentName, eventTitle }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Service] Info: EMAIL_USER/EMAIL_PASS not configured. Skipping cancellation email to ${toEmail}.`);
    return false;
  }

  const mailOptions = {
    from: `"College Event Hub" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `❌ Registration Cancelled: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 15px;">
          <h2 style="color: #ef4444; margin: 0;">College Event Hub</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Registration Cancellation Notice</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your registration for <strong>${eventTitle}</strong> has been cancelled as requested.</p>
          <p>Your seat has been released for other students. You can register again anytime if spots are still available.</p>
        </div>
        <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px; color: #9ca3af; font-size: 12px;">
          &copy; 2026 College Event Hub. All rights reserved.
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Cancellation email sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Error sending cancellation email to ${toEmail}:`, error.message);
    return false;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendCancellationEmail
};
