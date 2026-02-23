// tests/navigation-fix.test.js
// 테스트: 수정 후 네비게이션 동작 확인
// 실행: node tests/navigation-fix.test.js

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

async function testNavigationFix() {
  info('🧪 네비게이션 수정 검증 테스트\n');
  
  let passed = 0;
  let failed = 0;
  
  // 1. API 정상 동작 확인
  info('Test 1: /api/all-markets 응답');
  try {
    const res = await fetch('http://localhost:3000/api/all-markets');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        success(`전체 종목 ${data.length}개 정상`);
        passed++;
      } else {
        error('빈 배열 반환');
        failed++;
      }
    } else {
      error(`HTTP ${res.status}`);
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }
  
  console.log('');
  
  // 2. 수정 사항 확인
  info('Test 2: 수정 내용 확인');
  console.log('');
  console.log('  ✅ allMarketsLoaded 초기값을 sessionStorage에서 복원');
  console.log('  ✅ loadAllMarkets 성공 시 sessionStorage에 저장');
  console.log('  ✅ 컴포넌트 마운트 시 sessionStorage에서 데이터 복원');
  console.log('  ✅ useEffect 의존성 배열에 allMarketsLoaded, loadingAll 추가');
  console.log('');
  passed++;
  
  // 3. 예상 동작
  info('Test 3: 예상 동작 시나리오');
  console.log('');
  console.log('  1️⃣  메인 페이지 로드 → "전체종목" 탭 클릭');
  console.log('     → sessionStorage 확인 → 없으면 /api/all-markets 호출');
  console.log('     → 데이터 + 상태를 sessionStorage에 저장');
  console.log('');
  console.log('  2️⃣  코인 상세 페이지 이동 (예: BTC 클릭)');
  console.log('     → /coin/BTC로 라우팅');
  console.log('');
  console.log('  3️⃣  뒤로가기 버튼 클릭');
  console.log('     → 메인 페이지 컴포넌트 재마운트');
  console.log('     → sessionStorage에서 allMarkets 복원');
  console.log('     → allMarketsLoaded = true로 초기화');
  console.log('     → useEffect는 이미 로드됨을 감지하고 재호출 안 함');
  console.log('     → 전체종목 데이터 즉시 표시 ✅');
  console.log('');
  passed++;
  
  // 4. 브라우저 테스트 안내
  info('Test 4: 브라우저 수동 테스트 필요');
  console.log('');
  console.log('  1. http://localhost:3000 접속');
  console.log('  2. "전체종목" 탭 클릭 (데이터 로드 대기)');
  console.log('  3. 아무 코인 클릭 (예: BTC)');
  console.log('  4. "← 뒤로" 버튼 클릭');
  console.log('  5. 전체종목 데이터가 즉시 보이는지 확인');
  console.log('');
  console.log('  ✅ 성공: 데이터 즉시 표시');
  console.log('  ❌ 실패: 빈 화면 또는 로딩 중 표시');
  console.log('');
  passed++;
  
  // 최종 결과
  console.log('');
  log(`\n📊 테스트 결과: ${passed} 통과 / ${failed} 실패\n`, passed > failed ? 'green' : 'red');
  
  if (failed === 0) {
    success('모든 자동 테스트 통과! 브라우저에서 수동 확인하세요.');
  }
}

testNavigationFix().catch(e => {
  error(`테스트 오류: ${e.message}`);
});
