import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const response = await axios.post('/api/auth/login', {
          username: 'admin',
          password: 'admin123'
        });
        const { access_token, role } = response.data;
        setUser({ token: access_token, role, username: 'admin' });
      } catch (err) {
        console.error('Auto login failed:', err);
        setError('FAILED TO INITIALIZE SECURE SESSION. ENSURE SYSTEM BACKEND IS ONLINE.');
      } finally {
        setLoading(false);
      }
    };
    autoLogin();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        CONNECTING TO NETWATCH NETWORK HEALTH SYSTEM...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ff4444',
        fontFamily: 'IBM Plex Mono, monospace',
        padding: '2rem',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>SYSTEM INIT ERROR</div>
        <div style={{ fontSize: '11px', color: '#bbb' }}>{error}</div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={() => {}} />;
}
