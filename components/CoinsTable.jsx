// components/CoinsTable.jsx
import styles from '@/styles/coinsTable.module.css';

export default function CoinsTable({ coins }) {
  if (!coins || coins.length === 0) return null;

  const formatCurrency = (value) => {
    return value.toLocaleString('ko-KR');
  };

  const formatBillion = (value) => {
    return (value / 1000000000).toFixed(1) + 'B';
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>📊 실시간 시세 TOP 10</h2>
      
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.col1}>종목</div>
          <div className={styles.col2}>현재가</div>
          <div className={styles.col3}>24h 변동</div>
          <div className={styles.col4}>고가 / 저가</div>
          <div className={styles.col5}>시가총액</div>
          <div className={styles.col6}>거래대금</div>
        </div>

        {coins.map((coin) => (
          <div key={coin.market} className={styles.coinRow}>
            <div className={styles.col1}>
              <div className={styles.symbol}>{coin.market.replace('KRW-', '')}</div>
              <div className={styles.korean}>{coin.name}</div>
            </div>
            
            <div className={styles.col2}>
              <div className={styles.price}>₩ {formatCurrency(coin.price)}</div>
            </div>
            
            <div className={`${styles.col3} ${coin.change >= 0 ? styles.up : styles.down}`}>
              <span className={styles.arrow}>{coin.change >= 0 ? '📈' : '📉'}</span>
              {coin.change > 0 ? '+' : ''}
              {coin.change}%
            </div>
            
            <div className={styles.col4}>
              <div className={styles.highLow}>
                ₩{formatCurrency(coin.high)} / ₩{formatCurrency(coin.low)}
              </div>
            </div>
            
            <div className={styles.col5}>
              <div className={styles.marketCap}>
                {coin.market_cap_krw 
                  ? `₩${formatBillion(coin.market_cap_krw)} ${coin.market_cap_rank ? `#${coin.market_cap_rank}` : ''}`
                  : '-'
                }
              </div>
            </div>
            
            <div className={styles.col6}>
              <div className={styles.volume}>
                ₩{formatBillion(coin.volume)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
