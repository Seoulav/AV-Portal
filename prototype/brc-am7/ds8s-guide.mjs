// W-20261013-006: DS-8S only. Values and button names come from the user-provided
// 순차 전원 공급 설정 가이드_220529.pdf, pages 1–4.
const markup = `
  <h2 id="ds8s-guide-title"><span class="pg-idx">06</span>설정 가이드</h2>
  <p class="ds8s-guide-intro">사용자 제공 「순차 전원 공급 설정 가이드(2022-05)」의 조작 순서 요약. 원문은 아래 문서 카드에서 보기·내려받기 가능.</p>
  <figure class="ds8s-console">
    <svg viewBox="0 0 900 220" role="img" aria-labelledby="ds8s-console-title ds8s-console-desc">
      <title id="ds8s-console-title">DS-8S 전면 설정 조작부</title>
      <desc id="ds8s-console-desc">왼쪽 FND 표시창과 TIME SET, BYPASS, D/OUT CH1, 오른쪽 채널 1부터 8까지의 버튼 위치를 나타낸 설명 그림</desc>
      <rect x="3" y="3" width="894" height="214" rx="18" class="ds8s-panel"/>
      <rect x="19" y="20" width="215" height="176" rx="12" class="ds8s-display-case"/>
      <text x="44" y="76" class="ds8s-console-ac">AC</text>
      <rect x="89" y="51" width="116" height="92" rx="5" class="ds8s-display"/>
      <text x="111" y="117" class="ds8s-fnd">o1</text>
      <circle cx="199" cy="164" r="12" class="ds8s-button"/><text x="159" y="189" class="ds8s-console-label">TIME SET</text>
      <circle cx="302" cy="112" r="16" class="ds8s-button"/><text x="267" y="75" class="ds8s-console-label">BYPASS</text>
      <circle cx="404" cy="112" r="16" class="ds8s-button"/><text x="356" y="75" class="ds8s-console-label">D/OUT CH1</text>
      <line x1="463" y1="28" x2="463" y2="191" class="ds8s-divider"/>
      <text x="571" y="62" class="ds8s-console-label">채널 스위치 1–8</text>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="${496 + i * 53}" cy="117" r="16" class="ds8s-button"/><text x="${491 + i * 53}" y="158" class="ds8s-channel-label">${i + 1}</text>`).join('')}
    </svg>
    <figcaption>가이드 1쪽 조작부를 바탕으로 한 위치 안내 그림 · 실제 버튼 모양의 축척도는 아님</figcaption>
  </figure>
  <div class="ds8s-guide-grid">
    <div class="ds8s-guide-block">
      <h3>설정 순서</h3>
      <ol class="ds8s-steps">
        <li><b>① TIME SET</b><span>설정 모드 시작</span><code aria-label="가이드에 표시값 없음">—</code></li>
        <li><b>② BYPASS</b><span>반복 클릭하여 모드 선택</span><code>o1–o6</code></li>
        <li><b>③ D/OUT CH1</b><span>선택한 모드로 진입</span><code>F00–F99 등</code></li>
        <li><b>④ 값·채널 설정</b><span>BYPASS·D/OUT CH1으로 값 변경, 해당 모드의 채널 버튼 적용</span><code>모드별 표시</code></li>
        <li><b>⑤ TIME SET</b><span>설정 종료·저장</span><code aria-label="가이드에 저장 후 표시값 없음">—</code></li>
      </ol>
      <p class="ds8s-small">①·⑤의 FND 값은 원문에 명시되지 않아 표시하지 않음. 채널 버튼 적용 방식은 모드마다 다름.</p>
      <div class="ds8s-leds"><strong>채널 적용 표시</strong><span><i class="ds8s-led ds8s-led-red"></i>온 타임: 적색 LED</span><span><i class="ds8s-led ds8s-led-green"></i>오프 타임·상시 전원: 녹색 LED</span></div>
    </div>
    <div class="ds8s-guide-block">
      <h3>모드와 FND 코드</h3>
      <div class="ds8s-table-scroll" tabindex="0" aria-label="DS-8S 설정 모드 표, 좌우 스크롤 가능">
        <table><thead><tr><th>모드</th><th>설정</th><th>표시값</th><th>채널 버튼 적용</th></tr></thead><tbody>
          <tr><th><code>o1</code></th><td>채널별 온 타임 0–99초</td><td><code>F00–F99</code></td><td>적색 LED 점등</td></tr>
          <tr><th><code>o2</code></th><td>채널별 오프 타임 0–99초</td><td><code>F00–F99</code></td><td>녹색 LED 점등</td></tr>
          <tr><th><code>o3</code></th><td>상시 전원 채널</td><td><code>Fo2</code></td><td>녹색 LED 점등</td></tr>
          <tr><th><code>o4</code></th><td>전면 스위치 잠금</td><td><code>F0o / F0F</code></td><td>잠금·해제 전환</td></tr>
          <tr><th><code>o5</code></th><td>제어 모드</td><td><code>F01 / F02 / F03</code></td><td>모드 순환</td></tr>
          <tr><th><code>o6</code></th><td>유니트 번호 0–99</td><td><code>F00–F99</code></td><td>번호 변경은 BYPASS·D/OUT CH1</td></tr>
        </tbody></table>
      </div>
      <div class="ds8s-code-key"><span><code>F0o</code> 잠금</span><span><code>F0F</code> 해제</span><span><code>F01</code> 마스터</span><span><code>F02</code> 슬레이브</span><span><code>F03</code> 채널</span><span><code>F00</code> 일반 모드(이전 버전 호환, o6)</span></div>
    </div>
  </div>
  <div class="ds8s-guide-block ds8s-communication">
    <h3>RS-485 통신 연결 <small>가이드 4쪽</small></h3>
    <div class="ds8s-pin-layout">
      <svg viewBox="0 0 410 180" role="img" aria-labelledby="ds8s-rj-title ds8s-rj-desc">
        <title id="ds8s-rj-title">RS-485S INPUT RJ-45 핀 안내</title>
        <desc id="ds8s-rj-desc">가이드의 잭 그림을 단순화한 것으로 핀 번호 1부터 8까지를 왼쪽에서 오른쪽으로 표시</desc>
        <path d="M70 33 H340 V139 H294 V160 H116 V139 H70 Z" class="ds8s-rj-shell"/>
        ${Array.from({ length: 8 }, (_, i) => `<rect x="${95 + i * 28}" y="48" width="17" height="36" class="ds8s-pin"/><text x="${99 + i * 28}" y="113" class="ds8s-pin-number">${i + 1}</text>`).join('')}
        <text x="112" y="24" class="ds8s-pin-caption">가이드 4쪽 핀 번호 기준</text>
      </svg>
      <div class="ds8s-table-scroll" tabindex="0" aria-label="RS-485 핀 기능 표, 좌우 스크롤 가능"><table><thead><tr><th>핀</th><th>표기</th></tr></thead><tbody>
        <tr><th>1·2</th><td>X (미사용)</td></tr><tr><th>3</th><td>IN1</td></tr><tr><th>4</th><td>OUT2</td></tr>
        <tr><th>5</th><td>A (TX+, RX+)</td></tr><tr><th>6</th><td>B (TX-, RX-)</td></tr><tr><th>7·8</th><td>GND</td></tr>
      </tbody></table></div>
    </div>
    <p>PC↔장비: RJ-45 1:1 케이블, 핀 5·6·7 사용. 장비↔장비: RJ-45 1:1 케이블, 핀 3·4·5·6·7·8 사용.</p>
    <p>외부 통신 프로토콜 및 규격: <strong>본사 문의 요망</strong>.</p>
  </div>
  <aside class="ds8s-warning"><strong>통신 제어 주의</strong><span>통신 제어 시 POWER 스위치를 OFF 상태로 두어야 함. (가이드 4쪽)</span></aside>
`;

export function renderDs8sGuide() {
  const section = document.createElement('section');
  section.id = 'ds8s-setting-guide';
  section.className = 'pg-card ds8s-setting-guide';
  section.setAttribute('aria-labelledby', 'ds8s-guide-title');
  section.innerHTML = markup;
  return section;
}
