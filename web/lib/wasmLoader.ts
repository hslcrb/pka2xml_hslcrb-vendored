/** Lazy, cancellable browser bridge. The engine only runs in a worker. */
export const MAX_INPUT_BYTES = 32 * 1024 * 1024;
const JOB_TIMEOUT_MS = 60_000;

export interface ConvertResult {
  success: boolean;
  output?: Uint8Array<ArrayBuffer>;
  logs: string[];
  exitCode: number;
}

interface WorkerReply {
  id: number;
  type: 'ready' | 'result' | 'error';
  result?: ConvertResult;
  message?: string;
}

interface PendingRequest {
  resolve: (reply: WorkerReply) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let readiness: Promise<void> | null = null;
let nextId = 0;
let converting = false;
const pending = new Map<number, PendingRequest>();

function resetWorker(reason: Error) {
  worker?.terminate();
  worker = null;
  readiness = null;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(reason);
  }
  pending.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  if (typeof Worker === 'undefined') throw new Error('이 브라우저는 Web Worker를 지원하지 않습니다. 최신 브라우저 또는 CLI를 이용해 주세요.');
  const instance = new Worker('/converter.worker.js', { name: 'pka2xml-engine' });
  worker = instance;
  instance.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
    if (instance !== worker) return;
    const request = pending.get(data.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(data.id);
    if (data.type === 'error') request.reject(new Error(data.message || '변환 엔진에서 오류가 발생했습니다.'));
    else request.resolve(data);
  };
  instance.onerror = () => {
    if (instance === worker) resetWorker(new Error('변환 엔진을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'));
  };
  instance.onmessageerror = () => {
    if (instance === worker) resetWorker(new Error('변환 결과를 읽지 못했습니다. 다시 시도해 주세요.'));
  };
  return instance;
}

function request(type: 'init' | 'convert', data?: Uint8Array<ArrayBuffer>, args?: string[]): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    const instance = getWorker();
    const id = ++nextId;
    const timer = setTimeout(() => {
      resetWorker(new Error('작업이 60초를 초과해 중단했습니다. 파일을 확인하거나 CLI에서 다시 시도해 주세요.'));
    }, JOB_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    try {
      instance.postMessage({ id, type, data, args }, data ? [data.buffer] : []);
    } catch (error) {
      clearTimeout(timer);
      pending.delete(id);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/** Resolves only after the WASM engine is actually instantiated. */
export function loadWasm(): Promise<void> {
  if (!readiness) {
    readiness = request('init').then(() => undefined).catch((error) => {
      readiness = null;
      throw error;
    });
  }
  return readiness;
}

/** Stops computation immediately; the next run creates a fresh engine. */
export function cancelConversion(): void {
  resetWorker(new Error('변환을 취소했습니다. 원본 파일은 그대로입니다.'));
}

export async function runPka2xml(inputData: Uint8Array, args: string[]): Promise<ConvertResult> {
  if (converting) return { success: false, logs: ['진행 중인 작업이 있습니다. 완료하거나 취소한 뒤 다시 시도해 주세요.'], exitCode: -1 };
  if (inputData.byteLength > MAX_INPUT_BYTES) {
    return { success: false, logs: ['브라우저에서는 32 MiB 이하 파일을 선택해 주세요.'], exitCode: -1 };
  }
  converting = true;
  try {
    await loadWasm();
    // Transfer a copy so callers can reuse their original input.
    const data = new Uint8Array(inputData);
    const reply = await request('convert', data, [...args]);
    if (!reply.result) throw new Error('변환 결과가 비어 있습니다. 다시 시도해 주세요.');
    return reply.result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, logs: [message], exitCode: message.includes('취소') ? -2 : -1 };
  } finally {
    converting = false;
  }
}
