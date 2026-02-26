// pages/api/batch-recommendations.js
/**
 * Vercel Cron Job Endpoint
 * 매일 실행되어 추천 코인 배치 업데이트
 */

const { spawn } = require('child_process');

export const config = {
    maxDuration: 60, // 최대 60초
};

export default async function handler(req, res) {
    // GET 요청만 허용 (Vercel Cron은 GET 사용)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 선택사항: 보안 토큰 체크 (배포 환경에서는 vercel.json의 header로 검증)
    const authHeader = req.headers['authorization'];
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🤖 [배치] 추천 코인 업데이트 시작...');

        return new Promise((resolve) => {
            // Node.js 스크립트 실행
            const batchProcess = spawn('node', [
                require.resolve('../scripts/batch-recommendations.js')
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            batchProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log(data.toString());
            });

            batchProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(data.toString());
            });

            batchProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ [배치] 완료!');
                    resolve(res.status(200).json({
                        success: true,
                        message: '배치 업데이트 완료',
                        timestamp: new Date().toISOString(),
                    }));
                } else {
                    console.error('❌ [배치] 실패:', stderr);
                    resolve(res.status(500).json({
                        success: false,
                        message: '배치 업데이트 실패',
                        error: stderr,
                    }));
                }
            });

            // 타임아웃 설정 (50초)
            setTimeout(() => {
                batchProcess.kill();
                resolve(res.status(504).json({
                    success: false,
                    message: '배치 타임아웃',
                }));
            }, 50000);
        });
    } catch (error) {
        console.error('❌ [배치] 에러:', error);
        return res.status(500).json({
            success: false,
            message: '배치 실행 중 에러',
            error: error.message,
        });
    }
}
