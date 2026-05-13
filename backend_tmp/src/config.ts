import { config as dotenv } from 'dotenv';
dotenv();

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod',
  DATABASE_URL: process.env.DATABASE_URL || './db.sqlite',
  SMTP: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  TWILIO: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phone: process.env.TWILIO_PHONE || '',
  },
  ALERT_CRON_SECRET: process.env.ALERT_CRON_SECRET || 'dev-cron-secret',
};
