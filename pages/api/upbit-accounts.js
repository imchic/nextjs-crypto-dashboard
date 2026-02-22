// pages/api/upbit-accounts.js
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    // API 키 로드
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'upbit_config.json');
    
    if (!fs.existsSync(configPath)) {
      return res.status(500).json({ error: 'Upbit config not found' });
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const { access_key, secret_key } = config;

    // 1. 한글명 매핑 가져오기
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all');
    const allMarkets = await marketsResponse.json();
    const koreanNameMap = {};
    allMarkets.forEach(m => {
      const symbol = m.market.replace('KRW-', '');
      koreanNameMap[symbol] = m.korean_name;
    });

    // 2. JWT 토큰 생성
    const payload = {
      access_key: access_key,
      nonce: uuidv4(),
    };

    const token = jwt.sign(payload, secret_key);
    const authorizationToken = `Bearer ${token}`;

    // 3. 업비트 계좌 조회
    const response = await fetch('https://api.upbit.com/v1/accounts', {
      headers: { Authorization: authorizationToken },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upbit API Error:', errorText);
      return res.status(response.status).json({ error: 'Upbit API failed', details: errorText });
    }

    const accounts = await response.json();
    
    // KRW 잔고 찾기
    const krwAccount = accounts.find(acc => acc.currency === 'KRW');
    const krwBalance = krwAccount ? parseFloat(krwAccount.balance) : 0;
    
    // 코인 계좌만 필터링
    const coinAccounts = accounts.filter(acc => 
      acc.currency !== 'KRW' && parseFloat(acc.balance) > 0
    );

    // 4. 한글명 추가
    const accountsWithNames = coinAccounts.map(acc => ({
      ...acc,
      korean_name: koreanNameMap[acc.currency] || acc.currency
    }));

    res.status(200).json({
      coins: accountsWithNames,
      krw_balance: krwBalance
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
