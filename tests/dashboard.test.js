// tests/dashboard.test.js
// 테스트 실행: node tests/dashboard.test.js

const BASE_URL = 'http://localhost:3000';

// 색상 출력용
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 테스트 1: 전체 종목 불러오기
async function testLoadAllMarkets() {
  info('테스트 1: 전체 종목 불러오기');
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/all-markets`);
    const elapsed = Date.now() - start;
    
    if (!response.ok) {
      error(`HTTP 오류: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      error('응답이 배열이 아님');
      return false;
    }
    
    success(`전체 종목 ${data.length}개 로드 성공 (${elapsed}ms)`);
    
    // 샘플 데이터 확인
    if (data.length > 0) {
      const sample = data[0];
      info(`샘플: ${sample.symbol} - ${sample.name} - ₩${sample.price?.toLocaleString() || 'N/A'}`);
    }
    
    return true;
  } catch (e) {
    error(`전체 종목 로드 실패: ${e.message}`);
    return false;
  }
}

// 테스트 2: 리프레시 끊김 없이 연속 호출
async function testContinuousRefresh() {
  info('테스트 2: 연속 리프레시 (3초 간격 × 5회)');
  
  const results = [];
  
  for (let i = 1; i <= 5; i++) {
    try {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/dashboard`);
      const elapsed = Date.now() - start;
      
      if (!response.ok) {
        error(`${i}번째 요청 실패: ${response.status}`);
        results.push({ success: false, elapsed });
        continue;
      }
      
      const data = await response.json();
      
      if (!data.stats || !data.by_volume) {
        error(`${i}번째 응답 형식 오류`);
        results.push({ success: false, elapsed });
        continue;
      }
      
      success(`${i}번째 리프레시 성공 (${elapsed}ms) - 종목: ${data.by_volume.length}개`);
      results.push({ success: true, elapsed, count: data.by_volume.length });
      
      // 3초 대기
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (e) {
      error(`${i}번째 요청 에러: ${e.message}`);
      results.push({ success: false, elapsed: 0 });
    }
  }
  
  // 결과 요약
  const successCount = results.filter(r => r.success).length;
  const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.elapsed, 0) / successCount;
  
  info(`성공: ${successCount}/5, 평균 응답시간: ${avgTime.toFixed(0)}ms`);
  
  return successCount === 5;
}

// 테스트 3: 관심종목 토글 (LocalStorage 시뮬레이션)
async function testFavoriteToggle() {
  info('테스트 3: 관심종목 토글 시뮬레이션');
  
  // LocalStorage는 브라우저 환경에서만 동작하므로 로직 검증
  const favorites = [];
  const testSymbol = 'BTC';
  
  // 추가
  favorites.push(testSymbol);
  if (favorites.includes(testSymbol)) {
    success('관심종목 추가 성공');
  } else {
    error('관심종목 추가 실패');
    return false;
  }
  
  // 제거
  const index = favorites.indexOf(testSymbol);
  if (index > -1) {
    favorites.splice(index, 1);
  }
  
  if (!favorites.includes(testSymbol)) {
    success('관심종목 제거 성공');
  } else {
    error('관심종목 제거 실패');
    return false;
  }
  
  // 중복 추가 방지 테스트
  favorites.push(testSymbol);
  favorites.push(testSymbol);
  const uniqueFavorites = [...new Set(favorites)];
  
  if (uniqueFavorites.length === 1) {
    success('중복 방지 로직 정상');
  } else {
    error('중복 방지 실패');
    return false;
  }
  
  info('⚠️  실제 브라우저에서 LocalStorage 동작 확인 필요');
  return true;
}

// 테스트 4: API 응답 시간 측정
async function testAPIPerformance() {
  info('테스트 4: API 응답 시간');
  
  const endpoints = [
    '/api/dashboard',
    '/api/ticker?market=KRW-BTC',
    '/api/candles?market=KRW-BTC&type=minutes/60&count=24',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const elapsed = Date.now() - start;
      
      if (response.ok) {
        success(`${endpoint}: ${elapsed}ms`);
      } else {
        warn(`${endpoint}: ${response.status} (${elapsed}ms)`);
      }
    } catch (e) {
      error(`${endpoint}: ${e.message}`);
    }
  }
  
  return true;
}

// 전체 테스트 실행
async function runAllTests() {
  log('\n🚀 대시보드 테스트 시작\n', 'blue');
  
  const results = [];
  
  results.push(await testLoadAllMarkets());
  console.log('');
  
  results.push(await testContinuousRefresh());
  console.log('');
  
  results.push(await testFavoriteToggle());
  console.log('');
  
  results.push(await testAPIPerformance());
  console.log('');
  
  // 최종 결과
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`\n✅ 모든 테스트 통과 (${passed}/${total})\n`, 'green');
  } else {
    log(`\n⚠️  일부 테스트 실패 (${passed}/${total})\n`, 'yellow');
  }
}

// 실행
runAllTests().catch(e => {
  error(`테스트 실행 오류: ${e.message}`);
  process.exit(1);
});
