/* global createPka2xml */
'use strict';

// This worker owns the engine and all in-memory input/output files.
const MAX_INPUT_BYTES = 32 * 1024 * 1024;
const MAX_STDOUT_BYTES = 32 * 1024 * 1024;
let enginePromise = null;
let currentLog = null;
let queue = Promise.resolve();

function record(text, error = false) {
  if (!currentLog) return;
  const line = String(text);
  if (!error && currentLog.captureStdout) {
    currentLog.stdoutSize += line.length + 1;
    if (currentLog.stdoutSize > MAX_STDOUT_BYTES) throw new Error('텍스트 결과가 32 MiB를 초과했습니다. CLI를 이용해 주세요.');
    currentLog.stdout.push(line);
  }
  if (currentLog.lines.length < 100) {
    currentLog.lines.push((error ? '[ERR] ' : '') + line.slice(0, 4096));
  } else if (currentLog.lines.length === 100) {
    currentLog.lines.push('긴 로그는 여기서 줄였습니다. 결과 파일에는 영향을 주지 않습니다.');
  }
}

async function engine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      if (typeof createPka2xml !== 'function') {
        importScripts(new URL('pka2xml.js', self.location.href).href);
      }
      return createPka2xml({
        noInitialRun: true,
        locateFile: (name) => new URL(name, self.location.href).href,
        print: (text) => record(text),
        printErr: (text) => record(text, true),
      });
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

function command(args, data) {
  if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
    throw new Error('명령어 인자를 확인해 주세요.');
  }
  const flag = args[0];
  const arity = { '-d': 3, '-e': 3, '-f': 3, '-nets': 2, '-logs': 2, '--forge': 2 }[flag];
  if (!arity || args.length !== arity) throw new Error('지원하지 않는 명령 또는 잘못된 인자 수입니다. help에서 사용법을 확인하세요.');
  if (args.slice(1).some((name) => !name.trim() || name === '.' || name === '..' || /[\u0000-\u001f/\\]/.test(name))) {
    throw new Error('브라우저에서는 폴더 경로 없이 파일 이름만 사용해 주세요.');
  }
  if (!(data instanceof Uint8Array)) throw new Error('입력 파일을 읽을 수 없습니다.');
  if (data.byteLength > MAX_INPUT_BYTES) throw new Error('브라우저에서는 32 MiB 이하 파일을 선택해 주세요. 더 큰 파일은 CLI에서 처리할 수 있습니다.');
  if (flag !== '--forge' && data.byteLength === 0) throw new Error('비어 있는 파일입니다. 다른 파일을 선택해 주세요.');
  if (flag === '--forge') return { args: [flag, '/job-output'], input: false, stdout: false };
  if (arity === 2) return { args: [flag, '/job-input'], input: true, stdout: true };
  return { args: [flag, '/job-input', '/job-output'], input: true, stdout: false };
}

async function convert(data, args) {
  let mod;
  const log = { lines: [], stdout: [], stdoutSize: 0, captureStdout: false };
  try {
    const job = command(args, data);
    log.captureStdout = job.stdout;
    currentLog = log;
    mod = await engine();
    // Fixed virtual names prevent path traversal; download names stay in the UI.
    if (job.input) mod.FS.writeFile('/job-input', data);
    const exitCode = mod.callMain([...job.args]);
    if (exitCode !== 0) {
      enginePromise = null;
      if (!log.lines.length) log.lines.push('변환에 실패했습니다. 파일 형식과 명령을 확인해 주세요.');
      return { success: false, logs: log.lines, exitCode: Number.isFinite(exitCode) ? exitCode : -1 };
    }
    const output = job.stdout
      ? new TextEncoder().encode(log.stdout.join('\n') + (log.stdout.length ? '\n' : ''))
      : new Uint8Array(mod.FS.readFile('/job-output'));
    if (!output.byteLength) throw new Error('엔진이 결과 파일을 만들지 않았습니다. 입력 형식과 모드를 확인해 주세요.');
    return { success: true, output, logs: log.lines, exitCode: 0 };
  } catch (error) {
    // A trap must not poison the next conversion.
    enginePromise = null;
    log.lines.push('[ERR] ' + (error instanceof Error ? error.message : String(error)));
    return { success: false, logs: log.lines, exitCode: -1 };
  } finally {
    if (mod) {
      for (const name of ['/job-input', '/job-output']) {
        try { mod.FS.unlink(name); } catch { /* The file may not exist. */ }
      }
    }
    currentLog = null;
  }
}

self.onmessage = ({ data: message }) => {
  if (!message || !Number.isSafeInteger(message.id)) return;
  queue = queue.then(async () => {
    if (message.type === 'init') {
      try {
        await engine();
        self.postMessage({ id: message.id, type: 'ready' });
      } catch (error) {
        self.postMessage({ id: message.id, type: 'error', message: String(error) });
      }
      return;
    }
    if (message.type !== 'convert') {
      self.postMessage({ id: message.id, type: 'error', message: '알 수 없는 작업입니다.' });
      return;
    }
    const result = await convert(message.data, message.args);
    self.postMessage({ id: message.id, type: 'result', result }, result.output ? [result.output.buffer] : []);
  }).catch((error) => {
    enginePromise = null;
    self.postMessage({ id: message.id, type: 'error', message: String(error) });
  });
};
