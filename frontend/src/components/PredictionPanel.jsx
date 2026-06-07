import React from 'react';

export default function PredictionPanel({ prediction }) {
  const prob = prediction ? prediction.probability : 0;
  const status = prediction ? prediction.status : 'LOW RISK';

  // Determine status color based on probability
  let probColor = '#4caf50'; // <= 30
  if (prob > 70) {
    probColor = '#ff4444';
  } else if (prob > 30) {
    probColor = '#ffcc00';
  }

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

  const displayRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '1rem',
  };

  const probValueStyle = {
    display: 'flex',
    alignItems: 'baseline',
    color: probColor,
  };

  const bigNumberStyle = {
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: 1,
  };

  const percentStyle = {
    fontSize: '18px',
    color: '#555',
    marginLeft: '2px',
  };

  const statusLabelStyle = {
    fontSize: '12px',
    letterSpacing: '0.1em',
    color: probColor,
    textTransform: 'uppercase',
  };

  const barContainerStyle = {
    position: 'relative',
    height: '6px',
    backgroundColor: '#1a1a1a',
    width: '100%',
    marginBottom: '6px',
  };

  const barFillStyle = {
    height: '100%',
    width: `${prob}%`,
    backgroundColor: probColor,
    transition: 'width 0.5s ease',
  };

  const divider30Style = {
    position: 'absolute',
    left: '30%',
    top: 0,
    bottom: 0,
    width: '1px',
    backgroundColor: '#333',
  };

  const divider70Style = {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: '1px',
    backgroundColor: '#333',
  };

  const zoneLabelsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
  };

  const zoneStyle = {
    color: '#444',
    fontSize: '9px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>CONGESTION PREDICTION</div>
      <div style={displayRowStyle}>
        <div style={probValueStyle}>
          <span style={bigNumberStyle}>{prediction ? prob : '—'}</span>
          {prediction && <span style={percentStyle}>%</span>}
        </div>
        <div style={statusLabelStyle}>{prediction ? status : 'NO DATA'}</div>
      </div>
      <div style={barContainerStyle}>
        <div style={barFillStyle}></div>
        <div style={divider30Style}></div>
        <div style={divider70Style}></div>
      </div>
      <div style={zoneLabelsStyle}>
        <span style={zoneStyle}>LOW</span>
        <span style={zoneStyle}>MEDIUM</span>
        <span style={zoneStyle}>HIGH</span>
      </div>
    </div>
  );
}
