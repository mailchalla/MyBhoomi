import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3001/api/customers/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setData)
      .catch(() => router.push('/customers'));
  }, [id]);

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;
  const { customer, user, purchases } = data;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Customer: {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <p>Phone: {user?.phone}</p>
      <p>Address: {customer?.address}</p>
      <p>Notes: {customer?.notes}</p>

      <h2 style={{ marginTop: 32 }}>Purchases</h2>
      {(purchases || []).map((p: any) => (
        <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16, marginTop: 8 }}>
          <p><strong>{p.plot?.name}</strong> — ${p.totalPrice?.toFixed(2)} — {p.instalmentMonths} instalments</p>
          <p>Status: {p.status}</p>
          <Link href={`/purchases/${p.id}`} style={{ color: '#0070f3' }}>View Purchase</Link>
        </div>
      ))}
      {!purchases?.length && <p>No purchases.</p>}
      <button onClick={() => router.push('/customers')} style={{ marginTop: 24, padding: '6px 16px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>← Back</button>
    </div>
  );
}
