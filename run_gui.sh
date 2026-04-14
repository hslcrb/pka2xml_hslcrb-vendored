#!/bin/bash
# pka2xml GUI Runner

if [ ! -f .setup_done ]; then
    echo "⚠️  잠깐! GUI를 띄우기 전에 프로젝트 초기 설정이 필요해."
    echo "명령어 한 줄이면 되니까 먼저 이걸 실행해줘: ./setup.sh"
    echo "--------------------------------------------------------"
    read -p "지금 바로 초기 설정을 진행할까? (y/n): " choice
    if [ "$choice" == "y" ] || [ "$choice" == "Y" ]; then
        chmod +x setup.sh && ./setup.sh
    else
        echo "❌ 초기 설정 없이는 GUI를 실행할 수 없어. 나중에 다시 봐!"
        exit 1
    fi
fi

# GUI 실행
echo "🚀 pka2xml 프리미엄 GUI를 시작합니다..."
cd gui && corepack yarn dev
