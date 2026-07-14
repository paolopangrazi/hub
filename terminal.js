/* ppsh — the interactive terminal for the hub. Extracted from index.html to keep it lean.
   Self-contained: injects its own CSS + overlay markup, then wires the command engine.
   Depends on the shared .t-* colour classes (in index.html) and the global toggleTheme(). */
(function () {
  'use strict';

  /* ── styles (always dark, theme-independent) ── */
  const CSS = `
  #term-overlay { position:fixed; inset:0; z-index:60; background:rgba(4,7,12,.66); backdrop-filter:blur(4px); display:flex; align-items:flex-start; justify-content:center; padding:5vh 1rem 1rem; }
  #term-overlay.hidden { display:none; }
  #term-win { width:100%; max-width:56rem; border:1px solid #20293c; border-radius:.75rem; background:#0b0f18; box-shadow:0 0 0 1px rgba(0,250,154,.15), 0 24px 80px -12px rgba(0,0,0,.8); overflow:hidden; color:#e9eef4; animation:termin .18s ease; }
  @keyframes termin { from { opacity:0; transform:translateY(10px) scale(.985); } to { opacity:1; transform:none; } }
  #term-head { display:flex; align-items:center; gap:.5rem; padding:.7rem 1rem; background:#101623; border-bottom:1px solid #20293c; }
  #term-body { height:34rem; max-height:70vh; overflow-y:auto; padding:1rem; font-family:"IBM Plex Mono",monospace; font-size:14px; line-height:1.7; }
  #term-out { white-space:pre-wrap; word-break:break-word; }
  #term-out a { color:#00FA9A; text-decoration:underline; text-decoration-color:rgba(0,250,154,.5); }
  #term-out .skrow { padding-left:9ch; text-indent:-9ch; }
  #term-in { flex:1; background:transparent; border:none; outline:none; color:#e9eef4; caret-color:#00FA9A; font:inherit; }
  @media (prefers-reduced-motion: reduce) { #term-win { animation:none; } }`;
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── overlay markup ── */
  document.body.insertAdjacentHTML('beforeend', `
<div id="term-overlay" class="hidden" role="dialog" aria-modal="true" aria-label="Interactive terminal">
  <div id="term-win">
    <div id="term-head">
      <span class="w-3 h-3 rounded-full bg-[#ff6b6b]/70"></span>
      <span class="w-3 h-3 rounded-full bg-ember/70"></span>
      <span class="w-3 h-3 rounded-full bg-cy/70"></span>
      <span class="font-mono text-sm ml-2" style="color:#8b96a8">pp@hub — ppsh</span>
      <button onclick="termClose()" aria-label="Close terminal" class="ml-auto font-mono hover:text-ember transition-colors" style="color:#8b96a8">✕</button>
    </div>
    <div id="term-body" onclick="if(!window.getSelection().toString())document.getElementById('term-in').focus()">
      <div id="term-out"></div>
      <div class="flex gap-2 items-baseline">
        <span class="t-e shrink-0">pp@hub:~$</span>
        <input id="term-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal input">
      </div>
    </div>
  </div>
</div>`);

  /* ── command engine ── */
  const termOverlay = document.getElementById('term-overlay'),
        termOut = document.getElementById('term-out'),
        termIn = document.getElementById('term-in'),
        termBody = document.getElementById('term-body');
  let termHist = [], termHistIdx = -1, termBooted = false;

  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const SECTIONS = ['timeline','novartis','aisco','alcatel','cs','books','music','creative','education'];
  const LI = 'https://ch.linkedin.com/in/paolopangrazi';

  const CMDS = {
    help: () => [
      '<span class="t-c">ppsh — available commands</span>',
      '  <span class="t-e">whoami</span>          who is paolo?',
      '  <span class="t-e">skills</span>          core skills',
      '  <span class="t-e">experience</span>      career — try: experience novartis',
      '  <span class="t-e">git log</span>         career as a commit graph',
      '  <span class="t-e">projects</span>        side projects (C / C++)',
      '  <span class="t-e">patent</span>          the granted patent',
      '  <span class="t-e">languages</span>       spoken languages',
      '  <span class="t-e">contact</span>         get in touch',
      '  <span class="t-e">cv</span>              resume',
      '  <span class="t-e">ls</span>              list all sections',
      '  <span class="t-e">cd &lt;section&gt;</span>    navigate to a section',
      '  <span class="t-e">neofetch</span>        system info',
      '  <span class="t-e">theme</span>           toggle light/dark',
      '  <span class="t-e">clear</span>           clear the terminal',
      '  <span class="t-e">exit</span>            close the terminal',
      '',
      '<span class="t-d">psst — recruiters may also try:</span> <span class="t-e">sudo hire-me</span>'
    ],
    whoami: () => [
      '<span class="t-p">Paolo Pangrazi</span> — Technical Leader · Solution Architect',
      'Full-Stack Software &amp; Database Engineer',
      '<span class="t-d">Basel, CH · time · space · energy</span>'
    ],
    skills: () => [[
      '<span class="t-p">hard skills</span> <span class="t-d">──────────────────────────</span>',
      '<span class="t-c">lang</span>     C · C++ · Java · Python · JavaScript · TypeScript · Bash',
      '<span class="t-c">data</span>     SQL · Oracle PL/SQL · Microsoft SQL Server · PostgreSQL · Data Migration',
      '<span class="t-c">web</span>      Javascript, Typescript, Angular, Ruby on Rails',
      '<span class="t-c">arch</span>     Solution &amp; Software Architecture · OO Design · UML · CORBA · Multithreading · Embedded Systems',
      '<span class="t-c">eng</span>      Full-Stack · Algorithms · Unix · Shell Scripting · Real-Time &amp; Physics-Based Simulation',
      '<span class="t-c">ai</span>       OpenCode · Claude · Grok Code',
      '<span class="t-c">domain</span>   Intellectual Property · Innovation &amp; Patents · Telecommunications · SDH / Network Management · Pharma · Fire Training Engineering',
      '&nbsp;',
      '<span class="t-p">soft skills</span> <span class="t-d">──────────────────────────</span>',
      '<span class="t-c">deliver</span>  Business Process Automation · Requirements Analysis · Project Management',
      '<span class="t-c">lead</span>     Technical &amp; Team Leadership · Stakeholder Mgmt · Vendor / RFP Mgmt · Budget Mgmt · Product Mgmt &amp; Ownership',
      '&nbsp;',
      '<span class="t-c">now</span>      learning Ruby on Rails · Zig · Rust'
    ].map(l => '<div class="skrow">' + l + '</div>').join('')],
    experience: (arg) => {
      const jobs = {
        novartis: ['<span class="t-e">novartis</span> <span class="t-d">2008 — 2026</span>',
          '  42k patents · 110k trademarks · zero data lost.',
          '  IP portfolio data lake, Memotech → Anaqua AQX migration lead,',
          '  full trademark automation, e-filing with Swissreg. 107k lines of PL/SQL.'],
        aisco: ['<span class="t-e">aisco firetrainer</span> <span class="t-d">2020 — 2023</span>',
          '  Invented. Patented. Shipped.',
          '  HW–SW Lead Architect of a physics-based digital fire trainer.',
          '  Patent EP3795219 · product launched 2023.'],
        alcatel: ['<span class="t-e">alcatel-lucent</span> <span class="t-d">2006 — 2008</span>',
          '  O(n³) → O(n²): SDH resync engine redesign, ~100× faster at 3k nodes.',
          '  C++/Java NMS components, Link Aggregation IEEE 802.3ad.']
      };
      if (arg && jobs[arg]) return jobs[arg];
      if (arg) return ['<span class="t-r">experience: unknown employer \'' + esc(arg) + '\'</span>', 'try: novartis · aisco · alcatel'];
      return [...jobs.novartis, '', ...jobs.aisco, '', ...jobs.alcatel, '', '<span class="t-d">details: experience &lt;name&gt; · or cd &lt;name&gt;</span>'];
    },
    projects: () => [
      '<span class="t-e">LiAM</span>  — SMTP + POP3 mail server in pure C, RFC-compliant, zero libraries',
      '       <a href="https://github.com/paolopangrazi/liam" target="_blank" rel="noopener">github.com/paolopangrazi/liam</a>',
      '<span class="t-e">tuiX</span>  — C++17 terminal spreadsheet editor, vim keys, formula engine',
      '       <a href="https://github.com/paolopangrazi/tuix" target="_blank" rel="noopener">github.com/paolopangrazi/tuix</a>'
    ],
    patent: () => [
      '<span class="t-e">EP3795219</span> — digital fire-training system, granted 2020',
      '<a href="https://patentscope.wipo.int/search/en/detail.jsf?docId=EP320899875" target="_blank" rel="noopener">patentscope.wipo.int → EP3795219</a>'
    ],
    git: (arg) => {
      if (arg === 'log') {
        const el = document.getElementById('git-graph');
        const lines = el ? el.innerHTML.replace(/\r/g, '').split('\n')
          : ['<span class="t-r">git log: graph not available on this page.</span>'];
        return [...lines, '', '<span class="t-d">↑ same tree as</span> <span class="t-e">// git log --career</span> <span class="t-d">on the page —</span> <span class="t-e">cd timeline</span>'];
      }
      if (arg === 'status') return ['On branch <span class="t-e">main</span>', 'Your branch is ahead of every other candidate.', 'nothing to commit — shipping continuously <span class="t-e">✓</span>'];
      if (arg === 'blame') return ['<span class="t-d">100% Paolo Pangrazi. every line. it was him.</span>'];
      return ['usage: <span class="t-e">git log</span> · <span class="t-e">git status</span> · <span class="t-e">git blame</span>'];
    },
    languages: () => ['IT █████ · EN ████░ · DE ████░ · ES ███░░'],
    contact: () => ['<a href="' + LI + '" target="_blank" rel="noopener">linkedin.com/in/paolopangrazi</a>', '<span class="t-d">response time: fast. like the O(n²) rewrite.</span>'],
    cv: () => ['resume lives here → <a href="' + LI + '" target="_blank" rel="noopener">' + LI.replace('https://','') + '</a>'],
    ls: () => ['<span class="t-c">' + SECTIONS.join('  ') + '</span>'],
    pwd: () => ['/home/pp/hub'],
    cd: (arg) => {
      if (!arg) return ['cd: usage: cd &lt;section&gt; — try ls'];
      if (!SECTIONS.includes(arg)) return ['<span class="t-r">cd: no such section: ' + esc(arg) + '</span>'];
      termClose();
      document.getElementById(arg).scrollIntoView({ behavior: 'smooth' });
      return [];
    },
    theme: () => { toggleTheme(); return ['theme toggled — the terminal stays dark. obviously.']; },
    neofetch: () => ['<pre style="margin:0;line-height:1.45"><span class="t-e">' +
      ' ██████╗ ██████╗ \n' +
      ' ██╔══██╗██╔══██╗\n' +
      ' ██████╔╝██████╔╝\n' +
      ' ██╔═══╝ ██╔═══╝ \n' +
      ' ██║     ██║     \n' +
      ' ╚═╝     ╚═╝     </span>\n' +
      '<span class="t-c">pp@hub</span>\n' +
      '<span class="t-d">──────</span>\n' +
      '<span class="t-c">OS:</span>       Arch Linux (Omarchy)\n' +
      '<span class="t-c">Role:</span>     Technical Leader · Solution Architect\n' +
      '<span class="t-c">Uptime:</span>   20 years in tech\n' +
      '<span class="t-c">Shell:</span>    ppsh 1.0\n' +
      '<span class="t-c">Kernel:</span>   C · C++ · SQL · caffeine\n' +
      '<span class="t-c">Motto:</span>    time · space · energy</pre>'],
    clear: () => { termOut.innerHTML = ''; return []; },
    exit: () => { termClose(); return []; },
    sudo: (arg, rest) => {
      if ((arg + ' ' + (rest || '')).trim() !== 'hire-me') return ['<span class="t-r">sudo: only one thing is worth elevated privileges here. try: sudo hire-me</span>'];
      return [
        '[sudo] password for recruiter: <span class="t-d">••••••••</span>',
        '<span class="t-e">Access granted.</span> initializing hiring sequence…',
        '  <span class="t-e">✓</span> 20 years of experience ........ loaded',
        '  <span class="t-e">✓</span> patent EP3795219 .............. verified',
        '  <span class="t-e">✓</span> O(n³) → O(n²) ................. optimized',
        '  <span class="t-e">✓</span> 42k patents · 110k trademarks . migrated, zero data lost',
        '  <span class="t-e">✓</span> sense of humor ................ detected',
        '',
        '<span class="t-p">All checks passed.</span> next step → <a href="' + LI + '" target="_blank" rel="noopener">linkedin.com/in/paolopangrazi</a>'
      ];
    }
  };
  CMDS.man = CMDS.help;
  CMDS.echo = (a, rest) => [esc(((a||'') + ' ' + (rest||'')).trim())];

  function termPrint(lines) {
    if (lines.length) termOut.insertAdjacentHTML('beforeend', lines.join('\n') + '\n');
    termBody.scrollTop = termBody.scrollHeight;
  }
  function termRun(raw) {
    const input = raw.trim();
    termPrint(['<span class="t-e">pp@hub:~$</span> <span class="t-p">' + esc(raw) + '</span>']);
    if (!input) return;
    termHist.push(raw); termHistIdx = termHist.length;
    const [cmd, arg, ...rest] = input.split(/\s+/);
    const fn = CMDS[cmd.toLowerCase()];
    termPrint(fn ? fn(arg ? arg.toLowerCase() : arg, rest.join(' ')) :
      ['<span class="t-r">ppsh: command not found: ' + esc(cmd) + '</span> — try <span class="t-e">help</span>']);
  }
  function termOpen() {
    termOverlay.classList.remove('hidden');
    if (!termBooted) {
      termBooted = true;
      termPrint([
        '<span class="t-e">Hey, welcome!</span> <span class="t-d">Glad you found your way here.</span>',
        '<span class="t-d">You\'re in</span> <span class="t-c">ppsh 1.0</span> <span class="t-d">— Paolo\'s personal shell. Poke around, make yourself at home.</span>',
        '<span class="t-d">Type</span> <span class="t-e">help</span> <span class="t-d">to see what\'s possible · press</span> <span class="t-p">ESC</span> <span class="t-d">or click outside to exit.</span>',
        ''
      ]);
    }
    setTimeout(() => termIn.focus(), 50);
  }
  function termClose() { termOverlay.classList.add('hidden'); }

  termIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') { termRun(termIn.value); termIn.value = ''; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (termHistIdx > 0) termIn.value = termHist[--termHistIdx]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); termIn.value = termHistIdx < termHist.length - 1 ? termHist[++termHistIdx] : (termHistIdx = termHist.length, ''); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = termIn.value.trim().toLowerCase();
      if (!v) return;
      const hits = Object.keys(CMDS).filter(c => c.startsWith(v));
      if (hits.length === 1) termIn.value = hits[0] + ' ';
      else if (hits.length > 1) termPrint(['<span class="t-d">' + hits.join('  ') + '</span>']);
    }
  });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if ((e.key === '`' || e.key === 'Enter') && !typing && termOverlay.classList.contains('hidden')) { e.preventDefault(); termOpen(); }
    else if (e.key === 'Escape' && !termOverlay.classList.contains('hidden')) termClose();
  });
  termOverlay.addEventListener('mousedown', e => { if (e.target === termOverlay) termClose(); });
  window.addEventListener('load', () => {
    const h = location.hash.replace('#', '');
    if (!h || h === 'top') termOpen();
  });

  /* the buttons in index.html call these via inline onclick */
  window.termOpen = termOpen;
  window.termClose = termClose;
})();
