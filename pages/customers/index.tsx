import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.user?.role === 'customer') { router.push('/'); return; } return d.user; })
      .then(() => fetch('http://localhost:3001/api/customers', { credentials: 'include' }).then(r => r.json()))
      .then(d => { setCustomers(d.customers || []); setLoading(false); })
      .catch(() => router.push('/'));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Customers</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: 8 }}>ID</th><th style={{ padding: 8 }}>User ID</th><th style={{ padding: 8 }}>Address</th><th style={{ padding: 8 }}>Notes</th><th></th>
        </tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{c.id.slice(0, 8)}...</td>
              <td style={{ padding: 8 }}>{c.userId.slice(0, 8)}...</td>
              <td style={{ padding: 8 }}>{c.address}</td>
              <td style={{ padding: 8 }}>{c.notes}</td>
              <td style={{ padding: 8 }}><Link href={`/customers/${c.id}`} style={{ color: '#0070f3' }}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !customers.length && <p style={{ color: '#666', marginTop: 16 }}>No customers found.</p>}
    </div>
  );
}
