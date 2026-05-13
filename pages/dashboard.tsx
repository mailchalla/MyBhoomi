import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setUser(data.user); return data.user; })
      .then(u => {
        if (u?.role === 'customer') {
          return fetch('http://localhost:3001/api/alerts/unread', { credentials: 'include' }).then(r => r.json());
        }
        return { alerts: [] };
      })
      .then(data => { if (data?.alerts) setUnreadAlerts(data.alerts.length); setLoading(false); })
      .catch(() => { router.push('/'); });
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>MyBooomi</h1>
      <h2>{user.role === 'customer' ? 'My Dashboard' : 'Admin Dashboard'}</h2>
      <p>Welcome, {user.name} ({user.role})</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        <NavCard href="/plots" label="Plots" />
        <NavCard href="/customers" label="Customers" />
        <NavCard href="/purchases" label="Purchases" />
        {user.role !== 'customer' && <NavCard href="/reports" label="Reports" />}
        <NavCard href="/alerts" label={`Alerts${user.role === 'customer' && unreadAlerts > 0 ? ` (${unreadAlerts} unread)` : ''}`} />
      </div>
    </div>
  );
}

function NavCard({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ padding: '16px 24px', background: '#0070f3', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 16 }}>
      {label}
    </Link>
  );
}
