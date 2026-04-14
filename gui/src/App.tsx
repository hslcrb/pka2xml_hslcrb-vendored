import { useState } from 'react'
import {
  FileSymlink,
  Settings,
  Terminal,
  Activity,
  ShieldCheck,
  FolderOpen
} from 'lucide-react'

function App() {
  const [inputPath, setInputPath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState('시스템 준비됨')
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const handleOpenFile = async (type: 'input' | 'output') => {
    const filters = type === 'input'
      ? [{ name: 'Packet Tracer Files', extensions: ['pka', 'pkt', 'xml'] }]
      : [{ name: 'Output Files', extensions: ['xml', 'pka', 'pkt'] }]

    const path = await window.electronAPI.openFile({
      properties: ['openFile'],
      filters
    })

    if (path) {
      if (type === 'input') setInputPath(path)
      else setOutputPath(path)
      addLog(`${type === 'input' ? '입력' : '출력'} 파일 선택됨: ${path}`)
    }
  }

  const runCommand = async (action: 'decrypt' | 'encrypt' | 'fix' | 'forge') => {
    const isForge = action === 'forge'

    if (!isForge && !inputPath) {
      addLog('오류: 입력 파일 경로가 필요합니다.')
      return
    }
    if (!outputPath) {
      addLog('오류: 출력 파일 경로가 필요합니다.')
      return
    }

    setIsLoading(true)
    setStatus(`${action.toUpperCase()} 실행 중...`)
    addLog(`작업 시작: ${action}`)

    let args: string[] = []
    if (action === 'decrypt') args = ['-d', inputPath, outputPath]
    else if (action === 'encrypt') args = ['-e', inputPath, outputPath]
    else if (action === 'fix') args = ['-f', inputPath, outputPath]
    else if (action === 'forge') args = ['--forge', outputPath]

    const result = await window.electronAPI.execute(args)

    if (result.success) {
      addLog(`${action} 성공!`)
      if (result.stdout) addLog(`결과: ${result.stdout}`)
      setStatus('작업 완료')
    } else {
      addLog(`오류 발생: ${result.error || result.stderr}`)
      setStatus('작업 실패')
    }
    setIsLoading(false)
  }

  const runGraph = async () => {
    if (!inputPath) {
      addLog('오류: 그래프를 그리려면 XML 파일(입력)이 필요합니다.')
      return
    }
    addLog('그래프 시각화 실행 중...')
    const result = await window.electronAPI.execute(['GRAPH_MODE', inputPath])
    if (!result.success) addLog(`그래프 실행 실패: ${result.error}`)
  }

  return (
    <div className="container">
      <header>
        <h1>pka2xml <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>GUI Premium</span></h1>
        <p className="subtitle">Cisco Packet Tracer 파일 리버싱 및 시각화 시스템</p>
      </header>

      <main className="glass-card">
        <div className="input-group">
          <label className="label">입력 파일 (.pka / .pkt / .xml)</label>
          <div className="file-input-container">
            <input
              type="text"
              placeholder="파일을 선택하거나 경로를 입력하세요..."
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
            />
            <button className="secondary" onClick={() => handleOpenFile('input')}>
              <FolderOpen size={18} />
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="label">출력 파일 경로</label>
          <div className="file-input-container">
            <input
              type="text"
              placeholder="변환된 파일이 저장될 경로..."
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
            />
            <button className="secondary" onClick={() => handleOpenFile('output')}>
              <FolderOpen size={18} />
            </button>
          </div>
        </div>

        <div className="actions">
          <button onClick={() => runCommand('decrypt')} disabled={isLoading}>
            <FileSymlink size={18} style={{ marginRight: '8px' }} /> 복호화 (Decrypt)
          </button>
          <button onClick={() => runCommand('encrypt')} disabled={isLoading}>
            <ShieldCheck size={18} style={{ marginRight: '8px' }} /> 암호화 (Encrypt)
          </button>
          <button className="secondary" onClick={() => runCommand('fix')} disabled={isLoading}>
            <Settings size={18} style={{ marginRight: '8px' }} /> 버전 패치 (Fix)
          </button>
          <button className="secondary" onClick={() => runCommand('forge')} disabled={isLoading}>
            <Activity size={18} style={{ marginRight: '8px' }} /> 인증 우회 (Forge)
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            style={{ width: '100%', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)' }}
            onClick={runGraph}
            disabled={isLoading}
          >
            <Activity size={18} style={{ marginRight: '8px' }} /> 토폴로지 그래프 시각화
          </button>
        </div>
      </main>

      <div className="log-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#94a3b8' }}>
          <Terminal size={14} /> <span>실행 로그</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ color: '#475569', fontStyle: 'italic' }}>로그 데이터가 없습니다.</div>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>

      <footer className="status-bar">
        <div>상태: <span style={{ color: '#e2e8f0' }}>{status}</span></div>
        <div className="badge">v1.0.0-PRO</div>
      </footer>
    </div>
  )
}

export default App
