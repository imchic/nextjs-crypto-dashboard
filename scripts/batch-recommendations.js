#!/usr/bin/env node

/**
 * Daily Recommendation Batch Script
 * 매일 실행: 암호화폐 시장 데이터 분석 → 추천 생성
 */

const fs = require('fs');
const path = require('path');

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

      recommendations[symbol] = {
        reason,
        type,
        risk,
        score: parseInt(score),
        timestamp: new Date().toISOString(),
        change: parseFloat(data.change.toFixed(2)),
        volume: data.volume,
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
