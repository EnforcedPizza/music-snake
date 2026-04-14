import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppRouter } from './router.js';
import { VineCorners } from './components/VineDecoration.js';
import { StatsPanel } from './components/StatsPanel.js';
import { useStats } from './hooks/useStats.js';

function Navbar() {
  const location = useLocation();
  const { global: stats, artists } = useStats();
  const [showStats, setShowStats] = useState(false);
  const isGame = location.pathname.startsWith('/game');

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: 'rgba(255, 248, 240, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid var(--border)',
        padding: '0.65rem 1rem',
      }}>
        <div style={{
          maxWidth: 580,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'Fredoka One',
              fontSize: '1.2rem',
              color: 'var(--pink)',
            }}
          >
            <span style={{ animation: isGame ? 'wiggle 2s ease-in-out infinite' : 'none' }}>🐍</span>
            Music Snake
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {stats.currentStreak > 0 && (
              <span style={{
                fontFamily: 'Nunito',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'var(--yellow-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}>
                🔥 {stats.currentStreak}
              </span>
            )}
            <button
              onClick={() => setShowStats(true)}
              style={{
                background: 'none',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                padding: '0.3rem 0.7rem',
                fontFamily: 'Nunito',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                color: 'var(--text-mid)',
                transition: 'all 0.15s',
                minHeight: 32,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--pink)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--pink)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-mid)';
              }}
            >
              📊 Stats
            </button>
            {!isGame && (
              <Link to="/browse" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', minHeight: 36 }}>
                Play
              </Link>
            )}
          </div>
        </div>
      </nav>
      {showStats && (
        <StatsPanel global={stats} artists={artists} onClose={() => setShowStats(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <>
      <VineCorners />
      <Navbar />
      <AppRouter />
    </>
  );
}
