// pages/coin/[symbol].js
import styles from '@/styles/coinDetail.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoBarChartOutline, IoReceiptOutline } from 'react-icons/io5';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChartIcon, ErrorIcon, HeartIcon } from '@/components/Icons';
import LottieLoadingBar from '@/components/LottieLoadingBar';
import getTodayRecommendations from '@/utils/dailyRecommendations';

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

// CustomAxisTick 컴포넌트 - 라이트/다크 모드 대응
const CustomXAxisTick = ({ x, y, payload, theme }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dy={16}
      textAnchor="middle"
      fill={theme === 'light' ? '#333333' : '#ffffff'}
      fontSize="11px"
      fontWeight="600"
      fontFamily="Pretendard, system-ui"
    >
      {payload.value}
    </text>
  </g>
);

const CustomYAxisTick = ({ x, y, payload, theme, isCandleChart }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dy={3}
      textAnchor="end"
      fill={theme === 'light' ? '#333333' : '#ffffff'}
      fontSize="11px"
      fontWeight="600"
      fontFamily="Pretendard, system-ui"
    >
      {isCandleChart ? `₩${(payload.value / 1000).toFixed(0)}K` : `${(payload.value / 1000000).toFixed(0)}M`}
    </text>
  </g>
);

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
  const [theme, setTheme] = useState('dark');
  const [coinGeckoData, setCoinGeckoData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  // const [chartHeight, setChartHeight] = useState(600);
  const [marketInfo, setMarketInfo] = useState(null); // 유의/신규 정보
  const [recommendations, setRecommendations] = useState({}); // AI 추천 정보

  useEffect(() => {
    // 차트 높이 반응형 조정 -> 고정 높이(350px) 사용으로 제거
    /*
    const updateHeight = () => {
      setChartHeight(window.innerWidth < 480 ? 350 : 600);
    };
    updateHeight(); // 초기 실행
    window.addEventListener('resize', updateHeight);
    */
    
    // 즐겨찾기 로드
    const saved = localStorage.getItem('coinFavorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }

    // AI 추천 정보 로드
    setRecommendations(getTodayRecommendations());
    
    // 마켓 정보(유의 등) 로드
    const fetchMarketInfo = async () => {
      try {
        const res = await fetch('https://api.upbit.com/v1/market/all?isDetails=true');
        const markets = await res.json();
        const info = markets.find(m => m.market === `KRW-${symbol}`);
        if (info) {
          setMarketInfo({
            market_warning: info.market_warning,
            // 최근 상장 여부는 대략적으로 판단 불가하므로 생략하거나 별도 로직 필요
            // 여기서는 유의 종목만 체크
          });
        }
      } catch (e) {
        console.error('Failed to fetch market info', e);
      }
    };
    if (symbol) fetchMarketInfo();
    
    // return () => window.removeEventListener('resize', updateHeight);
  }, [symbol]);

  const toggleFavorite = () => {
    if (!symbol) return;
    
    let newFavorites;
    if (favorites.includes(symbol)) {
      newFavorites = favorites.filter(s => s !== symbol);
    } else {
      newFavorites = [...favorites, symbol];
    }
    setFavorites(newFavorites);
    localStorage.setItem('coinFavorites', JSON.stringify(newFavorites));
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.close - data.open;
      const changePercent = ((change / data.open) * 100).toFixed(2);
      const isUp = change >= 0;

      return (
        <div style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
          border: theme === 'light' ? '1px solid #cccccc' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme === 'light' ? '#666' : '#888',
            marginBottom: '8px',
            borderBottom: theme === 'light' ? '1px solid #e0e0e0' : '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '6px',
          }}>
            {label}
          </div>
          <div style={{ fontSize: '13px', color: theme === 'light' ? '#333' : '#fff', marginBottom: '4px' }}>
            <span style={{ color: theme === 'light' ? '#888' : '#888' }}>시가:</span> <span style={{ fontWeight: 'bold' }}>₩{data.open?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: theme === 'light' ? '#333' : '#fff', marginBottom: '4px' }}>
            <span style={{ color: theme === 'light' ? '#888' : '#888' }}>고가:</span> <span style={{ fontWeight: 'bold', color: '#0ECB81' }}>₩{data.high?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: theme === 'light' ? '#333' : '#fff', marginBottom: '4px' }}>
            <span style={{ color: theme === 'light' ? '#888' : '#888' }}>저가:</span> <span style={{ fontWeight: 'bold', color: '#F6465D' }}>₩{data.low?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '13px', color: theme === 'light' ? '#333' : '#fff', marginBottom: '8px' }}>
            <span style={{ color: theme === 'light' ? '#888' : '#888' }}>종가:</span> <span style={{ fontWeight: 'bold' }}>₩{data.close?.toLocaleString()}</span>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: isUp ? '#0ECB81' : '#F6465D',
            borderTop: theme === 'light' ? '1px solid #e0e0e0' : '1px solid rgba(255,255,255,0.1)',
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
    
    // 테마 초기 설정
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // MutationObserver로 테마 변경 감지
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || savedTheme;
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    loadCoinData();
    setInitialLoad(true);

    // CoinGecko 데이터 로드
    loadCoinGeckoData();

    // 5초마다 가격 자동 업데이트 (백그라운드)
    const priceInterval = setInterval(() => {
      loadCoinData(false); // 백그라운드 업데이트
    }, 5000);

    return () => {
      clearInterval(priceInterval);
      observer.disconnect();
    };
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
            volume: candle.candle_acc_trade_volume,
            // 캔들 몸통 높이 (상승/하락)
            body: Math.abs(close - open),
            bodyBase: Math.min(open, close),
            // 꼬리 (하단) - 높이만
            lowerWick: Math.min(open, close) - candle.low_price,
            lowerWickBase: candle.low_price,
            // 꼬리 (상단) - 높이만
            upperWick: candle.high_price - Math.max(open, close),
            upperWickBase: Math.max(open, close),
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

  const loadCoinGeckoData = async () => {
    try {
      const res = await fetch(`/api/coingecko?symbol=${symbol}`);
      const data = await res.json();
      if (data && !data.error) {
        setCoinGeckoData(data);
        console.log('CoinGecko data loaded:', data);
      }
    } catch (e) {
      console.error('CoinGecko error:', e);
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
        <div className={styles.loading}>
          <LottieLoadingBar />
        </div>
      </div>
    );
  }

  if (!coinData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <ErrorIcon size={40} color="var(--danger-red)" />
          <p>{symbol} 데이터를 찾을 수 없습니다.</p>
        </div>
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

        <div className={styles.headerTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 className={styles.title}>{symbol}</h1>
            
            {/* 즐겨찾기 버튼 */}
            <button 
              onClick={toggleFavorite} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
              title={favorites.includes(symbol) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              <HeartIcon 
                size={22} 
                filled={favorites.includes(symbol)} 
                color={favorites.includes(symbol) ? '#FF4757' : 'var(--text-tertiary)'} 
              />
            </button>

            {/* 유의 종목 뱃지 */}
            {marketInfo?.market_warning === 'CAUTION' && (
              <span style={{ 
                backgroundColor: 'rgba(255, 193, 7, 0.15)', 
                color: '#FFC107', 
                padding: '4px 8px', 
                borderRadius: '6px', 
                fontSize: '12px', 
                fontWeight: '800',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>유의</span>
            )}

            {/* AI 추천 뱃지들 */}
            {recommendations[symbol] && (
              <>
                <span style={{ 
                  background: (recommendations[symbol]?.score || 0) >= 80 ? 'rgba(255, 215, 0, 0.15)' : 'var(--bg-tertiary)',
                  color: (recommendations[symbol]?.score || 0) >= 80 ? '#FFD700' : 'var(--text-secondary)',
                  border: (recommendations[symbol]?.score || 0) >= 80 ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid var(--border-medium)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '800',
                  boxShadow: (recommendations[symbol]?.score || 0) >= 80 ? '0 0 10px rgba(255, 215, 0, 0.1)' : 'none'
                }}>
                  🏆 {recommendations[symbol].score}점
                </span>
                <span style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--border-medium)'
                }}>
                  {recommendations[symbol].type}
                </span>
                <span style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-secondary)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--border-medium)'
                }}>
                  {recommendations[symbol].risk}
                </span>
              </>
            )}
          </div>
          <div className={styles.headerPrice}>
            ₩{coinData.price.toLocaleString('ko-KR')}
            <span className={coinData.change > 0 ? styles.positive : styles.negative}>
              {coinData.change > 0 ? '+' : ''}{coinData.change}%
            </span>
          </div>
        </div>
        <div className={styles.subtitle}>{KOREAN_NAMES[symbol] || symbol}</div>

        {/* 💡 코인 특징 (3줄 요약) - 상세 페이지 전용 */}
        {recommendations[symbol]?.description && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: '1px solid var(--border-medium)',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
              💡 코인 특징 (3줄 요약)
            </strong>
            <div style={{ whiteSpace: 'pre-line' }}>
              {recommendations[symbol].description}
            </div>
          </div>
        )}
      </div>

      {/* 📊 가격 범위 섹션 */}
      <div className={styles.priceRangeSection}>
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>24h 고가</span>
          <span className={`${styles.priceValue} ${styles.high}`}>₩{coinData.high.toLocaleString()}</span>
        </div>
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>24h 저가</span>
          <span className={`${styles.priceValue} ${styles.low}`}>₩{coinData.low.toLocaleString()}</span>
        </div>
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>거래대금</span>
          <span className={styles.priceValue}>₩{(coinData.trade_price_24h / 1000000000).toFixed(2)}B</span>
        </div>
      </div>

      {/* 💰 시가총액 & 순위 섹션 */}
      {coinGeckoData && (
        <div className={styles.marketCapSection}>
          <div className={styles.marketCapItem}>
            <span className={styles.marketCapLabel}>시가총액</span>
            <span className={styles.marketCapValue}>
              ${(coinGeckoData.market_cap_usd / 1000000000).toFixed(2)}B
            </span>
            <span className={styles.marketCapKrw}>
              ₩{(coinGeckoData.market_cap_krw / 1000000000000).toFixed(2)}T
            </span>
          </div>
          {coinGeckoData.market_cap_rank && (
            <div className={styles.marketCapItem}>
              <span className={styles.marketCapLabel}>순위</span>
              <span className={styles.marketCapRank}>#{coinGeckoData.market_cap_rank}</span>
            </div>
          )}
          {coinGeckoData.btc_dominance && (
            <div className={styles.marketCapItem}>
              <span className={styles.marketCapLabel}>BTC 도미넌스</span>
              <span className={styles.marketCapValue}>{coinGeckoData.btc_dominance.toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}

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
        <div className={`${styles.chartSection} ${theme}`}>
          {candleLoading ? (
            <div className={styles.loading} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LottieLoadingBar />
            </div>
          ) : candleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={candleData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                style={{
                  backgroundColor: 'transparent'
                }}
              >
                <CartesianGrid 
                  stroke={theme === 'light' ? '#e0e0e0' : 'rgba(255,255,255,0.08)'} 
                  strokeDasharray="3 3" 
                />
                <XAxis
                  dataKey="time"
                  stroke={theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)'}
                  axisLine={{ stroke: theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)' }}
                  tick={{ fill: theme === 'light' ? '#333333' : '#ffffff', fontSize: 13, fontWeight: 700 }}
                  height={45}
                />
                <YAxis
                  stroke={theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)'}
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={{ fill: theme === 'light' ? '#333333' : '#ffffff', fontSize: 13, fontWeight: 700 }}
                  axisLine={{ stroke: theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)' }}
                  width={70}
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 낮은가(wick) 베이스 - 투명 */}
                <Bar dataKey="lowerWickBase" stackId="candle" barSize={6} fill="transparent" isAnimationActive={false} />
                
                {/* 하단 꼬리 */}
                <Bar dataKey="lowerWick" stackId="candle" barSize={6} radius={[0, 0, 0, 0]}>
                  {candleData.map((entry, index) => (
                    <Cell 
                      key={`lower-${index}`} 
                      fill={entry.isUp ? '#0ECB81' : '#F6465D'}
                      opacity={1}
                    />
                  ))}
                </Bar>

                {/* 캔들 몸통 베이스 - 투명 */}
                <Bar dataKey="bodyBase" stackId="candle" barSize={12} fill="transparent" isAnimationActive={false} />

                {/* 캔들 몸통 */}
                <Bar dataKey="body" stackId="candle" barSize={12}>
                  {candleData.map((entry, index) => (
                    <Cell
                      key={`body-${index}`}
                      fill={entry.isUp ? '#0ECB81' : '#F6465D'}
                      opacity={0.95}
                    />
                  ))}
                </Bar>

                {/* 상단 꼬리 베이스 - 투명 */}
                <Bar dataKey="upperWickBase" stackId="candle" barSize={6} fill="transparent" isAnimationActive={false} />

                {/* 상단 꼬리 */}
                <Bar dataKey="upperWick" stackId="candle" barSize={6} radius={[0, 0, 0, 0]}>
                  {candleData.map((entry, index) => (
                    <Cell 
                      key={`upper-${index}`} 
                      fill={entry.isUp ? '#0ECB81' : '#F6465D'}
                      opacity={1}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>😢 차트가 없네요...</div>
          )}
        </div>

        {/* 거래량 차트 */}
        {candleData.length > 0 && (
          <div className={`${styles.volumeChartSection} ${theme}`}>
            <h3 className={styles.volumeTitle}>
              <BarChartIcon size={18} /> 거래량
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <ComposedChart
                data={candleData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                style={{
                  backgroundColor: 'transparent'
                }}
              >
                <CartesianGrid 
                  stroke={theme === 'light' ? '#e0e0e0' : 'rgba(255,255,255,0.08)'} 
                  strokeDasharray="3 3" 
                />
                <XAxis
                  dataKey="time"
                  stroke={theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)'}
                  axisLine={{ stroke: theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)' }}
                  tick={{ fill: theme === 'light' ? '#333333' : '#ffffff', fontSize: 12, fontWeight: 700 }}
                  height={40}
                />
                <YAxis
                  stroke={theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)'}
                  tick={{ fill: theme === 'light' ? '#333333' : '#ffffff', fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: theme === 'light' ? '#cccccc' : 'rgba(255,255,255,0.15)' }}
                  width={70}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value) => `${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
                    border: theme === 'light' ? '1px solid #cccccc' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#333333' : '#ffffff'
                  }}
                />
                <Bar dataKey="volume" barSize={8} radius={[2, 2, 0, 0]}>
                  {candleData.map((entry, index) => (
                    <Cell key={`vol-${index}`} fill={entry.isUp ? '#0ECB81' : '#F6465D'} opacity={0.7} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

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
                      const isBest = i === 0; // top of reversed sell list is best ask
                      return (
                        <div key={i} className={`${styles.orderbookRow} ${isBest ? styles.bestRow : ''}`}>
                          <div
                            className={styles.orderbookBar}
                            style={{
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, transparent, rgba(246, 70, 93, 0.2))'
                            }}
                          />
                          <span className={styles.orderbookPrice}>₩{unit.ask_price.toLocaleString()}</span>
                          <span className={styles.orderbookSize}>{unit.ask_size.toFixed(4)}</span>
                          {isBest && <span className={styles.orderbookBestBadge}>BEST</span>}
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
                      const isBest = i === 0; // first buy row is best bid
                      return (
                        <div key={i} className={`${styles.orderbookRow} ${isBest ? styles.bestRow : ''}`}>
                          <div
                            className={styles.orderbookBar}
                            style={{
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, transparent, rgba(14, 203, 129, 0.2))'
                            }}
                          />
                          <span className={styles.orderbookPrice}>₩{unit.bid_price.toLocaleString()}</span>
                          <span className={styles.orderbookSize}>{unit.bid_size.toFixed(4)}</span>
                          {isBest && <span className={styles.orderbookBestBadge}>BEST</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                <ErrorIcon size={32} color="var(--text-tertiary)" />
                <p>호가 데이터가 없습니다.</p>
              </div>
            )
          ) : (
            trades.length > 0 ? (
              <div className={styles.tradesContainer}>
                <h3>체결 내역</h3>
                <div className={styles.tradesTotal}>
                  <span className={styles.tradesTotalLabel}>실시간 체결량 (최근 20)</span>
                  <div className={styles.tradesTotalMain}>
                    <strong className={styles.tradesTotalAmount}>{trades.slice(0,20).reduce((s,t)=>s + Number(t.trade_volume || 0),0).toFixed(4)}</strong>
                    <span className={styles.tradesTotalUnit}>개</span>
                  </div>
                  <div className={styles.tradesTotalKrw}>₩{trades.slice(0,20).reduce((s,t)=>s + (Number(t.trade_price || 0) * Number(t.trade_volume || 0)),0).toLocaleString()}</div>
                </div>

                <div className={styles.tradesHeader}>
                  <span>시간</span>
                  <span>구분</span>
                  <span>가격</span>
                  <span>수량</span>
                </div>
                <div className={styles.tradesList}>
                  {trades.slice(0, 20).map((trade, i) => {
                    const time = (() => {
                      const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
                      try {
                        // Prefer explicit KST fields if available
                        if (trade.trade_date_kst && trade.trade_time_kst) {
                          const d = new Date(`${trade.trade_date_kst}T${trade.trade_time_kst}+09:00`);
                          return d.toLocaleTimeString('ko-KR', opts);
                        }

                        // If only trade_time_kst (no date) exists, format HHMMSS -> HH:MM:SS
                        if (trade.trade_time_kst) {
                          const t = String(trade.trade_time_kst);
                          if (/^\d{6}$/.test(t)) return `${t.substr(0,2)}:${t.substr(2,2)}:${t.substr(4,2)}`;
                          return t;
                        }

                        // Fallback to timestamp (handle seconds vs milliseconds)
                        if (trade.timestamp) {
                          let t = Number(trade.timestamp);
                          if (t > 0 && t < 1e12) t = t * 1000; // seconds -> ms
                          const d = new Date(t);
                          return d.toLocaleTimeString('ko-KR', opts);
                        }

                        // Last resort: UTC time substring
                        if (trade.trade_time_utc) return trade.trade_time_utc.substring(0, 8);
                      } catch (e) {
                        return (trade.trade_time_utc || '').substring(0, 8);
                      }
                      return '';
                    })();
                    const isBuy = trade.ask_bid === 'BID';
                    return (
                      <div key={i} className={`${styles.tradeRow} ${isBuy ? styles.buyRow : styles.sellRow}`}>
                        <span className={styles.tradeTime}>{time}</span>
                        <span className={`${styles.tradeBadge} ${isBuy ? styles.buyBadge : styles.sellBadge}`}>
                          {isBuy ? '매수' : '매도'}
                        </span>
                        <span className={`${styles.tradePrice} ${isBuy ? styles.buy : styles.sell}`}>
                          ₩{trade.trade_price.toLocaleString()}
                        </span>
                        <span className={styles.tradeVolume}>{trade.trade_volume.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                <ErrorIcon size={32} color="var(--text-tertiary)" />
                <p>체결 데이터가 없습니다.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
