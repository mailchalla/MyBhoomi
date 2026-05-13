import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewPurchasePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const [form, setForm] = useState({ customerId: '', plotId: '', instalmentMonths: '6', purchaseDate: new Date().toISOString().split('T')[0] });
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/customers', { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:3001/api/plots?status=available', { credentials: 'include' }).then(r => r.json()),
    ]).then(([c, p]) => { setCustomers(c.customers || []); setPlots(p.plots || []); });
  }, []);

  useEffect(() => {
    if (!form.plotId) { setTotalPrice(null); return; }
    fetch(`http://localhost:3001/api/plots/${form.plotId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.currentPrice) setTotalPrice(d.currentPrice.ratePerSqFt * d.plot.areaSqFt);
      });
  }, [form.plotId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const d = await res.json();
      router.push(`/purchases/${d.purchase.id}`);
    } catch (err: any) { setError(err.message); }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>New Purchase</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Customer</label>
        <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required style={s}>
          <option value="">Select customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Plot</label>
        <select value={form.plotId} onChange={e => setForm({ ...form, plotId: e.target.value })} required style={s}>
          <option value="">Select plot...</option>
          {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.areaSqFt} sqft)</option>)}
        </select>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Instalment Months</label>
        <input type="number" min="1" value={form.instalmentMonths} onChange={e => setForm({ ...form, instalmentMonths: e.target.value })} required style={s} />
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Purchase Date</label>
        <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required style={s} />
        {totalPrice && <p style={{ background: '#f0f0f0', padding: 12, borderRadius: 4 }}>Total Price: <strong>${totalPrice.toFixed(2)}</strong> ({form.instalmentMonths} × ${(totalPrice / parseInt(form.instalmentMonths)).toFixed(2)}/month)</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ ...s, background: '#0070f3', color: '#fff', cursor: 'pointer' }}>Create Purchase</button>
        <button type="button" onClick={() => router.back()} style={{ ...s, background: '#eee', marginTop: 8 }}>Cancel</button>
      </form>
    </div>
  );
}

const s: React.CSSProperties = { display: 'block', width: '100%', padding: '8px', marginBottom: 12, fontSize: 16, boxSizing: 'border-box' };
