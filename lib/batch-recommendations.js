#!/usr/bin/env node

/**
 * Daily Recommendation Batch Script
 * 매일 실행: 암호화폐 시장 데이터 분석 → 추천 생성
 */

const fs = require('fs');
const path = require('path');

// 코인 특징 데이터베이스 (Knowledge Base)
// 구성: 주요 코인들의 수동 작성 설명
// 나머지 코인들은 CoinGecko API에서 동적으로 로드됨
// short_insight는 매일 배치 실행 시 설명의 첫 문장으로 자동 생성됨
const COIN_DESCRIPTIONS = {
  'BTC': {
    description: '1. 👑 디지털 금으로 불리는 최초의 암호화폐예요!\n2. 🚀 가장 높은 시가총액과 안정성을 자랑하고 있어요!\n3. 📈 시장의 큰 흐름을 이끌어가는 기축 통화 역할을 한답니다.'
  },
  'ETH': {
    description: '1. ✨ 스마트 컨트랙트 플랫폼의 대장주로 활약 중이에요!\n2. 🌐 DeFi, NFT 등 다양한 블록체인 생태계의 기반을 다졌어요.\n3. 🛠️ 덴쿤 업그레이드 등 꾸준히 발전하며 기대감을 높이고 있답니다.',
  },
  'XRP': {
    description: '1. 🏦 금융기관 간 초고속 송금을 위해 태어난 코인이에요!\n2. ⚡️ 빠른 전송 속도와 저렴한 수수료가 큰 장점이죠.\n3. ⚖️ SEC 소송 리스크를 털고 새로운 시작을 준비했어요! (스테이블코인 출시 예정!)',
  },
  'SOL': {
    description: '1. 🏎️ 이더리움 대항마로 불리는 엄청나게 빠른 블록체인이에요!\n2. 🔥 밈코인 열풍과 함께 커뮤니티 화력이 대단하답니다.\n3. 🛠️ 네트워크 안정성 개선과 모바일 생태계 확장에 힘쓰고 있어요.',
  },
  'DOGE': {
    description: '1. 🐕 인터넷 밈에서 시작해 전 세계를 뒤흔든 대표 밈코인이에요!\n2. 🚀 일론 머스크의 든든한 지지를 받으며 유명해졌어요.\n3. 💰 "X" 결제 시스템 도입 기대감으로 늘 주목받고 있답니다.',
  },
  'SHIB': {
    description: '1. 🐶 도지코인 킬러를 꿈꾸며 등장한 귀여운 밈코인이에요!\n2. 🏗️ 시바리움(L2) 출시로 단순 밈을 넘어 생태계를 넓히고 있어요.\n3. 🔥 대규모 소각으로 희소성을 높이려는 노력을 하고 있답니다.',
  },
  'AVAX': {
    description: '1. 🏔️ 빠른 처리 속도를 자랑하는 강력한 레이어1 플랫폼이에요!\n2. 🧩 서브넷 기술로 나만의 맞춤형 블록체인을 만들 수 있어요.\n3. 🤝 시티은행 등 전통 금융권과의 파트너십으로 주목받고 있답니다.',
  },
  'ADA': {
    description: '1. 📚 학술적 연구를 기반으로 탄탄하게 만들어진 3세대 블록체인이에요!\n2. 🛡️ 매우 높은 보안성과 확장성을 목표로 차근차근 나아가고 있어요.\n3. 🗳️ 탈중앙화된 거버넌스 시스템으로 함께 만들어가는 코인이랍니다.',
  },
  'NEAR': {
    description: '1. 🌟 사용자 친화적인 디자인으로 누구나 쉽게 쓸 수 있는 블록체인이에요!\n2. 🚀 샤딩 기술로 무한한 확장성을 꿈꾸고 있답니다.\n3. 🤝 AI와 블록체인의 미래 융합 기술 개발에 집중하고 있어요.',
  },
  'APT': {
    description: '1. 💻 메타(구 페이스북) 출신 개발진이 만든 Move 언어 기반 체인이에요!\n2. ⚡️ Move 언어 기반으로 빠르고 안정적인 트랜잭션을 자랑해요.\n3. 🇰🇷 한국 시장 및 국내 게임사들과 활발한 파트너십을 맺고 있답니다.',
  },
  'SUI': {
    description: '1. 🌊 객체 지향 데이터 모델로 초고속 병렬 처리가 가능한 레이어1이에요!\n2. 🎮 낮은 지연 시간으로 게임과 DeFi에 최적화된 환경을 제공해요.\n3. 🚀 자체 게임기 출시와 대규모 생태계 펀드 조성으로 기대감이 커요.',
  },
  'SEI': {
    description: '1. 📈 트레이딩에 특화된 초고속 오더북 내장 블록체인이에요!\n2. ⚙️ 병렬 처리 기술(v2) 도입으로 EVM 호환성을 확보하며 발전 중이에요.\n3. 🚀 나스닥급 체결 속도를 목표로 디파이 시장을 혁신하고 있답니다.',
  },
  'MATIC': {
    description: '1. 🌉 폴리곤(Polygon)으로 리브랜딩된 이더리움 확장 솔루션이에요!\n2. 🌟 POL 토큰 마이그레이션과 ZK 롤업 기술 도입으로 기대감이 높아요.\n3. 🤝 스타벅스, 나이키 등 대기업 웹3 프로젝트의 선택을 받았어요.',
  },
  'ARB': {
    description: '1. ⚡️ 이더리움 보안을 계승하면서 속도를 확 끌어올린 레이어2 대장이에요!\n2. 💰 레이어2 중 가장 많은 예치금(TVL)과 활성 사용자를 보유하고 있답니다.\n3. 🎮 게임(Xai) 및 디파이 생태계가 매우 활발하게 성장하고 있어요.',
  },
  'OP': {
    description: '1. 🔴 옵티미스틱 롤업 기술을 활용하는 이더리움 레이어2 솔루션이에요!\n2. 🤝 "슈퍼체인" 비전 아래 코인베이스(Base)와 같은 대형 프로젝트들과 손잡았어요.\n3. 🎁 레트로PGF를 통해 생태계 기여자들에게 꾸준히 보상을 지급하고 있답니다.',
  },
  'LINK': {
    description: '1. 🔗 블록체인과 외부 세상의 데이터를 연결해주는 오라클 1등 주자예요!\n2. 🔒 디파이(DeFi) 생태계의 "신뢰"를 담당하는 필수 인프라랍니다.\n3. 🏦 SWIFT 등 전통 금융기관과의 협업으로 주목받고 있어요.',
  },
  'ETC': {
    description: '1. 🌳 "코드는 법이다" 철학을 고수하는 이더리움의 원조 체인이에요!\n2. ⛏️ 작업 증명(PoW) 방식을 지지하는 채굴자 커뮤니티가 든든해요.\n3. 📆 곧 다가올 반감기 이슈로 채산성 변화에 관심이 쏠리고 있어요.',
  },
  'BCH': {
    description: '1. 💰 비트코인의 블록 크기 문제를 해결하고자 하드포크한 코인이에요!\n2. ⚡️ 실생활 결제에 최적화된 빠른 전송 속도와 저렴한 수수료를 강조해요.\n3. 🔄 반감기 완료 및 업그레이드로 스마트 기능 도입을 시도하고 있답니다.',
  },
  'STX': {
    description: '1. ₿ 비트코인 네트워크 위에서 스마트 컨트랙트를 구동하는 특별한 코인이에요!\n2. 🌉 비트코인 레이어2 대장주로서 입지를 굳건히 하고 있어요.\n3. 🚀 나카모토 업그레이드로 전송 속도가 획기적으로 빨라질 예정이랍니다.',
  },
  'TRX': {
    description: '1. 🎬 엔터테인먼트 산업에 특화된 콘텐츠 공유 블록체인이에요!\n2. 💨 매우 빠른 처리량과 거의 없는 수수료가 매력적이에요.\n3. 💸 USDT 전송에 가장 많이 사용되는 네트워크 중 하나랍니다.',
  },
  'SAND': {
    description: '1. 🏞️ 더 샌드박스 메타버스 안에서 쓰이는 핵심 유틸리티 토큰이에요!\n2. 🎨 사용자들이 직접 게임과 아이템을 만들고 돈을 벌 수 있어요.\n3. 🌐 사우디 등 여러 국가와 대형 IP 파트너십으로 미래가 기대돼요.',
  },
  'MANA': {
    description: '1. 🎮 최초의 3D 가상현실 플랫폼 디센트럴랜드의 화폐예요!\n2. 🏘️ 가상 부동산(LAND) 거래와 브랜드 입점 활발\n3. 📈 VR/AR 기술 발전에 따라 메타버스 시장과 함께 주목받고 있어요.',
  },
  'WLD': {
    description: '1. 👁️ 홍채 인식을 통해 "진짜 사람"임을 증명하는 혁신적인 프로젝트예요!\n2. 🤖 샘 알트만(OpenAI)의 참여로 AI 테마와 깊이 연관되어 있어요.\n3. 💸 보편적 기본소득(UBI) 실험과 개인정보 보호 이슈가 공존한답니다.',
  },
  'ID': {
    description: '1. 🆔 웹3 시대의 "신분증" 역할을 하는 도메인 관리 플랫폼이에요!\n2. 🔗 여러 블록체인(bnb, arb 등)의 도메인을 한곳에서 관리할 수 있어요.\n3. 🚀 바이낸스 랩스 투자와 파트너십 확장으로 빠르게 성장하고 있답니다.',
  },
  'ENS': {
    description: '1. 🏷️ 복잡한 이더리움 지갑 주소를 "dolpick.eth"처럼 쉽게 바꿔줘요!\n2. 🌟 비탈릭 부테린도 극찬한 이더리움 기반의 대표적인 비금융 앱이에요.\n3. 📈 레이어2 지원과 웹사이트 호스팅 기능까지 확장하고 있답니다.',
  },
  'FLOW': {
    description: '1. 🎨 차세대 게임, 앱, 디지털 자산을 위한 개발자 친화적인 블록체인이에요!\n2. 🏀 NBA Top Shot 같은 굵직한 NFT 프로젝트들을 성공적으로 배출했어요.\n3. ⚙️ 크레센도 업그레이드를 통해 더욱 완벽한 탈중앙화를 목표로 하고 있어요.',
  },
  'PUNDIX': {
    description: '1. 💳 실제 상점에서 암호화폐 결제를 가능하게 하는 솔루션이에요!\n2. 🌍 전 세계 POS 단말기 보급으로 암호화폐 대중화에 기여하고 있답니다.\n3. 🤝 다양한 파트너십을 통해 생태계를 넓히고 있어요.',
  },
  'HUNT': {
    description: '1. 🌐 블록체인 기반의 웹3 게이미피케이션 플랫폼이에요!\n2. 🎮 "NFT 보물찾기" 같은 재미있는 서비스를 제공하고 있어요.\n3. 🚀 커뮤니티 주도형 프로젝트로 활발한 활동을 이어가고 있답니다.',
  },
};

// 분석 엔진
class RecommendationBatch {
  constructor() {
    this.today = new Date().toISOString().split('T')[0];
    this.recommendations = {};
  }

  // CoinGecko 코인 목록 조회
  async fetchCoinGeckoList() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
      if (!response.ok) {
        console.warn(`⚠️ CoinGecko 리스트 API 에러: ${response.status}`);
        return {};
      }
      const list = await response.json();

      const map = {};
      list.forEach(coin => {
        if (coin.symbol) {
          // 소문자로 저장 (Upbit은 대문자, CoinGecko는 소문자)
          map[coin.symbol.toUpperCase()] = coin.id;
        }
      });
      console.log(`  ℹ️ CoinGecko 리스트: ${list.length}개 코인 로드`);
      return map;
    } catch (e) {
      console.warn('⚠️ CoinGecko 리스트 로드 실패:', e.message);
      return {};
    }
  }

  // CoinGecko에서 코인 설명 가져오기
  async fetchCoinGeckoDescription(coinId) {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.description?.en || null;
    } catch (e) {
      return null;
    }
  }

  // 실제 Upbit API 데이터 수집
  async fetchMarketData() {
    console.log('📊 시장 데이터 수집 중 (Upbit API)...');

    try {
      // 1. 모든 KRW 마켓 조회
      const marketRes = await fetch('https://api.upbit.com/v1/market/all?isDetails=false');
      if (!marketRes.ok) throw new Error(`Market fetch failed: ${marketRes.status}`);

      const markets = await marketRes.json();
      const krwMarkets = markets
        .filter(m => m.market.startsWith('KRW-'))
        .map(m => m.market);

      console.log(`✅ KRW 마켓 발견: ${krwMarkets.length}개`);

      // 2. 티커 조회 (최대 100개씩)
      // Upbit API 제한 고려하여 100개씩 끊어서 요청 (전체 코인 조회)
      const marketData = {};
      const BATCH_SIZE = 100;

      for (let i = 0; i < krwMarkets.length; i += BATCH_SIZE) {
        const batchTargets = krwMarkets.slice(i, i + BATCH_SIZE);
        console.log(`📦 배치 요청 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(krwMarkets.length / BATCH_SIZE)} (${batchTargets.length}개)...`);

        const tickerRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${batchTargets.join(',')}`);
        if (!tickerRes.ok) {
          console.error(`Ticker fetch failed for batch ${i}: ${tickerRes.status}`);
          continue;
        }

        const tickers = await tickerRes.json();

        // 데이터 변환 및 병합
        tickers.forEach(t => {
          const symbol = t.market.replace('KRW-', '');
          const change = ((t.trade_price - t.opening_price) / t.opening_price) * 100;

          let trend = 'stable';
          if (change >= 5) trend = 'up_strong';
          else if (change > 0) trend = 'up';
          else if (change <= -5) trend = 'down_strong';
          else if (change < 0) trend = 'down';

          marketData[symbol] = {
            change: parseFloat(change.toFixed(2)),
            volume: t.acc_trade_price_24h,
            price: t.trade_price,
            trend: trend
          };
        });

        // API 속도 제한 준수 (잠시 대기)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return marketData;
    } catch (error) {
      console.error('❌ 데이터 수집 실패:', error);
      return {};
    }
  }

  // 분석 알고리즘
  analyzeAndRecommend(marketData, coinDescriptions = {}) {
    console.log('🔍 시장 분석 중...');

    const recommendations = {};

    for (const [symbol, data] of Object.entries(marketData)) {
      // 점수 계산 (0-100)
      let score = 50; // 기본값
      let reason = '';
      let type = '';
      let risk = '';

      // 변동률 분석 (0-40점)
      if (data.change > 10) {
        score += 30;
        reason = `🚀 급상승 중 (+${data.change.toFixed(1)}%)`;
      } else if (data.change > 5) {
        score += 20;
        reason = `📈 상승 중 (+${data.change.toFixed(1)}%)`;
      } else if (data.change > 0) {
        score += 10;
        reason = `➡️ 소폭 상승 (+${data.change.toFixed(1)}%)`;
      } else {
        score -= 10;
        reason = `📉 하락세 (${data.change.toFixed(1)}%)`;
      }

      // 거래량 분석 (0-30점)
      if (data.volume > 1000000000) {
        score += 20;
        reason += ' • 거래량 폭증';
      } else if (data.volume > 500000000) {
        score += 10;
        reason += ' • 거래량 증가';
      }

      // 추세 분석 (0-30점)
      if (data.trend === 'up_strong') {
        score += 20;
        type = '🚀 대박노리기';
        risk = '🔴 높음';
      } else if (data.trend === 'up') {
        score += 10;
        type = '💰 월급벌기';
        risk = '🟡 중간';
      } else {
        type = '🍚 밥값벌기';
        risk = '🟢 낮음';
      }

      // 점수 정규화 (0-100)
      score = Math.min(100, score);
      score = Math.max(0, score);

      // 코인 체급 분류 (대형/중형/소형/스캠주의)
      let category = '🪙 소형주';
      // 1. 대형주 정의 (BTC, ETH 및 거래대금 최상위)
      if (['BTC', 'ETH', 'XRP', 'SOL'].includes(symbol)) {
        category = '👑 대형주';
      }
      // 2. 중형주 (거래대금 500억 이상)
      else if (data.volume > 50000000000) {
        category = '🏢 중형주';
      }
      // 3. 스캠주의 (거래대금 10억 미만 OR 변동성 비정상)
      else if (data.volume < 1000000000 || Math.abs(data.change) > 30) {
        category = '☠️ 스캠주의';
        score -= 20; // 스캠 위험 시 점수 차감
      }

      // 코인 특징 (3줄 요약)
      const KB_description = COIN_DESCRIPTIONS[symbol];
      let description = KB_description ? KB_description.description : null;

      // COIN_DESCRIPTIONS에 없으면 CoinGecko 데이터 사용
      if (!description && coinDescriptions[symbol]) {
        description = coinDescriptions[symbol];
      }

      // CoinGecko 정보도 없으면 시장 데이터 기반으로 생성
      if (!description) {
        const trendText = data.change > 0 ? '상승세' : '조정세';
        const volText = data.volume > 1000000000 ? '폭발적' : '양호한' + ' 분위기예요';
        description = `1. 업비트 원화 마켓에서 만날 수 있는 코인이에요! 🤝\n2. 현재 전일 대비 ${Math.abs(data.change).toFixed(1)}% ${trendText}를 보이고 있어요. ${data.change > 0 ? '📈' : '📉'}\n3. 거래량은 ${volText} ✨ 시장의 주목을 받으며 활발히 움직인답니다!`;
      }

      // ⭐ short_insight는 코인 설명의 첫 줄 (한 줄 요약)
      let short_insight = symbol;
      if (description) {
        // KB 데이터 형식 (1. ~로 시작하면)
        if (description.includes('\n')) {
          const firstLine = description.split('\n')[0];
          short_insight = firstLine.replace(/^1\.\s+/, '').replace(/!$/, '');
        }
        // CoinGecko 데이터 형식 (HTML 포함 가능)
        else {
          let cleanDesc = description
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .trim();

          // 첫 번째 문장 추출 및 정제
          const match = cleanDesc.match(/^(.{0,80}?[.!?])/);
          short_insight = match ? match[1].trim() : cleanDesc.substring(0, 80);
        }
      }

      recommendations[symbol] = {
        reason,
        type,
        risk,
        score: parseInt(score),
        timestamp: new Date().toISOString(),
        change: parseFloat(data.change.toFixed(2)),
        volume: data.volume,
        description: description, // 특징 추가
        short_insight: short_insight, // short_insight 추가
        category: category // 체급 카테고리 추가
      };
    }

    return recommendations;
  }

  // 결과 저장
  saveRecommendations(recommendations) {
    console.log('💾 추천 데이터 저장 중...');

    // 1. utils/dailyRecommendations.js 업데이트
    const filePath = path.join(__dirname, '../utils/dailyRecommendations.js');

    // 파일 내용은 템플릿으로 생성 (안전하게 덮어쓰기)
    const fileContent = `// 일일 추천 배치 결과 (매일 새로 갱신)
// 실제 운영 시: 별도 배치 스크립트에서 DB 갱신

const DAILY_RECOMMENDATIONS = {
  // 기본 추천 타입 정의
  types: {
    high_risk: { label: '🚀 대박노리기', color: 'danger' },
    medium_risk: { label: '💰 월급벌기', color: 'warning' },
    low_risk: { label: '🍚 밥값벌기', color: 'success' }
  },

  // 오늘 날짜별 추천 (${this.today} 자동 생성)
  '${this.today}': ${JSON.stringify(recommendations, null, 2)}
};

export function getTodayRecommendations() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 오늘 데이터가 없으면 어제 또는 기본값
  const recommendations = DAILY_RECOMMENDATIONS[today] || 
                         getYesterdayRecommendations() ||
                         {};
  
  return recommendations;
}

export function getYesterdayRecommendations() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return DAILY_RECOMMENDATIONS[yesterdayStr] || null;
}

export default getTodayRecommendations;
`;

    fs.writeFileSync(filePath, fileContent);
    console.log(`✅ ${filePath} 업데이트됨`);

    return recommendations;
  }

  async run() {
    try {
      console.log('═══════════════════════════════════════');
      console.log(`🤖 일일 추천 배치 시작 (${this.today})`);
      console.log('═══════════════════════════════════════\n');

      // 1. 시장 데이터 수집
      const marketData = await this.fetchMarketData();
      console.log(`✅ ${Object.keys(marketData).length}개 코인 데이터 수집\n`);

      // 2. CoinGecko 코인 목록 및 설명 로드
      console.log('🌐 CoinGecko 데이터 로드 중...');
      const coinGeckoList = await this.fetchCoinGeckoList();
      const coinDescriptions = {};

      // 거래량 기준 상위 코인들부터 설명 로드 (rate limit 고려)
      const sortedSymbols = Object.entries(marketData)
        .sort((a, b) => b[1].volume - a[1].volume)
        .map(([symbol]) => symbol)
        .slice(0, 100); // 상위 100개

      for (const symbol of sortedSymbols) {
        // COIN_DESCRIPTIONS에 이미 있으면 스킵
        if (COIN_DESCRIPTIONS[symbol]) continue;

        const coinId = coinGeckoList[symbol];
        if (coinId) {
          const desc = await this.fetchCoinGeckoDescription(coinId);
          if (desc) {
            coinDescriptions[symbol] = desc;
            console.log(`  ✅ ${symbol} (${coinId})`);
          }
          // Rate limit 방지
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      console.log(`✅ ${Object.keys(coinDescriptions).length}개 코인 정보 로드 완료\n`);

      // 3. 분석 & 추천 생성
      const recommendations = this.analyzeAndRecommend(marketData, coinDescriptions);
      console.log(`✅ ${Object.keys(recommendations).length}개 코인 분석 완료\n`);

      // 3. 결과 저장
      this.saveRecommendations(recommendations);

      // 4. 결과 출력
      console.log('\n📊 생성된 추천 데이터:');
      console.log('═══════════════════════════════════════');

      Object.entries(recommendations)
        .sort((a, b) => b[1].score - a[1].score)
        .forEach(([symbol, data]) => {
          console.log(`\n${symbol}`);
          console.log(`  요약: ${data.short_insight}`); // short_insight 출력
          console.log(`  이유: ${data.reason}`);
          console.log(`  타입: ${data.type}`);
          console.log(`  위험: ${data.risk}`);
          console.log(`  점수: ${data.score}/100`);
          console.log(`  변동: ${data.change > 0 ? '+' : ''}${data.change}%`);
          console.log(`  체급: ${data.category}`);
        });

      console.log('\n═══════════════════════════════════════');
      console.log('✅ 배치 완료!\n');

      return recommendations;
    } catch (error) {
      console.error('❌ 배치 실패:', error);
      process.exit(1);
    }
  }
}

// 모듈 export
module.exports = { RecommendationBatch };

// CLI 실행 (직접 실행할 때만)
if (require.main === module) {
  const batch = new RecommendationBatch();
  batch.run();
}
