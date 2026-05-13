import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.user?.role === 'customer') { router.push('/'); return; } return d.user; })
      .then(() => fetch('http://localhost:3001/api/purchases', { credentials: 'include' }).then(r => r.json()))
      .then(d => { setPurchases(d.purchases || []); setLoading(false); })
      .catch(() => router.push('/'));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Purchases</h1>
        <Link href="/purchases/new" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>+ New Purchase</Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: 8 }}>ID</th><th style={{ padding: 8 }}>Plot</th><th style={{ padding: 8 }}>Customer</th><th style={{ padding: 8 }}>Total</th><th style={{ padding: 8 }}>Months</th><th style={{ padding: 8 }}>Status</th><th></th>
        </tr></thead>
        <tbody>
          {purchases.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{p.id.slice(0, 8)}...</td>
              <td style={{ padding: 8 }}>{p.plot?.name}</td>
              <td style={{ padding: 8 }}>{p.customer?.id?.slice(0, 8) || '—'}...</td>
              <td style={{ padding: 8 }}>${p.totalPrice?.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{p.instalmentMonths}</td>
              <td style={{ padding: 8 }}>{p.status}</td>
              <td style={{ padding: 8 }}><Link href={`/purchases/${p.id}`} style={{ color: '#0070f3' }}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !purchases.length && <p style={{ color: '#666', marginTop: 16 }}>No purchases found.</p>}
    </div>
  );
}
