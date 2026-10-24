import { MAX_INPUT_BYTES } from './wasmLoader';

export type Mode = 'decrypt' | 'encrypt' | 'patch' | 'nets' | 'logs' | 'forge';
export const MODES: Record<Mode, { flag: string; title: string; description: string; accept: string; extensions: string[]; output: string; input: boolean; text: boolean }> = {
  decrypt: { flag: '-d', title: 'XML로 열기', description: 'PKA·PKT 안의 내용을 읽을 수 있는 XML로 꺼냅니다.', accept: '.pka,.pkt', extensions: ['pka', 'pkt'], output: '.xml', input: true, text: true },
  encrypt: { flag: '-e', title: '다시 패키징', description: 'XML을 Packet Tracer 파일로 다시 담습니다.', accept: '.xml', extensions: ['xml'], output: '.pka', input: true, text: false },
  patch: { flag: '-f', title: '버전 패치', description: '파일의 버전 표시를 조정합니다. 실제 호환성은 내부 기능과 Packet Tracer 버전에 따라 달라집니다.', accept: '.pka,.pkt', extensions: ['pka', 'pkt'], output: '.pkt', input: true, text: false },
  nets: { flag: '-nets', title: 'nets 해독', description: 'Packet Tracer의 nets 데이터를 텍스트로 읽습니다.', accept: '', extensions: ['nets', 'txt', ''], output: '.txt', input: true, text: true },
  logs: { flag: '-logs', title: '로그 해독', description: 'Packet Tracer 로그를 한 줄씩 해독해 텍스트로 저장합니다.', accept: '.log,.txt', extensions: ['log', 'txt'], output: '.txt', input: true, text: true },
  forge: { flag: '--forge', title: '인증 파일 생성', description: '기존 CLI의 --forge 기능으로 인증 데이터를 생성합니다. 입력 파일은 필요하지 않습니다.', accept: '', extensions: [], output: '.txt', input: false, text: false },
};
export const PRIMARY_MODES: Mode[] = ['decrypt', 'encrypt', 'patch'];
export const ADVANCED_MODES: Mode[] = ['nets', 'logs', 'forge'];

export function extension(name: string) { return name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''; }
export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
export function validateFile(file: Pick<File, 'name' | 'size'>, mode: Mode): string | null {
  if (!file.size) return '비어 있는 파일입니다. 내용이 있는 파일을 선택해 주세요.';
  if (file.size > MAX_INPUT_BYTES) return '웹에서는 최대 32 MiB까지 변환할 수 있어요. 더 큰 파일은 CLI를 이용해 주세요.';
  if (!MODES[mode].extensions.includes(extension(file.name))) return `${MODES[mode].title}에 맞는 파일을 선택해 주세요. 지원 형식: ${MODES[mode].extensions.map(ext => ext ? `.${ext}` : '확장자 없는 파일').join(', ')}`;
  return null;
}
export function outputName(file: Pick<File, 'name'> | null, mode: Mode, encryptExtension = '.pka') {
  if (mode === 'forge') return 'auth.txt';
  const name = file?.name || 'output';
  const base = name.replace(/\.[^.]+$/, '');
  const suffix = mode === 'patch' ? '_patched' : mode === 'nets' || mode === 'logs' ? '_decoded' : '';
  const ext = mode === 'encrypt' ? encryptExtension : mode === 'patch' ? `.${extension(name) || 'pkt'}` : MODES[mode].output;
  return `${base}${suffix}${ext}`;
}
export function engineArgs(mode: Mode, file: Pick<File, 'name'> | null, name: string) {
  const cfg = MODES[mode];
  if (!cfg.input) return [cfg.flag, `output.${extension(name) || 'txt'}`];
  const input = `input.${extension(file?.name || '') || 'dat'}`;
  return mode === 'nets' || mode === 'logs' ? [cfg.flag, input] : [cfg.flag, input, `output.${extension(name)}`];
}
export function quoteName(value: string) { return /[\s"'\\]/.test(value) ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : value; }
export function commandFor(mode: Mode, file: Pick<File, 'name'> | null, name: string) {
  return ['pka2xml', MODES[mode].flag, ...(MODES[mode].input ? [quoteName(file?.name || (mode === 'encrypt' ? 'input.xml' : 'input.pka'))] : []), ...(mode === 'nets' || mode === 'logs' ? [] : [quoteName(name)])].join(' ');
}

/** Tokenizes names only; this is a browser command interface, never a shell. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let word = '', quote = '', started = false;
  if (/[\r\n\0]/.test(input)) throw new Error('한 줄의 명령어를 입력해 주세요.');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '\\' && quote !== "'" && i + 1 < input.length && /[\s"'\\]/.test(input[i + 1])) { word += input[++i]; started = true; continue; }
    if (quote) { if (c === quote) quote = ''; else word += c; started = true; continue; }
    if (c === '"' || c === "'") { quote = c; started = true; continue; }
    if (/\s/.test(c)) { if (started) { tokens.push(word); word = ''; started = false; } }
    else { word += c; started = true; }
  }
  if (quote) throw new Error('파일 이름의 따옴표가 닫히지 않았어요.');
  if (started) tokens.push(word);
  return tokens;
}
export type ParsedCommand = { kind: 'help' | 'clear' | 'ls' | 'download' } | { kind: 'convert'; mode: Mode; inputName: string | null; outputName: string };
function validateName(name: string) {
  if (!name || name === '.' || name === '..' || /^-/.test(name) || /[/\\\u0000-\u001f]/.test(name)) throw new Error('폴더 경로 대신 파일 이름만 입력해 주세요. 공백이 있으면 따옴표로 감싸세요.');
}
export function parseCommand(input: string): ParsedCommand {
  const parts = tokenize(input.trim());
  if (!parts.length) throw new Error('명령어를 입력해 주세요. help로 사용법을 볼 수 있어요.');
  if (['help', 'clear', 'ls', 'download'].includes(parts[0])) {
    if (parts.length !== 1) throw new Error(`${parts[0]}에는 추가 인자가 필요하지 않습니다.`);
    return { kind: parts[0] as 'help' | 'clear' | 'ls' | 'download' };
  }
  if (parts[0] !== 'pka2xml') throw new Error('사용할 수 있는 명령: pka2xml, help, clear, ls, download');
  if (parts.length === 1 || (parts.length === 2 && ['-h', '--help'].includes(parts[1]))) return { kind: 'help' };
  const mode = (Object.keys(MODES) as Mode[]).find(key => MODES[key].flag === parts[1]);
  if (!mode) throw new Error('지원하는 옵션: -d, -e, -f, -nets, -logs, --forge');
  const short = mode === 'forge' || mode === 'nets' || mode === 'logs';
  if (parts.length !== (short ? 3 : 4)) throw new Error(`사용법: pka2xml ${MODES[mode].flag} ${mode === 'forge' ? '<출력파일>' : short ? '<입력파일>' : '<입력파일> <출력파일>'}`);
  parts.slice(2).forEach(validateName);
  const inputName = mode === 'forge' ? null : parts[2];
  const name = mode === 'nets' || mode === 'logs' ? outputName({ name: parts[2] }, mode) : parts.at(-1)!;
  const validOutputs = mode === 'decrypt' ? ['xml'] : mode === 'encrypt' || mode === 'patch' ? ['pka', 'pkt'] : null;
  if (validOutputs && !validOutputs.includes(extension(name))) throw new Error(`출력 파일의 확장자는 ${validOutputs.map(ext => `.${ext}`).join(' 또는 ')}로 지정해 주세요.`);
  return { kind: 'convert', mode, inputName, outputName: name };
}
export function downloadBytes(data: Uint8Array, name: string) {
  const bytes = new Uint8Array(data);
  const url = URL.createObjectURL(new Blob([bytes], { type: extension(name) === 'xml' ? 'application/xml' : 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
