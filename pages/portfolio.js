// pages/portfolio.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/portfolio.module.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8B7FF4', '#0ECB81', '#F6465D', '#A78BFA', '#4299E1', '#48BB78', '#ED8936', '#6C5CE7'];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadRealPortfolio();
  }, []);

  const loadRealPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      const accountsRes = await fetch('/api/upbit-accounts');
      
      if (!accountsRes.ok) {
        const errorData = await accountsRes.json();
        throw new Error(errorData.error || 'Failed to fetch accounts');
      }

      const { coins: accounts, krw_balance } = await accountsRes.json();
      console.log('Upbit accounts:', accounts);
      console.log('KRW balance:', krw_balance);

      if (accounts.length === 0) {
        setPortfolio([]);
        setTotalValue(krw_balance);
        setTotalInvested(0);
        setLoading(false);
        return;
      }

      const tradableCoins = accounts.filter(acc => parseFloat(acc.avg_buy_price) > 0);

      if (tradableCoins.length === 0) {
        const portfolioData = accounts.map(acc => ({
          symbol: acc.currency,
          name: acc.korean_name || acc.currency,
          market: `KRW-${acc.currency}`,
          quantity: parseFloat(acc.balance) + parseFloat(acc.locked),
          balance: parseFloat(acc.balance),
          locked: parseFloat(acc.locked),
          avgPrice: 0,
          currentPrice: 0,
          evaluatedAmount: 0,
          totalInvested: 0,
          gain: 0,
          gainPercent: 0,
          note: '에어드랍',
        }));

        setPortfolio(portfolioData);
        setLoading(false);
        return;
      }

      const markets = tradableCoins.map(acc => `KRW-${acc.currency}`).join(',');
      console.log('Fetching tickers for:', markets);
      
      const tickerRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
      const tickers = await tickerRes.json();
      console.log('Tickers received:', tickers);

      const tickerMap = {};
      tickers.forEach(t => {
        tickerMap[t.market] = t.trade_price;
      });

      const portfolioData = tradableCoins.map((acc) => {
        const market = `KRW-${acc.currency}`;
        const currentPrice = tickerMap[market] || 0;
        const avgPrice = parseFloat(acc.avg_buy_price);
        const totalQuantity = parseFloat(acc.balance) + parseFloat(acc.locked);
        const balance = parseFloat(acc.balance);
        const locked = parseFloat(acc.locked);
        
        console.log(`${acc.currency}: qty=${totalQuantity}, avg=${avgPrice}, current=${currentPrice}`);
        
        const evaluatedAmount = currentPrice * totalQuantity;
        const totalInvested = avgPrice * totalQuantity;
        const gain = evaluatedAmount - totalInvested;
        const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

        if (currentPrice > 0) {
          return {
            symbol: acc.currency,
            name: acc.korean_name || acc.currency,
            market,
            quantity: totalQuantity,
            balance,
            locked,
            avgPrice,
            currentPrice,
            evaluatedAmount,
            totalInvested,
            gain,
            gainPercent,
            note: null,
          };
        }

        return {
          symbol: acc.currency,
          name: acc.korean_name || acc.currency,
          market,
          quantity: totalQuantity,
          balance,
          locked,
          avgPrice,
          currentPrice: 0,
          evaluatedAmount: 0,
          totalInvested,
          gain: 0,
          gainPercent: 0,
          note: '시세 조회 실패',
        };
      });

      console.log('Portfolio data:', portfolioData);

      const airdropCoins = accounts.filter(acc => parseFloat(acc.avg_buy_price) === 0).map(acc => ({
        symbol: acc.currency,
        name: acc.korean_name || acc.currency,
        market: `KRW-${acc.currency}`,
        quantity: parseFloat(acc.balance) + parseFloat(acc.locked),
        balance: parseFloat(acc.balance),
        locked: parseFloat(acc.locked),
        avgPrice: 0,
        currentPrice: 0,
        evaluatedAmount: 0,
        totalInvested: 0,
        gain: 0,
        gainPercent: 0,
        note: '에어드랍',
      }));

      const allCoins = [...portfolioData, ...airdropCoins];
      console.log('All coins combined:', allCoins);
      
      setPortfolio(allCoins);

      const sumValue = allCoins.reduce((sum, coin) => sum + coin.evaluatedAmount, 0) + krw_balance;
      const sumInvested = allCoins.reduce((sum, coin) => sum + coin.totalInvested, 0);
      
      console.log('Total Value (coins + KRW):', sumValue);
      console.log('Total Invested:', sumInvested);
      console.log('KRW Balance:', krw_balance);
      
      setTotalValue(sumValue);
      setTotalInvested(sumInvested);

      const pieData = allCoins
        .filter(coin => coin.evaluatedAmount > 0)
        .map(coin => ({
          name: coin.name,
          value: coin.evaluatedAmount,
        }));
      setChartData(pieData);

      setLoading(false);
    } catch (err) {
      console.error('Portfolio load error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>지갑 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <Link href="/">
            <button className={styles.backBtn}>← 돌아가기</button>
          </Link>
        </div>
      </div>
    );
  }

  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/">
          <button className={styles.backBtn}>← 돌아가기</button>
        </Link>
        <h1 className={styles.title}>💰 내 지갑</h1>
        <button className={styles.refreshBtn} onClick={loadRealPortfolio}>🔄</button>
      </div>

      {portfolio.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>💰</p>
          <p className={styles.emptyText}>보유 자산 없음</p>
          <p className={styles.emptyHint}>업비트에서 거래를 시작하세요</p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>💎</span>
                <span className={styles.cardTitle}>총 평가</span>
              </div>
              <div className={styles.cardValue}>
                ₩{totalValue.toLocaleString()}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>💸</span>
                <span className={styles.cardTitle}>총 투자</span>
              </div>
              <div className={styles.cardValue}>
                ₩{totalInvested.toLocaleString()}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{totalGain >= 0 ? '📈' : '📉'}</span>
                <span className={styles.cardTitle}>손익</span>
              </div>
              <div className={`${styles.cardValue} ${totalGain >= 0 ? styles.positive : styles.negative}`}>
                {totalGain >= 0 ? '+' : ''}₩{Math.abs(totalGain).toLocaleString()}
              </div>
              <div className={`${styles.cardPercent} ${totalGain >= 0 ? styles.positive : styles.negative}`}>
                {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className={styles.chartSection}>
              <h2 className={styles.sectionTitle}>자산 분포</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={0.85}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₩${value.toLocaleString()}`}
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={styles.holdings}>
            <div style={{ padding: '20px 20px 12px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>보유 자산</h2>
            </div>
            {portfolio.map((coin, index) => (
              <div key={index} className={`${styles.coinCard} ${coin.note === '에어드랍' ? styles.airdrop : ''}`}>
                <div className={styles.coinHeader}>
                  <div className={styles.coinInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.coinName}>{coin.name}</span>
                      {coin.note && (
                        <span className={styles.noteLabel}>
                          {coin.note}
                        </span>
                      )}
                    </div>
                    <span className={styles.coinSymbol}>{coin.symbol}</span>
                  </div>
                  {!coin.note && (
                    <span className={`${styles.gainBadge} ${coin.gain >= 0 ? styles.positive : styles.negative}`}>
                      {coin.gain >= 0 ? '+' : ''}{coin.gainPercent.toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className={styles.coinStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>보유수량</span>
                    <span className={styles.statValue}>{coin.quantity.toFixed(4)}</span>
                  </div>
                  {coin.avgPrice > 0 && (
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>평단가</span>
                      <span className={styles.statValue}>₩{coin.avgPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {coin.currentPrice > 0 && (
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>현재가</span>
                      <span className={styles.statValue}>₩{coin.currentPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {coin.evaluatedAmount > 0 && (
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>평가금액</span>
                      <span className={`${styles.statValue} ${styles.bold}`}>
                        ₩{coin.evaluatedAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {coin.gain !== 0 && coin.note !== '에어드랍' && (
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>손익</span>
                      <span className={`${styles.statValue} ${coin.gain >= 0 ? styles.positive : styles.negative}`}>
                        {coin.gain >= 0 ? '+' : ''}₩{Math.abs(coin.gain).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
