import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/alerts', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts || []); setLoading(false); })
      .catch(() => router.push('/'));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Alerts</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: 8 }}>Alert Date</th><th style={{ padding: 8 }}>Type</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}>Sent At</th>
        </tr></thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{a.alertDate}</td>
              <td style={{ padding: 8 }}>{a.type}</td>
              <td style={{ padding: 8 }}><span style={{ padding: '2px 8px', borderRadius: 12, background: a.status === 'sent' ? '#d4edda' : a.status === 'failed' ? '#f8d7da' : '#fff3cd' }}>{a.status}</span></td>
              <td style={{ padding: 8 }}>{a.sentAt ? new Date(a.sentAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !alerts.length && <p style={{ color: '#666', marginTop: 16 }}>No alerts found.</p>}
    </div>
  );
}
