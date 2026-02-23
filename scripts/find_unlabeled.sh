#!/bin/bash
# 아직 라벨이 없는 메일 검색
/home/linuxbrew/.linuxbrew/bin/gog gmail search '-has:label -is:starred' --max 200 --account imchic8@gmail.com --json 2>&1
