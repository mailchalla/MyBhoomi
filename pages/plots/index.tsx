import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PlotsPage() {
  const router = useRouter();
  const [plots, setPlots] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setUser(d.user); return d.user; })
      .then(u => {
        const url = filter ? `http://localhost:3001/api/plots?status=${filter}` : 'http://localhost:3001/api/plots';
        return fetch(url, { credentials: 'include' }).then(r => r.json());
      })
      .then(d => { setPlots(d.plots || []); setLoading(false); })
      .catch(() => router.push('/'));
  }, [filter]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Plots</h1>
        {user?.role !== 'customer' && <Link href="/plots/new" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>+ New Plot</Link>}
      </div>
      {user?.role !== 'customer' && (
        <div style={{ margin: '12px 0' }}>
          {['available', 'reserved', 'sold'].map(s => (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} style={{ marginRight: 8, padding: '4px 12px', background: filter === s ? '#0070f3' : '#eee', color: filter === s ? '#fff' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{s}</button>
          ))}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Dimensions</th>
            <th style={{ padding: 8 }}>Area (sqft)</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {plots.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{p.name}</td>
              <td style={{ padding: 8 }}>{p.lengthFt} × {p.widthFt} ft</td>
              <td style={{ padding: 8 }}>{p.areaSqFt}</td>
              <td style={{ padding: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: p.status === 'available' ? '#d4edda' : p.status === 'sold' ? '#f8d7da' : '#fff3cd', color: '#333' }}>{p.status}</span>
              </td>
              <td style={{ padding: 8 }}><Link href={`/plots/${p.id}`} style={{ color: '#0070f3' }}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!plots.length && <p style={{ color: '#666', marginTop: 16 }}>No plots found.</p>}
    </div>
  );
}
