import styles from '@/styles/Layout.module.css';
import { createContext, useEffect, useState } from 'react';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';

export const DashboardContext = createContext();

export default function Layout({ children }) {
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

  return (
    <DashboardContext.Provider value={{ dashboardState, setDashboardState, theme, toggleTheme }}>
      <div className={styles.wrapper}>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
}
