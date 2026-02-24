// components/Header.jsx
import { useState } from 'react';
import styles from '@/styles/header.module.css';

export default function Header({ timestamp }) {
  const [isLoading, setIsLoading] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
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
  );
}
