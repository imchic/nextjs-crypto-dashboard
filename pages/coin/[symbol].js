// pages/coin/[symbol].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/coinDetail.module.css';
import { IoArrowBack, IoBarChartOutline, IoReceiptOutline } from 'react-icons/io5';
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

const KOREAN_NAMES = {
  'SOL': '솔라나',
  'XRP': '리플',
  'ADA': '카르다노',
  'AVAX': '애벨란체',
  'DOGE': '도지',
  'NEAR': '니어',
  'DOT': '폴카닷',
  'LINK': '체인링크',
  'UNI': '유니스왑',
  'ARB': '아비트럼',
  'AGLD': '어드벤처골드',
  'KITE': '카이트',
  'ORBS': '오브스',
  'STX': '스택스',
  'BLUR': '블러',
  'SEI': '세이',
  'SAND': '샌드박스',
  'MANA': '디센트럴랜드',
  'FLOW': '플로우',
  'ENSO': '엔소',
  'SXP': '스와이프',
  'AZTEC': '아즈텍',
  'BTC': '비트코인',
  'CYBER': '사이버',
  'YGG': '일드길드',
  'FLOCK': '플록',
  'VTHO': '비토로',
  'SOMI': '솔미',
  'OM': '오엠',
  'BARD': '바드',
  'ETH': '이더리움',
  'USDT': '테더',
  'USDC': '유에스디씨',
  'BNB': '바이낸스코인',
  'XEC': '이캐시',
  'DYDX': '디와이디엑스',
  'MATIC': '폴리곤',
  'SHIB': '시바이누',
};

export default function CoinDetail() {
  const router = useRouter();
  const { symbol } = router.query;
  const [coinData, setCoinData] = useState(null);
  const [candleData, setCandleData] = useState([]);
  const [orderbook, setOrderbook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candleLoading, setCandleLoading] = useState(false);
  const [tab, setTab] = useState('candle');
  const [showOrderbook, setShowOrderbook] = useState(true);
  const [candleType, setCandleType] = useState('minutes/60');
  const [initialLoad, setInitialLoad] = useState(false);

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.close - data.open;
      const changePercent = ((change / data.open) * 100).toFixed(2);
      const isUp = change >= 0;
      
      return (
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '6px',
          }}>
            {label}
          </div>
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
            <span style={{ color: '#888' }}>시가:</span> <span style={{ fontWeight: 'bold' }}>₩{data.open?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
            <span style={{ color: '#888' }}>고가:</span> <span style={{ fontWeight: 'bold', color: '#0ECB81' }}>₩{data.high?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
            <span style={{ color: '#888' }}>저가:</span> <span style={{ fontWeight: 'bold', color: '#F6465D' }}>₩{data.low?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>종가:</span> <span style={{ fontWeight: 'bold' }}>₩{data.close?.toLocaleString()}</span>
          </div>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 'bold',
            color: isUp ? '#0ECB81' : '#F6465D',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '6px',
          }}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{change.toLocaleString()} ({isUp ? '+' : ''}{changePercent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!router.isReady || !symbol) return;
    loadCoinData();
    setInitialLoad(true);
    
    // 5초마다 가격 자동 업데이트 (백그라운드)
    const priceInterval = setInterval(() => {
      loadCoinData(false); // 백그라운드 업데이트
    }, 5000);
    
    return () => clearInterval(priceInterval);
  }, [router.isReady, symbol]);

  // 캔들 타입 변경 시 또는 초기 로드 시
  useEffect(() => {
    if (!initialLoad || !symbol) return;
    loadCandles();
  }, [candleType, initialLoad, symbol]);

  const getCandleCount = (type) => {
    switch (type) {
      case 'minutes/1':
        return 200;
      case 'minutes/3':
        return 200;
      case 'minutes/5':
        return 100;
      case 'minutes/10':
        return 100;
      case 'minutes/15':
        return 60;
      case 'minutes/30':
        return 48;
      case 'minutes/60':
        return 24;
      case 'minutes/240':
        return 30;
      case 'days':
        return 30;
      case 'weeks':
        return 12;
      case 'months':
        return 12;
      default:
        return 24;
    }
  };

  const loadCandles = async () => {
    try {
      setCandleLoading(true);
      const market = `KRW-${symbol}`;
      const count = getCandleCount(candleType);

      console.log(`Fetching candles (${candleType}) for ${market}...`);
      const candleRes = await fetch(`/api/candles?market=${market}&type=${candleType}&count=${count}`);
      
      if (!candleRes.ok) {
        throw new Error(`HTTP error! status: ${candleRes.status}`);
      }
      
      const candleRawData = await candleRes.json();
      
      console.log('Candle response:', candleRawData);
      
      if (candleRawData.error) {
        console.warn('Candle API error:', candleRawData.error);
        setCandleData([]);
      } else if (candleRawData && Array.isArray(candleRawData) && candleRawData.length > 0) {
        const formatted = candleRawData.map((candle) => {
          const open = candle.opening_price;
          const close = candle.trade_price;
          const isUp = close >= open;
          
          return {
            time: new Date(candle.candle_date_time_utc).toLocaleTimeString('ko-KR', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
            open: candle.opening_price,
            close: candle.trade_price,
            high: candle.high_price,
            low: candle.low_price,
            // 캔들 몸통 (상승/하락)
            body: [Math.min(open, close), Math.max(open, close)],
            // 꼬리 (하단)
            lowerWick: [candle.low_price, Math.min(open, close)],
            // 꼬리 (상단)
            upperWick: [Math.max(open, close), candle.high_price],
            isUp,
          };
        });
        setCandleData(formatted.reverse());
        console.log('Candles formatted:', formatted.length);
      } else {
        console.warn('No candle data');
        setCandleData([]);
      }
      setCandleLoading(false);
    } catch (e) {
      console.error('Candle error:', e);
      setCandleLoading(false);
    }
  };

  const loadCoinData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      const market = `KRW-${symbol}`;

      // 1. Current price
      const tickerRes = await fetch(`/api/ticker?market=${market}`);
      const tickerData = await tickerRes.json();

      if (tickerData && tickerData.length > 0) {
        const ticker = tickerData[0];
        setCoinData({
          symbol,
          price: ticker.trade_price,
          change: (ticker.signed_change_rate * 100).toFixed(2),
          high: ticker.high_price,
          low: ticker.low_price,
          volume: ticker.acc_trade_volume_24h,
          trade_price_24h: ticker.acc_trade_price_24h,
        });

        // 2. Orderbook (백그라운드일 때만 스킵 가능)
        if (showLoadingIndicator) {
          try {
            const orderbookRes = await fetch(`/api/orderbook?market=${market}`);
            const orderbookData = await orderbookRes.json();
            if (orderbookData && orderbookData.length > 0) {
              setOrderbook(orderbookData[0]);
            }
          } catch (e) {
            console.error('Orderbook error:', e);
          }

          // 3. Trades
          try {
            const tradesRes = await fetch(`/api/trades?market=${market}&count=20`);
            const tradesData = await tradesRes.json();
            if (tradesData && tradesData.length > 0) {
              setTrades(tradesData);
            }
          } catch (e) {
            console.error('Trades error:', e);
          }
        }
      }

      if (showLoadingIndicator) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load:', error);
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  if (!router.isReady) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중... 🚀</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>데이터 불러오는 중... 📊</div>
      </div>
    );
  }

  if (!coinData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>😭 {symbol} 데이터를 못찾았어요...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <Link href="/">
          <button className={styles.backBtn}>
            <IoArrowBack /> 대시보드
          </button>
        </Link>

        <h1 className={styles.title}>{symbol}</h1>
        <div className={styles.subtitle}>{KOREAN_NAMES[symbol] || symbol}</div>
        <div className={styles.price}>
          ₩{coinData.price.toLocaleString('ko-KR')}
          <span className={coinData.change > 0 ? styles.positive : styles.negative}>
            {coinData.change > 0 ? '+' : ''}{coinData.change}%
          </span>
        </div>
      </div>

      {/* 캔들 타입 탭 (가로 스크롤) */}
      <div className={styles.tabs}>
        {CANDLE_TYPES.map((type) => (
          <button
            key={type.id}
            className={`${styles.tab} ${candleType === type.id ? styles.active : ''}`}
            onClick={() => setCandleType(type.id)}
            disabled={candleLoading}
          >
            <span className={styles.tabLabel}>{type.label}</span>
            <span className={styles.tabDesc}>{type.desc}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.chartSection}>
          {candleLoading ? (
            <div className={styles.loading}>📊 차트 그리는 중...</div>
          ) : candleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart 
                data={candleData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.5)" 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)" 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* 하단 꼬리 */}
                <Bar dataKey="lowerWick" barSize={2}>
                  {candleData.map((entry, index) => (
                    <Cell key={`lower-${index}`} fill={entry.isUp ? '#0ECB81' : '#F6465D'} />
                  ))}
                </Bar>
                
                {/* 캔들 몸통 */}
                <Bar dataKey="body" barSize={10}>
                  {candleData.map((entry, index) => (
                    <Cell 
                      key={`body-${index}`} 
                      fill={entry.isUp ? '#0ECB81' : '#F6465D'}
                      opacity={0.9}
                    />
                  ))}
                </Bar>
                
                {/* 상단 꼬리 */}
                <Bar dataKey="upperWick" barSize={2}>
                  {candleData.map((entry, index) => (
                    <Cell key={`upper-${index}`} fill={entry.isUp ? '#0ECB81' : '#F6465D'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>😢 차트가 없네요...</div>
          )}
        </div>

        {/* 호가/체결 (항상 표시) */}
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
            orderbook ? (
              <div className={styles.orderbookContainer}>
                {/* 매도호가 (위) */}
                <div className={styles.orderbookSell}>
                  <h3>매도호가 (팔자)</h3>
                  <div className={styles.orderbookList}>
                    {orderbook.orderbook_units.slice(0, 10).reverse().map((unit, i) => {
                      const maxSize = Math.max(...orderbook.orderbook_units.slice(0, 10).map(u => u.ask_size));
                      const percentage = (unit.ask_size / maxSize) * 100;
                      return (
                        <div key={i} className={styles.orderbookRow}>
                          <div 
                            className={styles.orderbookBar} 
                            style={{ 
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, transparent, rgba(246, 70, 93, 0.2))'
                            }}
                          />
                          <span className={styles.orderbookPrice}>₩{unit.ask_price.toLocaleString()}</span>
                          <span className={styles.orderbookSize}>{unit.ask_size.toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 현재가 (중간) */}
                {coinData && (
                  <div className={styles.currentPrice}>
                    <div className={styles.currentPriceLabel}>현재가</div>
                    <div className={`${styles.currentPriceValue} ${parseFloat(coinData.change) >= 0 ? styles.up : styles.down}`}>
                      ₩{coinData.price.toLocaleString()}
                      <span className={styles.currentPriceChange}>
                        {parseFloat(coinData.change) >= 0 ? '+' : ''}{parseFloat(coinData.change).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* 매수호가 (아래) */}
                <div className={styles.orderbookBuy}>
                  <h3>매수호가 (사자)</h3>
                  <div className={styles.orderbookList}>
                    {orderbook.orderbook_units.slice(0, 10).map((unit, i) => {
                      const maxSize = Math.max(...orderbook.orderbook_units.slice(0, 10).map(u => u.bid_size));
                      const percentage = (unit.bid_size / maxSize) * 100;
                      return (
                        <div key={i} className={styles.orderbookRow}>
                          <div 
                            className={styles.orderbookBar} 
                            style={{ 
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, transparent, rgba(14, 203, 129, 0.2))'
                            }}
                          />
                          <span className={styles.orderbookPrice}>₩{unit.bid_price.toLocaleString()}</span>
                          <span className={styles.orderbookSize}>{unit.bid_size.toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>
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
                    const time = trade.trade_time_utc.substring(0, 8);
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
