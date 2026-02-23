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

      console.log('티커 응답:', data);

      if (Array.isArray(data)) {
        const map = {};
        data.forEach((t) => {
          if (t && t.market) {
            const symbol = t.market.replace('KRW-', '');
            map[symbol] = t;
            console.log(`${symbol}: trade_price=${t.trade_price}`);
          }
        });
        setTickers(map);
        console.log('최종 tickers:', map);
      }
    } catch (e) {
      console.error('티커 정보를 불러올 수 없습니다.', e);
    }
  };

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
        balance,
        locked,
        quantity,
        avgBuyPrice,
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

  // KRW 표시는 모두 1원 단위로 반올림해서 사용
  const roundedKrwBalance = Math.round(krwBalance);
  const roundedTotalInvested = Math.round(totalInvested);
  const roundedTotalCurrent = Math.round(totalCurrent);
  const roundedTotalCurrentAsset = Math.round(totalCurrent + krwBalance);
  const roundedTotalProfit = Math.round(totalCurrent - totalInvested);

  const totalCurrentAsset = roundedTotalCurrentAsset;
  const totalProfit = roundedTotalProfit;
  const totalProfitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>💰 지갑 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const isIpError = error.includes('IP가 Upbit에 등록');

    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>⚠️ {isIpError ? '서버 설정 필요' : 'API 키 필요'}</h2>
          <p>{error}</p>
          {isIpError ? (
            <div className={styles.hint}>
              <p>현재는 <strong>로컬 개발 환경에서만</strong> 정상 작동합니다.</p>
              <p><strong>프로덕션 배포 시:</strong> Upbit API 설정 → IP 화이트리스트에서 Vercel 서버 IP를 추가해주세요.</p>
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>Vercel은 고정 IP가 없으므로, 이 문제를 해결하려면 다른 백엔드 서버가 필요할 수 있습니다.</p>
            </div>
          ) : (
            <p className={styles.hint}>
              .env.local 파일에 UPBIT_ACCESS_KEY와 UPBIT_SECRET_KEY를 설정하세요.
            </p>
          )}
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
          <div className={styles.summaryGrid}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>보유 KRW</div>
                <div className={styles.itemValue}>{roundedKrwBalance.toLocaleString()} <span className={styles.itemUnit}>KRW</span></div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>총 매수</div>
                <div className={styles.itemValue}>{roundedTotalInvested.toLocaleString()} <span className={styles.itemUnit}>KRW</span></div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>총 평가</div>
                <div className={styles.itemValue}>{roundedTotalCurrent.toLocaleString()} <span className={styles.itemUnit}>KRW</span></div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>주문가능</div>
                <div className={styles.itemValue}>{roundedKrwBalance.toLocaleString()} <span className={styles.itemUnit}>KRW</span></div>
              </div>
            </div>
            <div className={styles.summaryRight}>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>총 보유자산</div>
                <div className={styles.itemValue}>{totalCurrentAsset.toLocaleString()} <span className={styles.itemUnit}>KRW</span></div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>총평가손익</div>
                <div className={styles.itemValue} style={{ color: totalProfit > 0 ? '#ef5350' : totalProfit < 0 ? '#26a69a' : '#212121' }}>
                  {totalProfit > 0 ? '+' : ''}{Math.abs(totalProfit).toLocaleString()} <span className={styles.itemUnit}>KRW</span>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.itemLabel}>총평가수익률</div>
                <div className={styles.itemValue} style={{ color: totalProfitRate > 0 ? '#ef5350' : totalProfitRate < 0 ? '#26a69a' : '#212121' }}>
                  {totalProfitRate > 0 ? '+' : ''}{isNaN(totalProfitRate) ? '0.00' : totalProfitRate.toFixed(2)} <span className={styles.itemUnit}>%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>보유 코인</div>
        <div className={styles.sectionSubtitle}>실제 보유 중인 코인 카드</div>
      </div>

      <div className={styles.accountList}>
        {/* KRW 잔고 표시 */}
        {krwBalance > 0 && (
          <div className={styles.accountCard}>
            <div className={styles.accountHeader}>
              <div className={styles.currency}>원화</div>
            </div>
            <div className={styles.accountBody}>
              <div className={styles.balanceRow}>
                <span>보유량</span>
                <span className={styles.balance}>₩{krwBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 코인 카드들 */}
        {coinDetails.map((detail) => {
          const {
            account,
            balance,
            locked,
            quantity,
            avgBuyPrice,
            buyValue,
            hasValidTicker,
            currentPrice,
            currentValue,
            profit,
            profitRate,
          } = detail;

          let statusText = '';
          let statusClass = '';
          if (hasValidTicker && avgBuyPrice > 0 && profitRate > 0.1) {
            statusText = '수익중';
            statusClass = styles.statusPositive;
          } else if (hasValidTicker && avgBuyPrice > 0 && profitRate < -0.1) {
            statusText = '손실중';
            statusClass = styles.statusNegative;
          } else if (hasValidTicker && avgBuyPrice > 0) {
            statusText = '본전 근처';
            statusClass = styles.statusNeutral;
          }

          return (
            <div key={account.currency} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div className={styles.currencyRow}>
                  <div className={styles.currency}>
                    {account.korean_name || account.currency}
                  </div>
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
                </div>
                {avgBuyPrice > 0 && (
                  <div className={styles.avgPrice}>
                    평단: ₩{avgBuyPrice.toLocaleString()}
                  </div>
                )}
              </div>
              <div className={styles.accountBody}>
                <div className={styles.balanceRow}>
                  <span>보유량</span>
                  <span className={styles.balance}>
                    {balance.toFixed(8)} {account.currency}
                  </span>
                </div>
                {locked > 0 && (
                  <div className={styles.balanceRow}>
                    <span>주문 중</span>
                    <span className={styles.locked}>
                      {locked.toFixed(8)} {account.currency}
                    </span>
                  </div>
                )}
                {avgBuyPrice > 0 && (
                  <div className={styles.balanceRow}>
                    <span>매수금액</span>
                    <span className={styles.value}>₩{buyValue.toLocaleString()}</span>
                  </div>
                )}
                {hasValidTicker && currentPrice > 0 && (
                  <div className={styles.balanceRow}>
                    <span>현재가</span>
                    <span className={styles.value}>₩{currentPrice.toLocaleString()}</span>
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
