// Test SMTP configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP Configuration...');
console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL ? 'configured' : 'missing');
console.log('SMTP_APP_PASSWORD:', process.env.SMTP_APP_PASSWORD ? 'configured' : 'missing');

if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
    console.error('❌ SMTP credentials are missing!');
    process.exit(1);
}

const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD
    }
});

// Test the connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        process.exit(1);
    } else {
        console.log('✅ SMTP connection successful!');
        console.log('✅ Ready to send emails');
    }
});
