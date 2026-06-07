import React from 'react';

export default function AlertPanel({ alerts = [] }) {
  const containerStyle = {
    border: '1px solid #333',
    backgroundColor: '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    color: '#666',
    fontSize: '10px',
    letterSpacing: '0.15em',
    borderBottom: '1px solid #222',
    paddingBottom: '8px',
    marginBottom: '1rem',
    textTransform: 'uppercase',
  };

  const emptyStyle = {
    color: '#444',
    fontSize: '12px',
  };

  const listStyle = {
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  const rowStyle = {
    borderBottom: '1px solid #1a1a1a',
    padding: '6px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const iconStyle = {
    color: '#ff4444',
    fontWeight: 'bold',
  };

  const timeStyle = {
    color: '#888',
    fontSize: '11px',
    minWidth: '75px',
  };

  const messageStyle = {
    color: '#bbb',
    fontSize: '11px',
  };

  const probabilityStyle = {
    color: '#555',
    fontSize: '11px',
    marginLeft: 'auto',
  };

  const formatTime = (ts) => {
    try {
      const date = new Date(ts);
      return isNaN(date.getTime()) ? ts : date.toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>ALERT LOG</div>
      {alerts.length === 0 ? (
        <div style={emptyStyle}>No alerts.</div>
      ) : (
        <div style={listStyle}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={rowStyle}>
              <span style={iconStyle}>⚠</span>
              <span style={timeStyle}>{formatTime(alert.timestamp)}</span>
              <span style={messageStyle}>{alert.message}</span>
              <span style={probabilityStyle}>P={alert.probability}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
