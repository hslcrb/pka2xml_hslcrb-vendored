'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { runPka2xml } from '@/lib/wasmLoader';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';

const HELP_TEXT = `
pka2xml - Cisco Packet Tracer 파일 리버싱 도구 (WebAssembly 포트)

사용법:
  pka2xml -d <input.pka>   <output.xml>   # 복호화
  pka2xml -e <input.xml>   <output.pka>   # 암호화
  pka2xml -f <input.pkt>   <output.pkt>   # 버전 패치
  pka2xml --forge <file>                  # 인증 토큰 생성

파일 입력: 명령어 입력 후 엔터, 그러면 파일 선택 창이 열립니다.
`.trim();

export default function WebCLI() {
    const termRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const lineRef = useRef('');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            await import('@xterm/xterm/css/xterm.css');

            const term = new Terminal({
                theme: {
                    background: '#0d0d0d',
                    foreground: '#e0e0e0',
                    cursor: '#00ff99',
                    selectionBackground: '#1a4a2a',
                },
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: 13,
                cursorBlink: true,
                convertEol: true,
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            if (termRef.current) {
                term.open(termRef.current);
                fitAddon.fit();
            }

            xtermRef.current = term;
            fitRef.current = fitAddon;
            term.write(HELP_TEXT + '\r\n\r\n\x1b[32m$\x1b[0m ');
            setReady(true);

            term.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
                if (domEvent.key === 'Enter') {
                    term.write('\r\n');
                    handleCommand(lineRef.current.trim(), term);
                    lineRef.current = '';
                    term.write('\x1b[32m$\x1b[0m ');
                } else if (domEvent.key === 'Backspace') {
                    if (lineRef.current.length > 0) {
                        lineRef.current = lineRef.current.slice(0, -1);
                        term.write('\b \b');
                    }
                } else if (!domEvent.ctrlKey && key.length === 1) {
                    lineRef.current += key;
                    term.write(key);
                }
            });
        };

        init();

        const handleResize = () => fitRef.current?.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            xtermRef.current?.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCommand = useCallback(async (
        input: string,
        term: Terminal
    ) => {
        if (!input) return;

        const parts = input.split(/\s+/);
        const cmd = parts[0];

        if (cmd === 'help' || (cmd === 'pka2xml' && parts.length === 1)) {
            term.write(HELP_TEXT.replace(/\n/g, '\r\n') + '\r\n');
            return;
        }

        if (cmd === 'clear') {
            term.clear();
            return;
        }

        if (cmd === 'pka2xml') {
            term.write('\x1b[33m파일을 선택하세요...\x1b[0m\r\n');
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.onchange = async () => {
                const file = fileInput.files?.[0];
                if (!file) { term.write('\x1b[31m파일 선택 취소됨\x1b[0m\r\n'); return; }
                term.write(`\x1b[36m파일 로드됨: ${file.name}\x1b[0m\r\n`);
                const buf = new Uint8Array(await file.arrayBuffer());
                const args = [...parts.slice(1)];
                term.write('\x1b[33m변환 중...\x1b[0m\r\n');
                const result = await runPka2xml(buf, args);
                result.logs.forEach(l => term.write(l + '\r\n'));
                if (result.success && result.output) {
                    const blob = new Blob([result.output]);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = args[args.length - 1] || 'output';
                    a.click();
                    URL.revokeObjectURL(url);
                    term.write(`\x1b[32m✓ 완료 - ${a.download} 다운로드됨\x1b[0m\r\n`);
                } else {
                    term.write('\x1b[31m✗ 변환 실패\x1b[0m\r\n');
                }
            };
            fileInput.click();
            return;
        }

        term.write(`\x1b[31m알 수 없는 명령: ${cmd}\x1b[0m\r\n`);
        term.write('사용 가능한 명령: pka2xml, help, clear\r\n');
    }, []);

    return (
        <div className="cli-panel">
            <h2 className="panel-title">CLI 모드</h2>
            <div className="cli-hint">
                <code>pka2xml -d input.pka output.xml</code> 형식으로 입력하세요.
                파일은 자동으로 선택 창이 열립니다.
            </div>
            <div
                ref={termRef}
                className="terminal-container"
                style={{ height: '460px', borderRadius: '12px', overflow: 'hidden' }}
            />
            {!ready && <div className="cli-loading">터미널 초기화 중...</div>}
        </div>
    );
}
