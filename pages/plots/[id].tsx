import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PlotDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [priceForm, setPriceForm] = useState({ ratePerSqFt: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3001/api/plots/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); if (d.currentPrice) setPriceForm({ ratePerSqFt: d.currentPrice.ratePerSqFt }); })
      .catch(() => router.push('/plots'));
  }, [id]);

  async function updatePrice(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`http://localhost:3001/api/plots/${id}/prices/current`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ratePerSqFt: parseFloat(priceForm.ratePerSqFt) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg('Price updated!');
      const refreshed = await fetch(`http://localhost:3001/api/plots/${id}`, { credentials: 'include' }).then(r => r.json());
      setData(refreshed);
    } catch (err: any) { setMsg(err.message); }
  }

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;
  const { plot, currentPrice, priceHistory } = data;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>{plot.name}</h1>
      <p>{plot.lengthFt} × {plot.widthFt} ft — {plot.areaSqFt} sq ft</p>
      <p>Status: <strong>{plot.status}</strong></p>

      {currentPrice && (
        <div style={{ marginTop: 24 }}>
          <h2>Current Price</h2>
          <p>${currentPrice.ratePerSqFt}/sqft (effective from {currentPrice.effectiveFrom})</p>
          <form onSubmit={updatePrice} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" step="0.01" value={priceForm.ratePerSqFt} onChange={e => setPriceForm({ ratePerSqFt: e.target.value })} style={{ padding: 6, width: 100 }} />
            <button type="submit" style={{ padding: '6px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Update Price</button>
          </form>
          {msg && <p style={{ color: msg.includes('!') ? 'green' : 'red' }}>{msg}</p>}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h2>Price History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Rate ($/sqft)</th><th style={{ padding: 8 }}>From</th><th style={{ padding: 8 }}>To</th>
          </tr></thead>
          <tbody>
            {(priceHistory || []).map((p: any) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{p.ratePerSqFt}</td>
                <td style={{ padding: 8 }}>{p.effectiveFrom}</td>
                <td style={{ padding: 8 }}>{p.effectiveTo || 'current'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => router.push('/plots')} style={{ marginTop: 24, padding: '6px 16px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>← Back</button>
    </div>
  );
}
