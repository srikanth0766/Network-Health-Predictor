import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Charts({ history = [] }) {
  // Process and reverse history so time flows chronologically left-to-right
  const chartData = [...history]
    .reverse()
    .map((item) => {
      let timeStr = '';
      try {
        const d = new Date(item.timestamp);
        timeStr = isNaN(d.getTime()) ? '' : d.toTimeString().split(' ')[0]; // HH:MM:SS
      } catch {
        timeStr = '';
      }
      return {
        ...item,
        time: timeStr,
      };
    });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  };

  const chartPanelStyle = {
    border: '1px solid #222',
    backgroundColor: '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const fullWidthPanelStyle = {
    ...chartPanelStyle,
    gridColumn: '1 / span 2',
  };

  const labelStyle = {
    color: '#666',
    fontSize: '10px',
    letterSpacing: '0.15em',
    marginBottom: '1rem',
    textTransform: 'uppercase',
  };

  const tooltipContentStyle = {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: 0,
    fontFamily: 'IBM Plex Mono, monospace',
  };

  const tooltipLabelStyle = {
    color: '#666',
    fontSize: '10px',
  };

  const tooltipItemStyle = {
    color: '#ccc',
    fontSize: '11px',
  };

  const renderChart = (title, dataKey, strokeColor, height, domain = null) => {
    return (
      <div style={dataKey === 'connected_users' ? fullWidthPanelStyle : chartPanelStyle}>
        <div style={labelStyle}>{title}</div>
        <div style={{ width: '100%', height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#555', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                interval="preserveStartEnd"
                stroke="#222"
              />
              <YAxis
                tick={{ fill: '#555', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                stroke="#222"
                domain={domain || ['auto', 'auto']}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ stroke: '#222', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div style={gridStyle}>
      {renderChart('LATENCY (ms)', 'latency_ms', '#fff', 160)}
      {renderChart('PACKET LOSS (%)', 'packet_loss_percent', '#ffcc00', 160)}
      {renderChart('CPU USAGE (%)', 'cpu_usage_percent', '#aaa', 160)}
      {renderChart('CONGESTION PROBABILITY (%)', 'congestion_probability', '#ff4444', 160, [0, 100])}
      {renderChart('CONNECTED USERS', 'connected_users', '#888', 140)}
    </div>
  );
}
