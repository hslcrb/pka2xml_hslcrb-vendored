'use client';
import { useId, useState } from 'react';
import Icon from './Icon';
import { formatSize } from '@/lib/conversion';

export default function FilePicker({ file, accept = '', disabled = false, onFile, onReject }: { file: File | null; accept?: string; disabled?: boolean; onFile: (file: File | null) => void; onReject: (message: string) => void }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <div className={`file-drop ${dragging ? 'is-dragging' : ''} ${file ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); if (disabled) return; if (event.dataTransfer.files.length !== 1) { onReject('한 번에 하나의 파일을 선택해 주세요.'); return; } onFile(event.dataTransfer.files[0]); }}>
        <input data-testid="file-input" className="sr-only" id={id} type="file" accept={accept} disabled={disabled} onChange={event => { const selected = event.currentTarget.files?.[0]; if (selected) onFile(selected); event.currentTarget.value = ''; }} />
        <label htmlFor={id} className="file-drop-label">
          <span className="upload-emblem"><Icon name={file ? 'file' : 'upload'} width={27} height={27} /></span>
          {file ? <><strong className="selected-filename">{file.name}</strong><span>{formatSize(file.size)} · 클릭해서 다른 파일 선택</span></> : <><strong>파일을 이곳에 놓아주세요.</strong><span>또는 <span className="file-browse">파일 찾아보기</span></span><small>{accept ? accept.replaceAll(',', ' · ').toUpperCase() : '파일 하나 선택'} <i />최대 32 MiB</small></>}
        </label>
      </div>
      {file && !disabled && <button className="subtle-button remove-file" type="button" onClick={() => onFile(null)}><Icon name="close" width={13} height={13} />선택 해제</button>}
    </div>
  );
}
