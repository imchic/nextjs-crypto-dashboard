#!/usr/bin/env node

/**
 * Daily Recommendation Batch Script
 * 매일 실행: 암호화폐 시장 데이터 분석 → 추천 생성
 */

const fs = require('fs');
const path = require('path');

// 코인 특징 데이터베이스 (Knowledge Base)
const COIN_DESCRIPTIONS = {
  'BTC': '1. 암호화폐의 시초이자 디지털 금으로 불리는 자산\n2. 가장 높은 시가총액과 안정성을 보유\n3. 시장 전반의 흐름을 주도하는 기축 통화',
  'ETH': '1. 스마트 컨트랙트를 지원하는 플랫폼 대장주\n2. DeFi, NFT 등 다양한 블록체인 생태계의 기반\n3. 지속적인 업그레이드로 확장성 개선 중',
  'XRP': '1. 금융기관 간의 즉각적인 송금을 위한 코인\n2. 매우 빠른 전송 속도와 낮은 수수료가 장점\n3. SEC 소송 리스크 해소로 기대감 상승',
  'SOL': '1. 이더리움의 대항마로 불리는 초고속 블록체인\n2. 낮은 수수료와 빠른 처리 속도(TPS)가 강점\n3. 강력한 커뮤니티와 개발자 생태계 보유',
  'ADA': '1. 학술적 연구를 기반으로 개발된 3세대 블록체인\n2. 높은 보안성과 확장성을 목표로 함\n3. 탈중앙화된 거버넌스 시스템 운영',
  'DOGE': '1. 인터넷 밈(Meme)에서 시작된 대표적인 밈코인\n2. 일론 머스크의 지지로 높은 인지도 확보\n3. 라이트코인 기반으로 전송 속도가 빠름',
  'AVAX': '1. 빠른 처리 속도를 자랑하는 레이어1 플랫폼\n2. 서브넷 기능을 통해 맞춤형 블록체인 구축 가능\n3. 금융 및 기업용 블록체인 솔루션으로 주목',
  'DOT': '1. 서로 다른 블록체인을 연결하는 인터체인 프로젝트\n2. 파라체인 옥션을 통해 생태계 확장 중\n3. 웹3.0 시대를 이끌어갈 핵심 인프라',
  'MATIC': '1. 이더리움의 확장성 문제를 해결하는 레이어2 솔루션\n2. 빠르고 저렴한 수수료로 많은 DApp 유치\n3. 영지식 증명(ZK) 기술 도입으로 기술력 강화',
  'LINK': '1. 블록체인과 외부 데이터를 연결하는 오라클 대장주\n2. DeFi 생태계의 필수적인 데이터 제공자\n3. SWIFT 등 전통 금융기관과 협업 진행',
  'NEAR': '1. 사용성을 극대화한 사용자 친화적 블록체인\n2. 샤딩 기술을 도입하여 무한한 확장성 목표\n3. 웹2 개발자가 쉽게 적응할 수 있는 환경 제공',
  'ATOM': '1. 블록체인 간의 인터넷을 표방하는 코스모스 허브\n2. IBC 프로토콜을 통해 서로 다른 체인 연결\n3. 개발자가 쉽게 독자적 체인을 만들 수 있음',
  'TRX': '1. 엔터테인먼트 산업에 특화된 콘텐츠 공유 플랫폼\n2. 높은 처리량과 제로에 가까운 수수료\n3. USDT 전송에 가장 많이 사용되는 네트워크',
  'ETC': '1. 이더리움 해킹 사건 이전의 오리지널 체인\n2. 작업 증명(PoW) 방식을 고수하며 보안성 중시\n3. 코드 불변성을 핵심 가치로 삼음',
  'BCH': '1. 비트코인에서 하드포크된 P2P 전자 화폐\n2. 블록 크기를 늘려 결제 속도와 수수료 개선\n3. 실생활 결제 수단으로의 활용 지향',
  'SHIB': '1. 도지코인 킬러를 표방하며 등장한 밈코인\n2. 자체 생태계(Shibarium, DEX) 구축 중\n3. 강력한 커뮤니티 화력을 보유함',
  'SAND': '1. 더 샌드박스 메타버스 내의 유틸리티 토큰\n2. 가상 부동산(LAND) 거래 및 게임 내 화폐로 사용\n3. 유명 브랜드 및 IP와 다양한 파트너십 체결',
  'MANA': '1. 디센트럴랜드 가상현실 플랫폼의 기축 통화\n2. 사용자가 직접 콘텐츠를 만들고 수익 창출 가능\n3. 메타버스 부동산 시장의 선두주자',
  'ARB': '1. 이더리움 레이어2 롤업 솔루션의 선두주자\n2. 이더리움의 보안을 유지하며 속도와 비용 개선\n3. 압도적인 TVL(예치금)과 생태계 보유',
  'OP': '1. 옵티미스틱 롤업 기술을 사용하는 레이어2\n2. 슈퍼체인 비전을 통해 생태계 확장 중\n3. 코인베이스 등 대형 프로젝트와 협력',
  'SUI': '1. 메타 출신 개발팀이 만든 고성능 레이어1\n2. Move 언어를 사용하여 보안성과 속도 최적화\n3. 객체 중심 데이터 모델로 병렬 처리 가능',
  'APT': '1. 메타의 Diem 프로젝트 계승한 레이어1\n2. Move 언어 기반의 높은 안정성과 확장성\n3. 출시 초기부터 빠른 속도로 주목받음',
  'SEI': '1. 트레이딩에 특화된 초고속 레이어1 블록체인\n2. 자체 주문 매칭 엔진을 내장하여 DEX 최적화\n3. 나스닥급의 체결 속도를 목표로 함'
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
      // Upbit API 제한 고려하여 상위 100개만 우선 분석 (알트코인 포함)
      const targets = krwMarkets.slice(0, 100); 
      
      const tickerRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${targets.join(',')}`);
      if (!tickerRes.ok) throw new Error(`Ticker fetch failed: ${tickerRes.status}`);
      
      const tickers = await tickerRes.json();
      
      // 3. 데이터 변환
      const marketData = {};
      tickers.forEach(t => {
        const symbol = t.market.replace('KRW-', '');
        // 등락률 계산
        const change = ((t.trade_price - t.opening_price) / t.opening_price) * 100;
        
        // 트렌드 분석
        let trend = 'stable';
        if (change >= 5) trend = 'up_strong';
        else if (change > 0) trend = 'up';
        else if (change <= -5) trend = 'down_strong';
        else if (change < 0) trend = 'down';
        
        marketData[symbol] = {
          change: parseFloat(change.toFixed(2)),
          volume: t.acc_trade_price_24h, // 거래대금 (원화)
          price: t.trade_price,
          trend: trend
        };
      });
      
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

      // 코인 특징 (3줄 요약)
      let description = COIN_DESCRIPTIONS[symbol];
      if (!description) {
        // 특징 데이터가 없는 경우 자동 생성
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
        description: description // 특징 추가
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
