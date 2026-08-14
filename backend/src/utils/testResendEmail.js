const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { sendWelcomeCompanyEmail, sendInterviewInviteEmail } = require('../services/emailService');

const testResend = async () => {
  try {
    console.log('[Test] Triggering Resend Welcome Email...');
    console.log('[Resend From]', process.env.RESEND_FROM_EMAIL);

    await sendWelcomeCompanyEmail('Sayantan Das', 'sayantan.das@codeclouds.com', 'Codeclouds Corp');
    console.log('[Success] Resend Welcome Email Dispatched!');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testResend();
