#!/usr/bin/env python3
import yfinance as yf

symbols = ["PLTR", "RKLB", "IREN", "IONQ", "SNOW"]

for symbol in symbols:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="2d")
        if len(hist) >= 1:
            curr = hist['Close'].iloc[-1]
            prev = hist['Close'].iloc[-2] if len(hist) > 1 else curr
            change = curr - prev
            change_pct = (change / prev * 100) if prev > 0 else 0
            print(f"{symbol}: ${curr:.2f} {change:+.2f} ({change_pct:+.2f}%)")
    except Exception as e:
        print(f"{symbol}: Error - {e}")
