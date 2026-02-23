import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { IoBarChartOutline, IoReceiptOutline } from 'react-icons/io5';
import styles from '@/styles/coinDetail.module.css';

const CANDLE_TYPES = [
  { id: 'minutes/1', label: '1분', desc: '초단타' },
  { id: 'minutes/3', label: '3분', desc: '단타' },
  { id: 'minutes/5', label: '5분', desc: '스캘핑' },
  { id: 'minutes/10', label: '10분', desc: '단기' },
  { id: 'minutes/15', label: '15분', desc: '단기' },
  { id: 'minutes/30', label: '30분', desc: '중단기' },
  { id: 'minutes/60', label: '1시간', desc: '데이트레이딩' },
  { id: 'minutes/240', label: '4시간', desc: '스윙' },
  { id: 'days', label: '일봉', desc: '중기투자' },
  { id: 'weeks', label: '주봉', desc: '장기투자' },
  { id: 'months', label: '월봉', desc: '존버' },
];

export default function CoinDetailPanel({ coin }) {
  const [candleType, setCandleType] = useState('minutes/5');
  const [candleData, setCandleData] = useState([]);
  const [candleLoading, setCandleLoading] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(true);
  const [orderbook, setOrderbook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // 테마 초기 설정
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // MutationObserver로 테마 변경 감지
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || savedTheme;
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!coin) return;
    
    const fetchCandleData = async () => {
      setCandleLoading(true);
      try {
        const res = await fetch(`/api/candles?market=KRW-${coin.symbol}&type=${candleType}&count=60`);
        const rawData = await res.json();
        
        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
          const formatted = rawData.map((candle) => {
            const open = candle.opening_price;
            const close = candle.trade_price;
            
            return {
              time: new Date(candle.candle_date_time_utc).toLocaleTimeString('ko-KR', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }),
              open,
              close,
              high: candle.high_price,
              low: candle.low_price,
              volume: candle.candle_acc_trade_volume,
              wickHigh: candle.high_price - Math.max(open, close),
              body: Math.abs(close - open),
              wickLow: Math.min(open, close) - candle.low_price,
            };
          });
          setCandleData(formatted.reverse());
        } else {
          setCandleData([]);
        }
      } catch (err) {
        console.error('캔들 데이터 로딩 실패:', err);
        setCandleData([]);
      }
      setCandleLoading(false);
    };

    const fetchOrderbook = async () => {
      try {
        const res = await fetch(`/api/orderbook?market=KRW-${coin.symbol}`);
        const data = await res.json();
        // Upbit API는 배열로 리턴함
        if (Array.isArray(data) && data.length > 0) {
          setOrderbook(data[0]);
        } else {
          setOrderbook(null);
        }
      } catch (err) {
        console.error('호가 로딩 실패:', err);
        setOrderbook(null);
      }
    };

    const fetchTrades = async () => {
      try {
        const res = await fetch(`/api/trades?market=KRW-${coin.symbol}`);
        const data = await res.json();
        setTrades(data);
      } catch (err) {
        console.error('체결 로딩 실패:', err);
      }
    };

    fetchCandleData();
    fetchOrderbook();
    fetchTrades();

    const interval = setInterval(() => {
      fetchOrderbook();
      fetchTrades();
    }, 3000);

    return () => clearInterval(interval);
  }, [coin, candleType]);

  if (!coin) return null;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;
    const d = payload[0].payload;
    const change = d.close - d.open;
    const changePercent = ((change / d.open) * 100).toFixed(2);
    const isUp = change >= 0;
    
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipTime}>{d.time}</p>
        <p>
          <span>시가</span>
          <span>₩{d.open?.toLocaleString()}</span>
        </p>
        <p>
          <span>고가</span>
          <span style={{ color: '#0ECB81' }}>₩{d.high?.toLocaleString()}</span>
        </p>
        <p>
          <span>저가</span>
          <span style={{ color: '#F6465D' }}>₩{d.low?.toLocaleString()}</span>
        </p>
        <p>
          <span>종가</span>
          <span style={{ color: isUp ? '#0ECB81' : '#F6465D', fontWeight: 700 }}>
            ₩{d.close?.toLocaleString()}
          </span>
        </p>
        <p style={{ 
          marginTop: '8px', 
          paddingTop: '8px', 
          borderTop: '1px solid var(--border-light)',
          color: isUp ? '#0ECB81' : '#F6465D',
          fontWeight: 700,
        }}>
          <span>변동</span>
          <span>{isUp ? '+' : ''}{changePercent}%</span>
        </p>
      </div>
    );
  };

  return (
    <div className={styles.detailWrapper}>
      {/* 캔들 타입 탭 */}
      <div className={styles.tabs}>
        {CANDLE_TYPES.map(ct => (
          <button
            key={ct.id}
            className={`${styles.tab} ${candleType === ct.id ? styles.active : ''}`}
            onClick={() => setCandleType(ct.id)}
          >
            <span className={styles.tabLabel}>{ct.label}</span>
            <span className={styles.tabDesc}>{ct.desc}</span>
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className={styles.content}>
        <div className={styles.chartSection}>
          {candleLoading ? (
            <div className={styles.loading}>📊 차트 그리는 중...</div>
          ) : candleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={candleData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === 'light' ? '#e0e0e0' : 'rgba(255,255,255,0.1)'} 
                />
                <XAxis dataKey="time" stroke={theme === 'light' ? '#666666' : 'rgba(255,255,255,0.5)'} style={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke={theme === 'light' ? '#666666' : 'rgba(255,255,255,0.5)'} style={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="wickHigh" stackId="a" fill="transparent" />
                <Bar dataKey="body" stackId="a">
                  {candleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.open > entry.close ? '#F6465D' : '#0ECB81'} />
                  ))}
                </Bar>
                <Bar dataKey="wickLow" stackId="a" fill="transparent" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>차트 데이터가 없습니다</div>
          )}
        </div>

        {/* 거래량 차트 */}
        {candleData.length > 0 && (
          <div className={styles.volumeChartSection}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: theme === 'light' ? '#333' : '#fff' }}>📊 거래량</h3>
            <ResponsiveContainer width="100%" height={150}>
              <ComposedChart data={candleData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === 'light' ? '#e0e0e0' : 'rgba(255,255,255,0.1)'} 
                />
                <XAxis dataKey="time" stroke={theme === 'light' ? '#666666' : 'rgba(255,255,255,0.5)'} style={{ fontSize: 9 }} />
                <YAxis stroke={theme === 'light' ? '#666666' : 'rgba(255,255,255,0.5)'} style={{ fontSize: 9 }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  formatter={(value) => `${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
                    border: theme === 'light' ? '1px solid #cccccc' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: theme === 'light' ? '#333' : '#fff'
                  }}
                />
                <Bar dataKey="volume" barSize={6} radius={[2, 2, 0, 0]}>
                  {candleData.map((entry, index) => (
                    <Cell key={`vol-${index}`} fill={entry.open > entry.close ? '#F6465D' : '#0ECB81'} opacity={0.6} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 호가/체결 */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomTabs}>
            <button
              className={`${styles.bottomTab} ${showOrderbook ? styles.active : ''}`}
              onClick={() => setShowOrderbook(true)}
            >
              <IoBarChartOutline /> 호가
            </button>
            <button
              className={`${styles.bottomTab} ${!showOrderbook ? styles.active : ''}`}
              onClick={() => setShowOrderbook(false)}
            >
              <IoReceiptOutline /> 체결
            </button>
          </div>

          {showOrderbook ? (
            orderbook && orderbook.orderbook_units ? (
              <div className={styles.orderbookContainer}>
                <div className={styles.orderbookSell}>
                  <h3>매도호가 (팔자)</h3>
                  {orderbook.orderbook_units.slice().reverse().map((unit, i) => (
                    <div key={i} className={styles.orderbookRow}>
                      <span className={styles.askPrice}>₩{unit.ask_price.toLocaleString()}</span>
                      <span className={styles.askSize}>{unit.ask_size.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.orderbookBuy}>
                  <h3>매수호가 (사자)</h3>
                  {orderbook.orderbook_units.map((unit, i) => (
                    <div key={i} className={styles.orderbookRow}>
                      <span className={styles.bidPrice}>₩{unit.bid_price.toLocaleString()}</span>
                      <span className={styles.bidSize}>{unit.bid_size.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.empty}>😭 호가 데이터가 없어요...</div>
            )
          ) : (
            trades.length > 0 ? (
              <div className={styles.tradesContainer}>
                <h3>체결 내역</h3>
                <div className={styles.tradesHeader}>
                  <span>시간</span>
                  <span>가격</span>
                  <span>수량</span>
                  <span>구분</span>
                </div>
                <div className={styles.tradesList}>
                  {trades.slice(0, 20).map((trade, i) => {
                    const time = (() => {
                      try {
                        // Prefer KST fields when present
                        if (trade.trade_date_kst && trade.trade_time_kst) {
                          const d = new Date(`${trade.trade_date_kst}T${trade.trade_time_kst}+09:00`);
                          return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Seoul' });
                        }
                        if (trade.trade_time_kst) {
                          const t = String(trade.trade_time_kst);
                          if (/^\d{6}$/.test(t)) return `${t.substr(0,2)}:${t.substr(2,2)}:${t.substr(4,2)}`;
                          return t;
                        }
                        if (trade.timestamp) {
                          let t = Number(trade.timestamp);
                          if (t > 0 && t < 1e12) t = t * 1000;
                          const d = new Date(t);
                          return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Seoul' });
                        }
                        if (trade.trade_time_utc) return trade.trade_time_utc.substring(0, 8);
                      } catch (e) {
                        return trade.trade_time_utc ? trade.trade_time_utc.substring(0,8) : '';
                      }
                      return '';
                    })();
                    const isBuy = trade.ask_bid === 'BID';
                    return (
                      <div key={i} className={`${styles.tradeRow} ${isBuy ? styles.buyRow : styles.sellRow}`}>
                        <span className={styles.tradeTime}>{time}</span>
                        <span className={`${styles.tradePrice} ${isBuy ? styles.buy : styles.sell}`}>
                          ₩{trade.trade_price.toLocaleString()}
                        </span>
                        <span className={styles.tradeVolume}>{trade.trade_volume.toFixed(4)}</span>
                        <span className={`${styles.tradeBadge} ${isBuy ? styles.buyBadge : styles.sellBadge}`}>
                          {isBuy ? '매수' : '매도'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.empty}>😭 체결 데이터가 없어요...</div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
