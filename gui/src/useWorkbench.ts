import { useEffect, useRef, useState } from 'react'
import type { ConversionResult, EngineInfo, Operation } from '../shared/contracts.js'

export type WorkStatus = 'checking' | 'ready' | 'running' | 'success' | 'error' | 'cancelled' | 'unavailable'

export function useWorkbench() {
  const api = window.electronAPI
  const [operation, setSelectedOperation] = useState<Operation>('decrypt')
  const [inputPath, setInputPath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [engine, setEngine] = useState<EngineInfo | null>(null)
  const [status, setStatus] = useState<WorkStatus>('checking')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [notice, setNotice] = useState('')
  const [logs, setLogs] = useState<{ id: number; time: string; text: string }[]>([])
  const [selecting, setSelecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const lock = useRef(false)
  const nextLog = useRef(0)
  const needsInput = operation !== 'forge'
  const needsOutput = operation !== 'nets' && operation !== 'logs'
  const busy = status === 'running' || selecting
  const canRun = Boolean(engine?.available && !busy && (!needsInput || inputPath) && (!needsOutput || outputPath))

  function addLog(text: string) {
    const entry = { id: nextLog.current++, time: new Date().toLocaleTimeString('ko-KR', { hour12: false }), text: text.length > 12000 ? `${text.slice(0, 12000)}\n… 긴 기록은 일부만 표시합니다.` : text }
    setLogs(previous => [...previous.slice(-79), entry])
    setCopied(false)
  }

  useEffect(() => {
    let mounted = true
    if (!api) { setStatus('unavailable'); return }
    api.getEngineInfo().then(info => {
      if (mounted) { setEngine(info); setStatus(info.available ? 'ready' : 'unavailable') }
    }).catch(() => {
      if (mounted) { setStatus('unavailable'); setNotice('변환 엔진과 연결하지 못했습니다. 데스크톱 앱을 다시 열어 주세요.') }
    })
    return () => { mounted = false }
  }, [api])

  function clearResult() {
    setResult(null)
    setNotice('')
    setStatus(engine?.available ? 'ready' : 'unavailable')
  }

  function setOperation(next: Operation) {
    if (busy || lock.current) return
    setSelectedOperation(next)
    setInputPath('')
    setOutputPath('')
    clearResult()
  }

  async function chooseFile(kind: 'input' | 'output') {
    if (!api || busy || lock.current) return
    lock.current = true
    setSelecting(true)
    try {
      const selected = kind === 'input' ? await api.chooseInput(operation) : await api.chooseOutput(operation, inputPath || undefined)
      if (selected) {
        if (kind === 'input') { setInputPath(selected); setOutputPath('') } else setOutputPath(selected)
        clearResult()
        addLog(`${kind === 'input' ? '원본' : '저장 위치'} 선택 · ${selected}`)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '파일 대화상자를 열지 못했습니다.')
      setStatus('error')
    } finally { setSelecting(false); lock.current = false }
  }

  async function run() {
    if (!api || !canRun || lock.current) return
    lock.current = true
    setStatus('running')
    setResult(null)
    setNotice('')
    addLog(`작업 시작 · ${operation}`)
    try {
      const completed = await api.execute({ operation, inputPath: needsInput ? inputPath : undefined, outputPath: needsOutput ? outputPath : undefined })
      setResult(completed)
      setStatus(completed.success ? 'success' : completed.cancelled ? 'cancelled' : 'error')
      setNotice(completed.error ?? '')
      if (completed.success) addLog(`작업 완료 · ${(completed.elapsedMs / 1000).toFixed(2)}초${completed.outputPath ? ` · ${completed.outputPath}` : ''}`)
      else addLog(completed.error ?? '작업을 완료하지 못했습니다.')
      if (completed.stderr) addLog(completed.stderr)
    } catch (error) {
      const message = error instanceof Error ? error.message : '변환 엔진과 연결하지 못했습니다. 다시 시도해 주세요.'
      setNotice(message)
      setStatus('error')
      addLog(message)
    } finally { lock.current = false }
  }

  async function cancel() {
    try { if (await api?.cancel()) addLog('취소 요청을 보냈습니다.') }
    catch { setNotice('취소 요청을 보내지 못했습니다. 잠시 기다려 주세요.') }
  }

  async function reveal() {
    try { if (!await api?.revealOutput()) setNotice('결과 파일을 찾지 못했습니다. 파일이 이동되었는지 확인해 주세요.') }
    catch { setNotice('결과 폴더를 열지 못했습니다. 표시된 저장 경로를 확인해 주세요.') }
  }

  async function copyLogs() {
    try {
      await navigator.clipboard.writeText(logs.map(entry => `[${entry.time}] ${entry.text}`).join('\n'))
      setCopied(true)
    } catch { setNotice('기록을 복사하지 못했습니다. 기록의 텍스트를 직접 선택해 주세요.') }
  }

  function reset() {
    if (busy || lock.current) return
    setInputPath('')
    setOutputPath('')
    clearResult()
  }

  return { operation, setOperation, inputPath, outputPath, engine, status, result, notice, logs, busy, canRun, needsInput, needsOutput, copied, chooseFile, run, cancel, reveal, copyLogs, reset, bridgeAvailable: Boolean(api) }
}
