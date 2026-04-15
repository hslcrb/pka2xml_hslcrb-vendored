'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { runPka2xml } from '@/lib/wasmLoader';

type Mode = 'decrypt' | 'encrypt' | 'patch' | 'forge';

const modeConfig: Record<Mode, { flag: string; inputExt: string; outputExt: string; label: string }> = {
    decrypt: { flag: '-d', inputExt: '.pka/.pkt', outputExt: '.xml', label: '복호화 (PKA/PKT → XML)' },
    encrypt: { flag: '-e', inputExt: '.xml', outputExt: '.pka', label: '암호화 (XML → PKA)' },
    patch: { flag: '-f', inputExt: '.pkt', outputExt: '.pkt', label: '버전 패치 (PKT → PKT)' },
    forge: { flag: '--forge', inputExt: '.txt', outputExt: '.txt', label: '인증 토큰 생성 (Forge)' },
};

export default function WebGUI() {
    const [mode, setMode] = useState<Mode>('decrypt');
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [outputData, setOutputData] = useState<Uint8Array<ArrayBuffer> | null>(null);
    const [outputName, setOutputName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    }, []);

    const handleRun = async () => {
        if (!file) return;
        setStatus('running');
        setLogs([]);
        setOutputData(null);

        const buf = new Uint8Array(await file.arrayBuffer());
        const cfg = modeConfig[mode];
        const inputName = file.name;
        const base = file.name.replace(/\.[^.]+$/, '');
        const outName = `${base}_converted${cfg.outputExt.split('/')[0]}`;

        const result = await runPka2xml(buf, [cfg.flag, inputName, outName]);
        setLogs(result.logs);
        if (result.success && result.output) {
            setOutputData(result.output);
            setOutputName(outName);
            setStatus('done');
        } else {
            setStatus('error');
        }
    };

    const handleDownload = () => {
        if (!outputData) return;
        const blob = new Blob([outputData.buffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outputName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="gui-panel">
            <h2 className="panel-title">GUI 모드</h2>

            {/* 모드 선택 */}
            <div className="mode-selector">
                {(Object.keys(modeConfig) as Mode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`mode-btn ${mode === m ? 'active' : ''}`}
                    >
                        {modeConfig[m].label}
                    </button>
                ))}
            </div>

            {/* 파일 드롭존 */}
            <div
                className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input ref={inputRef} type="file" style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                {file ? (
                    <div className="file-info">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                ) : (
                    <div className="drop-hint">
                        <span className="drop-icon">⬆</span>
                        <p>파일을 드래그 앤 드롭하거나 클릭하여 선택</p>
                        <p className="drop-ext">지원 형식: {modeConfig[mode].inputExt}</p>
                    </div>
                )}
            </div>

            {/* 실행 버튼 */}
            <button
                className={`run-btn ${status === 'running' ? 'running' : ''}`}
                onClick={handleRun}
                disabled={!file || status === 'running'}
            >
                {status === 'running' ? '⏳ 변환 중...' : '▶ 변환 실행'}
            </button>

            {/* 로그 출력 */}
            {logs.length > 0 && (
                <div className="log-box">
                    {logs.map((l, i) => (
                        <div key={i} className={`log-line ${l.startsWith('[ERR]') ? 'err' : ''}`}>
                            {l}
                        </div>
                    ))}
                </div>
            )}

            {/* 결과 다운로드 */}
            {status === 'done' && outputData && (
                <div className="result-box success">
                    <span>✅ 변환 완료 — {outputName}</span>
                    <button className="dl-btn" onClick={handleDownload}>⬇ 다운로드</button>
                </div>
            )}
            {status === 'error' && (
                <div className="result-box error">
                    <span>❌ 변환 실패 — 로그를 확인하세요</span>
                </div>
            )}
        </div>
    );
}
