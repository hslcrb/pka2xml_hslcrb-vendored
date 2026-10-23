import { execFile, type ExecFileException } from 'node:child_process'
import { mkdtemp, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { operations, type ConversionRequest, type ConversionResult } from '../shared/contracts.js'

const flags = { decrypt: '-d', encrypt: '-e', fix: '-f', forge: '--forge', nets: '-nets', logs: '-logs' } as const
const stdoutOperations = new Set(['nets', 'logs'])

function absolutePath(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value || value.length > 4096 || value.includes('\0') || !path.isAbsolute(value)) {
    throw new Error(`${label}의 전체 경로를 선택해 주세요.`)
  }
  return path.resolve(value)
}

export function validateRequest(value: unknown): ConversionRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('올바른 작업을 선택해 주세요.')
  const request = value as Record<string, unknown>
  if (!operations.includes(request.operation as ConversionRequest['operation'])) throw new Error('지원하지 않는 작업입니다.')
  if (Object.keys(request).some(key => !['operation', 'inputPath', 'outputPath'].includes(key))) throw new Error('알 수 없는 작업 옵션입니다.')
  const operation = request.operation as ConversionRequest['operation']
  const inputPath = operation === 'forge' ? undefined : absolutePath(request.inputPath, '원본 파일')
  const outputPath = stdoutOperations.has(operation) ? undefined : absolutePath(request.outputPath, '결과 파일')
  if (inputPath && inputPath === outputPath) throw new Error('원본과 결과에 같은 파일을 사용할 수 없습니다.')
  return { operation, inputPath, outputPath }
}

export function buildArguments(request: ConversionRequest, outputPath?: string): string[] {
  const validated = validateRequest(request)
  return [flags[validated.operation], validated.inputPath, outputPath ?? validated.outputPath].filter((argument): argument is string => argument !== undefined)
}

export function binaryPathFor(appRoot: string, resourcesPath: string, packaged: boolean): string {
  return packaged ? path.join(resourcesPath, 'bin', 'pka2xml') : path.resolve(appRoot, '..', 'pka2xml')
}

function messageFor(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code
  if (code === 'ENOENT') return '파일 또는 변환 엔진을 찾을 수 없습니다. 경로와 설치 상태를 확인해 주세요.'
  if (code === 'EACCES' || code === 'EPERM') return '파일을 읽거나 저장할 권한이 없습니다. 다른 위치를 선택해 주세요.'
  if (code === 'ENOEXEC') return '이 컴퓨터에서 실행할 수 없는 변환 엔진입니다. 플랫폼에 맞는 엔진을 준비해 주세요.'
  return error instanceof Error ? error.message : '작업을 완료하지 못했습니다. 파일과 저장 위치를 확인해 주세요.'
}

export async function executeConversion(
  binaryPath: string,
  request: unknown,
  signal?: AbortSignal,
  timeoutMs = 120_000,
): Promise<ConversionResult> {
  const startedAt = Date.now()
  let temporaryDirectory: string | undefined
  let stdout = ''
  let stderr = ''
  let exitCode: number | null = null
  try {
    const validated = validateRequest(request)
    if (signal?.aborted) throw new Error('작업을 취소했습니다.')
    const input = validated.inputPath ? await stat(validated.inputPath) : undefined
    if (input && !input.isFile()) throw new Error('원본으로 일반 파일을 선택해 주세요.')
    if (validated.outputPath) {
      const output = await stat(validated.outputPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined
        throw error
      })
      if (output && !output.isFile()) throw new Error('결과 경로에 폴더가 있습니다. 파일 이름을 지정해 주세요.')
      if (input && output && input.dev === output.dev && input.ino === output.ino) throw new Error('원본과 결과에 같은 파일을 사용할 수 없습니다.')
      temporaryDirectory = await mkdtemp(path.join(path.dirname(validated.outputPath), '.pka2xml-'))
    }
    const temporaryOutput = temporaryDirectory ? path.join(temporaryDirectory, 'result') : undefined
    const result = await new Promise<{ stdout: string; stderr: string; error: ExecFileException | null }>(resolve => {
      execFile(binaryPath, buildArguments(validated, temporaryOutput), {
        shell: false,
        windowsHide: true,
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: timeoutMs,
        killSignal: 'SIGKILL',
        signal,
      }, (error, output, errors) => resolve({ error, stdout: output, stderr: errors }))
    })
    stdout = result.stdout
    stderr = result.stderr
    exitCode = result.error ? (typeof result.error.code === 'number' ? result.error.code : null) : 0
    if (signal?.aborted) throw new Error('작업을 취소했습니다. 기존 결과 파일은 유지됩니다.')
    if (result.error) {
      if (result.error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') throw new Error('결과 로그가 4 MiB를 넘었습니다. 큰 로그 파일은 명령줄 도구로 처리해 주세요.')
      if (result.error.killed) throw new Error('작업 시간이 초과되었습니다. 파일을 확인하고 다시 시도해 주세요.')
      throw new Error(stderr.trim() || messageFor(result.error))
    }
    if (temporaryOutput && validated.outputPath) {
      const output = await stat(temporaryOutput)
      if (!output.isFile()) throw new Error('변환 엔진이 결과 파일을 만들지 못했습니다.')
      await rename(temporaryOutput, validated.outputPath)
    }
    return { success: true, cancelled: false, stdout, stderr, outputPath: validated.outputPath, elapsedMs: Date.now() - startedAt, exitCode }
  } catch (error) {
    return { success: false, cancelled: signal?.aborted ?? false, stdout, stderr, error: messageFor(error), elapsedMs: Date.now() - startedAt, exitCode }
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => undefined)
  }
}
