import styles from '@/styles/Layout.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createContext, useEffect, useState } from 'react';
import { IoMoonOutline, IoRefreshOutline, IoSunnyOutline } from 'react-icons/io5';

export const DashboardContext = createContext();

export default function Layout({ children }) {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [dashboardState, setDashboardState] = useState({
    timestamp: null,
    loading: false,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
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
              <h1 className={styles.logo}>임돌픽</h1>
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
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
}
