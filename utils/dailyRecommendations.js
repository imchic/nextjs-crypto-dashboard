// 일일 추천 배치 결과 (매일 새로 갱신)
// 실제 운영 시: 별도 배치 스크립트에서 DB 갱신

const DAILY_RECOMMENDATIONS = {
  // 기본 추천 타입 정의
  types: {
    high_risk: { label: '🚀 대박노리기', color: 'danger' },
    medium_risk: { label: '💰 월급벌기', color: 'warning' },
    low_risk: { label: '🍚 밥값벌기', color: 'success' }
  },

  // 오늘 날짜별 추천 (2026-02-24 자동 생성)
  '2026-02-24': {
  "SOL": {
    "reason": "🚀 급상승 중 (+12.5%) • 거래량 폭증",
    "type": "🚀 대박노리기",
    "risk": "🔴 높음",
    "score": 100,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 12.5,
    "volume": 1200000000
  },
  "XRP": {
    "reason": "📈 상승 중 (+8.3%) • 거래량 증가",
    "type": "💰 월급벌기",
    "risk": "🟡 중간",
    "score": 90,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 8.3,
    "volume": 950000000
  },
  "AVAX": {
    "reason": "📈 상승 중 (+7.8%) • 거래량 증가",
    "type": "💰 월급벌기",
    "risk": "🟡 중간",
    "score": 90,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 7.8,
    "volume": 850000000
  },
  "NEAR": {
    "reason": "📈 상승 중 (+6.5%) • 거래량 증가",
    "type": "💰 월급벌기",
    "risk": "🟡 중간",
    "score": 90,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 6.5,
    "volume": 620000000
  },
  "ARB": {
    "reason": "➡️ 소폭 상승 (+4.2%) • 거래량 증가",
    "type": "🍚 밥값벌기",
    "risk": "🟢 낮음",
    "score": 70,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 4.2,
    "volume": 580000000
  },
  "OP": {
    "reason": "➡️ 소폭 상승 (+3.8%) • 거래량 증가",
    "type": "🍚 밥값벌기",
    "risk": "🟢 낮음",
    "score": 70,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 3.8,
    "volume": 520000000
  },
  "MATIC": {
    "reason": "📈 상승 중 (+5.1%) • 거래량 증가",
    "type": "💰 월급벌기",
    "risk": "🟡 중간",
    "score": 90,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 5.1,
    "volume": 610000000
  },
  "LINK": {
    "reason": "➡️ 소폭 상승 (+2.3%)",
    "type": "🍚 밥값벌기",
    "risk": "🟢 낮음",
    "score": 60,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 2.3,
    "volume": 450000000
  },
  "UNI": {
    "reason": "➡️ 소폭 상승 (+3.9%) • 거래량 증가",
    "type": "🍚 밥값벌기",
    "risk": "🟢 낮음",
    "score": 70,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 3.9,
    "volume": 520000000
  },
  "ATOM": {
    "reason": "➡️ 소폭 상승 (+2.8%)",
    "type": "🍚 밥값벌기",
    "risk": "🟢 낮음",
    "score": 60,
    "timestamp": "2026-02-24T03:08:45.432Z",
    "change": 2.8,
    "volume": 380000000
  }
}
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
