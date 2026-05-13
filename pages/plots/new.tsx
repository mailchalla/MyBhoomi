import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewPlotPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', lengthFt: '', widthFt: '', status: 'available' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/plots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, lengthFt: parseFloat(form.lengthFt), widthFt: parseFloat(form.widthFt) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const d = await res.json();
      router.push(`/plots/${d.plot.id}`);
    } catch (err: any) { setError(err.message); }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>New Plot</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Plot Name (e.g. Plot A-1)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={s} />
        <input placeholder="Length (ft)" type="number" step="0.01" value={form.lengthFt} onChange={e => setForm({ ...form, lengthFt: e.target.value })} required style={s} />
        <input placeholder="Width (ft)" type="number" step="0.01" value={form.widthFt} onChange={e => setForm({ ...form, widthFt: e.target.value })} required style={s} />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={s}>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
        </select>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ ...s, background: '#0070f3', color: '#fff', cursor: 'pointer' }}>Create Plot</button>
        <button type="button" onClick={() => router.back()} style={{ ...s, background: '#eee', marginTop: 8 }}>Cancel</button>
      </form>
    </div>
  );
}

const s: React.CSSProperties = { display: 'block', width: '100%', padding: '8px', marginBottom: 12, fontSize: 16, boxSizing: 'border-box' };
