// pages/coin/[symbol].js
import CandleChartLW from '@/components/CandleChartLW';
import { BarChartIcon, ErrorIcon, HeartIcon } from '@/components/Icons';
import LottieLoadingBar from '@/components/LottieLoadingBar';
import styles from '@/styles/coinDetail.module.css';
import getTodayRecommendations from '@/utils/dailyRecommendations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoBarChartOutline, IoReceiptOutline } from 'react-icons/io5';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  const [upbitFearIndex, setUpbitFearIndex] = useState(null); // 업비트 커스텀 공포지수

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
        // API 프록시를 통해 요청 (직접 Upbit API 호출 금지)
        const res = await fetch('/api/all-markets');
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
    console.log('✅ Initial loadCoinData called');
    setInitialLoad(true);
    console.log('✅ setInitialLoad(true) called');

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
    console.log('🔍 Candle useEffect:', { initialLoad, symbol, candleType });
    if (!initialLoad || !symbol) {
      console.warn('⚠️ Skipping candles - initialLoad:', initialLoad, 'symbol:', symbol);
      return;
    }
    console.log('✅ Loading candles...');
    loadCandles();
  }, [candleType, initialLoad, symbol]);

  // 캔들 데이터 또는 호가 데이터 로드되면 공포지수 계산
  useEffect(() => {
    if (candleData && candleData.length > 0) {
      loadUpbitFearIndex();
    }
  }, [candleData, orderbook]);

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
          const timestamp = Math.floor(new Date(candle.candle_date_time_utc).getTime() / 1000);

          return {
            time: new Date(candle.candle_date_time_utc).toLocaleTimeString('ko-KR', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp,
            open: candle.opening_price,
            close: candle.trade_price,
            high: candle.high_price,
            low: candle.low_price,
            volume: candle.candle_acc_trade_volume,
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

      console.log('🔄 loadCoinData called:', { market, showLoadingIndicator, timestamp: new Date().toISOString() });

      // 1. Current price
      const tickerRes = await fetch(`/api/ticker?market=${market}`);
      console.log('📊 Ticker response status:', tickerRes.status);
      const tickerData = await tickerRes.json();
      console.log('📊 Ticker data:', tickerData);

      if (tickerData && tickerData.length > 0) {
        const ticker = tickerData[0];
        console.log('✅ Ticker data set successfully');
        setCoinData({
          symbol,
          price: ticker.trade_price,
          change: (ticker.signed_change_rate * 100).toFixed(2),
          high: ticker.high_price,
          low: ticker.low_price,
          volume: ticker.acc_trade_volume_24h,
          trade_price_24h: ticker.acc_trade_price_24h,
        });

        // 2. Orderbook (항상 로드)
        console.log('🟡 Attempting to fetch orderbook...');
        try {
          const orderbookRes = await fetch(`/api/orderbook?market=${market}`);
          console.log('📍 Orderbook response status:', orderbookRes.status);
          const orderbookData = await orderbookRes.json();
          console.log('📍 Orderbook data:', orderbookData);
          if (orderbookData && orderbookData.length > 0) {
            console.log('✅ Orderbook set successfully');
            setOrderbook(orderbookData[0]);
          } else {
            console.warn('⚠️ Orderbook data is empty or invalid:', orderbookData);
          }
        } catch (e) {
          console.error('❌ Orderbook error:', e.message, e);
        }

        // 3. Trades (항상 로드)
        console.log('🟡 Attempting to fetch trades...');
        try {
          const tradesRes = await fetch(`/api/trades?market=${market}&count=20`);
          console.log('📜 Trades response status:', tradesRes.status);
          const tradesData = await tradesRes.json();
          console.log('📜 Trades data:', tradesData);
          if (tradesData && tradesData.length > 0) {
            console.log('✅ Trades set successfully');
            setTrades(tradesData);
          } else {
            console.warn('⚠️ Trades data is empty or invalid:', tradesData);
          }
        } catch (e) {
          console.error('❌ Trades error:', e.message, e);
        }
      } else {
        console.warn('⚠️ Ticker data is empty or invalid:', tickerData);
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

  const loadUpbitFearIndex = async () => {
    try {
      // 촛대 데이터로 계산
      if (!candleData || candleData.length === 0) return;

      // 상승/하락 촛대 개수
      const upCandles = candleData.filter(c => c.close >= c.open).length;
      const downCandles = candleData.filter(c => c.close < c.open).length;
      const total = upCandles + downCandles;

      if (total === 0) return;

      // 1. 촛대 기반 공포지수 (하락 비율)
      let fearIndex = 100 * (downCandles / total);

      // 2. 변동성 조정 (24h 변동률 절대값)
      if (coinData?.signed_change_rate !== undefined) {
        const volatility = Math.abs(coinData.signed_change_rate);
        fearIndex = fearIndex * 0.6 + volatility * 100 * 0.4;
      }

      // 3. 호가 심리 조정 (매도/매수 잔량)
      if (orderbook && orderbook.orderbook_units && orderbook.orderbook_units.length > 0) {
        let askVolume = 0; // 매도
        let bidVolume = 0; // 매수

        orderbook.orderbook_units.forEach(unit => {
          askVolume += unit.ask_size || 0;
          bidVolume += unit.bid_size || 0;
        });

        if (askVolume + bidVolume > 0) {
          const askRatio = askVolume / (askVolume + bidVolume);
          fearIndex = fearIndex * 0.7 + (askRatio * 100) * 0.3;
        }
      }

      fearIndex = Math.min(100, Math.max(0, fearIndex));

      const getClassification = (value) => {
        if (value >= 75) return 'Extreme Fear';
        if (value >= 60) return 'Fear';
        if (value >= 40) return 'Neutral';
        if (value >= 25) return 'Greed';
        return 'Extreme Greed';
      };

      const getHumor = (classification) => {
        const humors = {
          'Extreme Fear': [
            '니 자동 손절 시스템 작동 중...',
            '존버? 뭐 하는 건데 그리고 싶지도 않으네',
            '손가락이 가려운 그런 날...',
            '이따 손절 쒀봤나? 나 쒀버렸어'
          ],
          'Fear': [
            '여기가 바닥 아닐까..? (아님)',
            '약한자는 탈락! 강자만 남는다 💪',
            '매수 기회? 아니 매도 기회?',
            '손절 이벤트 열렸습니다 🎉'
          ],
          'Neutral': [
            '중립이라고? 그럼 뭘 해요?',
            '어디가 정상 가격인지 아무도 모른다',
            '방향성? 그게 뭐죠?',
            '맞다고 했다가 틀린다'
          ],
          'Greed': [
            '달로 가자고 했잖아! 🚀',
            '이건 뜨는 거 맞다고 했는데?',
            '모두 환호할 준비는 되셨나요?',
            '천정? 자동으로 올라갑니다만?'
          ],
          'Extreme Greed': [
            '존버는 선택이 아닌 필수다 ✋',
            '손을 놓으면 지는 거다! 🤚',
            '월급날까지 기다려 내가 다시 들어간다',
            '이게 정상이 되는 날이 올거야'
          ]
        };

        const jokes = humors[classification] || ['뭔가 이상한데...?'];
        return jokes[Math.floor(Math.random() * jokes.length)];
      };

      setUpbitFearIndex({
        value: Math.round(fearIndex),
        classification: getClassification(fearIndex),
        humor: getHumor(getClassification(fearIndex)),
        upCandles,
        downCandles,
        upRatio: ((upCandles / total) * 100).toFixed(1),
        downRatio: ((downCandles / total) * 100).toFixed(1)
      });
    } catch (e) {
      console.error('Fear Index error:', e);
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

                {/* 체급 뱃지 (대형/중형/소형/스캠) */}
                {recommendations[symbol]?.category && (
                  <span style={{
                    background: recommendations[symbol].category.includes('대형') ? 'rgba(139, 127, 244, 0.2)' :
                      recommendations[symbol].category.includes('중형') ? 'rgba(59, 130, 246, 0.15)' :
                        recommendations[symbol].category.includes('스캠') ? '#000000' : 'var(--bg-tertiary)',
                    color: recommendations[symbol].category.includes('대형') ? '#8B7FF4' :
                      recommendations[symbol].category.includes('중형') ? '#60A5FA' :
                        recommendations[symbol].category.includes('스캠') ? '#FF4757' : 'var(--text-secondary)',
                    border: recommendations[symbol].category.includes('스캠') ? '1px solid #FF4757' : '1px solid var(--border-medium)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {recommendations[symbol].category}
                  </span>
                )}

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
        {recommendations[symbol]?.short_insight && (
          <div className={styles.shortInsight}>
            {recommendations[symbol].short_insight}
          </div>
        )}

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
        </div>
      )}

      {/*  업비트 커스텀 공포지수 섹션 */}
      {upbitFearIndex && (
        <div className={styles.fearIndexSection} style={{
          padding: '16px 24px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '800',
            margin: '0 0 12px 0',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            유탱 에겐지수 🥶
          </h3>
          <div style={{
            padding: '12px',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}>
            {/* 유머 멘트 */}
            {upbitFearIndex.humor && (
              <div style={{
                textAlign: 'center',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: '1.5',
                  display: 'block'
                }}>
                  "{upbitFearIndex.humor}"
                </span>
              </div>
            )}

            {/* 진행 바 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                flex: 1,
                height: '24px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div
                  style={{
                    height: '100%',
                    width: `${upbitFearIndex.value}%`,
                    background: upbitFearIndex.value >= 70 ? '#27AE60' :
                      upbitFearIndex.value >= 50 ? '#F39C12' :
                        upbitFearIndex.value >= 30 ? '#E74C3C' : '#8B0000',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span style={{
                fontSize: '18px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                minWidth: '45px',
                textAlign: 'center'
              }}>
                {upbitFearIndex.value}
              </span>
            </div>

            {/* 통계 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>상승봉</div>
                <div style={{ fontWeight: '700', color: '#0ECB81' }}>{upbitFearIndex.upCandles}개</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>하락봉</div>
                <div style={{ fontWeight: '700', color: '#F6465D' }}>{upbitFearIndex.downCandles}개</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>하락률</div>
                <div style={{ fontWeight: '700', color: '#FCD535' }}>{upbitFearIndex.downRatio}%</div>
              </div>
            </div>

            {/* 상태 설명 */}
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: upbitFearIndex.value >= 70 ? 'rgba(39, 174, 96, 0.1)' :
                upbitFearIndex.value >= 50 ? 'rgba(243, 156, 18, 0.1)' :
                  upbitFearIndex.value >= 30 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(139, 0, 0, 0.1)',
              border: `1px solid ${upbitFearIndex.value >= 70 ? 'rgba(39, 174, 96, 0.3)' :
                upbitFearIndex.value >= 50 ? 'rgba(243, 156, 18, 0.3)' :
                  upbitFearIndex.value >= 30 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(139, 0, 0, 0.3)'}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              {upbitFearIndex.value >= 70 ? '🟢 월급 전... 손 못 놨어 ✋' :
                upbitFearIndex.value >= 50 ? '🟠 그래 여기가 시작이지 🚀' :
                  upbitFearIndex.value >= 45 ? '🟡 뭘 해야 하는데?? 🤔' :
                    upbitFearIndex.value >= 25 ? '🔴 존버... 제발 🥺' :
                      '🔴 이건 뭐하는 건데 😅'}
            </div>
          </div>
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
            <CandleChartLW data={candleData} height={350} />
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
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#6366F1"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
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
                    <strong className={styles.tradesTotalAmount}>{trades.slice(0, 20).reduce((s, t) => s + Number(t.trade_volume || 0), 0).toFixed(4)}</strong>
                    <span className={styles.tradesTotalUnit}>개</span>
                  </div>
                  <div className={styles.tradesTotalKrw}>₩{trades.slice(0, 20).reduce((s, t) => s + (Number(t.trade_price || 0) * Number(t.trade_volume || 0)), 0).toLocaleString()}</div>
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
                          if (/^\d{6}$/.test(t)) return `${t.substr(0, 2)}:${t.substr(2, 2)}:${t.substr(4, 2)}`;
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