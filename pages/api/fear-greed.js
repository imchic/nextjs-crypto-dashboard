// pages/api/fear-greed.js
// Crypto Fear & Greed Index
// Source: https://api.alternative.me/fng/

const getKoreanLabel = (classification, value) => {
    const fearGreedMap = {
        'Extreme Fear': { ko: '극패닉', emoji: '🔴', humor: '정신차려... 손절할 시간?' },
        'Fear': { ko: '공포', emoji: '🟠', humor: '살려줘... 내 자산...' },
        'Neutral': { ko: '중립', emoji: '🟡', humor: '어? 뭐뒀지? 가나?' },
        'Greed': { ko: '탐욕', emoji: '🟢', humor: '올라올라~ 달에 가자!' },
        'Extreme Greed': { ko: '극도탐욕', emoji: '🟣', humor: '젠장할! 모두 사야해!' }
    };

    return fearGreedMap[classification] || { ko: classification, emoji: '❓', humor: '뭐지 이게?' };
};

export default async function handler(req, res) {
    try {
        // 최신 공포지수 데이터 가져오기
        const response = await fetch('https://api.alternative.me/fng/?limit=1');

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const fearGreed = data.data[0];
            const koreanLabel = getKoreanLabel(fearGreed.value_classification, fearGreed.value);

            res.status(200).json({
                value: parseInt(fearGreed.value),
                classification: fearGreed.value_classification,
                koreanLabel: koreanLabel.ko,
                emoji: koreanLabel.emoji,
                humor: koreanLabel.humor,
                timestamp: fearGreed.timestamp,
                description: fearGreed.text_classification || fearGreed.value_classification,
            });
        } else {
            res.status(404).json({ error: 'No data available' });
        }
    } catch (error) {
        console.error('Fear & Greed API Error:', error);
        res.status(500).json({ error: 'Failed to fetch fear & greed index', details: error.message });
    }
}
