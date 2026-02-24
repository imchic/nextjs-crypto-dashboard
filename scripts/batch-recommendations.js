#!/usr/bin/env node

/**
 * Daily Recommendation Batch Script
 * 매일 실행: 암호화폐 시장 데이터 분석 → 추천 생성
 */

const fs = require('fs');
const path = require('path');

// 코인 특징 데이터베이스 (Knowledge Base)
// 구성: 1.백과(정의) / 2.트위터(커뮤니티) / 3.뉴스(이슈)
const COIN_DESCRIPTIONS = {
  'BTC': '1. [백과] 최초의 암호화폐이자 디지털 안전 자산(디지털 금)\n2. [커뮤니티] 비트코인 맥시멀리스트들의 강력한 지지 보유\n3. [뉴스] 현물 ETF 승인 이후 기관 자금 유입 지속 중',
  'ETH': '1. [백과] 스마트 컨트랙트를 지원하는 탈중앙화 플랫폼 대장\n2. [커뮤니티] 가장 많은 개발자와 NFT/DeFi 생태계 보유\n3. [뉴스] 덴쿤 업그레이드 등 레이어2 수수료 절감 이슈',
  'XRP': '1. [백과] 금융기관 간의 실시간 자금 이체를 위한 리플넷 코인\n2. [커뮤니티] "리플 아미"라 불리는 강력하고 충성도 높은 홀더\n3. [뉴스] SEC 소송 리스크 해소 및 스테이블코인 출시 기대',
  'SOL': '1. [백과] 이더리움의 확장성 문제를 해결하는 초고속 레이어1\n2. [커뮤니티] 밈코인 열풍과 함께 트위터 내 언급량 폭발\n3. [뉴스] 네트워크 안정성 개선 및 모바일(Saga) 생태계 확장',
  'DOGE': '1. [백과] 시바견 밈(Meme)에서 시작된 P2P 디지털 화폐\n2. [커뮤니티] 일론 머스크와 "X"의 결제 도입 기대감 형성\n3. [뉴스] 밈코인 대장주로서 시장 변동성 주도',
  'SHIB': '1. [백과] 도지코인 킬러를 표방하며 등장한 이더리움 기반 밈코인\n2. [커뮤니티] 시바리움(L2) 출시로 단순 밈을 넘어 생태계 구축\n3. [뉴스] 대규모 소각 메커니즘과 DEX 생태계 활성화',
  'AVAX': '1. [백과] 높은 처리 속도와 낮은 지연 시간을 가진 레이어1\n2. [커뮤니티] 서브넷 기술을 통한 기업/게임용 체인 수요 증가\n3. [뉴스] 시티은행 등 전통 금융권의 RWA(실물자산) 파트너십',
  'ADA': '1. [백과] 학술적 검증을 거친 3세대 Ouroboros 지분증명 코인\n2. [커뮤니티] 장기 투자 성향이 강하며 탈중앙화 철학 중시\n3. [뉴스] 볼테르(Voltaire) 단계 진입으로 거버넌스 완성 목표',
  'NEAR': '1. [백과] 사용성을 극대화한 샤딩 기반의 고성능 블록체인\n2. [커뮤니티] "체인 추상화" 비전으로 사용자 경험(UX) 혁신 주도\n3. [뉴스] AI와 블록체인의 융합 기술 개발에 집중',
  'APT': '1. [백과] 메타(페이스북) 출신 개발자들이 만든 Move 언어 기반 체인\n2. [커뮤니티] 빠른 속도와 안정성으로 "솔라나 킬러" 후보 거론\n3. [뉴스] 한국 시장 및 게임사들과의 적극적인 파트너십',
  'SUI': '1. [백과] 객체 중심 데이터 모델을 적용한 차세대 레이어1\n2. [커뮤니티] 낮은 지연 시간으로 고사양 게임/DeFi 최적화\n3. [뉴스] 자체 게임기 출시 및 생태계 펀드 조성',
  'SEI': '1. [백과] 트레이딩에 특화된 초고속 오더북 내장 블록체인\n2. [커뮤니티] 병렬 처리 기술(v2) 도입으로 EVM 호환성 확보\n3. [뉴스] 디파이(DeFi) 및 NFT 거래 최적화 체인으로 성장',
  'MATIC': '1. [백과] 폴리곤(Polygon)으로 리브랜딩된 이더리움 확장 솔루션\n2. [커뮤니티] "POL" 토큰 마이그레이션 및 ZK 롤업 기술 기대\n3. [뉴스] 스타벅스, 나이키 등 대기업 웹3 프로젝트의 메인넷',
  'ARB': '1. [백과] 이더리움의 보안을 계승하며 속도를 높인 롤업 대장\n2. [커뮤니티] 레이어2 중 가장 높은 TVL(예치금)과 활성 사용자\n3. [뉴스] 게임(Xai) 및 디파이 생태계가 매우 활발함',
  'OP': '1. [백과] 옵티미스틱 롤업을 사용하는 이더리움 레이어2\n2. [커뮤니티] "슈퍼체인" 비전으로 코인베이스(Base) 등과 연합\n3. [뉴스] 레트로PGF를 통해 기여자들에게 수익 분배',
  'LINK': '1. [백과] 스마트 컨트랙트에 외부 데이터를 연결하는 오라클 미들웨어\n2. [커뮤니티] DeFi의 "신뢰"를 담당하는 필수 인프라로 인식\n3. [뉴스] CCIP(상호운용성) 기술로 은행과 블록체인 연결',
  'ETC': '1. [백과] "코드는 법이다"를 고수하는 이더리움의 오리지널 체인\n2. [커뮤니티] 작업 증명(PoW)을 선호하는 채굴자들의 지지\n3. [뉴스] 반감기 이슈와 함께 채산성 주목',
  'BCH': '1. [백과] 비트코인의 블록 크기 문제를 해결하기 위해 하드포크\n2. [커뮤니티] 실생활 결제 수단을 목표로 하며 전송 속도 강조\n3. [뉴스] 반감기 완료 및 업그레이드로 스마트 기능 도입 시도',
  'STX': '1. [백과] 비트코인 네트워크 위에서 스마트 컨트랙트를 구동\n2. [커뮤니티] 비트코인 레이어2 대장주로서의 입지 강화\n3. [뉴스] 나카모토 업그레이드로 전송 속도 획기적 개선',
  'TRX': '1. [백과] 콘텐츠 엔터테인먼트 산업을 위한 고효율 플랫폼\n2. [커뮤니티] 저렴한 수수료로 USDT 전송에 가장 많이 사용됨\n3. [뉴스] 창립자 저스틴 선의 적극적인 마케팅과 소각 정책',
  'SAND': '1. [백과] 블록체인 기반의 가상 세계(메타버스) 플랫폼\n2. [커뮤니티] 사용자가 직접 게임과 아이템을 제작하고 수익화\n3. [뉴스] 사우디 등 국가적 차원의 메타버스 파트너십',
  'MANA': '1. [백과] 최초의 3D 가상현실 플랫폼 디센트럴랜드의 화폐\n2. [커뮤니티] 가상 부동산(LAND) 거래 및 브랜드 입점 활발\n3. [뉴스] VR/AR 기기 발전에 따른 메타버스 재조명 기대',
  'WLD': '1. [백과] 홍채 인식을 통해 인간임을 증명하는 월드코인\n2. [커뮤니티] 샘 알트만(OpenAI) 프로젝트로 AI 테마와 연동\n3. [뉴스] 기본소득(UBI) 실험 및 개인정보 보호 이슈 공존',
  'ID': '1. [백과] 웹3 신원 증명 및 도메인 관리 플랫폼(스페이스ID)\n2. [커뮤니티] 여러 체인의 도메인(.bnb, .arb)을 통합 관리\n3. [뉴스] 바이낸스 랩스 투자 및 파트너십 확장',
  'ENS': '1. [백과] 복잡한 지갑 주소를 읽기 쉬운 이름으로 변환(이더리움)\n2. [커뮤니티] 비탈릭 부테린이 극찬한 가장 성공적인 비금융 앱\n3. [뉴스] 레이어2 지원 및 웹사이트 호스팅 기능 확장',
  'FLOW': '1. [백과] 차세대 게임, 앱, 디지털 자산을 위한 개발자 친화 체인\n2. [커뮤니티] NBA Top Shot 등 굵직한 NFT 프로젝트 배출\n3. [뉴스] 크레센도 업그레이드로 완전한 탈중앙화 지향'
};

// 분석 엔진
class RecommendationBatch {
  constructor() {
    this.today = new Date().toISOString().split('T')[0];
    this.recommendations = {};
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
  analyzeAndRecommend(marketData) {
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
      let categoryColor = 'default'; // 뱃지 색상용 (추후 사용)

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
      let description = COIN_DESCRIPTIONS[symbol];
      if (!description) {
        const trendText = data.change > 0 ? '상승세' : '조정세';
        const volText = data.volume > 1000000000 ? '폭발적' : '양호';
        description = `1. 업비트 원화 마켓에서 거래되는 암호화폐\n2. 현재 전일 대비 ${Math.abs(data.change).toFixed(1)}% ${trendText}를 보임\n3. 거래량 흐름이 ${volText}이며 시장의 주목을 받음`;
      }

      recommendations[symbol] = {
        reason,
        type,
        risk,
        score: parseInt(score),
        timestamp: new Date().toISOString(),
        change: parseFloat(data.change.toFixed(2)),
        volume: data.volume,
        description: description,
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

      // 2. 분석 & 추천 생성
      const recommendations = this.analyzeAndRecommend(marketData);
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
          console.log(`  이유: ${data.reason}`);
          console.log(`  타입: ${data.type}`);
          console.log(`  위험: ${data.risk}`);
          console.log(`  점수: ${data.score}/100`);
          console.log(`  변동: ${data.change > 0 ? '+' : ''}${data.change}%`);
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

// 실행
const batch = new RecommendationBatch();
batch.run();
