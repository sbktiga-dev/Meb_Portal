import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mail.ru',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`\n📧 EMAIL (no SMTP configured):\nTo: ${to}\nSubject: ${subject}\n`);
      return true;
    }

    await transporter.verify();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function verificationEmailHtml(userName: string, url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px 20px; background: #f8f7f4;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #F97316, #ea580c); padding: 32px; text-align: center;">
          <h1 style="color: white; font-size: 24px; margin: 0;">МебПортал</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">Подтверждение регистрации</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Привет, ${userName || 'Пользователь'}!</p>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">Для завершения регистрации нажмите кнопку ниже:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${url}" style="display: inline-block; background: #F97316; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">Подтвердить email</a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">Если вы не регистрировались на МебПортале, просто проигнорируйте это письмо. Ссылка действительна 24 часа.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
