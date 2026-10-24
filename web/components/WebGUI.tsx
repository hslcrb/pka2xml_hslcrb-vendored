'use client';
import { useEffect, useState } from 'react';
import { ADVANCED_MODES, commandFor, MODES, outputName, PRIMARY_MODES, validateFile, type Mode } from '@/lib/conversion';
import { useConversion } from '@/lib/useConversion';
import Icon from './Icon';
import FilePicker from './FilePicker';
import ConversionResult from './ConversionResult';

export default function WebGUI({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const [mode, setMode] = useState<Mode>('decrypt');
  const [file, setFile] = useState<File | null>(null);
  const [outputExtension, setOutputExtension] = useState('.pka');
  const conversion = useConversion();
  const { busy, state, reset, fail, run, cancel } = conversion;
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  const cfg = MODES[mode];
  const name = outputName(file, mode, outputExtension);
  const selectMode = (next: Mode) => { reset(); setMode(next); setFile(null); };
  const selectFile = (next: File | null) => {
    reset();
    const error = next ? validateFile(next, mode) : null;
    setFile(error ? null : next);
    if (error) fail(error);
  };
  return (
    <div className="work-grid">
      <section className="conversion-card glass" aria-labelledby="conversion-heading">
        <div className="card-heading"><span className="eyebrow">MAKE SOMETHING CLEAR</span><span className="card-index">01 — 02</span></div>
        <h2 id="conversion-heading">무엇을 꺼내볼까요?</h2>
        <p className="card-intro">작업을 고르고, 파일 하나를 놓아주세요.</p>
        <div className="mode-options" role="group" aria-label="변환 작업">
          {PRIMARY_MODES.map(item => <button type="button" key={item} className={`mode-option ${mode === item ? 'is-active' : ''}`} aria-pressed={mode === item} disabled={busy} onClick={() => selectMode(item)}><Icon name={item === 'decrypt' ? 'code' : item === 'encrypt' ? 'file' : 'spark'} width={18} height={18} /><span>{MODES[item].title}</span><small>{item === 'decrypt' ? 'PKA · PKT → XML' : item === 'encrypt' ? 'XML → PKA · PKT' : 'PKA · PKT → PATCH'}</small></button>)}
        </div>
        <div className="advanced-row"><label htmlFor="advanced-mode">다른 작업이 필요하다면</label><select id="advanced-mode" aria-label="고급 작업" value={ADVANCED_MODES.includes(mode) ? mode : ''} disabled={busy} onChange={event => selectMode((event.target.value || 'decrypt') as Mode)}><option value="">고급 작업</option>{ADVANCED_MODES.map(item => <option value={item} key={item}>{MODES[item].title}</option>)}</select></div>
        <div className="input-heading"><h3><span>01</span>{cfg.input ? '원본 파일' : '파일 생성'}</h3><span>{cfg.input ? '파일은 업로드되지 않아요' : '입력 파일 없이 실행'}</span></div>
        {cfg.input ? <FilePicker file={file} accept={cfg.accept} disabled={busy} onFile={selectFile} onReject={message => { setFile(null); fail(message); }} /> : <div className="forge-explanation"><span className="upload-emblem"><Icon name="spark" width={25} height={25} /></span><strong>입력 파일 없이 시작합니다.</strong><p>{cfg.description}</p></div>}
        <div className="output-settings"><div><h3><span>02</span>변환 후 파일</h3><p className="planned-filename">{name}</p></div>{mode === 'encrypt' && <label className="format-label">출력 형식<select aria-label="출력 형식" value={outputExtension} disabled={busy} onChange={event => { reset(); setOutputExtension(event.target.value); }}><option value=".pka">.pka</option><option value=".pkt">.pkt</option></select></label>}</div>
        <p className="mode-description"><Icon name="info" width={14} height={14} />{cfg.description}</p>
        <button data-testid="run-conversion" className="button button-primary run-conversion" type="button" disabled={busy || (cfg.input && !file)} onClick={() => void run(file, mode, name)}>{busy ? <><span className="spinner spinner-small" />변환 중…</> : <>{state.phase === 'error' ? '다시 시도' : state.phase === 'done' ? '다시 변환' : mode === 'forge' ? '인증 파일 생성' : '변환 시작'}<Icon name="arrow" width={19} height={19} /></>}</button>
        <details className="command-equivalent"><summary><Icon name="terminal" width={15} height={15} />같은 작업을 명령어로<Icon name="chevron" width={14} height={14} /></summary><code>{commandFor(mode, file, name)}</code></details>
      </section>
      <ConversionResult state={state} onCancel={cancel} />
    </div>
  );
}
