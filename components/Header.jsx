// components/Header.jsx
import { useState, useEffect } from 'react';
import styles from '@/styles/header.module.css';

export default function Header({ timestamp }) {
  const [dominance, setDominance] = useState({ btc: 0, eth: 0, totalMarketCap: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Fetch global market data
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/global');
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setDominance({
          btc: data.btcDominance || 0,
          eth: data.ethDominance || 0,
          totalMarketCap: data.totalMarketCap || 0,
        });
      } catch (error) {
        console.error('Failed to fetch global data:', error);
        // Keep showing previous data, don't reset to 0
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalData();
    // Refresh every 30 seconds (캐싱 때문에 간격 증가)
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <img src="/logos/imdol-logo.png" alt="IMDOL COIN" className={styles.logoImage} />
          </div>
        </div>
        <div className={styles.status}>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            {isLoading ? 'Loading' : 'Live'}
          </span>
          <span className={styles.timestamp}>{formatTime(timestamp)}</span>
        </div>
      </header>

      {/* Market Dominance Bar */}
      <div className={styles.dominanceBar}>
        <div className={styles.dominanceContainer}>
          <div className={styles.dominanceItem}>
            <span className={styles.dominanceLabel}>BTC</span>
            <div className={styles.dominanceTrack}>
              <div
                className={styles.dominanceFill}
                style={{ width: `${dominance.btc}%`, backgroundColor: '#F7931A' }}
              ></div>
            </div>
            <span className={styles.dominanceValue}>{dominance.btc.toFixed(1)}%</span>
          </div>

          <div className={styles.dominanceItem}>
            <span className={styles.dominanceLabel}>ETH</span>
            <div className={styles.dominanceTrack}>
              <div
                className={styles.dominanceFill}
                style={{ width: `${dominance.eth}%`, backgroundColor: '#627EEA' }}
              ></div>
            </div>
            <span className={styles.dominanceValue}>{dominance.eth.toFixed(1)}%</span>
          </div>

          <div className={styles.totalMarketCap}>
            <span className={styles.marketCapLabel}>Market Cap</span>
            <span className={styles.marketCapValue}>${dominance.totalMarketCap}조</span>
          </div>
        </div>
      </div>
    </>
  );
}
