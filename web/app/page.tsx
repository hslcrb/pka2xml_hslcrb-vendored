'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';

// xterm.js는 SSR에서 window를 필요로 하므로 dynamic import 사용
const WebCLI = dynamic(() => import('@/components/WebCLI'), { ssr: false });
const WebGUI = dynamic(() => import('@/components/WebGUI'), { ssr: false });

type Tab = 'gui' | 'cli';

export default function Home() {
  const [tab, setTab] = useState<Tab>('gui');
  const [wasmReady, setWasmReady] = useState(false);

  return (
    <>
      {/* Emscripten WASM 글루 코드 로드 */}
      <Script
        src="/pka2xml.js"
        strategy="afterInteractive"
        onLoad={() => setWasmReady(true)}
        onError={() => console.warn('pka2xml.js not found - WASM build required')}
      />

      <div className="page-wrapper">
        {/* 헤더 */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">pka2xml</span>
              <span className="logo-badge">WASM</span>
            </div>
            <p className="header-sub">
              Cisco Packet Tracer 파일 리버싱 도구 — 100% 브라우저에서 실행
            </p>
          </div>
        </header>

        {/* WASM 준비 상태 배너 */}
        <div className={`wasm-banner ${wasmReady ? 'ready' : 'loading'}`}>
          {wasmReady
            ? '✅ WASM 엔진 로드 완료 — 파일 변환 준비됨'
            : '⏳ WASM 엔진 로드 중... (빌드 필요: web/build_wasm.sh 실행 후 사용 가능)'
          }
        </div>

        {/* 탭 전환 */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'gui' ? 'active' : ''}`}
            onClick={() => setTab('gui')}
          >
            🖥 GUI 모드
          </button>
          <button
            className={`tab-btn ${tab === 'cli' ? 'active' : ''}`}
            onClick={() => setTab('cli')}
          >
            ⌨ CLI 모드
          </button>
        </div>

        {/* 컨텐츠 */}
        <main className="main">
          {tab === 'gui' ? <WebGUI /> : <WebCLI />}
        </main>

        {/* 푸터 */}
        <footer className="footer">
          <p>
            오픈소스 프로젝트 ·{' '}
            <a href="https://github.com/hslcrb/pka2xml_hslcrb-vendored" target="_blank" rel="noreferrer">
              GitHub
            </a>{' '}
            · WebAssembly (Emscripten) 기반
          </p>
        </footer>
      </div>
    </>
  );
}
