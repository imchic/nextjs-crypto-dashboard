import styles from '@/styles/portfolio.module.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoRefreshOutline } from 'react-icons/io5';

export default function Portfolio() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickers, setTickers] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/upbit-accounts');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAccounts(data);
        fetchTickers(data);
      }
    } catch (err) {
      setError('계좌 정보를 불러올 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickers = async (accountsData) => {
    try {
      const base = accountsData || accounts;
      const markets = Array.from(
        new Set(
          base
            .filter((acc) => acc.currency !== 'KRW')
            .map((acc) => `KRW-${acc.currency}`)
        )
      );

      if (markets.length === 0) {
        setTickers({});
        return;
      }

      const res = await fetch(`/api/ticker?market=${markets.join(',')}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const map = {};
        data.forEach((t) => {
          if (t && t.market) {
            const symbol = t.market.replace('KRW-', '');
            map[symbol] = t;
          }
        });
        setTickers(map);
      }
    } catch (e) {
      console.error('티커 정보를 불러올 수 없습니다.', e);
    }
  };

  // 모든 코인 평가 계산
  let totalInvested = 0;
  let totalCurrent = 0;
  let profitCount = 0;
  let lossCount = 0;
  let evenCount = 0;
  const coinDetails = accounts
    .filter((acc) => acc.currency !== 'KRW')
    .filter((acc) => parseFloat(acc.balance || 0) > 0 || parseFloat(acc.locked || 0) > 0)
    .map((account) => {
      const balance = parseFloat(account.balance || 0);
      const locked = parseFloat(account.locked || 0);
      const avgBuyPrice = parseFloat(account.avg_buy_price || 0);
      const quantity = balance + locked;
      const buyValue = quantity * avgBuyPrice;

      const ticker = tickers[account.currency];
      const hasValidTicker = ticker && typeof ticker.trade_price === 'number';
      const currentPrice = hasValidTicker ? ticker.trade_price : avgBuyPrice;
      const currentValue = quantity * currentPrice;
      const profit = currentValue - buyValue;
      const profitRate = buyValue > 0 ? (profit / buyValue) * 100 : 0;

      totalInvested += buyValue;
      totalCurrent += currentValue;

      if (hasValidTicker && avgBuyPrice > 0) {
        if (profitRate > 0.1) {
          profitCount += 1;
        } else if (profitRate < -0.1) {
          lossCount += 1;
        } else {
          evenCount += 1;
        }
      }

      return {
        account,
        quantity,
        buyValue,
        hasValidTicker,
        currentPrice,
        currentValue,
        profit,
        profitRate,
      };
    });

  const krwBalance = accounts
    .filter((acc) => acc.currency === 'KRW')
    .reduce((sum, acc) => sum + parseFloat(acc.balance || 0) + parseFloat(acc.locked || 0), 0);

  const totalCurrentAsset = totalCurrent + krwBalance;
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const getMoodLabel = (rate) => {
    if (!isFinite(rate)) return '😐 관망 모드';
    if (rate >= 15) return '🚀 불장 미소폭발존';
    if (rate >= 5) return '😎 기분좋은 미소존';
    if (rate > 0) return '🙂 은근히 수익존';
    if (rate <= -15) return '🩸 심각한 출혈존';
    if (rate <= -5) return '🥵 식은땀 출혈존';
    if (rate < 0) return '😣 멘탈관리 구간';
    return '😐 관망 모드';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>💰 지갑 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>⚠️ API 키가 필요합니다</h2>
          <p>{error}</p>
          <p className={styles.hint}>
            .env.local 파일에 UPBIT_ACCESS_KEY와 UPBIT_SECRET_KEY를 설정하세요.
          </p>
          <button className={styles.backBtnWithText} onClick={() => router.push('/')}>
            <IoArrowBack size={16} /> 대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <IoArrowBack size={16} />
        </button>
        <h1>💰 내 지갑</h1>
        <button className={styles.refreshBtn} onClick={fetchAccounts}>
          <IoRefreshOutline size={16} />
        </button>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>지갑 요약</div>
        <div className={styles.sectionSubtitle}>전체 자산과 손익 흐름</div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>총 평가 자산</div>
          <div className={styles.summaryValue}>₩{totalCurrentAsset.toLocaleString()}</div>
          <div className={styles.summaryChips}>
            <div
              className={`${styles.summaryChip} ${totalProfit > 0
                ? styles.chipPositive
                : totalProfit < 0
                  ? styles.chipNegative
                  : styles.chipNeutral
                }`}
            >
              <div className={styles.chipLabel}>총 평가손익</div>
              <div className={styles.chipValue}>
                {totalProfit > 0 ? '+' : ''}₩{Math.abs(totalProfit).toLocaleString()} (
                {isNaN(totalProfitRate) ? '0.00' : totalProfitRate.toFixed(2)}%)
              </div>
            </div>
            <div className={styles.summaryChip}>
              <div className={styles.chipLabel}>수익중</div>
              <div className={styles.chipValue}>{profitCount} 종목</div>
            </div>
            <div className={styles.summaryChip}>
              <div className={styles.chipLabel}>손실중</div>
              <div className={styles.chipValue}>{lossCount} 종목</div>
            </div>
          </div>
          <div className={styles.summarySub}>
            <span className={styles.moodLabel}>오늘의 기분</span>
            <span className={styles.moodChip}>{getMoodLabel(totalProfitRate)}</span>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>보유 코인</div>
        <div className={styles.sectionSubtitle}>실제 보유 중인 코인 카드</div>
      </div>

      <div className={styles.accountList}>
        {accounts.map((account) => {
          const balance = parseFloat(account.balance);
          const locked = parseFloat(account.locked);
          const avgBuyPrice = parseFloat(account.avg_buy_price || 0);

          if (balance === 0 && locked === 0) return null;

          const quantity = balance + locked;
          const buyValue = quantity * avgBuyPrice;

          // 티커 정보 확인
          const ticker = tickers[account.currency];
          const hasValidTicker = account.currency !== 'KRW' && ticker && typeof ticker.trade_price === 'number';

          // 티커가 있을 때만 평가 관련 정보 계산
          let currentValue = 0;
          let profit = 0;
          let profitRate = 0;
          let statusText = '';
          let statusClass = '';

          if (hasValidTicker && avgBuyPrice > 0) {
            const currentPrice = ticker.trade_price;
            currentValue = quantity * currentPrice;
            profit = currentValue - buyValue;
            profitRate = (profit / buyValue) * 100;

            if (profitRate > 0.1) {
              statusText = '수익중';
              statusClass = styles.statusPositive;
            } else if (profitRate < -0.1) {
              statusText = '손실중';
              statusClass = styles.statusNegative;
            } else {
              statusText = '본전 근처';
              statusClass = styles.statusNeutral;
            }
          }

          return (
            <div key={account.currency} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div className={styles.currencyRow}>
                  <div className={styles.currency}>
                    {account.currency === 'KRW' ? '원화' : (account.korean_name || account.currency)}
                  </div>
                  {account.currency !== 'KRW' && (
                    <div className={styles.badges}>
                      {statusText && (
                        <span className={`${styles.statusChip} ${statusClass}`}>
                          {statusText}
                        </span>
                      )}
                      {account.market_warning === 'CAUTION' && (
                        <span className={styles.badge} data-type="caution">유의</span>
                      )}
                      {account.is_airdrop && (
                        <span className={styles.badge} data-type="airdrop">에어드랍</span>
                      )}
                    </div>
                  )}
                </div>
                {account.currency !== 'KRW' && avgBuyPrice > 0 && (
                  <div className={styles.avgPrice}>
                    평단: ₩{avgBuyPrice.toLocaleString()}
                  </div>
                )}
              </div>
              <div className={styles.accountBody}>
                <div className={styles.balanceRow}>
                  <span>보유량</span>
                  <span className={styles.balance}>
                    {account.currency === 'KRW'
                      ? `₩${balance.toLocaleString()}`
                      : `${balance.toFixed(8)} ${account.currency}`
                    }
                  </span>
                </div>
                {locked > 0 && (
                  <div className={styles.balanceRow}>
                    <span>주문 중</span>
                    <span className={styles.locked}>
                      {account.currency === 'KRW'
                        ? `₩${locked.toLocaleString()}`
                        : `${locked.toFixed(8)} ${account.currency}`
                      }
                    </span>
                  </div>
                )}
                {account.currency !== 'KRW' && avgBuyPrice > 0 && (
                  <div className={styles.balanceRow}>
                    <span>매수금액</span>
                    <span className={styles.value}>₩{buyValue.toLocaleString()}</span>
                  </div>
                )}
                {hasValidTicker && currentValue > 0 && (
                  <div className={styles.balanceRow}>
                    <span>평가금액</span>
                    <span className={styles.value}>₩{currentValue.toLocaleString()}</span>
                  </div>
                )}
                {hasValidTicker && avgBuyPrice > 0 && (
                  <div className={styles.balanceRow}>
                    <span>수익률</span>
                    <span
                      className={
                        profitRate > 0
                          ? styles.profitPositive
                          : profitRate < 0
                            ? styles.profitNegative
                            : styles.profitZero
                      }
                    >
                      {profitRate > 0 ? '+' : ''}{profitRate.toFixed(2)}%
                    </span>
                  </div>
                )}
                {hasValidTicker && avgBuyPrice > 0 && (
                  <div className={styles.balanceRow}>
                    <span>평가손익</span>
                    <span
                      className={
                        profit > 0
                          ? styles.profitPositive
                          : profit < 0
                            ? styles.profitNegative
                            : styles.profitZero
                      }
                    >
                      {profit > 0 ? '+' : ''}₩{Math.abs(profit).toLocaleString()} ·{' '}
                      <span className={styles.profitLabel}>{getMoodLabel(profitRate)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
