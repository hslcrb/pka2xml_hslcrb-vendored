import { useWorkbench } from './useWorkbench'
import { operations, type Operation } from '../shared/contracts'

function App() {
  const work = useWorkbench()
  return (
    <div className="container">
      <header><h1>pka2xml · 투명한 작업실</h1><p>파일 속 네트워크를, 조금 더 선명하게.</p></header>
      <main className="glass-card">
        {!work.bridgeAvailable && <p role="status">화면 미리보기입니다. 파일 변환은 데스크톱 앱에서 사용할 수 있습니다.</p>}
        {work.engine && <p>{work.engine.message}</p>}
        <label htmlFor="operation">작업 선택</label>
        <select id="operation" value={work.operation} onChange={event => work.setOperation(event.target.value as Operation)} disabled={work.busy}>
          {operations.map(operation => <option key={operation}>{operation}</option>)}
        </select>
        {work.needsInput && <div className="input-group"><label htmlFor="input">원본 파일</label><div className="file-input-container">
          <input id="input" type="text" value={work.inputPath} readOnly placeholder="파일을 선택해 주세요" />
          <button onClick={() => void work.chooseFile('input')} disabled={work.busy || !work.engine?.available}>파일 선택</button>
        </div></div>}
        {work.needsOutput && <div className="input-group"><label htmlFor="output">저장 위치</label><div className="file-input-container">
          <input id="output" type="text" value={work.outputPath} readOnly placeholder="새 결과 파일의 위치" />
          <button onClick={() => void work.chooseFile('output')} disabled={work.busy || !work.engine?.available}>저장 위치 선택</button>
        </div></div>}
        <button onClick={() => void work.run()} disabled={!work.canRun}>변환 시작</button>
        {work.status === 'running' && <button onClick={() => void work.cancel()}>취소</button>}
        {work.result?.success && work.result.outputPath && <button onClick={() => void work.reveal()}>결과 폴더 열기</button>}
        <p role="status">{work.status}</p>
        {work.notice && <p role={work.status === 'error' ? 'alert' : 'status'}>{work.notice}</p>}
        {work.result?.success && work.result.stdout && <pre>{work.result.stdout.slice(0, 64000)}</pre>}
      </main>
      <section className="log-area" aria-label="작업 기록">
        {work.logs.map(entry => <div key={entry.id}>[{entry.time}] {entry.text}</div>)}
      </section>
      <footer>모든 변환은 이 컴퓨터 안에서 이루어집니다. 토폴로지 시각화는 별도 graph.py 도구를 사용해 주세요.</footer>
    </div>
  )
}

export default App
