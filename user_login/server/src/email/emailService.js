import nodemailer from 'nodemailer'

const APP_BASE_URL_DEFAULT = 'http://localhost:5176'

let transporter = null

function getTransporter() {
  // Read env vars lazily so dotenv.config() in index.js has already run
  const EMAIL_HOST = process.env.EMAIL_HOST || ''
  const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587)
  const EMAIL_SECURE = ['true', '1', 'yes'].includes(String(process.env.EMAIL_SECURE || '').toLowerCase())
  const EMAIL_USER = process.env.EMAIL_USER || ''
  const EMAIL_PASS = process.env.EMAIL_PASS || ''

  if (!transporter) {
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      throw new Error(
        'Email not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env'
      )
    }
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
  }
  return transporter
}

/**
 * Send a password reset email.
 * @param {string} toEmail  - recipient email address
 * @param {string} toName   - recipient display name
 * @param {string} token    - raw (unhashed) reset token
 */
export async function sendPasswordResetEmail(toEmail, toName, token) {
  const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || ''

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f0;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;border:1px solid #e6efea;
                    padding:40px 36px;box-shadow:0 8px 24px rgba(6,44,30,0.08);">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <h1 style="margin:0;font-size:22px;color:#062c1e;">Password Reset OTP</h1>
          </td>
        </tr>
        <tr>
          <td style="color:#2d3436;font-size:15px;line-height:1.6;">
            <p>Hi ${toName},</p>
            <p>We received a request to reset the password for your SFC Digital Park Guide account.</p>
            <p>Use the 6-digit code below to reset your password. It expires in <strong>5 minutes</strong>.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 0;">
            <div style="display:inline-block;padding:18px 40px;background:#f4faf5;
                        border:2px solid #379237;border-radius:14px;">
              <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#165132;">${token}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="color:#5d7166;font-size:13px;line-height:1.6;">
            <p>Enter this code on the Forgot Password page to set a new password.</p>
            <p style="margin-top:20px;">If you did not request a password reset, you can safely ignore this email.
               Your password will not change.</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;border-top:1px solid #e6efea;color:#aaa;font-size:12px;text-align:center;">
            SFC Digital Park Guide &mdash; This is an automated message, please do not reply.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Hi ${toName},\n\nYour SFC Digital Park Guide password reset OTP is: ${token}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.`

  await getTransporter().sendMail({
    from: EMAIL_FROM,
    to: toEmail,
    subject: 'SFC Park Guide — Password Reset',
    text,
    html,
  })
}
