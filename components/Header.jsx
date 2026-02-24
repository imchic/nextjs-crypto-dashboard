// components/Header.jsx
import styles from '@/styles/header.module.css';
import { WalletIcon } from '@/components/Icons';

export default function Header({ timestamp }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // 시간만 표시 (깔끔하게)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <WalletIcon size={22} />
        </div>
        <h1 className={styles.logoText}>DolPick</h1>
      </div>
      <div className={styles.status}>
        <span className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          Live
        </span>
        <span className={styles.timestamp}>{formatTime(timestamp)}</span>
      </div>
    </header>
  );
}
