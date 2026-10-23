'use client';
import { useState } from 'react';
import type { ConversionState } from '@/lib/useConversion';
import { downloadBytes, formatSize } from '@/lib/conversion';
import Icon from './Icon';

export default function ConversionResult({ state, onCancel }: { state: ConversionState; onCancel: () => void }) {
  const [copied, setCopied] = useState(false);
  const preview = state.text && state.output ? new TextDecoder().decode(state.output.subarray(0, 8192)) : '';
  return (
    <section className={`result-panel glass result-${state.phase}`} aria-labelledby="result-heading">
      <div className="card-heading"><span className="eyebrow">YOUR OUTPUT</span><span className="result-step">03 / 결과</span></div>
      <h2 id="result-heading">작업의 다음 장.</h2>
      {state.phase === 'idle' && <div className="result-empty"><div className="empty-file"><Icon name="file" width={38} height={38} /><span className="empty-spark"><Icon name="spark" width={14} height={14} /></span></div><h3>결과가 놓일 자리예요.</h3><p>파일을 선택하고 변환하면<br />여기에서 확인하고 내려받을 수 있어요.</p></div>}
      <div aria-live="polite" aria-atomic="true">
        {state.phase === 'running' && <div className="result-working"><span className="spinner" /><h3>조금 더 또렷해지는 중.</h3><p>{state.message}</p><button data-testid="cancel-conversion" className="button button-secondary button-small" type="button" onClick={onCancel}>변환 취소 <Icon name="close" width={15} height={15} /></button></div>}
        {(state.phase === 'error' || state.phase === 'cancelled') && <div className={`result-message ${state.phase === 'error' ? 'error-message' : ''}`}><Icon name="info" /><h3>{state.phase === 'error' ? '다시 한번 살펴볼까요?' : '작업을 멈췄어요.'}</h3><p>{state.message}</p><small>원본 파일은 변경되지 않았습니다.</small></div>}
        {state.phase === 'done' && state.output && <div className="result-complete"><span className="completion-mark"><Icon name="check" /></span><h3>{state.message}</h3><p className="output-filename">{state.name}</p><span className="output-meta">{formatSize(state.output.byteLength)} <i />{state.elapsed < 1000 ? `${Math.round(state.elapsed)} ms` : `${(state.elapsed / 1000).toFixed(1)} s`}</span><button data-testid="download-result" className="button button-primary download-button" type="button" onClick={() => downloadBytes(state.output!, state.name)}>결과 다운로드 <Icon name="download" width={18} height={18} /></button></div>}
      </div>
      {preview && <details className="preview-details" open><summary>내용 미리보기 <Icon name="chevron" width={15} height={15} /></summary><pre tabIndex={0}>{preview}</pre>{state.output!.byteLength > 8192 && <small>처음 8 KiB만 표시합니다. 전체 내용은 다운로드해 확인하세요.</small>}</details>}
      {state.logs.length > 0 && <details className="log-details"><summary>실행 기록 <span>{state.logs.length}</span><Icon name="chevron" width={15} height={15} /></summary><pre tabIndex={0}>{state.logs.join('\n')}</pre><button className="subtle-button" type="button" onClick={async () => { try { await navigator.clipboard.writeText(state.logs.join('\n')); setCopied(true); } catch { setCopied(false); } }}>{copied ? '기록을 복사했어요' : '기록 복사'}</button></details>}
      <div className="result-privacy"><Icon name="shield" width={15} height={15} /><p>이 기기에서 처리됩니다.<br />파일 내용은 서버로 전송되지 않아요.</p></div>
    </section>
  );
}
