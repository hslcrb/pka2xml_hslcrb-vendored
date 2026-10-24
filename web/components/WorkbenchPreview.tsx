import Icon from './Icon';

/** A labelled static preview; no engine or client code is loaded. */
export default function WorkbenchPreview() {
  return (
    <figure className="preview-scene" aria-label="변환 워크벤치 예시: campus.pka 파일을 campus.xml로 변환한 모습">
      <div className="preview-orbit orbit-one" aria-hidden="true" />
      <div className="preview-orbit orbit-two" aria-hidden="true" />
      <div className="preview-window glass">
        <div className="preview-toolbar"><div className="window-dots" aria-hidden="true"><i /><i /><i /></div><span>pka2xml / workbench</span><Icon name="shield" width={16} height={16} /></div>
        <div className="preview-body">
          <div className="preview-heading"><span className="eyebrow">YOUR FILE. A LITTLE CLEARER.</span><span className="small-tag">로컬 변환</span></div>
          <h2>무엇을 꺼내볼까요?</h2>
          <div className="preview-modes"><span className="selected">XML로 열기</span><span>다시 패키징</span><span>버전 패치</span></div>
          <div className="preview-file"><span className="file-tile"><Icon name="file" /></span><div><strong>campus.pka</strong><small>Packet Tracer activity</small></div><span className="preview-tick"><Icon name="check" width={16} height={16} /></span></div>
          <div className="preview-flow"><span /><Icon name="arrow" width={16} height={16} /><span /></div>
          <div className="preview-result"><div><span className="success-dot" />변환을 마쳤어요.<strong>campus.xml</strong></div><span className="preview-download"><Icon name="download" width={18} height={18} /></span></div>
          <div className="preview-code" aria-hidden="true"><span className="code-muted">01</span> <span>&lt;PACKETTRACER5&gt;</span><br /><span className="code-muted">02</span> &nbsp;&nbsp;&lt;NETWORK&gt;…&lt;/NETWORK&gt;<br /><span className="code-muted">03</span> <span>&lt;/PACKETTRACER5&gt;</span></div>
        </div>
      </div>
      <figcaption><span className="caption-line" />워크벤치 미리보기 · 예시 파일</figcaption>
      <span className="floating-note"><Icon name="spark" width={17} height={17} />파일 속 가능성을, 더 가까이.</span>
    </figure>
  );
}
