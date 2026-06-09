import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MetricsCard from './MetricsCard.jsx';
import PredictionPanel from './PredictionPanel.jsx';
import AlertPanel from './AlertPanel.jsx';
import Charts from './Charts.jsx';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('monitor');
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [metrics, setMetrics] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recs, setRecs] = useState([]);

  // Fetch initial data
  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/metrics/history', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setHistory(res.data);
      if (res.data.length > 0) {
        setMetrics(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get('/api/recommendations', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setRecs(res.data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (user.role === 'admin') {
      fetchAlerts();
      fetchRecommendations();
    }
  }, [user.token, user.role]);

  // Connect WebSocket
  useEffect(() => {
    let ws;
    let reconnectTimer;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      setWsStatus('CONNECTING');

      const host = window.location.hostname ? `${window.location.hostname}:8000` : 'localhost:8000';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}/ws?token=${user.token}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isUnmounted) return;
        setWsStatus('LIVE');
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.metrics) {
            setMetrics(data.metrics);
            setHistory((prev) => {
              const updated = [data.metrics, ...prev];
              return updated.slice(0, 100);
            });
          }
          if (data.prediction) {
            setPrediction(data.prediction);
          }
          if (data.alert && user.role === 'admin') {
            setAlerts((prev) => {
              const updated = [data.alert, ...prev];
              return updated.slice(0, 50);
            });
          }
          // If message contains alert or prediction changes, refresh recommendations
          if (user.role === 'admin') {
            fetchRecommendations();
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        setWsStatus('RECONNECTING');
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (isUnmounted) return;
        setWsStatus('ERROR');
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [user.token, user.role]);

  // Calculate Health Score
  const getHealth = () => {
    if (!metrics) {
      return { score: 100, label: 'EXCELLENT', color: '#fff' };
    }
    const latency = metrics.latency_ms ?? 0;
    const loss = metrics.packet_loss_percent ?? 0;
    const cpu = metrics.cpu_usage_percent ?? 0;

    let score = 100;
    score -= latency > 80 ? (latency - 80) * 0.3 : 0;
    score -= loss * 5;
    score -= cpu > 70 ? (cpu - 70) * 0.5 : 0;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    let label = 'EXCELLENT';
    let color = '#fff';

    if (finalScore >= 90) {
      label = 'EXCELLENT';
      color = '#fff';
    } else if (finalScore >= 70) {
      label = 'GOOD';
      color = '#ccc';
    } else if (finalScore >= 50) {
      label = 'WARNING';
      color = '#ffcc00';
    } else {
      label = 'CRITICAL';
      color = '#ff4444';
    }

    return { score: finalScore, label, color };
  };

  const health = getHealth();

  // Layout Styles
  const containerStyle = {
    backgroundColor: '#0a0a0a',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: 'IBM Plex Mono, monospace',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const topBarStyle = {
    height: '48px',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    backgroundColor: '#0a0a0a',
  };

  const topBarLeftStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const logoStyle = {
    color: '#fff',
    fontSize: '12px',
    letterSpacing: '0.2em',
    fontWeight: 'bold',
  };

  const separatorStyle = {
    color: '#333',
    margin: '0 10px',
  };

  const titleStyle = {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.15em',
  };

  const topBarRightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  };

  const statusDotStyle = {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    backgroundColor:
      wsStatus === 'LIVE'
        ? '#4caf50'
        : wsStatus === 'CONNECTING' || wsStatus === 'RECONNECTING'
        ? '#ffcc00'
        : '#ff4444',
    marginRight: '6px',
  };

  const statusTextStyle = {
    fontSize: '10px',
    letterSpacing: '0.15em',
    color:
      wsStatus === 'LIVE'
        ? '#4caf50'
        : wsStatus === 'CONNECTING' || wsStatus === 'RECONNECTING'
        ? '#ffcc00'
        : '#ff4444',
  };

  const userInfoStyle = {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '0.1em',
  };

  const logoutButtonStyle = {
    border: '1px solid #333',
    background: 'none',
    color: '#666',
    padding: '4px 10px',
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
  };

  const alertBannerStyle = {
    backgroundColor: '#1a0000',
    borderBottom: '1px solid #ff4444',
    padding: '10px 1.5rem',
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: '#ff4444',
  };

  const alertBannerProbStyle = {
    color: '#660000',
    marginLeft: '8px',
    fontWeight: 'bold',
  };

  const mainContentStyle = {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: 1,
  };

  const firstRowStyle = {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '1rem',
  };

  const healthScorePanelStyle = {
    border: '1px solid #333',
    backgroundColor: '#111',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    textAlign: 'center',
  };

  const healthScoreLabelStyle = {
    color: '#444',
    fontSize: '10px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  };

  const healthScoreNumStyle = {
    fontSize: '52px',
    fontWeight: '700',
    lineHeight: 1,
    color: health.color,
    marginBottom: '8px',
  };

  const healthScoreStatusStyle = {
    fontSize: '11px',
    letterSpacing: '0.2em',
    color: health.color,
  };

  const metricsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '1rem',
  };

  const secondRowStyle = {
    display: 'grid',
    gridTemplateColumns: user.role === 'admin' ? '1fr 1fr' : '1fr',
    gap: '1rem',
  };

  const recommendationsPanelStyle = {
    border: '1px solid #333',
    backgroundColor: '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
  };

  const panelHeaderStyle = {
    color: '#666',
    fontSize: '10px',
    letterSpacing: '0.15em',
    borderBottom: '1px solid #222',
    paddingBottom: '8px',
    marginBottom: '1rem',
    textTransform: 'uppercase',
  };

  const recommendationItemStyle = {
    borderLeft: '2px solid #444',
    paddingLeft: '0.75rem',
    marginBottom: '0.75rem',
    fontSize: '12px',
    color: '#bbb',
    lineHeight: '1.5',
  };

  const emptyRecommendationsStyle = {
    color: '#444',
    fontSize: '12px',
  };

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <header style={topBarStyle}>
        <div style={topBarLeftStyle}>
          <span style={logoStyle}>NETWATCH</span>
          <span style={separatorStyle}>|</span>
          <span style={titleStyle}>CAMPUS NETWORK HEALTH PREDICTOR</span>
        </div>
        <div style={topBarRightStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={statusDotStyle}></span>
            <span style={statusTextStyle}>{wsStatus}</span>
          </div>
          <span style={userInfoStyle}>
            {user.role.toUpperCase()} / {user.username.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="nav-container">
        <button
          className={`nav-btn ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          Health Monitor
        </button>
        <button
          className={`nav-btn ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          Predictions & Insights
        </button>
      </nav>

      {/* Alert Banner */}
      {prediction && prediction.probability > 80 && (
        <div style={alertBannerStyle}>
          <span>⚠ HIGH RISK — NETWORK CONGESTION PREDICTED WITHIN NEXT MONITORING WINDOW</span>
          <span style={alertBannerProbStyle}>P={prediction.probability}%</span>
        </div>
      )}

      {/* Main Grid Content */}
      <main style={mainContentStyle}>
        {activeTab === 'monitor' && (
          <>
            {/* Row 1: Health Score + Metrics Cards */}
            <section style={firstRowStyle}>
              <div style={healthScorePanelStyle}>
                <div style={healthScoreLabelStyle}>HEALTH SCORE</div>
                <div style={healthScoreNumStyle}>{metrics ? health.score : '—'}</div>
                <div style={healthScoreStatusStyle}>{metrics ? health.label : 'LOADING'}</div>
              </div>
              <div style={metricsGridStyle}>
                <MetricsCard
                  label="LATENCY"
                  value={metrics?.latency_ms}
                  unit="ms"
                  warn={metrics?.latency_ms > 80}
                />
                <MetricsCard
                  label="PACKET LOSS"
                  value={metrics?.packet_loss_percent}
                  unit="%"
                  warn={metrics?.packet_loss_percent > 3}
                />
                <MetricsCard
                  label="BANDWIDTH"
                  value={metrics?.bandwidth_usage_percent}
                  unit="%"
                  warn={metrics?.bandwidth_usage_percent > 85}
                />
                <MetricsCard
                  label="USERS"
                  value={metrics?.connected_users}
                  unit=""
                  warn={metrics?.connected_users > 150}
                />
                <MetricsCard
                  label="CPU"
                  value={metrics?.cpu_usage_percent}
                  unit="%"
                  warn={metrics?.cpu_usage_percent > 85}
                />
              </div>
            </section>

            {/* Row 3: Charts */}
            <section>
              <Charts history={history} />
            </section>
          </>
        )}

        {activeTab === 'predictions' && (
          <>
            {/* Row 2: Prediction + (Admin Only) Recommendations */}
            <section style={secondRowStyle}>
              <PredictionPanel prediction={prediction} />
              {user.role === 'admin' && (
                <div style={recommendationsPanelStyle}>
                  <div style={panelHeaderStyle}>RECOMMENDATIONS</div>
                  <div style={{ flex: 1 }}>
                    {recs.length > 0 ? (
                      recs.map((item, index) => (
                        <div key={index} style={recommendationItemStyle}>
                          {item.text}
                        </div>
                      ))
                    ) : (
                      <div style={emptyRecommendationsStyle}>No active recommendations.</div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Row 4: Alert Log (Admin Only) */}
            {user.role === 'admin' && (
              <section>
                <AlertPanel alerts={alerts} />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
