#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Windows 로컬 알림 (한글 완벽 지원)
tkinter 사용
"""

import tkinter as tk
from tkinter import messagebox

# 윈도우 숨기기
root = tk.Tk()
root.withdraw()

# 한글 팝업 (메시지박스)
result = messagebox.showinfo(
    "테스트 알림",
    "Windows 로컬 알림 정상 작동!"
)

print("알림 발송 완료!")
