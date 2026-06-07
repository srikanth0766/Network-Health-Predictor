import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('USERNAME AND PASSWORD ARE REQUIRED');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });
      const { access_token, role } = response.data;
      onLogin({ token: access_token, role, username });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail.toUpperCase());
      } else {
        setError('AUTHENTICATION FAILED. CHECK SYSTEM OR CREDENTIALS.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0a0a0a',
    fontFamily: 'IBM Plex Mono, monospace',
    boxSizing: 'border-box',
    padding: '1rem',
  };

  const panelStyle = {
    width: '360px',
    border: '1px solid #333',
    backgroundColor: '#111',
    padding: '2rem',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    color: '#fff',
    fontSize: '11px',
    letterSpacing: '0.15em',
    paddingBottom: '12px',
    borderBottom: '1px solid #333',
    marginBottom: '20px',
    fontWeight: 'normal',
  };

  const fieldStyle = {
    marginBottom: '16px',
  };

  const labelStyle = {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '6px',
  };

  const getInputStyle = (fieldName) => ({
    width: '100%',
    backgroundColor: '#000',
    border: focusedInput === fieldName ? '1px solid #555' : '1px solid #333',
    outline: 'none',
    color: '#fff',
    padding: '8px 10px',
    fontSize: '13px',
    fontFamily: 'IBM Plex Mono, monospace',
    boxSizing: 'border-box',
  });

  const errorStyle = {
    color: '#ff4444',
    fontSize: '12px',
    marginBottom: '16px',
    lineHeight: '1.4',
  };

  const buttonStyle = {
    width: '100%',
    backgroundColor: loading ? '#222' : '#fff',
    color: loading ? '#666' : '#000',
    border: 'none',
    padding: '10px',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
  };

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h2 style={headerStyle}>NETWATCH / AUTH</h2>
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
              style={getInputStyle('username')}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              style={getInputStyle('password')}
            />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
