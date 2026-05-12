import { CreateInstalment } from '../lib/db/adapter';

export function generateInstalmentSchedule(
  purchaseDate: string,
  totalPrice: number,
  months: number
): CreateInstalment[] {
  const schedule: CreateInstalment[] = [];
  const monthlyAmount = Math.round((totalPrice / months) * 100) / 100;
  const remainder = Math.round((totalPrice - monthlyAmount * months) * 100) / 100;

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(purchaseDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const amount = i === months ? (monthlyAmount + remainder) : monthlyAmount;
    schedule.push({ instalmentNumber: i, amount, dueDate: dueDateStr, status: 'pending' });
  }
  return schedule;
}

export function generateAlertsForInstalment(instalmentId: string, dueDate: string): Array<{ instalmentId: string; alertDate: string; type: 'in-app' | 'email' | 'sms' }> {
  const alertDate = new Date(dueDate);
  alertDate.setDate(alertDate.getDate() - 2);
  const alertDateStr = alertDate.toISOString().split('T')[0];
  return [
    { instalmentId, alertDate: alertDateStr, type: 'in-app' },
    { instalmentId, alertDate: alertDateStr, type: 'email' },
    { instalmentId, alertDate: alertDateStr, type: 'sms' },
  ];
}