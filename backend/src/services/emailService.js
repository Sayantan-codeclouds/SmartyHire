const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'SmartyHire <noreply@sayantandas.in>';

    // Send via Resend API endpoint
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject,
            html,
          }),
        });
        const data = await res.json();
        console.log(`[Resend Email Success] Sent to: ${to} | ID: ${data.id}`);
        return true;
      } catch (resendErr) {
        console.error('[Resend Email Error]', resendErr.message);
      }
    }

    // Fallback to Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log(`[Nodemailer Email Sent] To: ${to}`);
    return true;
  } catch (err) {
    console.log(`[Email Notice] To: ${to} | Subject: ${subject}`);
    return true;
  }
};

// Send Candidate Interview Invitation Email via Resend (with 48-Hour Expiration Warning)
const sendInterviewInviteEmail = async (candidateName, candidateEmail, interviewTitle, companyName, publicId) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const publicLink = `${clientUrl}/interview/${publicId}`;

  const html = `
  <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #0B0F17; padding: 40px; color: #F8FAFC;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0D131F; border-radius: 16px; padding: 36px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 800; color: #ffffff;">SmartyHire <span style="color: #818CF8;">AI</span></span>
      </div>
      <h2 style="color: #818CF8; margin-top: 0; font-size: 22px;">You're Invited to Interview at ${companyName}</h2>
      <p style="font-size: 14px; color: #CBD5E1;">Hi ${candidateName || 'Candidate'},</p>
      <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">You have been invited to take an autonomous AI Voice Interview for the position of <strong>${interviewTitle}</strong> at <strong>${companyName}</strong>.</p>
      
      <div style="background-color: #451A03; border: 1px solid #F59E0B; padding: 14px 18px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <span style="color: #FCD34D; font-size: 13px; font-weight: 700;">⏰ IMPORTANT: This interview invitation link will expire in 48 Hours. Please complete your interview before the link expires.</span>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${publicLink}" style="background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; font-size: 14px; box-shadow: 0 10px 25px rgba(99,102,241,0.3);">Start AI Interview →</a>
      </div>

      <div style="background-color: #151D2E; padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #94A3B8;">
        💡 <strong>Interview Preparation Tips:</strong> Ensure you are in a quiet room with a working webcam, microphone, and stable internet connection. Fullscreen mode is required.
      </div>
      
      <hr style="border: 0; border-top: 1px solid #1E293B; margin: 28px 0;" />
      <p style="font-size: 12px; color: #64748B; margin: 0;">Powered by SmartyHire AI • Speech & Proctoring Engine</p>
    </div>
  </div>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `[Expires in 48h] Interview Invitation: ${interviewTitle} at ${companyName}`,
    html,
  });
};

// Send Welcome Email to New Company Registering via Resend
const sendWelcomeCompanyEmail = async (adminName, adminEmail, companyName) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;

  const html = `
  <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #0B0F17; padding: 40px; color: #F8FAFC;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0D131F; border-radius: 16px; padding: 36px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 22px; font-weight: 800; color: #ffffff;">SmartyHire <span style="color: #818CF8;">AI</span></span>
      </div>
      <h2 style="color: #38BDF8; margin-top: 0; font-size: 22px;">Welcome to SmartyHire AI, ${adminName}! 🎉</h2>
      <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">Your company workspace <strong>${companyName}</strong> has been successfully created and configured with live autonomous AI interviewing capabilities.</p>
      
      <div style="margin: 32px 0; text-align: center;">
        <a href="${loginUrl}" style="background: linear-gradient(135deg, #6366F1 0%, #38BDF8 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; font-size: 14px;">Access Workspace Dashboard →</a>
      </div>

      <div style="background-color: #151D2E; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #CBD5E1; space-y: 8px;">
        <h4 style="margin: 0 0 10px 0; color: #818CF8; font-size: 14px;">🚀 Quick Start Steps:</h4>
        <p style="margin: 4px 0;">1. Create your first <strong>AI Interview Blueprint</strong></p>
        <p style="margin: 4px 0;">2. Invite candidates via direct Resend email (links expire in 48h)</p>
        <p style="margin: 4px 0;">3. Review AI scorecards, radar charts, and PDF reports</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #1E293B; margin: 28px 0;" />
      <p style="font-size: 12px; color: #64748B; margin: 0;">© 2026 SmartyHire AI. All rights reserved.</p>
    </div>
  </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Welcome to SmartyHire AI - ${companyName} Workspace Ready!`,
    html,
  });
};

// Send Password Reset Email via Resend
const sendPasswordResetEmail = async (userName, userEmail, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;

  const html = `
  <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #0B0F17; padding: 40px; color: #F8FAFC;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0D131F; border-radius: 16px; padding: 36px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 22px; font-weight: 800; color: #ffffff;">SmartyHire <span style="color: #818CF8;">AI</span></span>
      </div>
      <h2 style="color: #F59E0B; margin-top: 0; font-size: 22px;">Reset Your SmartyHire Password 🔑</h2>
      <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">Hi ${userName || 'User'},</p>
      <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">We received a request to reset the password for your SmartyHire account (<strong>${userEmail}</strong>).</p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${resetLink}" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; font-size: 14px; box-shadow: 0 10px 25px rgba(245,158,11,0.3);">Reset My Password →</a>
      </div>

      <div style="background-color: #151D2E; padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #94A3B8;">
        ⏰ <strong>Security Notice:</strong> This password reset link is valid for 1 hour. If you did not request a password reset, please ignore this email.
      </div>

      <hr style="border: 0; border-top: 1px solid #1E293B; margin: 28px 0;" />
      <p style="font-size: 12px; color: #64748B; margin: 0;">© 2026 SmartyHire AI. Security & Access Control.</p>
    </div>
  </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `[Action Required] Reset Your SmartyHire Password`,
    html,
  });
};

// Send Recruiter Email When a Candidate Completes Their Interview
const sendCompletionNotificationEmail = async (adminEmail, candidateName, interviewTitle, candidateId) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const reportLink = `${clientUrl}/dashboard/candidate/${candidateId}`;

  const html = `
  <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #0B0F17; padding: 40px; color: #F8FAFC;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0D131F; border-radius: 16px; padding: 36px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 800; color: #ffffff;">SmartyHire <span style="color: #818CF8;">AI</span></span>
      </div>
      <h2 style="color: #34D399; margin-top: 0; font-size: 22px;">🎉 Interview Completed!</h2>
      <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
        <strong>${candidateName}</strong> has just completed the AI Interview for <strong>${interviewTitle}</strong>.
        The AI evaluation scorecard is now being generated by the SmartyHire engine.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${reportLink}" style="background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; font-size: 14px; box-shadow: 0 10px 25px rgba(99,102,241,0.3);">View Candidate Profile & Report →</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #1E293B; margin: 28px 0;" />
      <p style="font-size: 12px; color: #64748B; margin: 0;">Powered by SmartyHire AI Engine</p>
    </div>
  </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `✅ ${candidateName} has completed the ${interviewTitle} interview`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendInterviewInviteEmail,
  sendWelcomeCompanyEmail,
  sendPasswordResetEmail,
  sendCompletionNotificationEmail,
};
