import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PurchaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`http://localhost:3001/api/auth/me`, { credentials: 'include' }).then(r => r.json()),
      fetch(`http://localhost:3001/api/purchases/${id}`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([u, d]) => { setUser(u.user); setData(d); });
  }, [id]);

  async function markPaid(instalmentId: string) {
    await fetch(`http://localhost:3001/api/purchases/${id}/instalments/${instalmentId}/pay`, { method: 'PUT', credentials: 'include' });
    const refreshed = await fetch(`http://localhost:3001/api/purchases/${id}`, { credentials: 'include' }).then(r => r.json());
    setData(refreshed);
  }

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;
  const { purchase, plot, instalments } = data;
  const isAdmin = user?.role !== 'customer';

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Purchase</h1>
      <p>Plot: <strong>{plot?.name}</strong></p>
      <p>Total Price: <strong>${purchase?.totalPrice?.toFixed(2)}</strong></p>
      <p>Instalments: {purchase?.instalmentMonths} months</p>
      <p>Status: {purchase?.status}</p>

      <h2 style={{ marginTop: 32 }}>Instalment Schedule</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: 8 }}>#</th><th style={{ padding: 8 }}>Amount</th><th style={{ padding: 8 }}>Due Date</th><th style={{ padding: 8 }}>Status</th><th></th>
        </tr></thead>
        <tbody>
          {(instalments || []).map((inst: any) => (
            <tr key={inst.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{inst.instalmentNumber}</td>
              <td style={{ padding: 8 }}>${inst.amount?.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{inst.dueDate}</td>
              <td style={{ padding: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: inst.status === 'paid' ? '#d4edda' : inst.status === 'overdue' ? '#f8d7da' : '#fff3cd' }}>{inst.status}</span>
              </td>
              <td style={{ padding: 8 }}>
                {isAdmin && inst.status !== 'paid' && (
                  <button onClick={() => markPaid(inst.id)} style={{ padding: '4px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Mark Paid</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => router.push('/purchases')} style={{ marginTop: 24, padding: '6px 16px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>← Back</button>
    </div>
  );
}
