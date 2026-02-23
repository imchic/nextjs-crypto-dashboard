// tests/navigation.test.js
// 테스트: 상세 페이지 → 뒤로가기 후 전체종목 표시 문제
// 실행: node tests/navigation.test.js

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

async function testNavigationBug() {
  info('🔍 네비게이션 버그 재현 테스트\n');
  
  // 1. 메인 페이지 → 전체종목 탭
  info('Step 1: 메인 페이지 로드 (전체종목 선택)');
  info('예상: /api/all-markets 호출되어야 함');
  
  // 2. 상세 페이지 이동
  info('Step 2: 코인 상세 페이지 이동 (예: BTC)');
  info('예상: /api/ticker, /api/candles 호출');
  
  // 3. 뒤로가기
  info('Step 3: 뒤로가기 버튼 클릭');
  info('예상: 메인 페이지로 돌아가고 이전 상태(전체종목) 복원');
  
  // 4. 문제 확인
  warn('\n❗ 문제: 전체종목 탭에서 데이터가 사라짐\n');
  
  // 가능한 원인 분석
  info('🔍 가능한 원인:');
  console.log('');
  console.log('  1. allMarketsLoaded 상태가 초기화됨');
  console.log('     → 뒤로가기 시 컴포넌트 재마운트로 상태 리셋');
  console.log('');
  console.log('  2. group === "all" 조건이지만 allMarkets가 빈 배열');
  console.log('     → useEffect 의존성 문제로 재로드 안 됨');
  console.log('');
  console.log('  3. 로딩 중 상태에서 멈춤');
  console.log('     → loadingAll이 true로 남아있음');
  console.log('');
  
  // API 호출 확인
  info('📡 API 호출 테스트:');
  
  try {
    const allMarketsRes = await fetch('http://localhost:3000/api/all-markets');
    if (allMarketsRes.ok) {
      const data = await allMarketsRes.json();
      success(`/api/all-markets 정상 (${data.length}개)`);
    } else {
      error(`/api/all-markets 실패: ${allMarketsRes.status}`);
    }
  } catch (e) {
    error(`API 호출 오류: ${e.message}`);
  }
  
  console.log('');
  info('🔧 수정 방향:');
  console.log('');
  console.log('  1. allMarketsLoaded를 localStorage나 sessionStorage에 저장');
  console.log('  2. group 변경 시 조건 재검증');
  console.log('  3. 뒤로가기 시 useEffect가 제대로 동작하도록 의존성 수정');
  console.log('');
}

testNavigationBug().catch(e => {
  error(`테스트 실행 오류: ${e.message}`);
});
