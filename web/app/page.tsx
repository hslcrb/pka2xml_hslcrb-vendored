import Link from 'next/link';
import Brand, { SOURCE_URL } from '@/components/Brand';
import Icon from '@/components/Icon';
import WorkbenchPreview from '@/components/WorkbenchPreview';

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">본문으로 건너뛰기</a>
      <header className="site-header container">
        <Brand />
        <nav className="site-nav" aria-label="주 메뉴">
          <a href="#possibilities">기능</a><a href="#start">시작하기</a>
          <a className="nav-source" href={SOURCE_URL}>GitHub <Icon name="external" width={15} height={15} /></a>
          <Link className="button button-small button-ink" href="/workbench" prefetch={false}>워크벤치 <Icon name="arrow" width={16} height={16} /></Link>
        </nav>
      </header>
      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="success-dot" />작은 파일을 위한, 열린 작업실</span>
            <h1 id="hero-title">파일 속 네트워크,<br /><em>투명하게</em> 꺼내세요.</h1>
            <p className="hero-description">Packet Tracer 파일과 XML 사이를 가볍게.<br className="desktop-break" /> 읽고, 살펴보고, 다시 담는 모든 순간을<br className="desktop-break" /> 내 컴퓨터 안에서 이어가세요.</p>
            <div className="hero-actions"><Link href="/workbench" prefetch={false} className="button button-primary">브라우저에서 시작 <Icon name="arrow" /></Link><a href={SOURCE_URL} className="text-link">소스 살펴보기 <Icon name="external" width={18} height={18} /></a></div>
            <p className="hero-footnote"><span>설치 없이 시작</span><span>파일 업로드 없이 변환</span></p>
          </div>
          <WorkbenchPreview />
        </section>
        <section className="format-ribbon container" aria-label="지원하는 작업 환경과 형식">
          <span>하나의 엔진.<br /><strong>당신에게 맞는 작업 방식.</strong></span>
          <div><Icon name="window" /><span>Web</span><i />Desktop<i /><span>CLI</span></div>
          <p><code>.pka</code><span>·</span><code>.pkt</code><Icon name="swap" /><code>.xml</code></p>
          <span className="ribbon-license">OPEN SOURCE<br /><strong>GPL-3.0</strong></span>
        </section>
        <section className="possibilities container section-space" id="possibilities" aria-labelledby="possibilities-title">
          <div className="section-heading"><div><span className="eyebrow">01 / A CLEARER VIEW</span><h2 id="possibilities-title">열어서 이해하고,<br />다음 작업으로.</h2></div><p>익숙한 파일에 새로운 시야를.<br />복잡한 과정은 엔진에 맡기고,<br />중요한 내용에 집중하세요.</p></div>
          <div className="capability-grid">
            <article className="capability"><span className="capability-number">01</span><div className="capability-visual visual-open" aria-hidden="true"><span>.pka</span><Icon name="arrow" /><strong>&lt;xml&gt;</strong></div><h3>안에 무엇이 있는지.</h3><p>PKA·PKT 파일을 XML로 풀어 네트워크 구성과 활동 데이터를 살펴보세요.</p><span className="feature-code">pka2xml -d</span></article>
            <article className="capability"><span className="capability-number">02</span><div className="capability-visual visual-pack" aria-hidden="true"><strong>&lt;xml&gt;</strong><Icon name="arrow" /><span>.pka</span></div><h3>다시 파일로, 차곡차곡.</h3><p>XML을 Packet Tracer 형식으로 패키징하세요. 읽기와 쓰기가 하나의 흐름으로 이어집니다.</p><span className="feature-code">pka2xml -e</span></article>
            <article className="capability"><span className="capability-number">03</span><div className="capability-visual visual-patch" aria-hidden="true"><span className="patch-sheet"><Icon name="file" width={39} height={39} /></span><span className="patch-spark"><Icon name="spark" /></span></div><h3>버전 사이를 조금 더 쉽게.</h3><p>파일의 버전 표시를 조정하세요. 실제 호환성은 파일 내용과 Packet Tracer 버전에 따라 달라집니다.</p><span className="feature-code">pka2xml -f</span></article>
          </div>
        </section>
        <section className="philosophy-wrap" aria-labelledby="philosophy-title">
          <div className="philosophy container">
            <div className="philosophy-art" aria-hidden="true"><div className="glass-sheet sheet-back" /><div className="glass-sheet sheet-front"><Icon name="shield" width={76} height={76} /><span>LOCAL, BY DESIGN.</span></div><span className="art-label">작업의 중심은<br />언제나 당신의 컴퓨터.</span></div>
            <div className="philosophy-copy"><span className="eyebrow">02 / TRANSPARENT BY DESIGN</span><h2 id="philosophy-title">보이는 도구.<br />머무르는 파일.</h2><p>좋은 도구는 무엇을 하는지 숨기지 않습니다. pka2xml은 열린 소스와 로컬 처리로, 파일을 이해하는 과정을 당신의 손에 남깁니다.</p><div className="principle"><Icon name="shield" /><div><h3>파일은 브라우저 안에서</h3><p>WebAssembly 엔진이 이 기기에서 처리합니다. 선택한 파일 내용을 서버로 전송하지 않습니다.</p></div></div><div className="principle"><Icon name="code" /><div><h3>작동 방식은 누구에게나</h3><p>공유하는 C++ 엔진부터 각 인터페이스까지. 코드를 읽고, 개선하고, 함께 만들 수 있습니다.</p></div></div><a className="text-link" href={`${SOURCE_URL}#readme`}>프로젝트 알아보기 <Icon name="external" width={17} height={17} /></a></div>
          </div>
        </section>
        <section className="getting-started container section-space" id="start" aria-labelledby="start-title">
          <div className="section-heading"><div><span className="eyebrow">03 / MAKE YOURSELF AT HOME</span><h2 id="start-title">편한 곳에서<br />시작하면 됩니다.</h2></div><p>지금은 브라우저로 가볍게.<br />더 깊은 작업은 소스에서 시작하세요.</p></div>
          <div className="start-grid"><article className="start-browser glass"><span className="small-tag">가장 빠른 시작</span><Icon name="window" width={32} height={32} /><h3>브라우저 워크벤치</h3><p>파일을 고르고 변환한 뒤 내려받으세요. 클릭이 편하면 GUI, 명령어가 편하면 콘솔.</p><Link href="/workbench" prefetch={false} className="button button-primary">워크벤치 열기 <Icon name="arrow" /></Link><small>첫 변환 시 엔진을 불러옵니다. 이후 파일 처리는 로컬에서 실행됩니다.</small></article><article className="start-source"><span className="eyebrow">FOR YOUR OWN WORKSPACE</span><h3>데스크톱 & 커맨드라인</h3><p>저장소의 소스로 직접 빌드해 사용하세요. 환경별 준비 사항과 실행 방법은 프로젝트 문서에서 확인할 수 있습니다.</p><div className="source-terminal"><div><span className="terminal-dot" />터미널 · 빌드 후 사용 예시</div><code><span>$</span> pka2xml -d campus.pka campus.xml</code></div><div className="source-actions"><a href={`${SOURCE_URL}#readme`} className="text-link">빌드 안내 보기 <Icon name="external" width={17} height={17} /></a><a href={`${SOURCE_URL}/archive/refs/heads/master.zip`} className="text-link">소스 ZIP <Icon name="download" width={17} height={17} /></a></div><small>미리 빌드된 설치 프로그램 대신, 현재 제공되는 소스와 빌드 안내를 연결합니다.</small></article></div>
        </section>
        <section className="faq container" aria-labelledby="faq-title"><div><span className="eyebrow">A FEW GOOD QUESTIONS</span><h2 id="faq-title">시작 전, 궁금한 것들.</h2></div><div className="faq-list"><details><summary>파일이 서버에 업로드되나요?<Icon name="chevron" /></summary><p>아니요. 웹 화면과 변환 엔진을 내려받은 후, 선택한 파일은 브라우저의 메모리에서 처리합니다. 변환 결과도 이 기기에서 직접 내려받습니다.</p></details><details><summary>어떤 파일을 사용할 수 있나요?<Icon name="chevron" /></summary><p>기본 작업은 PKA·PKT를 XML로 변환하기, XML을 PKA·PKT로 패키징하기, 버전 표시 패치입니다. 워크벤치의 고급 작업에서는 nets·로그 해독과 인증 파일 생성을 사용할 수 있습니다. 웹 입력 파일은 최대 32 MiB입니다.</p></details><details><summary>모든 Packet Tracer 버전과 호환되나요?<Icon name="chevron" /></summary><p>모든 버전과 파일을 보장하지는 않습니다. 형식이나 내부 기능의 차이로 변환에 실패하거나, 결과를 Packet Tracer에서 열 수 없을 수 있습니다. 원본을 보관하고 작업할 파일의 복사본으로 시작하세요.</p></details><details><summary>프로젝트에 참여하고 싶어요.<Icon name="chevron" /></summary><p>재현 가능한 버그 제보, 문서 개선, 코드 기여를 환영합니다. <a href={SOURCE_URL}>GitHub 저장소</a>에서 소스와 기여 안내를 확인하세요. 프로젝트는 GPL-3.0으로 공개되어 있습니다.</p></details></div></section>
      </main>
      <footer className="site-footer container"><div><Brand compact /><p>파일 속 가능성을, 더 가까이.</p></div><div className="footer-links"><a href={SOURCE_URL}>GitHub <Icon name="external" width={14} height={14} /></a><a href={`${SOURCE_URL}/blob/master/LICENSE`}>GPL-3.0</a><span>독립적인 오픈소스 프로젝트</span></div></footer>
    </div>
  );
}
