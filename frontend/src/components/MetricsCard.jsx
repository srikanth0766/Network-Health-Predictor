import React from 'react';

export default function MetricsCard({ label, value, unit, warn }) {
  const containerStyle = {
    border: warn ? '1px solid #664400' : '1px solid #222',
    backgroundColor: warn ? '#110d00' : '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#555',
    fontSize: '10px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  };

  const valueStyle = {
    color: warn ? '#ffcc00' : '#fff',
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'baseline',
  };

  const unitStyle = {
    fontSize: '13px',
    color: warn ? '#997700' : '#555',
    marginLeft: '4px',
    fontWeight: 'normal',
  };

  const displayValue = (value !== null && value !== undefined) ? value : null;

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {displayValue !== null ? (
          <>
            {typeof displayValue === 'number' ? displayValue.toFixed(displayValue % 1 === 0 ? 0 : 1) : displayValue}
            {unit && <span style={unitStyle}>{unit}</span>}
          </>
        ) : (
          '—'
        )}
      </div>
    </div>
  );
}
