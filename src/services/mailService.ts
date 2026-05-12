import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.SMTP.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP.host,
      port: config.SMTP.port,
      auth: { user: config.SMTP.user, pass: config.SMTP.pass },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) { console.warn('SMTP not configured — skipping email'); return false; }
  try {
    await t.sendMail({ from: config.SMTP.user, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}
