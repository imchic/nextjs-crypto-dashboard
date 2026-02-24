'use client';

import Chart from 'react-apexcharts';

export default function CandleChartLW({ data = [], height = 480 }) {
    // 캔들 데이터를 ApexCharts 형식으로 변환
    const candleData = data.map(d => ({
        x: d.timestamp ? new Date(d.timestamp * 1000) : null,
        y: [d.open, d.high, d.low, d.close],
    })).filter(item => item.x !== null);

    const options = {
        chart: {
            type: 'candlestick',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true,
                },
            },
            background: 'transparent',
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#0ECB81',
                    downward: '#F6465D',
                },
                wick: {
                    useFillColor: true,
                },
            },
        },
        xaxis: {
            type: 'datetime',
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: '#d1d4dc',
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            tooltip: {
                enabled: true,
            },
            labels: {
                style: {
                    colors: '#d1d4dc',
                    fontSize: '12px',
                },
                formatter: (value) => `₩${(value / 1000).toFixed(0)}K`,
            },
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.1)',
            show: true,
            xaxis: {
                lines: {
                    show: false,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                if (!data) return '';

                const date = new Date(data.x);
                const dateStr = date.toLocaleString('ko-KR', {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });

                const [open, high, low, close] = data.y;
                const isUp = close >= open;
                const change = ((close - open) / open * 100).toFixed(2);
                const changeColor = isUp ? '#0ECB81' : '#F6465D';

                return `
                    <div style="
                        background: #1a1a1a;
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        padding: 12px;
                        font-size: 12px;
                        color: #d1d4dc;
                        min-width: 180px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    ">
                        <div style="
                            color: #fff;
                            font-weight: bold;
                            margin-bottom: 8px;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                            padding-bottom: 8px;
                        ">${dateStr}</div>
                        <div style="display: grid; gap: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">시가:</span>
                                <span>₩${open.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">고가:</span>
                                <span style="color: #0ECB81;">₩${high.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">저가:</span>
                                <span style="color: #F6465D;">₩${low.toLocaleString()}</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                border-top: 1px solid rgba(255,255,255,0.1);
                                padding-top: 6px;
                                margin-top: 6px;
                                font-weight: bold;
                            ">
                                <span style="color: #888;">종가:</span>
                                <span style="color: ${changeColor};">₩${close.toLocaleString()}</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: center;
                                margin-top: 8px;
                                padding: 6px;
                                background: ${changeColor}22;
                                border-radius: 4px;
                                color: ${changeColor};
                                font-weight: bold;
                            ">
                                ${isUp ? '▲' : '▼'} ${Math.abs(change)}%
                            </div>
                        </div>
                    </div>
                `;
            },
        },
    };

    const series = [
        {
            name: '캔들',
            data: candleData,
        },
    ];

    return (
        <div style={{ width: '100%', height: `${height}px`, background: 'transparent' }}>
            {data.length > 0 ? (
                <Chart
                    options={options}
                    series={series}
                    type="candlestick"
                    height={height}
                    width="100%"
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                    데이터 로딩 중...
                </div>
            )}
        </div>
    );
}
