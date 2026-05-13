import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ReportsPage() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3001/api/reports/upcoming?days=${days}`, { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:3001/api/reports/due', { credentials: 'include' }).then(r => r.json()),
    ]).then(([u, o]) => { setUpcoming(u.instalments || []); setOverdue(o.instalments || []); });
  }, [days]);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Reports</h1>
      <div style={{ margin: '12px 0' }}>
        {[{ label: '7 days', days: 7 }, { label: '14 days', days: 14 }, { label: '30 days', days: 30 }].map(opt => (
          <button key={opt.days} onClick={() => setDays(opt.days)} style={{ marginRight: 8, padding: '4px 12px', background: days === opt.days ? '#0070f3' : '#eee', color: days === opt.days ? '#fff' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{opt.label}</button>
        ))}
      </div>

      <h2>Upcoming Instalments ({upcoming.length})</h2>
      <InstalmentTable instalments={upcoming} />

      <h2 style={{ marginTop: 32, color: '#dc3545' }}>Overdue Instalments ({overdue.length})</h2>
      <InstalmentTable instalments={overdue} />
    </div>
  );
}

function InstalmentTable({ instalments }: { instalments: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
        <th style={{ padding: 8 }}>#</th><th style={{ padding: 8 }}>Amount</th><th style={{ padding: 8 }}>Due Date</th><th style={{ padding: 8 }}>Plot</th><th style={{ padding: 8 }}>Customer</th>
      </tr></thead>
      <tbody>
        {instalments.map((inst: any) => (
          <tr key={inst.id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: 8 }}>{inst.instalmentNumber}</td>
            <td style={{ padding: 8 }}>${inst.amount?.toFixed(2)}</td>
            <td style={{ padding: 8 }}>{inst.dueDate}</td>
            <td style={{ padding: 8 }}>{inst.plot?.name}</td>
            <td style={{ padding: 8 }}>{inst.customerName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
