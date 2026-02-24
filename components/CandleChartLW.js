'use client';

import { useEffect, useRef } from 'react';

export default function CandleChartLW({ data = [], height = 480 }) {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef();

    useEffect(() => {
        // 클라이언트 전용 실행
        if (!chartContainerRef.current) return;

        // 동적 import
        import('lightweight-charts').then(({ createChart }) => {
            try {
                const chart = createChart(chartContainerRef.current, {
                    width: chartContainerRef.current.clientWidth,
                    height,
                    layout: {
                        backgroundColor: '#0b0b0b',
                        textColor: '#d1d4dc',
                    },
                    grid: {
                        vertLines: { color: 'rgba(255,255,255,0.03)' },
                        horzLines: { color: 'rgba(255,255,255,0.03)' },
                    },
                    rightPriceScale: { visible: true },
                    timeScale: { borderVisible: false },
                });

                const candleSeries = chart.addCandlestickSeries({
                    upColor: '#0ECB81',
                    downColor: '#F6465D',
                    borderVisible: false,
                    wickVisible: true,
                });

                chartRef.current = chart;
                seriesRef.current = candleSeries;

                const handleResize = () => {
                    if (chart && chartContainerRef.current) {
                        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                    }
                };

                window.addEventListener('resize', handleResize);

                return () => {
                    window.removeEventListener('resize', handleResize);
                    chart.remove();
                };
            } catch (err) {
                console.error('Chart initialization error:', err);
            }
        }).catch(err => console.error('Failed to load lightweight-charts:', err));
    }, [height]);

    useEffect(() => {
        if (!seriesRef.current) return;
        try {
            const series = seriesRef.current;
            const formatted = data.map(d => ({
                time: d.timestamp || d.time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));
            series.setData(formatted);
        } catch (err) {
            console.error('Series data error:', err);
        }
    }, [data]);

    return <div ref={chartContainerRef} style={{ width: '100%', height: `${height}px` }} />;
}
