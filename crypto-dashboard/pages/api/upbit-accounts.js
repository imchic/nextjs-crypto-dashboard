// pages/api/upbit-accounts.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const API_SERVER = 'http://3.36.240.119:5000';

export default async function handler(req, res) {
  try {
    // 환경변수에서 API 키 로드
    const access_key = process.env.UPBIT_ACCESS_KEY;
    const secret_key = process.env.UPBIT_SECRET_KEY;

    if (!access_key || !secret_key) {
      return res.status(500).json({
        error: 'Upbit API keys not configured. Please set UPBIT_ACCESS_KEY and UPBIT_SECRET_KEY in .env.local'
      });
    }

    // 마켓 정보 가져오기 (한글명, 경고) - EC2 API 서버에서 가져오기
    const marketsRes = await fetch(`${API_SERVER}/api/markets`);
    const allMarkets = await marketsRes.json();
    const marketInfo = {};
    const krwListedCoins = new Set(); // KRW 마켓에 상장된 코인

    allMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      if (m.market.startsWith('KRW-')) {
        krwListedCoins.add(symbol);
        marketInfo[symbol] = {
          korean_name: m.korean_name,
          market_warning: m.market_warning || 'NONE',
          is_airdrop: false,
        };
      }
    });

    // JWT 토큰 생성
    const payload = {
      access_key: access_key,
      nonce: uuidv4(),
    };

    const token = jwt.sign(payload, secret_key);
    const authorizationToken = `Bearer ${token}`;

    // 업비트 계좌 조회 - EC2 API 서버에서 처리
    const response = await fetch(`${API_SERVER}/api/accounts`, {
      headers: { Authorization: authorizationToken }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Server Error:', errorText);

      return res.status(response.status).json({
        error: 'API Server 호출 실패',
        details: errorText
      });
    }

    const accounts = await response.json();

    // 계좌에 마켓 정보 추가 (KRW 마켓에 없는 코인은 에어드랍)
    const accountsWithInfo = accounts.map(acc => {
      const isAirdrop = !krwListedCoins.has(acc.currency);

      return {
        ...acc,
        korean_name: marketInfo[acc.currency]?.korean_name || acc.currency,
        market_warning: marketInfo[acc.currency]?.market_warning || 'NONE',
        is_airdrop: isAirdrop,
      };
    });

    res.status(200).json(accountsWithInfo);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
