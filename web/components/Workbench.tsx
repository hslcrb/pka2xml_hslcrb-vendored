'use client';
import { useState } from 'react';
import Link from 'next/link';
import Brand, { SOURCE_URL } from './Brand';
import Icon from './Icon';
import WebGUI from './WebGUI';
import WebCLI from './WebCLI';

export default function Workbench() {
  const [tab, setTab] = useState<'gui' | 'cli'>('gui');
  const [busy, setBusy] = useState(false);
  return (
    <div className="workbench-shell">
      <a className="skip-link" href="#workbench-main">작업 공간으로 건너뛰기</a>
      <header className="site-header container"><Brand compact /><nav className="workbench-nav" aria-label="워크벤치 메뉴"><Link href="/">프로젝트 소개</Link><a href={SOURCE_URL}>GitHub <Icon name="external" width={14} height={14} /></a></nav></header>
      <main className="container workbench-main" id="workbench-main">
        <div className="workbench-heading"><div><span className="eyebrow">THE TRANSPARENT WORKSHOP</span><h1>파일 속 가능성을,<br className="mobile-only" /> 더 가까이.</h1><p>읽고, 살펴보고, 다시 담는 당신의 작업 공간.</p></div><span className="local-badge"><Icon name="shield" width={15} height={15} />온전히 이 기기에서</span></div>
        <div className="workspace-toolbar"><div className="workspace-tabs" role="tablist" aria-label="작업 방식">{(['gui', 'cli'] as const).map(item => <button key={item} id={`tab-${item}`} role="tab" aria-selected={tab === item} aria-controls={`panel-${item}`} tabIndex={tab === item ? 0 : -1} disabled={busy} type="button" onClick={() => setTab(item)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'gui' : event.key === 'End' ? 'cli' : item === 'gui' ? 'cli' : 'gui'; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }}><Icon name={item === 'gui' ? 'window' : 'terminal'} width={17} height={17} />{item === 'gui' ? '파일 변환' : '명령어 콘솔'}<span>{item.toUpperCase()}</span></button>)}</div><p><span className="success-dot" />파일 선택 · 변환 · 다운로드</p></div>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>{tab === 'gui' ? <WebGUI onBusyChange={setBusy} /> : <WebCLI onBusyChange={setBusy} />}</div>
        <div className="workbench-notes"><p><Icon name="info" width={15} height={15} />첫 변환 시 엔진을 불러옵니다. 원본은 그대로 보관하고, 결과는 새 파일로 내려받습니다.</p><a href={`${SOURCE_URL}/issues`} className="text-link">문제 알려주기 <Icon name="external" width={14} height={14} /></a></div>
      </main>
      <footer className="workbench-footer container"><span>pka2xml <i />OPEN SOURCE · GPL-3.0</span><Link href="/">작은 파일을 위한, 열린 작업실 <Icon name="external" width={13} height={13} /></Link></footer>
    </div>
  );
}
