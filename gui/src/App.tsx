import { useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Braces, Check, CheckCircle2, ChevronDown, Clock3, Code2, Copy, FileCode2, FileText, FolderOpen, Layers3, LoaderCircle, LockKeyhole, Plus, ShieldCheck, SlidersHorizontal, Sparkles, Terminal, TriangleAlert, X } from 'lucide-react'
import type { Operation } from '../shared/contracts'
import { useWorkbench } from './useWorkbench'
import './App.css'

const modes = {
  decrypt: { label: 'XML로 열기', short: 'XML로 열기', from: 'PKA / PKT', to: 'XML', description: 'Packet Tracer 파일을 읽을 수 있는 XML로 펼쳐 보세요.', button: 'XML로 변환하기', icon: FileCode2 },
  encrypt: { label: 'Packet Tracer로 묶기', short: '다시 묶기', from: 'XML', to: 'PKA / PKT', description: '편집한 XML을 Packet Tracer에서 열 수 있는 파일로 저장해요.', button: '파일로 묶기', icon: Layers3 },
  fix: { label: '버전 호환성 조정', short: '버전 조정', from: 'PKA / PKT', to: 'PKA / PKT', description: '파일의 버전 정보를 조정한 별도 사본을 만들어요.', button: '호환 사본 만들기', icon: SlidersHorizontal },
  nets: { label: 'Nets 파일 읽기', short: 'Nets 읽기', from: 'NETS', to: 'TEXT', description: 'Packet Tracer의 nets 파일을 해석해 결과를 확인해요.', button: 'Nets 파일 읽기', icon: Braces },
  logs: { label: '로그 파일 읽기', short: '로그 읽기', from: 'LOG', to: 'TEXT', description: '암호화된 Packet Tracer 로그를 읽을 수 있는 텍스트로 바꿔요.', button: '로그 파일 읽기', icon: FileText },
  forge: { label: '인증 파일 만들기', short: '인증 파일', from: 'NEW', to: 'AUTH', description: '명령줄 도구의 forge 기능으로 새 인증 파일을 만들어요.', button: '인증 파일 만들기', icon: Sparkles },
} as const
const basicModes: Operation[] = ['decrypt', 'encrypt', 'fix']
const advancedModes: Operation[] = ['nets', 'logs', 'forge']
const basename = (value: string) => value.split(/[\\/]/).pop() ?? value
const statusLabels = { checking: '엔진 확인 중', ready: '준비됨', running: '작업 중', success: '완료', error: '확인 필요', cancelled: '취소됨', unavailable: '연결 필요' }

function App() {
  const work = useWorkbench()
  const [view, setView] = useState<'workbench' | 'guide'>('workbench')
  const [textCopied, setTextCopied] = useState(false)
  const mode = modes[work.operation]
  const ModeIcon = mode.icon
  const selectMode = (operation: Operation) => { work.setOperation(operation); setTextCopied(false) }

  const copyResult = async () => {
    try { await navigator.clipboard.writeText(work.result?.stdout ?? ''); setTextCopied(true) }
    catch { setTextCopied(false) }
  }

  return (
    <div className="app-shell">
      <a href="#workspace" className="skip-link">작업실로 건너뛰기</a>
      <aside className="sidebar" aria-label="앱 탐색">
        <div className="brand"><img src="./brand.svg" alt="" width="43" height="43" /><div><strong>pka2xml</strong><small>THE TRANSPARENT WORKSHOP</small></div></div>
        <div className="sidebar-rule" />
        <p className="nav-label">MY WORKSPACE</p>
        <nav>
          <button className={`nav-item ${view === 'workbench' ? 'active' : ''}`} aria-current={view === 'workbench' ? 'page' : undefined} onClick={() => setView('workbench')}><Layers3 size={18} />작업실<span className="nav-dot" /></button>
          <button className={`nav-item ${view === 'guide' ? 'active' : ''}`} aria-current={view === 'guide' ? 'page' : undefined} onClick={() => setView('guide')}><BookOpen size={18} />작은 안내서</button>
        </nav>
        <div className="sidebar-note"><div className="note-icon"><ShieldCheck size={21} /></div><strong>파일은 당신 곁에.</strong><p>모든 변환은 이 컴퓨터 안에서.<br />파일을 서버로 보내지 않아요.</p><span className="local-tag"><span />LOCAL FIRST</span></div>
        <div className="sidebar-footer"><span className="tiny-spark">✦</span><span>열린 도구, 선명한 과정.<br /><small>GPL-3.0 · v1.0.0</small></span></div>
      </aside>

      <main className="main-content" id="workspace">
        <header className="topbar"><div className="breadcrumb"><span>나의 작업 공간</span><span>/</span><strong>{view === 'workbench' ? '파일 작업실' : '작은 안내서'}</strong></div><button className="quiet-button" onClick={() => { work.reset(); setView('workbench') }} disabled={work.busy}><Plus size={16} />새 작업</button></header>
        <section className="hero"><div><p className="eyebrow"><span /> THE TRANSPARENT WORKSHOP</p><h1>{view === 'workbench' ? <>파일 속 네트워크를,<br /><em>조금 더 선명하게.</em></> : <>작은 도구로 여는,<br /><em>더 넓은 이해.</em></>}</h1><p className="hero-description">{view === 'workbench' ? '복잡한 파일을 펼치고, 이해하고, 다시 연결하는 곳.' : '원본을 보존하며 차근차근 살펴보세요.'}</p></div><div className="packet-art" aria-hidden="true"><span className="art-orbit" /><span className="art-spark">✦</span><div className="packet-back"><span>PKA</span><Layers3 size={31} /></div><div className="packet-front"><Braces size={43} /><span>XML</span><i /></div><div className="art-arrow"><ArrowUpRight size={20} /></div></div></section>

        {view === 'guide' ? (
          <section className="guide glass-surface" aria-labelledby="guide-title"><div className="section-title"><span className="step-number">?</span><h2 id="guide-title">처음 오셨나요?</h2></div><div className="guide-grid"><article><span>01</span><h3>원본을 골라 주세요</h3><p>PKA·PKT 파일은 XML로 열고, 수정한 XML은 다시 Packet Tracer 파일로 묶을 수 있어요.</p></article><article><span>02</span><h3>새로운 자리를 정해요</h3><p>결과를 저장할 파일 이름과 폴더를 고르세요. 원본과 같은 파일에는 저장하지 않아요.</p></article><article><span>03</span><h3>안심하고 살펴보세요</h3><p>변환에 성공했을 때만 결과가 저장돼요. 실패하거나 취소해도 기존 결과는 그대로 남아요.</p></article></div><div className="guide-extra"><h3>조금 더 깊이 살펴보기</h3><p><strong>Nets·로그 읽기</strong>는 해석한 텍스트를 작업실에 표시해요. <strong>버전 조정</strong>은 파일의 버전 정보를 바꾸며, 모든 기능의 하위 버전 호환을 보장하지는 않아요.</p><p>토폴로지 그래프는 프로젝트에 포함된 별도 <code>graph.py</code> 도구를 사용해 주세요. 인증 파일 생성은 기존 명령줄 도구의 forge 기능과 같아요.</p></div><button className="primary-button" onClick={() => setView('workbench')}>첫 작업 시작하기<ArrowRight size={17} /></button></section>
        ) : (
          <>
            {work.status === 'unavailable' && <div className="notice-banner" role="status"><TriangleAlert size={20} /><div><strong>{work.bridgeAvailable ? '변환 엔진을 확인해 주세요' : '데스크톱 화면 미리보기'}</strong><p>{work.notice || work.engine?.message || '파일을 변환하려면 pka2xml 데스크톱 앱을 열어 주세요. 이 화면에서는 인터페이스를 둘러볼 수 있어요.'}</p></div></div>}
            <section className="mode-section" aria-labelledby="mode-title"><div className="section-title"><span className="step-number">01</span><h2 id="mode-title">무엇을 해볼까요?</h2><span className="section-hint">작업을 하나 골라 주세요</span></div><div className="mode-tabs" role="group" aria-label="변환 작업">{basicModes.map(operation => { const item = modes[operation]; const Icon = item.icon; return <button key={operation} className={`mode-tab ${work.operation === operation ? 'selected' : ''}`} aria-pressed={work.operation === operation} disabled={work.busy} onClick={() => selectMode(operation)}><span className="mode-icon"><Icon size={21} /></span><span><strong>{item.short}</strong><small>{item.from}<ArrowRight size={10} />{item.to}</small></span>{work.operation === operation && <Check size={15} className="mode-check" />}</button> })}</div><details className="advanced-tools" open={advancedModes.includes(work.operation) || undefined}><summary><ChevronDown size={14} />추가 도구<span>Nets · 로그 · 인증 파일</span></summary><div className="advanced-options">{advancedModes.map(operation => <button key={operation} aria-pressed={work.operation === operation} className={work.operation === operation ? 'selected' : ''} disabled={work.busy} onClick={() => selectMode(operation)}>{modes[operation].short}</button>)}</div></details></section>

            <section className="workbench glass-surface" aria-labelledby="workbench-title" aria-busy={work.status === 'running'}>
              <div className="workbench-heading"><div className="section-title"><span className="step-number">02</span><h2 id="workbench-title">{mode.label}</h2></div><span className={`status-pill status-${work.status}`}><span />{statusLabels[work.status]}</span></div><p className="workbench-description">{mode.description}</p>
              <div className="file-flow">
                <div className={`file-card ${work.inputPath ? 'has-file' : ''}`}><div className="file-card-top"><span>원본</span><span className="file-format">{mode.from}</span></div>{work.needsInput ? <><div className="file-symbol"><FileCode2 size={27} />{work.inputPath && <span><Check size={10} /></span>}</div><h3>{work.inputPath ? basename(work.inputPath) : '어떤 파일을 열어볼까요?'}</h3><p className="file-path" title={work.inputPath}>{work.inputPath || `${mode.from} 파일 하나를 선택해 주세요`}</p><button className="file-button" onClick={() => void work.chooseFile('input')} disabled={work.busy || !work.engine?.available}><FolderOpen size={15} />{work.inputPath ? '다른 파일 선택' : '파일 선택'}</button></> : <><div className="file-symbol"><Sparkles size={27} /></div><h3>입력 파일 없이 시작해요</h3><p className="file-path">새 인증 파일의 저장 위치만 정해 주세요.</p></>}</div>
                <span className="flow-arrow" aria-hidden="true"><ArrowRight size={20} /></span>
                <div className={`file-card destination ${work.outputPath ? 'has-file' : ''}`}><div className="file-card-top"><span>{work.needsOutput ? '결과' : '텍스트 결과'}</span><span className="file-format">{mode.to}</span></div><div className="file-symbol"><ModeIcon size={27} />{work.outputPath && <span><Check size={10} /></span>}</div><h3>{work.needsOutput ? work.outputPath ? basename(work.outputPath) : '결과가 머물 자리' : '작업실에서 바로 읽어요'}</h3><p className="file-path" title={work.outputPath}>{work.needsOutput ? work.outputPath || '새 파일 이름과 저장할 폴더를 정해요' : '변환된 텍스트는 아래 결과 영역에 표시돼요.'}</p>{work.needsOutput && <button className="file-button" onClick={() => void work.chooseFile('output')} disabled={work.busy || !work.engine?.available || (work.needsInput && !work.inputPath)}><FolderOpen size={15} />{work.outputPath ? '저장 위치 변경' : '저장 위치 선택'}</button>}</div>
              </div>
              <div className="workbench-actions"><div className="privacy-line"><LockKeyhole size={14} /><span>로컬 처리<span className="middle-dot">·</span>원본 보호</span></div>{work.status === 'running' ? <div className="running-actions"><span><LoaderCircle size={17} className="spin" />변환하고 있어요</span><button className="quiet-button" onClick={() => void work.cancel()}><X size={16} />취소</button></div> : <button className="primary-button" onClick={() => void work.run()} disabled={!work.canRun}>{mode.button}<ArrowRight size={17} /></button>}</div>
              {work.status === 'running' && <div className="indeterminate-progress" role="progressbar" aria-label="파일 변환 중"><span /></div>}
            </section>

            {work.status === 'success' && work.result && <section className="result-card" role="status"><div className="result-icon"><CheckCircle2 size={22} /></div><div className="result-body"><strong>새로운 파일, 새로운 시선.</strong><p>{work.result.outputPath ? '결과 파일이 안전하게 저장됐어요.' : '파일 해석을 마쳤어요. 아래에서 결과를 확인하세요.'}<span><Clock3 size={12} />{(work.result.elapsedMs / 1000).toFixed(2)}초</span></p></div>{work.result.outputPath && <button className="file-button" onClick={() => void work.reveal()}>결과 폴더 열기<ArrowUpRight size={15} /></button>}</section>}
            {work.notice && work.status !== 'unavailable' && <div className={`notice-banner ${work.status === 'cancelled' ? 'neutral-notice' : ''}`} role={work.status === 'error' ? 'alert' : 'status'}>{work.status === 'cancelled' ? <X size={19} /> : <TriangleAlert size={19} />}<div><strong>{work.status === 'cancelled' ? '작업을 멈췄어요' : '잠깐, 확인해 주세요'}</strong><p>{work.notice}</p>{work.status === 'error' && <small>파일과 저장 위치를 확인한 뒤 다시 변환할 수 있어요.</small>}</div></div>}
            {work.result?.success && work.result.stdout && <section className="text-result glass-surface"><div className="log-heading"><h2><Code2 size={17} />텍스트 결과</h2><button className="quiet-button" onClick={() => void copyResult()}><Copy size={14} />{textCopied ? '복사했어요' : '전체 결과 복사'}</button></div><pre tabIndex={0}>{work.result.stdout.slice(0, 64000)}</pre>{work.result.stdout.length > 64000 && <p>미리보기는 앞부분만 표시해요. 전체 결과는 복사 버튼으로 가져갈 수 있어요.</p>}</section>}
            <section className="logs-panel" aria-labelledby="logs-title"><div className="log-heading"><h2 id="logs-title"><Terminal size={17} />작업 기록<span>{String(work.logs.length).padStart(2, '0')}</span></h2><button className="quiet-button" onClick={() => void work.copyLogs()} disabled={!work.logs.length}><Copy size={14} />{work.copied ? '복사했어요' : '기록 복사'}</button></div><div className="log-content" role="log" aria-live="polite" aria-relevant="additions">{work.logs.length ? work.logs.map(entry => <div className="log-entry" key={entry.id}><time>{entry.time}</time><span>{entry.text}</span></div>) : <div className="log-empty"><span className="empty-dash" /><p>첫 번째 작업을 기다리고 있어요.<span>선택부터 완료까지, 진행 과정을 이곳에 남겨요.</span></p></div>}</div></section>
          </>
        )}
        <footer className="main-footer"><span>당신의 파일, 당신의 컴퓨터.</span><span><span className="footer-dot" />{work.engine?.available ? '로컬 엔진 연결됨' : work.bridgeAvailable ? '엔진 확인 필요' : '화면 미리보기'}</span></footer>
      </main>
    </div>
  )
}

export default App
