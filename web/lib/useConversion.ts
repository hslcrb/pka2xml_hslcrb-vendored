'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelConversion, runPka2xml } from './wasmLoader';
import { engineArgs, MODES, validateFile, type Mode } from './conversion';

type Phase = 'idle' | 'running' | 'done' | 'error' | 'cancelled';
export interface ConversionState { phase: Phase; message: string; logs: string[]; output: Uint8Array<ArrayBuffer> | null; name: string; text: boolean; elapsed: number }
const EMPTY: ConversionState = { phase: 'idle', message: '', logs: [], output: null, name: '', text: false, elapsed: 0 };

export function useConversion() {
  const [state, setState] = useState<ConversionState>(EMPTY);
  const generation = useRef(0);
  const active = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (active.current) cancelConversion(); active.current = false; }; }, []);
  const reset = useCallback(() => { generation.current++; if (active.current) cancelConversion(); active.current = false; setState(EMPTY); }, []);
  const fail = useCallback((message: string) => { generation.current++; setState({ ...EMPTY, phase: 'error', message }); }, []);
  const cancel = useCallback(() => { generation.current++; if (active.current) cancelConversion(); active.current = false; setState({ ...EMPTY, phase: 'cancelled', message: '작업을 취소했어요. 준비가 되면 다시 시작하세요.' }); }, []);
  const run = useCallback(async (file: File | null, mode: Mode, name: string): Promise<ConversionState | null> => {
    if (active.current) return null;
    const validation = MODES[mode].input ? !file ? '먼저 파일을 선택해 주세요.' : validateFile(file, mode) : null;
    if (validation) { fail(validation); return null; }
    const id = ++generation.current;
    active.current = true;
    setState({ ...EMPTY, phase: 'running', message: '엔진을 준비하고 파일을 변환하고 있어요.' });
    const started = performance.now();
    try {
      const bytes = MODES[mode].input && file ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array();
      if (id !== generation.current || !mounted.current) return null;
      const result = await runPka2xml(bytes, engineArgs(mode, file, name));
      if (id !== generation.current || !mounted.current) return null;
      const logs = result.logs.slice(-100).map(line => line.slice(0, 4000));
      const next: ConversionState = result.success && result.output !== undefined
        ? { phase: 'done', output: result.output, name, text: MODES[mode].text, message: '변환을 마쳤어요.', logs, elapsed: performance.now() - started }
        : { ...EMPTY, phase: result.exitCode === -2 ? 'cancelled' : 'error', message: logs.at(-1) || '파일을 변환하지 못했어요. 형식과 파일 내용을 확인한 뒤 다시 시도해 주세요.', logs };
      setState(next);
      return next;
    } catch (error) {
      if (id !== generation.current || !mounted.current) return null;
      const next: ConversionState = { ...EMPTY, phase: 'error', message: error instanceof Error ? error.message : '파일을 읽지 못했어요. 다시 선택해 주세요.' };
      setState(next);
      return next;
    } finally { if (id === generation.current) active.current = false; }
  }, [fail]);
  return { state, busy: state.phase === 'running', run, reset, fail, cancel };
}
