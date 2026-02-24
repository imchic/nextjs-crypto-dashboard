import styles from '@/styles/Layout.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createContext, useEffect, useState } from 'react';
import { IoMoonOutline, IoRefreshOutline, IoSunnyOutline } from 'react-icons/io5';

export const DashboardContext = createContext();

export default function Layout({ children }) {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [dominance, setDominance] = useState({ btc: 0, eth: 0, totalMarketCap: 0 });
  const [dashboardState, setDashboardState] = useState({
    timestamp: null,
    loading: false,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Fetch global market data
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
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
      }
    };

    fetchGlobalData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchGlobalData, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isDashboard = router.pathname === '/';

  return (
    <DashboardContext.Provider value={{ dashboardState, setDashboardState }}>
      <div className={styles.wrapper}>
        <header className={styles.globalHeader}>
          <Link href="/">
            <div className={styles.logoContainer}>
              <img src="/dolpick-icon.png" alt="DolPick" className={styles.logoIcon} />
              <h1 className={styles.logo}>DolPick</h1>
            </div>
          </Link>
          <div className={styles.headerRight}>
            {isDashboard && dashboardState.timestamp && (
              <>
                <div className={styles.timestamp}>{formatTime(dashboardState.timestamp)}</div>
                <button
                  className={`${styles.refreshBtn} ${dashboardState.loading ? styles.loading : ''}`}
                  onClick={dashboardState.onRefresh}
                  disabled={dashboardState.loading}
                >
                  <IoRefreshOutline size={16} className={dashboardState.loading ? styles.spin : ''} />
                </button>
              </>
            )}
            <button
              className={styles.themeBtn}
              onClick={toggleTheme}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <IoSunnyOutline /> : <IoMoonOutline />}
            </button>
          </div>
        </header>

        {/* Market Dominance Bar */}
        <div className={styles.dominanceBar}>
          <div className={styles.dominanceContainer}>
            {/* 시장정보 타이틀 */}
            <div className={styles.dominanceTitle}>
              <span className={styles.titleLabel}>글로벌 시장</span>
            </div>

            {/* BTC 도미넌스 */}
            <div className={styles.dominanceItem}>
              <div className={styles.dominanceHeader}>
                <span className={styles.dominanceLabel}>
                  <span className={styles.coinName}>비트코인</span>
                  <span className={styles.coinCode}>BTC</span>
                </span>
              </div>
              <div className={styles.dominanceTrack}>
                <div
                  className={styles.dominanceFill}
                  style={{ 
                    width: `${dominance.btc}%`, 
                    background: 'linear-gradient(90deg, #F7931A 0%, #FFA500 100%)'
                  }}
                ></div>
              </div>
              <span className={styles.dominanceValue}>{dominance.btc.toFixed(1)}%</span>
            </div>

            {/* ETH 도미넌스 */}
            <div className={styles.dominanceItem}>
              <div className={styles.dominanceHeader}>
                <span className={styles.dominanceLabel}>
                  <span className={styles.coinName}>이더리움</span>
                  <span className={styles.coinCode}>ETH</span>
                </span>
              </div>
              <div className={styles.dominanceTrack}>
                <div
                  className={styles.dominanceFill}
                  style={{ 
                    width: `${dominance.eth}%`, 
                    background: 'linear-gradient(90deg, #627EEA 0%, #7C8FFF 100%)'
                  }}
                ></div>
              </div>
              <span className={styles.dominanceValue}>{dominance.eth.toFixed(1)}%</span>
            </div>

            {/* 시장 총액 */}
            <div className={styles.totalMarketCap}>
              <span className={styles.marketCapLabel}>전체 시가총액</span>
              <span className={styles.marketCapValue}>₩{dominance.totalMarketCap}조</span>
            </div>
          </div>
        </div>

        <main className={styles.main}>
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
}
