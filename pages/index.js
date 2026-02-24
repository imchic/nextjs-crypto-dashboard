import styles from '@/styles/dashboard.module.css';
//import RECOMMENDATION_REASONS from '@/utils/recommendReasons';
import getTodayRecommendations from '@/utils/dailyRecommendations';
import AIRDROP_COINS from '@/utils/airdropCoins';
import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';
import { IoBulbOutline, IoSearchOutline } from 'react-icons/io5';
import CoinDetailPanel from '@/components/CoinDetailPanel';
import { DashboardContext } from '@/components/Layout';
import { RocketIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, BarChartIcon, HeartIcon, FireIcon, ErrorIcon, BotIcon } from '@/components/Icons';
import LottieLoadingBar from '@/components/LottieLoadingBar';

export default function Dashboard() {
  const { setDashboardState } = useContext(DashboardContext);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('KRW');
  const [searchTerm, setSearchTerm] = useState('');
  const [group, setGroup] = useState('all');
  const [allMarkets, setAllMarkets] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allMarketsLoaded, setAllMarketsLoaded] = useState(() => {
    // sessionStorage에서 복원 (페이지 새로고침 시에도 유지)
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('allMarketsLoaded') === 'true';
    }
    return false;
  });
  const [btcPrice, setBtcPrice] = useState(0);
  const [usdtPrice, setUsdtPrice] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [toast, setToast] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [sortBy, setSortBy] = useState('volume'); // volume, price, name, change
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [recommendations, setRecommendations] = useState(() => getTodayRecommendations());

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

    // 최근 검색어 불러오기
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    
    // sessionStorage에서 전체종목 데이터 복원 (있으면)
    const savedAllMarkets = sessionStorage.getItem('allMarkets');
    if (savedAllMarkets) {
      try {
        const parsed = JSON.parse(savedAllMarkets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllMarkets(parsed);
          setAllMarketsLoaded(true);
        }
      } catch (e) {
        console.error('Failed to parse saved markets:', e);
      }
    }

    // 헤더 새로고침 버튼 핸들러 등록
    setDashboardState({
      timestamp: null,
      loading: false,
      onRefresh: () => {
        loadData(true);
        showToast('✅ 새로고침!');
      },
    });
  }, []);

  useEffect(() => {
    loadData();
    loadExchangeRates();
    // 페이지 진입 시 allMarkets 미리 로드
    loadAllMarkets();
    const interval = setInterval(() => {
      loadData(false); // 백그라운드 업데이트 (로딩 표시 안 함)
      loadExchangeRates();
    }, 5000); // 3초 → 5초로 변경 (좀 더 여유롭게)
    return () => clearInterval(interval);
  }, []);

  // 전체 종목 로드 (한 번만)
  useEffect(() => {
    if (group === 'all' && !allMarketsLoaded && !loadingAll) {
      loadAllMarkets();
    }
  }, [group, allMarketsLoaded, loadingAll]);

  // 매일 자정에 새 추천 로드
  useEffect(() => {
    const checkAndUpdateRecommendations = () => {
      const newRecommendations = getTodayRecommendations();
      setRecommendations(newRecommendations);
    };

    // 초기 로드
    checkAndUpdateRecommendations();

    // 자정마다 업데이트 (매일 00:00)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // 첫 번째 자정까지 대기
    const midnightTimer = setTimeout(() => {
      checkAndUpdateRecommendations();
      // 그 이후로는 매일 자정에 업데이트
      setInterval(checkAndUpdateRecommendations, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  const loadData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
        setDashboardState(prev => ({ ...prev, loading: true }));
      }
      const response = await fetch('/api/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
      const newTimestamp = new Date().toISOString();
      setLastUpdated(newTimestamp);
      setDashboardState(prev => ({ ...prev, timestamp: newTimestamp }));
      if (showLoadingIndicator) {
        setLoading(false);
        setDashboardState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (showLoadingIndicator) {
        setLoading(false);
        setDashboardState(prev => ({ ...prev, loading: false }));
      }
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

      // sessionStorage에 저장 (뒤로가기 시에도 유지)
      sessionStorage.setItem('allMarkets', JSON.stringify(markets));
      sessionStorage.setItem('allMarketsLoaded', 'true');

      setLastUpdated(new Date().toISOString());
      setLoadingAll(false);
    } catch (error) {
      console.error('Error loading all markets:', error);
      setLoadingAll(false);
      // 실패 시 일반 데이터 사용
      setAllMarkets([]);
    }
  };

  const handleCoinClick = (coin) => {
    // 무조건 상세페이지로 이동 (데스크탑에서도 모바일 뷰 사용)
    router.push(`/coin/${coin.symbol}`);
  };

  const addRecentSearch = (coin) => {
    const newSearches = [coin, ...recentSearches.filter(c => c.symbol !== coin.symbol)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const removeRecentSearch = (symbol) => {
    const newSearches = recentSearches.filter(c => c.symbol !== symbol);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const getDisplayCoins = () => {
    if (!data) return [];
    if (group === 'all') return allMarkets;
    if (group === 'volume') return data.by_volume || [];
    if (group === 'gainers') return data.by_change?.gainers || [];
    if (group === 'losers') return data.by_decline || [];
    if (group === 'recommended') {
      const allCoins = allMarkets.length > 0 ? allMarkets : (data.by_volume || []);
      return allCoins.filter(coin => recommendations[coin.symbol]);
    }
    if (group === 'favorites') {
      const allCoins = [...(allMarkets || []), ...(data.by_volume || []), ...(data.by_change?.gainers || []), ...(data.by_decline || [])];
      const uniqueCoins = allCoins.reduce((acc, coin) => {
        if (!acc.find(c => c.symbol === coin.symbol)) acc.push(coin);
        return acc;
      }, []);
      return uniqueCoins.filter(coin => favorites.includes(coin.symbol));
    }
    return [];
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      const allCoins = group === 'all' ? allMarkets : (data ? getDisplayCoins() : []);
      const results = allCoins
        .filter(coin =>
          coin.symbol.toLowerCase().includes(value.toLowerCase()) ||
          coin.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setAutocompleteResults(results);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
      setAutocompleteResults([]);
    }
  };

  const selectCoin = (coin) => {
    addRecentSearch(coin);
    setSearchTerm('');
    setShowAutocomplete(false);
    
    // 무조건 상세페이지로 이동
    router.push(`/coin/${coin.symbol}`);
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
          <LottieLoadingBar />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <ErrorIcon size={40} color="var(--danger-red)" />
          <p>망했습니다. 새로고침 해주세요.</p>
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
    // 추천 종목 = 배치 결과(recommendations)에 있는 코인들
    // 전체 코인(allMarkets) 중에서 recommendations에 있는 것만 필터링
    const allCoins = allMarkets.length > 0 ? allMarkets : (data.by_volume || []);
    
    coins = allCoins.filter(coin => recommendations[coin.symbol]);
    
    // 점수 높은 순으로 정렬
    coins.sort((a, b) => {
      const scoreA = recommendations[a.symbol]?.score || 0;
      const scoreB = recommendations[b.symbol]?.score || 0;
      return scoreB - scoreA;
    });
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

  // 정렬 적용
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'volume':
        compareValue = (a.volume || 0) - (b.volume || 0);
        break;
      case 'price':
        compareValue = (a.price || 0) - (b.price || 0);
        break;
      case 'name':
        compareValue = (a.name || '').localeCompare(b.name || '', 'ko-KR');
        break;
      case 'change':
        compareValue = (a.change || 0) - (b.change || 0);
        break;
      case 'score':
        // 추천 점수가 없는 코인은 0점으로 처리
        compareValue = (recommendations[a.symbol]?.score || 0) - (recommendations[b.symbol]?.score || 0);
        break;
      case 'category':
        // 카테고리 순서 정의 (대형주 > 중형주 > 소형주 > 스캠주의)
        const categoryOrder = {
          '👑 대형주': 4,
          '🏢 중형주': 3,
          '🪙 소형주': 2,
          '☠️ 스캠주의': 1,
        };
        const categoryA = recommendations[a.symbol]?.category || '🪙 소형주';
        const categoryB = recommendations[b.symbol]?.category || '🪙 소형주';
        compareValue = categoryOrder[categoryA] - categoryOrder[categoryB];
        break;
      case 'symbol':
        compareValue = (a.symbol || '').localeCompare(b.symbol || '');
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'desc' ? -compareValue : compareValue;
  });

  return (
    <div className={selectedCoin ? styles.splitLayout : styles.fullLayout}>
      {/* 좌측: 상세 정보 (선택된 경우에만) */}
      {selectedCoin && (
        <div className={styles.detailPanel}>
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div>
                <h2>{selectedCoin.name} <span className={styles.detailSymbol}>{selectedCoin.symbol}</span></h2>
                <div className={styles.detailPrice}>
                  ₩{selectedCoin.price?.toLocaleString()}
                </div>
              </div>
              <button 
                className={styles.closeDetail}
                onClick={() => setSelectedCoin(null)}
              >
                ✕
              </button>
            </div>
            <CoinDetailPanel coin={selectedCoin} />
          </div>
        </div>
      )}

      {/* 우측: 코인 목록 */}
      <div className={styles.listPanel}>
        <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        {/* 프로그레스바 */}
        {loading && <div className={styles.progressBar}><div className={styles.progressFill}></div></div>}

        {/* 검색바 */}
        <div className={styles.headerControls}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchBox}>
              <IoSearchOutline className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="코인 검색..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.length > 0 && setShowAutocomplete(true)}
                className={styles.searchInput}
              />

              {/* 자동완성 결과 */}
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className={styles.autocomplete}>
                  {autocompleteResults.map(coin => (
                    <div
                      key={coin.symbol}
                      className={styles.autocompleteItem}
                      onClick={() => selectCoin(coin)}
                    >
                      <span className={styles.autoSymbol}>{coin.name}</span>
                      <span className={styles.autoName}>{coin.symbol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 검색어 (검색창 아래) */}
            {recentSearches.length > 0 && searchTerm.length === 0 && (
              <div className={styles.recentSearchesWrapper}>
                <span className={styles.recentLabel}>최근 검색</span>
                <div className={styles.recentSearches}>
                  {recentSearches.map(coin => (
                    <div key={coin.symbol} className={styles.recentChip}>
                      <span onClick={() => selectCoin(coin)}>
                        {coin.name} ({coin.symbol})
                      </span>
                      <button
                        className={styles.removeChip}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(coin.symbol);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <span className={styles.tabLabel}>
              <FireIcon size={18} /> 핫한놈들
            </span>
            <span className={styles.tabDesc}>거래대금 Top10</span>
          </button>
          <button
            className={`${styles.groupTab} ${group === 'gainers' ? styles.active : ''}`}
            onClick={() => setGroup('gainers')}
          >
            <span className={styles.tabLabel}>
              <TrendingUpIcon size={18} /> 풀매수가즈아
            </span>
            <span className={styles.tabDesc}>급등주 추천</span>
          </button>
          <button
            className={`${styles.groupTab} ${group === 'losers' ? styles.active : ''}`}
            onClick={() => setGroup('losers')}
          >
            <span className={styles.tabLabel}>
              <TrendingDownIcon size={18} /> 존버가미래다
            </span>
            <span className={styles.tabDesc}>급락주 저가매수</span>
          </button>
          <button
            className={`${styles.groupTab} ${group === 'recommended' ? styles.active : ''}`}
            onClick={() => setGroup('recommended')}
          >
            <span className={styles.tabLabel}>
              <BotIcon size={18} /> AI추천
            </span>
            <span className={styles.tabDesc}>엄선 Top10</span>
          </button>
          <button
            className={`${styles.groupTab} ${group === 'favorites' ? styles.active : ''}`}
            onClick={() => setGroup('favorites')}
          >
            <span className={styles.tabLabel}>
              <HeartIcon size={18} /> 찜꽁
            </span>
            <span className={styles.tabDesc}>즐겨찾기 {favorites.length}개</span>
          </button>
          <button
            className={styles.groupTab}
            onClick={handlePortfolioClick}
          >
            <span className={styles.tabLabel}>
              <WalletIcon size={18} /> 내지갑
            </span>
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

      {/* 컬럼 헤더 (정렬 버튼) */}
      <div className={styles.columnHeaders}>
        <button 
          className={`${styles.sortBtn} ${sortBy === 'name' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'name') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('name');
              setSortOrder('asc');
            }
          }}
        >
          코인명 {sortBy === 'name' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>

        <button 
          className={`${styles.sortBtn} ${sortBy === 'score' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'score') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('score');
              setSortOrder('desc');
            }
          }}
        >
          점수 {sortBy === 'score' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>

        <button 
          className={`${styles.sortBtn} ${sortBy === 'category' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'category') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('category');
              setSortOrder('desc');
            }
          }}
        >
          코인형태 {sortBy === 'category' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>

        <button 
          className={`${styles.sortBtn} ${sortBy === 'change' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'change') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('change');
              setSortOrder('desc');
            }
          }}
        >
          수익률 {sortBy === 'change' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>

        <button 
          className={`${styles.sortBtn} ${sortBy === 'price' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'price') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('price');
              setSortOrder('desc');
            }
          }}
        >
          {unit === 'KRW' ? '현재가 (원)' : unit === 'BTC' ? '현재가 (BTC)' : '현재가 ($)'} {sortBy === 'price' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>

        <button 
          className={`${styles.sortBtn} ${sortBy === 'volume' ? styles.active : ''}`}
          onClick={() => {
            if (sortBy === 'volume') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('volume');
              setSortOrder('desc');
            }
          }}
        >
          거래량 {sortBy === 'volume' && <span className={`${styles.sortArrow} ${sortOrder === 'asc' ? styles.asc : styles.desc}`}>{'▲'}</span>}
        </button>
      </div>

      {/* 돌돌이픽 설명 */}
      {group === 'recommended' && (
        <div className={styles.pickExplanation}>
          <div className={styles.pickIcon}>
            <IoBulbOutline />
          </div>
          <div className={styles.pickText}>
            <strong>AI 추천 코인 | 투자는 본인 책임입니다</strong>
            <p>실시간 시장 데이터를 분석하여 거래량, 변동성, 수익 잠재력을 종합 평가한 코인을 선별했습니다. 각 코인의 투자 유형과 리스크를 확인하고 신중히 판단하세요.</p>
          </div>
        </div>
      )}

      {/* 코인 리스트 */}
      <div className={styles.coinsList}>
        {loadingAll ? (
          <div className={styles.loading}>
            <LottieLoadingBar />
          </div>
        ) : sortedCoins.length > 0 ? (
          sortedCoins.map((coin, index) => {
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
                onClick={() => handleCoinClick(coin)}
              >
                <div className={styles.coinInfo}>
                  <div className={`${styles.coinMark} ${index < 3 ? styles.medal : styles.rank}`}>
                    {rankDisplay}
                  </div>
                  <div className={styles.coinDetails}>
                    <div className={styles.coinNameRow}>
                      <span className={styles.coinSymbol}>{coin.name}</span>
                      <span className={styles.coinName}>{coin.symbol}</span>
                      {coin.isNew && (
                        <span className={styles.badge} data-type="new">NEW</span>
                      )}
                      {coin.marketWarning === 'CAUTION' && (
                        <span className={styles.badge} data-type="caution">유의</span>
                      )}
                    </div>
                    {recommendations[coin.symbol] && (
                      <div className={styles.recommendBox}>
                        <div className={styles.recommendReason}>
                          💡 {recommendations[coin.symbol]?.reason}
                        </div>
                        <div className={styles.recommendMeta}>
                          {/* 점수 뱃지 */}
                          <span className={styles.recommendScore} style={{ 
                            background: (recommendations[coin.symbol]?.score || 0) >= 80 ? 'rgba(255, 215, 0, 0.1)' : 'var(--bg-tertiary)',
                            color: (recommendations[coin.symbol]?.score || 0) >= 80 ? '#FFD700' : 'var(--text-secondary)',
                            border: (recommendations[coin.symbol]?.score || 0) >= 80 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid var(--border-medium)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginRight: '6px'
                          }}>
                            🏆 {recommendations[coin.symbol]?.score || 0}점
                          </span>

                          {/* 체급 뱃지 추가 */}
                          {recommendations[coin.symbol]?.category && (
                            <span style={{ 
                              background: recommendations[coin.symbol].category.includes('대형') ? 'rgba(139, 127, 244, 0.15)' : 
                                         recommendations[coin.symbol].category.includes('중형') ? 'rgba(59, 130, 246, 0.1)' :
                                         recommendations[coin.symbol].category.includes('스캠') ? '#000000' : 'var(--bg-tertiary)',
                              color: recommendations[coin.symbol].category.includes('대형') ? '#8B7FF4' : 
                                     recommendations[coin.symbol].category.includes('중형') ? '#60A5FA' :
                                     recommendations[coin.symbol].category.includes('스캠') ? '#FF4757' : 'var(--text-secondary)',
                              border: recommendations[coin.symbol].category.includes('스캠') ? '1px solid #FF4757' : '1px solid var(--border-medium)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              marginRight: '6px'
                            }}>
                              {recommendations[coin.symbol].category}
                            </span>
                          )}
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
                        const btn = e.currentTarget;
                        if (btn) {
                          btn.classList.add(styles.animate);
                          setTimeout(() => {
                            if (btn) btn.classList.remove(styles.animate);
                          }, 600);
                        }
                        toggleFavorite(coin.symbol);
                      }}
                    >
                      <HeartIcon 
                        size={18} 
                        filled={favorites.includes(coin.symbol)}
                        color={favorites.includes(coin.symbol) ? '#FF4757' : 'currentColor'}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>🔍</div>
              <div className={styles.emptyText}>
                {group === 'favorites' ? (
                  <>
                    <strong>즐겨찾기한 코인이 없습니다</strong>
                    <p>💕  버튼을 눌러 관심 코인을 추가하세요</p>
                  </>
                ) : searchTerm ? (
                  <>
                    <strong>"{searchTerm}" 검색 결과가 없습니다</strong>
                    <p>다른 코인명이나 심볼로 검색해보세요</p>
                  </>
                ) : (
                  <>
                    <strong>표시할 코인이 없습니다</strong>
                    <p>다른 탭을 선택하거나 전체 종목을 확인하세요</p>
                  </>
                )}
              </div>
            </div>
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
      </div>
    </div>
  );
}

