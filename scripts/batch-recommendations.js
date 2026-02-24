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

  // 시뮬레이션 데이터: 실제로는 API에서 가져옴
  async fetchMarketData() {
    console.log('📊 시장 데이터 수집 중...');
    
    // 실제 구현: Upbit API에서 가져오기
    return {
      'SOL': { change: 12.5, volume: 1200000000, trend: 'up_strong' },
      'XRP': { change: 8.3, volume: 950000000, trend: 'up' },
      'AVAX': { change: 7.8, volume: 850000000, trend: 'up' },
      'NEAR': { change: 6.5, volume: 620000000, trend: 'up' },
      'ARB': { change: 4.2, volume: 580000000, trend: 'stable' },
      'OP': { change: 3.8, volume: 520000000, trend: 'stable' },
      'MATIC': { change: 5.1, volume: 610000000, trend: 'up' },
      'LINK': { change: 2.3, volume: 450000000, trend: 'stable' },
      'UNI': { change: 3.9, volume: 520000000, trend: 'stable' },
      'ATOM': { change: 2.8, volume: 380000000, trend: 'stable' },
    };
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
    
    let fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 새로운 데이터 추가
    const newDataStr = JSON.stringify(recommendations, null, 2);
    
    // 기존 데이터 찾기
    const regex = /DAILY_RECOMMENDATIONS = \{([\s\S]*?)\};/;
    const match = fileContent.match(regex);
    
    if (match) {
      // 데이터 영역만 추출
      const dataStart = fileContent.indexOf('{');
      const dataEnd = fileContent.lastIndexOf('};');
      
      // 새로운 데이터 추가
      let updatedContent = fileContent.slice(0, dataStart + 1);
      updatedContent += `\n  // 오늘 날짜별 추천 (${this.today} 자동 생성)\n`;
      updatedContent += `  '${this.today}': ${newDataStr},\n`;
      updatedContent += fileContent.slice(dataStart + 1, dataEnd + 1);
      
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ ${filePath} 업데이트됨`);
    }

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
