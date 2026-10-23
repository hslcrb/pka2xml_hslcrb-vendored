'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { commandFor, downloadBytes, extension, formatSize, outputName, parseCommand, validateFile, type Mode } from '@/lib/conversion';
import { useConversion } from '@/lib/useConversion';
import ConversionResult from './ConversionResult';
import FilePicker from './FilePicker';
import Icon from './Icon';

const HELP = [
  'pka2xml -d <input.pka|pkt> <output.xml>   XML로 열기',
  'pka2xml -e <input.xml> <output.pka|pkt>   다시 패키징',
  'pka2xml -f <input.pka|pkt> <output.pka|pkt>   버전 패치',
  'pka2xml -nets <nets>   nets 해독 · 텍스트 다운로드',
  'pka2xml -logs <input.log>   로그 해독 · 텍스트 다운로드',
  'pka2xml --forge <output.txt>   입력 파일 없이 인증 파일 생성',
  '',
  'help 사용법 · ls 선택 파일 · download 결과 저장 · clear 기록 지우기',
  '공백이 있는 파일 이름은 "수업 자료.pka"처럼 따옴표로 감싸세요.',
  '↑ ↓ 이전 명령어 · 실제 셸이나 시스템 명령을 실행하지 않습니다.',
].join('\n');
type Entry = { id: number; text: string; kind: 'command' | 'info' | 'success' | 'error' };

/** Native inputs preserve IME, selection, paste, screen readers, and mobile keyboards. */
export default function WebCLI({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, kind: 'info', text: 'pka2xml / browser console\n파일을 선택하고 명령어를 실행하세요. help로 사용법을 확인할 수 있어요.' }]);
  const nextEntry = useRef(1);
  const historyIndex = useRef(0);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const { state, busy, reset, fail, run, cancel } = useConversion();
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [entries]);
  const append = (text: string, kind: Entry['kind'] = 'info') => { const entry = { id: nextEntry.current++, text, kind }; setEntries(current => [...current, entry].slice(-80)); };
  const selectFile = (selected: File | null) => {
    reset();
    if (!selected) { setFile(null); setCommand(''); return; }
    const ext = extension(selected.name);
    const mode: Mode = ext === 'xml' ? 'encrypt' : ext === 'log' ? 'logs' : ext === 'nets' || !ext || ext === 'txt' ? 'nets' : 'decrypt';
    const error = validateFile(selected, mode);
    if (error) { setFile(null); fail(error); append(error, 'error'); return; }
    setFile(selected);
    setCommand(commandFor(mode, selected, outputName(selected, mode)));
    append(`파일 준비: ${selected.name} (${formatSize(selected.size)})`);
  };
  const execute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || composing.current || !command.trim()) return;
    const entered = command.trim();
    const newHistory = [...history, entered].slice(-50);
    setHistory(newHistory); historyIndex.current = newHistory.length;
    setCommand(''); append(entered, 'command');
    try {
      const parsed = parseCommand(entered);
      if (parsed.kind === 'help') { append(HELP); return; }
      if (parsed.kind === 'clear') { setEntries([]); reset(); return; }
      if (parsed.kind === 'ls') { append([file ? `${file.name} (${formatSize(file.size)})` : '선택한 입력 파일이 없습니다.', state.output ? `${state.name} (${formatSize(state.output.byteLength)}) · 변환 결과` : ''].filter(Boolean).join('\n')); return; }
      if (parsed.kind === 'download') { if (!state.output) throw new Error('먼저 파일을 변환해 주세요. 아직 저장할 결과가 없습니다.'); downloadBytes(state.output, state.name); append(`다운로드 시작: ${state.name}`, 'success'); return; }
      if (parsed.kind !== 'convert') return;
      reset();
      if (parsed.inputName && (!file || parsed.inputName !== file.name)) throw new Error(file ? `입력 파일 이름이 일치하지 않습니다. 선택한 파일: ${file.name}` : '먼저 위에서 입력 파일을 선택해 주세요.');
      append('이 기기에서 변환 중…');
      const result = await run(parsed.inputName ? file : null, parsed.mode, parsed.outputName);
      if (result) {
        if (result.logs.length) append(result.logs.join('\n'), result.phase === 'error' ? 'error' : 'info');
        append(result.phase === 'done' ? `완료: ${result.name} (${formatSize(result.output!.byteLength)}) · 결과 다운로드 버튼 또는 download 명령으로 저장하세요.` : result.message, result.phase === 'done' ? 'success' : 'error');
      }
    } catch (error) { const message = error instanceof Error ? error.message : '명령어를 확인해 주세요.'; fail(message); append(message, 'error'); }
  };
  return (
    <div className="work-grid">
      <section className="console-card glass" aria-labelledby="console-heading">
        <div className="card-heading"><span className="eyebrow">A FAMILIAR WAY TO WORK</span><button className="subtle-button" type="button" onClick={() => append(HELP)}>사용법 <Icon name="info" width={14} height={14} /></button></div>
        <h2 id="console-heading">손에 익은 명령어로.</h2><p className="card-intro">파일을 고르면 명령어가 준비돼요. 원하는 옵션으로 바꿔보세요.</p>
        <div className="console-file-picker"><FilePicker file={file} disabled={busy} onFile={selectFile} onReject={message => { setFile(null); fail(message); }} /></div>
        <div className="console-terminal">
          <div className="console-topbar"><div className="window-dots" aria-hidden="true"><i /><i /><i /></div><span>pka2xml · local session</span><span>{busy ? 'RUNNING' : 'READY'}</span></div>
          <div className="console-output" ref={logRef} role="log" aria-label="명령어 실행 기록" aria-live="polite" aria-relevant="additions" tabIndex={0}>{entries.map(entry => <pre className={`console-entry entry-${entry.kind}`} key={entry.id}>{entry.kind === 'command' ? '$ ' : ''}{entry.text}</pre>)}</div>
          <form className="console-command" onSubmit={execute}><label htmlFor="console-input" className="sr-only">명령어</label><span aria-hidden="true">$</span><input id="console-input" data-testid="console-input" ref={inputRef} value={command} onChange={event => { setCommand(event.target.value); historyIndex.current = history.length; }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => { if (event.nativeEvent.isComposing || composing.current) return; if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && history.length) { event.preventDefault(); const direction = event.key === 'ArrowUp' ? -1 : 1; historyIndex.current = Math.max(0, Math.min(history.length, historyIndex.current + direction)); setCommand(history[historyIndex.current] || ''); } }} placeholder="help 또는 pka2xml 명령어 입력" disabled={busy} autoComplete="off" autoCapitalize="off" spellCheck={false} /><button data-testid="run-command" type="submit" aria-label="명령어 실행" disabled={busy || !command.trim()}><Icon name="arrow" width={18} height={18} /></button></form>
        </div>
        <div className="console-shortcuts"><button type="button" disabled={busy} onClick={() => { setCommand('help'); inputRef.current?.focus(); }}>help</button><button type="button" disabled={busy} onClick={() => { setCommand('ls'); inputRef.current?.focus(); }}>ls</button><button type="button" disabled={busy} onClick={() => { setCommand('clear'); inputRef.current?.focus(); }}>clear</button><span>↑ ↓ 명령어 기록 <i />공백이 있는 이름은 따옴표로</span></div>
      </section>
      <ConversionResult state={state} onCancel={() => { cancel(); append('변환을 취소했습니다. 다시 실행할 수 있어요.'); }} />
    </div>
  );
}
