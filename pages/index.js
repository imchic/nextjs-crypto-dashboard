import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/dashboard.module.css';
import { IoSearchOutline, IoRefreshOutline, IoTrendingUpOutline, IoTrendingDownOutline } from 'react-icons/io5';
import { FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import RECOMMENDATION_REASONS from '@/utils/recommendReasons';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('KRW');
  const [searchTerm, setSearchTerm] = useState('');
  const [group, setGroup] = useState('all');
  const [allMarkets, setAllMarkets] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allMarketsLoaded, setAllMarketsLoaded] = useState(false);
  const [btcPrice, setBtcPrice] = useState(0);
  const [usdtPrice, setUsdtPrice] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    // LocalStorage에서 즐겨찾기 불러오기
    const savedFavorites = localStorage.getItem('coinFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    loadData();
    loadExchangeRates();
    const interval = setInterval(() => {
      loadData();
      loadExchangeRates();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 전체 종목 로드 (한 번만)
  useEffect(() => {
    if (group === 'all' && !allMarketsLoaded && !loadingAll) {
      loadAllMarkets();
    }
  }, [group]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/crypto_dashboard.json');
      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date().toISOString());
      setLoading(false);
      showToast('✅ 데이터 업데이트 완료!');
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      showToast('❌ 업데이트 실패');
    }
  };

  const loadExchangeRates = async () => {
    try {
      const response = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-USDT');
      const data = await response.json();
      
      const btc = data.find(t => t.market === 'KRW-BTC');
      const usdt = data.find(t => t.market === 'KRW-USDT');
      
      if (btc) setBtcPrice(btc.trade_price);
      if (usdt) setUsdtPrice(usdt.trade_price);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
  };

  const loadAllMarkets = async () => {
    if (loadingAll || allMarketsLoaded) return; // 중복 방지
    
    try {
      setLoadingAll(true);
      console.log('Loading all markets...');
      const response = await fetch('/api/all-markets', {
        signal: AbortSignal.timeout(10000) // 10초 타임아웃
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const markets = await response.json();
      console.log('All markets loaded:', markets.length);
      setAllMarkets(markets);
      setAllMarketsLoaded(true);
      setLastUpdated(new Date().toISOString());
      setLoadingAll(false);
    } catch (error) {
      console.error('Error loading all markets:', error);
      setLoadingAll(false);
      // 실패 시 일반 데이터 사용
      setAllMarkets([]);
    }
  };

  const handleCoinClick = (symbol) => {
    router.push(`/coin/${symbol}`);
  };

  const handlePortfolioClick = () => {
    router.push('/portfolio');
  };

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      let newFavorites;
      if (prev.includes(symbol)) {
        newFavorites = prev.filter(s => s !== symbol);
      } else {
        newFavorites = [...prev, symbol];
      }
      localStorage.setItem('coinFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Loading...';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '0';
    
    if (unit === 'KRW') {
      return price.toLocaleString('ko-KR');
    } else if (unit === 'BTC') {
      if (!btcPrice || btcPrice === 0) return '...';
      const btcValue = price / btcPrice;
      return btcValue.toFixed(8);
    } else if (unit === 'USDT') {
      if (!usdtPrice || usdtPrice === 0) return '...';
      const usdtValue = price / usdtPrice;
      return usdtValue.toFixed(2);
    }
    return price.toLocaleString('ko-KR');
  };

  // 금액을 한글로 표현 (1억, 1천만 등)
  const formatPriceKorean = (price) => {
    if (price === 0) return '0원';
    
    const units = [
      { value: 1000000000, label: '억' },
      { value: 100000000, label: '억' },
      { value: 10000000, label: '천만' },
      { value: 1000000, label: '백만' },
      { value: 100000, label: '십만' },
      { value: 10000, label: '만' },
      { value: 1000, label: '천' },
    ];

    for (let unit of units) {
      if (price >= unit.value) {
        const quotient = (price / unit.value).toFixed(1);
        return `${quotient}${unit.label}`;
      }
    }
    
    return `${price.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>코인 불러오는 중... 🚀</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>망했습니다 😭 새로고침 ㄱㄱ</p>
        </div>
      </div>
    );
  }

  const { stats, timestamp: dataTimestamp, groups } = data;
  
  // 그룹 매핑 처리
  let coins = [];
  if (group === 'all') {
    coins = allMarkets;
  } else if (group === 'volume') {
    coins = data.by_volume || [];
  } else if (group === 'gainers') {
    coins = data.by_change?.gainers || [];
  } else if (group === 'losers') {
    coins = data.by_decline || [];
  } else if (group === 'recommended') {
    // 추천 종목 = 거래량 상위 10개
    coins = data.by_volume?.slice(0, 10) || [];
  } else if (group === 'favorites') {
    // 즐겨찾기 - 모든 코인 데이터에서 찾기 (중복 제거)
    const allCoins = [...(allMarkets || []), ...(data.by_volume || []), ...(data.by_change?.gainers || []), ...(data.by_decline || [])];
    
    // symbol 기준으로 중복 제거
    const uniqueCoins = allCoins.reduce((acc, coin) => {
      if (!acc.find(c => c.symbol === coin.symbol)) {
        acc.push(coin);
      }
      return acc;
    }, []);
    
    coins = uniqueCoins.filter(coin => favorites.includes(coin.symbol));
  }
  
  const filteredCoins = coins.filter(coin => 
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coin.name && coin.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>백만원만 넣어</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.timestamp}>{formatTime(lastUpdated)}</div>
            <button 
              className={`${styles.refreshBtn} ${loading ? styles.loading : ''}`} 
              onClick={loadData}
              disabled={loading}
            >
              <IoRefreshOutline size={16} className={loading ? styles.spin : ''} />
            </button>
          </div>
        </div>
        
        {/* 프로그레스바 */}
        {loading && <div className={styles.progressBar}><div className={styles.progressFill}></div></div>}

        {/* 검색바 */}
        <div className={styles.headerControls}>
          <div className={styles.searchBox}>
            <IoSearchOutline className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="코인 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* 그룹 탭 */}
        <div className={styles.groupTabs}>
          <button 
            className={`${styles.groupTab} ${group === 'all' ? styles.active : ''}`} 
            onClick={() => setGroup('all')}
          >
            <span className={styles.tabLabel}>📋 전체종목</span>
            <span className={styles.tabDesc}>업비트 전체</span>
          </button>
          <button 
            className={`${styles.groupTab} ${group === 'volume' ? styles.active : ''}`} 
            onClick={() => setGroup('volume')}
          >
            <span className={styles.tabLabel}>🔥 핫한놈들</span>
            <span className={styles.tabDesc}>거래대금 Top10</span>
          </button>
          <button 
            className={`${styles.groupTab} ${group === 'gainers' ? styles.active : ''}`} 
            onClick={() => setGroup('gainers')}
          >
            <span className={styles.tabLabel}>🚀 풀매수가즈아</span>
            <span className={styles.tabDesc}>급등주 추천</span>
          </button>
          <button 
            className={`${styles.groupTab} ${group === 'losers' ? styles.active : ''}`} 
            onClick={() => setGroup('losers')}
          >
            <span className={styles.tabLabel}>😭 존버가미래다</span>
            <span className={styles.tabDesc}>급락주 저가매수</span>
          </button>
          <button 
            className={`${styles.groupTab} ${group === 'recommended' ? styles.active : ''}`} 
            onClick={() => setGroup('recommended')}
          >
            <span className={styles.tabLabel}>🌙 돌돌이픽</span>
            <span className={styles.tabDesc}>엄선 Top10</span>
          </button>
          <button 
            className={`${styles.groupTab} ${group === 'favorites' ? styles.active : ''}`} 
            onClick={() => setGroup('favorites')}
          >
            <span className={styles.tabLabel}>⭐ 찜꽁</span>
            <span className={styles.tabDesc}>즐겨찾기 {favorites.length}개</span>
          </button>
          <button 
            className={styles.groupTab}
            onClick={handlePortfolioClick}
          >
            <span className={styles.tabLabel}>💰 내지갑</span>
            <span className={styles.tabDesc}>포트폴리오</span>
          </button>
        </div>

        {/* 단위 선택 */}
        <div className={styles.unitTabs}>
          <button className={`${styles.unitTab} ${unit === 'KRW' ? styles.active : ''}`} onClick={() => setUnit('KRW')}>
            원화
          </button>
          <button className={`${styles.unitTab} ${unit === 'BTC' ? styles.active : ''}`} onClick={() => setUnit('BTC')}>
            BTC
          </button>
          <button className={`${styles.unitTab} ${unit === 'USDT' ? styles.active : ''}`} onClick={() => setUnit('USDT')}>
            $ 달러
          </button>
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className={styles.columnHeaders}>
        <div className={styles.colSymbol}>코인명</div>
        <div className={styles.colChange}>수익률</div>
        <div className={styles.colPrice}>
          {unit === 'KRW' ? '현재가 (원)' : unit === 'BTC' ? '현재가 (BTC)' : '현재가 ($)'}
        </div>
        <div className={styles.colVolume}>거래량</div>
      </div>

      {/* 코인 리스트 */}
      <div className={styles.coinsList}>
        {loadingAll ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>전체 종목 불러오는 중... 🚀</p>
          </div>
        ) : filteredCoins.length > 0 ? (
          filteredCoins.map((coin, index) => {
            // 순위 표시 로직
            let rankDisplay;
            if (index === 0) {
              rankDisplay = '🥇';
            } else if (index === 1) {
              rankDisplay = '🥈';
            } else if (index === 2) {
              rankDisplay = '🥉';
            } else {
              rankDisplay = (index + 1).toString();
            }

            return (
            <div 
              key={coin.symbol} 
              className={styles.coinRow}
              onClick={() => handleCoinClick(coin.symbol)}
            >
              <div className={styles.coinInfo}>
                <div className={`${styles.coinMark} ${index < 3 ? styles.medal : styles.rank}`}>
                  {rankDisplay}
                </div>
                <div className={styles.coinDetails}>
                  <div className={styles.coinSymbol}>{coin.name}</div>
                  <div className={styles.coinName}>{coin.symbol}</div>
                  {RECOMMENDATION_REASONS[coin.symbol] && (
                    <div className={styles.recommendBox}>
                      <div className={styles.recommendReason}>
                        💡 {RECOMMENDATION_REASONS[coin.symbol].reason}
                      </div>
                      <div className={styles.recommendMeta}>
                        <span className={styles.recommendType}>
                          {RECOMMENDATION_REASONS[coin.symbol].type}
                        </span>
                        <span className={styles.recommendRisk}>
                          {RECOMMENDATION_REASONS[coin.symbol].risk}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.colChange}>
                <div className={`${styles.changeValue} ${parseFloat(coin.change) > 0 ? styles.positive : styles.negative}`}>
                  {parseFloat(coin.change) > 0 ? '+' : ''}{parseFloat(coin.change).toFixed(2)}%
                </div>
              </div>

              <div className={styles.colPrice}>
                {unit === 'KRW' && '₩'}
                {unit === 'USDT' && '$'}
                {formatPrice(coin.price)}
                {unit === 'BTC' && ' BTC'}
              </div>

              <div className={styles.colVolume}>
                <div className={styles.volumeContent}>
                  <span>{formatPriceKorean(coin.volume)}</span>
                  <button 
                    className={`${styles.favoriteBtn} ${favorites.includes(coin.symbol) ? styles.active : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(coin.symbol);
                    }}
                  >
                    {favorites.includes(coin.symbol) ? '찜꽁' : '찜'}
                  </button>
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <div className={styles.empty}>
            {group === 'favorites' ? '⭐ 즐겨찾기한 코인이 없습니다. 별 버튼을 눌러 추가하세요!' : '😢 그런 코인은 없습니다...'}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className={styles.footer}>
        🌙 돌돌이 코인갤러리 | 투자는 본인 책임입니다
      </div>

      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  );
}

