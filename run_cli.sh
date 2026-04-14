#!/bin/bash
# pka2xml CLI Runner

if [ ! -f .setup_done ]; then
    echo "⚠️  잠깐! 프로젝트 초기 설정(재조립)이 되지 않은 것 같아."
    echo "명령어 한 줄이면 되니까 먼저 이걸 실행해줘: ./setup.sh"
    echo "--------------------------------------------------------"
    read -p "지금 바로 초기 설정을 진행할까? (y/n): " choice
    if [ "$choice" == "y" ] || [ "$choice" == "Y" ]; then
        chmod +x setup.sh && ./setup.sh
    else
        echo "❌ 초기 설정 없이는 CLI를 실행할 수 없어. 나중에 다시 와!"
        exit 1
    fi
fi

# pka2xml 바이너리 실행 (인자값 전달)
if [ -f ./pka2xml ]; then
    ./pka2xml "$@"
else
    echo "❌ 에러: pka2xml 바이너리가 없어. ./setup.sh 를 다시 확인해봐!"
    exit 1
fi
