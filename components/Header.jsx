// components/Header.jsx
import styles from '@/styles/header.module.css';
import { WalletIcon } from '@/components/Icons';

export default function Header({ timestamp }) {
  const formatTime = (isoString) => {
    if (!isoString) return '로딩 중...';
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <header className={styles.header}>
      <h1>
        <WalletIcon size={20} /> 암호화폐 대시보드
      </h1>
      <div className={styles.timestamp}>{formatTime(timestamp)}</div>
    </header>
  );
}
