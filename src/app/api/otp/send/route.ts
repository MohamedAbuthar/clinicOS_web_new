import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'

// Validate basic email format
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
	try {
		const { email, otp } = await req.json()

		console.log('OTP Send Request:', { email, otp: otp ? '***' : 'missing' })

		if (!email || !otp) {
			return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 })
		}

		if (!isValidEmail(email)) {
			return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 })
		}

		const smtpUser = process.env.SMTP_EMAIL
		const smtpPass = process.env.SMTP_APP_PASSWORD

		console.log('SMTP Config:', { 
			smtpUser: smtpUser ? 'configured' : 'missing', 
			smtpPass: smtpPass ? 'configured' : 'missing' 
		})

		if (!smtpUser || !smtpPass) {
			console.error('SMTP credentials missing:', { smtpUser: !!smtpUser, smtpPass: !!smtpPass })
			return NextResponse.json({
				success: false,
				message: 'SMTP credentials not configured. Add SMTP_EMAIL and SMTP_APP_PASSWORD to .env.'
			}, { status: 500 })
		}

		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: { user: smtpUser, pass: smtpPass },
		})

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color:#0f766e;">🏥 ClinicOS - Login OTP</h2>
				<p>Your one-time password is:</p>
				<div style="background:#f8fafc;border:2px dashed #0ea5e9;border-radius:8px;padding:16px;text-align:center;margin:12px 0;">
					<span style="font-size:32px;letter-spacing:6px;color:#0f766e;font-weight:bold;">${otp}</span>
				</div>
				<p>This code expires in 10 minutes. Do not share it with anyone.</p>
				<p style="color:#64748b;font-size:12px;margin-top:24px;">This is an automated message. Please do not reply.</p>
			</div>
		`

		await transporter.sendMail({
			from: {
				name: 'ClinicOS',
				address: smtpUser,
			},
			to: email,
			subject: 'Your ClinicOS Login OTP',
			html,
			text: `Your ClinicOS OTP is: ${otp} (valid for 10 minutes)`,
		})

		console.log('OTP email sent successfully to:', email)
		return NextResponse.json({ success: true, message: 'OTP email sent via SMTP' })
	} catch (err) {
		console.error('SMTP send error:', err)
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined
		})
		return NextResponse.json({ 
			success: false, 
			message: `Failed to send OTP email: ${err instanceof Error ? err.message : 'Unknown error'}` 
		}, { status: 500 })
	}
}
