import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // Use App Password for Gmail
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (email, verificationToken, firstName = 'User') => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Panmed Helsesenter AS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Bekreft din e-postadresse - Panmed Helsesenter AS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bekreft din e-postadresse</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Panmed Helsesenter AS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hei ${firstName},</h2>
          <p>Takk for at du registrerte deg hos Panmed Helsesenter AS. Vennligst bekreft din e-postadresse for å fullføre registreringen og begynne å bruke plattformen vår.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Bekreft e-postadresse
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren din:</p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Denne lenken utløper om 24 timer.</p>
          <p style="color: #666; font-size: 14px;">Hvis du ikke opprettet en konto, vennligst ignorer denne e-posten.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Panmed Helsesenter AS. Alle rettigheter reservert.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Hei ${firstName},
      
      Takk for at du registrerte deg hos Panmed Helsesenter AS. Vennligst bekreft din e-postadresse ved å klikke på lenken nedenfor:
      
      ${verificationUrl}
      
      Denne lenken utløper om 24 timer.
      
      Hvis du ikke opprettet en konto, vennligst ignorer denne e-posten.
      
      © ${new Date().getFullYear()} Panmed Helsesenter AS. Alle rettigheter reservert.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken, firstName = 'User') => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Panmed Helsesenter AS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Tilbakestill ditt passord - Panmed Helsesenter AS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tilbakestill ditt passord</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Panmed Helsesenter AS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hei ${firstName},</h2>
          <p>Vi har mottatt en forespørsel om å tilbakestille passordet for din Panmed Helsesenter AS-konto.</p>
          <p>Klikk på knappen nedenfor for å tilbakestille passordet ditt:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Tilbakestill passord
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren din:</p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Denne lenken utløper om 1 time.</p>
          <p style="color: #666; font-size: 14px;">Hvis du ikke ba om tilbakestilling av passord, vennligst ignorer denne e-posten. Passordet ditt forblir uendret.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Panmed Helsesenter AS. Alle rettigheter reservert.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Hei ${firstName},
      
      Vi har mottatt en forespørsel om å tilbakestille passordet for din Panmed Helsesenter AS-konto.
      
      Klikk på lenken nedenfor for å tilbakestille passordet ditt:
      
      ${resetUrl}
      
      Denne lenken utløper om 1 time.
      
      Hvis du ikke ba om tilbakestilling av passord, vennligst ignorer denne e-posten. Passordet ditt forblir uendret.
      
      © ${new Date().getFullYear()} Panmed Helsesenter AS. Alle rettigheter reservert.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default transporter;

