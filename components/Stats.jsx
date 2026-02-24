// components/Stats.jsx
import styles from '@/styles/stats.module.css';
import { TrendingUpIcon, TrendingDownIcon, BarChartIcon } from '@/components/Icons';

export default function Stats({ stats }) {
  if (!stats) return null;

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.label}>평균 변동률</div>
        <div className={`${styles.value} ${stats.avg_change >= 0 ? styles.green : styles.red}`}>
          {stats.avg_change >= 0 ? <TrendingUpIcon size={16} /> : <TrendingDownIcon size={16} />}
          {stats.avg_change > 0 ? '+' : ''}
          {stats.avg_change}%
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.label}>상승 종목</div>
        <div className={`${styles.value} ${styles.green}`}>
          <TrendingUpIcon size={16} /> {stats.gainers}개
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.label}>하락 종목</div>
        <div className={`${styles.value} ${styles.red}`}>
          <TrendingDownIcon size={16} /> {stats.losers}개
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.label}>추적 종목</div>
        <div className={styles.value}>
          <BarChartIcon size={16} /> {stats.total}개
        </div>
      </div>
    </div>
  );
}
