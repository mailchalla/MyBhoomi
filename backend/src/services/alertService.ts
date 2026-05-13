import { getDb } from '../lib/db';
import { sendEmail } from './mailService';
import { config } from '../config';

async function sendSms(to: string, body: string): Promise<boolean> {
  if (!config.TWILIO.accountSid || !config.TWILIO.authToken) {
    console.warn('Twilio not configured — skipping SMS');
    return false;
  }
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(config.TWILIO.accountSid, config.TWILIO.authToken);
    await client.messages.create({ body, from: config.TWILIO.phone, to });
    return true;
  } catch (err) {
    console.error('SMS send failed:', err);
    return false;
  }
}

function instalmentEmailHtml(customerName: string, plotName: string, amount: number, dueDate: string): string {
  return `<p>Hi ${customerName},</p>
<p>This is a reminder that your instalment of <strong>$${amount.toFixed(2)}</strong> for plot <strong>${plotName}</strong> is due on <strong>${dueDate}</strong> (in 2 days).</p>
<p>Please ensure payment is made on time.</p>
<p>Regards,<br/>MyBooomi</p>`;
}

function instalmentSmsBody(customerName: string, plotName: string, amount: number, dueDate: string): string {
  return `MyBooomi: Hi ${customerName}, your instalment of $${amount.toFixed(2)} for ${plotName} is due on ${dueDate}.`;
}

export const alertService = {
  async checkAndSendDueAlerts() {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const alerts = await db.alert.findByDateRange(today, today);

    for (const alert of alerts) {
      if (alert.status !== 'pending') continue;

      // Find the instalment and its chain
      // We need to find the instalment by its id via instalment.findById
      const instalment = await db.instalment.findById(alert.instalmentId);
      if (!instalment) { console.warn(`Alert ${alert.id}: instalment not found`); continue; }

      // Get purchase to find customer
      const purchase = await db.purchase.findById(instalment.purchaseId);
      if (!purchase) { console.warn(`Alert ${alert.id}: purchase not found`); continue; }

      // Get customer and user
      const customer = await db.customer.findById(purchase.customerId);
      if (!customer) { console.warn(`Alert ${alert.id}: customer not found`); continue; }

      const user = await db.user.findById(customer.userId);
      if (!user) { console.warn(`Alert ${alert.id}: user not found`); continue; }

      // Get plot name
      const plot = await db.plot.findById(purchase.plotId);
      const plotName = plot?.name ?? 'Unknown Plot';

      // Send the alert
      let success = false;
      if (alert.type === 'email') {
        success = await sendEmail(
          user.email,
          `MyBooomi: Instalment due on ${instalment.dueDate}`,
          instalmentEmailHtml(user.name, plotName, instalment.amount, instalment.dueDate)
        );
      } else if (alert.type === 'sms') {
        success = await sendSms(
          user.phone,
          instalmentSmsBody(user.name, plotName, instalment.amount, instalment.dueDate)
        );
      } else {
        // in-app — always succeeds
        success = true;
      }

      await db.alert.updateStatus(alert.id, success ? 'sent' : 'failed', success ? new Date().toISOString() : undefined);
    }

    // Also update overdue instalments
    const overdue = await db.instalment.findOverdue();
    for (const inst of overdue) {
      await db.instalment.updateStatus(inst.id, 'overdue');
    }
  },
};
