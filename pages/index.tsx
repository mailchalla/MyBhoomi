import { useState, CSSProperties } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.register(form);
      }
      await api.login(form.email, form.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <Head><title>MyBooomi — Login</title></Head>
      <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <h1>MyBooomi</h1>
        <h2>{isRegister ? 'Create Account' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={inputStyle} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" style={btnStyle}>{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </>
  );
}

const inputStyle: CSSProperties = { display: 'block', width: '100%', padding: '8px', marginBottom: 12, fontSize: 16, boxSizing: 'border-box' };
const btnStyle: CSSProperties = { width: '100%', padding: '10px', fontSize: 16, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };