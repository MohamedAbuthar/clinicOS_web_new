import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'

// Validate basic email format
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
	try {
		const { email, password, name } = await req.json()

		console.log('Send Password Request:', { email, name, password: password ? '***' : 'missing' })

		if (!email || !password || !name) {
			return NextResponse.json(
				{ success: false, message: 'Email, password, and name are required' },
				{ status: 400 }
			)
		}

		if (!isValidEmail(email)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid email format' },
				{ status: 400 }
			)
		}

		const smtpUser = process.env.SMTP_EMAIL
		const smtpPass = process.env.SMTP_APP_PASSWORD

		console.log('Environment check:', {
			NODE_ENV: process.env.NODE_ENV,
			VERCEL: process.env.VERCEL,
			SMTP_EMAIL: smtpUser ? 'configured' : 'missing',
			SMTP_APP_PASSWORD: smtpPass ? 'configured' : 'missing',
		})

		if (!smtpUser || !smtpPass) {
			console.error('SMTP credentials missing:', {
				smtpUser: !!smtpUser,
				smtpPass: !!smtpPass,
			})
			return NextResponse.json(
				{
					success: false,
					message: 'SMTP credentials not configured. Please check your environment variables.',
				},
				{ status: 500 }
			)
		}

		// Determine SMTP configuration based on email provider
		let smtpConfig;
		if (smtpUser.includes('@gmail.com')) {
			smtpConfig = {
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					user: smtpUser,
					pass: smtpPass,
				},
				tls: {
					rejectUnauthorized: false,
				},
			};
		} else if (smtpUser.includes('@outlook.com') || smtpUser.includes('@hotmail.com')) {
			smtpConfig = {
				host: 'smtp-mail.outlook.com',
				port: 587,
				secure: false,
				auth: {
					user: smtpUser,
					pass: smtpPass,
				},
				tls: {
					rejectUnauthorized: false,
				},
			};
		} else if (smtpUser.includes('@yahoo.com')) {
			smtpConfig = {
				host: 'smtp.mail.yahoo.com',
				port: 587,
				secure: false,
				auth: {
					user: smtpUser,
					pass: smtpPass,
				},
				tls: {
					rejectUnauthorized: false,
				},
			};
		} else {
			// Default to Gmail configuration
			smtpConfig = {
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					user: smtpUser,
					pass: smtpPass,
				},
				tls: {
					rejectUnauthorized: false,
				},
			};
		}

		const transporter = nodemailer.createTransport(smtpConfig)

		// Verify transporter configuration
		console.log('Verifying SMTP connection...')
		await transporter.verify()
		console.log('SMTP connection verified successfully')

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 10px;">
				<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h2 style="color: #0f766e; margin-bottom: 20px;">
						🏥 Welcome to ClinicOS!
					</h2>
					<p style="font-size: 16px; color: #334155; margin-bottom: 10px;">
						Hello <strong>${name}</strong>,
					</p>
					<p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
						You have been added as an <strong>Assistant</strong> to the ClinicOS Admin Portal. Below are your login credentials:
					</p>
					
					<div style="background: #f0fdfa; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0; color: #0f766e; font-weight: bold;">Your Login Credentials:</p>
						<p style="margin: 5px 0; color: #334155;">
							<strong>Email:</strong> ${email}
						</p>
						<p style="margin: 5px 0; color: #334155;">
							<strong>Password:</strong> <span style="font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px; color: #0f766e; font-weight: bold;">${password}</span>
						</p>
					</div>
					
					<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
						<p style="margin: 0; color: #92400e; font-size: 14px;">
							<strong>⚠️ Important:</strong> Please keep this password secure and change it after your first login.
						</p>
					</div>
					
					<p style="font-size: 15px; color: #475569; margin-top: 20px;">
						You can login to the admin portal using the above credentials. If you have any questions, please contact your administrator.
					</p>
					
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
						<p style="color: #64748b; font-size: 13px; margin: 0;">
							Best regards,<br>
							<strong style="color: #0f766e;">ClinicOS Team</strong>
						</p>
					</div>
				</div>
				
				<p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
					This is an automated message. Please do not reply to this email.
				</p>
			</div>
		`

		const textContent = `
Welcome to ClinicOS!

Hello ${name},

You have been added as an Assistant to the ClinicOS Admin Portal.

Your Login Credentials:
Email: ${email}
Password: ${password}

⚠️ Important: Please keep this password secure and change it after your first login.

You can login to the admin portal using the above credentials.

Best regards,
ClinicOS Team

---
This is an automated message. Please do not reply to this email.
		`.trim()

		await transporter.sendMail({
			from: {
				name: 'ClinicOS',
				address: smtpUser,
			},
			to: email,
			subject: 'Welcome to ClinicOS - Your Login Credentials',
			html,
			text: textContent,
		})

		console.log('Password email sent successfully to:', email)
		return NextResponse.json({ 
			success: true, 
			message: 'Login credentials sent successfully via email' 
		})
	} catch (err) {
		console.error('SMTP send error:', err)
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined,
		})
		return NextResponse.json(
			{
				success: false,
				message: `Failed to send email: ${err instanceof Error ? err.message : 'Unknown error'}`,
			},
			{ status: 500 }
		)
	}
}

