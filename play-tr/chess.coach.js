/* chess.coach.js-02 */
(function () {
  'use strict';

  var ARROW_COLOR_HEX = '#00a3ff';
  var ARROW_LINE_ALPHA = 0.6;
  var ARROW_HEAD_ALPHA = 0.9;
  var ARROW_RING_ALPHA = 0.25;
  var ARROW_STROKE_W   = 0.14;

  function hexToRgba(hex, a){
    var h = hex.replace('#','');
    if (h.length===3) h = h.split('').map(function(c){return c+c;}).join('');
    var r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return 'rgba('+r+','+g+','+b+','+(a==null?1:a)+')';
  }
  var ARROW_LINE_COLOR = hexToRgba(ARROW_COLOR_HEX, ARROW_LINE_ALPHA);
  var ARROW_HEAD_COLOR = hexToRgba(ARROW_COLOR_HEX, ARROW_HEAD_ALPHA);
  var ARROW_RING_COLOR = hexToRgba(ARROW_COLOR_HEX, ARROW_RING_ALPHA);

  var SAYS_SRC = '/wp-content/uploads/play-tr/chess.coach.says.tr.js';
  var SAYS = null;
  function loadSAYS(){
    return new Promise(function(resolve){
      if (window.CM_COACH_SAYS_TR){ SAYS = window.CM_COACH_SAYS_TR; return resolve(true); }
      var s = document.createElement('script');
      s.src = SAYS_SRC; s.async = true;
      s.onload  = function(){ SAYS = window.CM_COACH_SAYS_TR || null; resolve(!!SAYS); };
      s.onerror = function(){ SAYS = null; resolve(false); };
      document.head.appendChild(s);
      setTimeout(function(){ if (SAYS==null){ SAYS = window.CM_COACH_SAYS_TR || null; resolve(!!SAYS); } }, 1000);
    });
  }

  function playLabel(ctx){
    if (ctx && ctx.userIsTop1) return 'doğru hamleyi yaptın';
    if (ctx && ctx.suggestNext) return 'oynanılabilir';
    return 'oynanılabilirdi';
  }
  function fmt(template, ctx){
    if (!template) return '';
    var txt = (ctx && (ctx.bestText || ctx.bestUci)) || '?';
    var looksUci = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(txt);
    var label = looksUci ? 'en iyi devam' : txt;
    var bestHTML = (ctx && ctx.clickable && ctx.bestUci)
      ? '<a href="#" class="cm-best" data-uci="'+ctx.bestUci+'">'+ label +'</a>'
      : label;
    return template.replace(/\{best\}/g, bestHTML).replace(/\{play\}/g, playLabel(ctx));
  }
  function line(cat, ctx){
    var tpl = (SAYS && SAYS.lines && SAYS.lines[cat]) || DEFAULT_LINES[cat] || "Analiz: <b>{best}</b> {play}.";
    return fmt(tpl, ctx);
  }

  var DEFAULT_LINES = {
    leg:    "Güçlü fikir; devamı: <b>{best}</b> {play}.",
    ok:     "Planı ilerletiyor; <b>{best}</b> {play}.",
    force:  "Tek yol; çizgiyi koru: <b>{best}</b> {play}.",
    ex:     "Harika; daha iyisi <b>{best}</b> {play}.",
    vgood:  "Çok iyi; makine <b>{best}</b> {play} diyor.",
    goodp:  "Sağlam adım; baskıyı artır: <b>{best}</b> {play}.",
    good:   "İyi; daha iyi seçenek <b>{best}</b> {play}.",
    midp:   "Daha iyisi vardı; doğrusu <b>{best}</b> {play}.",
    mid:    "Riskli; denge için <b>{best}</b> {play}.",
    wrnp:   "Fırsat kaçıyor; aktif devam <b>{best}</b> {play}.",
    wrn:    "Dikkat! Savun: <b>{best}</b> {play}.",
    bad:    "Büyük hata! İlk yardım: <b>{best}</b> {play}.",
    lose:   "Konum kayıp; en dirençli yol: <b>{best}</b> {play}.",
    book:   "Bilinen yol (teori): <b>{best}</b> {play}.",
    missed: "Kaçan fırsat; kazanç için <b>{best}</b> {play}."
  };

  var FIG = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' };
  function pieceFig(ch){ return FIG[ch] || ch; }
  function sanToFAN(san){
    if(!san) return '';
    if(/^O-O/.test(san)) return san;
    var s = san.replace(/=([QRBN])/g, function(_,p){ return '=' + pieceFig(p); });
    s = s.replace(/^([KQRBN])/, function(_,p){ return pieceFig(p); });
    if (!/^[♔♕♖♗♘]/.test(s)) s = '♙' + s;
    return s;
  }

  function safeStorage() {
    try { var t='__cm_c_'+Math.random(); localStorage.setItem(t,'1'); localStorage.removeItem(t); return localStorage; }
    catch (_){ try { var t2='__cm_c_'+Math.random(); sessionStorage.setItem(t2,'1'); sessionStorage.removeItem(t2); return sessionStorage; }
      catch(_2){ var mem={}; return { getItem:function(k){return (k in mem?mem[k]:null)}, setItem:function(k,v){mem[k]=String(v)}, removeItem:function(k){delete mem[k]} }; } }
  }
  var STORE = safeStorage();

  var TRAMPOLINE_JS       = '/wp-content/uploads/chess/engine/stockfish.trampoline.worker.js';
  var STOCKFISH_JS_LEGACY = '/wp-content/uploads/chess/libs/stockfish.js';

  var TOOLBAR_SEL = '#cm-app .cm-toolbar';
  var BOTTOM_BAR_SEL = '.cm-bar.cm-bar-bottom';
  var BOARD_ID    = 'cm-board';

  var THRESH = { ex:20, vgood:40, goodp:60, good:80, midp:100, mid:120, wrnp:160, wrn:200, bad:500 };
  var MATE_CP = 99999;

  function readSkill(){
    try{
      var p = JSON.parse(localStorage.getItem('cm-prefs')||'{}');
      var v = parseInt(p.skill,10);
      return Number.isFinite(v) ? v : 20;
    }catch(_){ return 20; }
  }
  function uniqueBestGapBySkill(skill){ if (skill <= 5) return 20; if (skill <= 10) return 15; return 10; }

  var coachOn = (STORE.getItem('cm-coach') || 'on') === 'on';
  var worker = null;

  var analysisByPly = Object.create(null);
  var currentPly = 0;
  var pendingKeys = new Set();

  var CACHE_MAX = 500;
  var cacheMap = new Map();
  var SS_PREFIX = 'cmc:';
  function cacheKey(preFEN, uci, skill){ return preFEN + '|' + uci + '|s' + String(skill); }
  function cacheGet(key){
    if (cacheMap.has(key)){ var rec = cacheMap.get(key); cacheMap.delete(key); cacheMap.set(key, rec); return rec; }
    try { var s = sessionStorage.getItem(SS_PREFIX+key); if (s){ var obj = JSON.parse(s); cacheSet(key, obj); return obj; } } catch(_) {}
    return null;
  }
  function cacheSet(key, rec){
    cacheMap.set(key, rec);
    while (cacheMap.size > CACHE_MAX){ var first = cacheMap.keys().next().value; cacheMap.delete(first); try { sessionStorage.removeItem(SS_PREFIX+first); } catch(_) {} }
    try { sessionStorage.setItem(SS_PREFIX+key, JSON.stringify(rec)); } catch(_) {}
  }

  function fitCoachText(){
    var host = document.getElementById('cm-coach'); if(!host) return;
    var txt  = host.querySelector('.txt'); if(!txt) return;
    var targetH = host.clientHeight || host.getBoundingClientRect().height;
    if (!targetH) return;
    var cs = window.getComputedStyle(host);
    var base = parseFloat(cs.fontSize) || 13, min=11, tries=10;
    host.style.fontSize = base + 'px';
    while (tries-- > 0 && txt.scrollHeight > targetH && base > min){ base -= 0.5; host.style.fontSize = base + 'px'; }
  }

  function welcomeMarkup(){
    return '' +
      '<div class="row">' +
        '<div class="mvno"></div>' +
        '<span class="badge coach-welcome-pill">Eğitmen Moduna hoşgeldin.</span>' +
        '<div class="txt welcome">' +
          '<span class="coach-intro">Beraber <strong>Altın</strong> hamleleri bulmaya başlayalım 🙂.</span>' +
        '</div>' +
      '</div>';
  }

  function ensurePanel() {
    var board = document.getElementById(BOARD_ID);
    if (!board) return null;

    var wrap = document.getElementById('cm-coach-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'cm-coach-wrap';
      wrap.className = 'coach-wrap';

      var avatar = document.createElement('img');
      avatar.id = 'cm-coach-avatar';
      avatar.className = 'coach-avatar';
      avatar.src = '/wp-content/uploads/2025/08/avatar.png';
      avatar.alt = 'Koç';

      var bubble = document.createElement('div'); bubble.className = 'coach-bubble';
      var host = document.createElement('div');
      host.id = 'cm-coach'; host.setAttribute('role','status'); host.setAttribute('aria-live','polite'); host.setAttribute('aria-atomic','true');
      host.innerHTML = coachOn ? welcomeMarkup() : '<div class="empty">Eğitmen modu <b>kapalı</b>.</div>';

      bubble.appendChild(host); wrap.appendChild(avatar); wrap.appendChild(bubble);

      var toolbar = document.querySelector(TOOLBAR_SEL);
      if (toolbar && toolbar.parentNode) toolbar.insertAdjacentElement('afterend', wrap);
      else board.parentNode.insertBefore(wrap, board);

      var styleId = 'cm-best-style';
      if (!document.getElementById(styleId)){
        var st = document.createElement('style'); st.id = styleId;
        st.textContent  = '.coach-bubble .cm-best{color:'+ARROW_COLOR_HEX+';text-decoration:underline;cursor:pointer}.coach-bubble .cm-best:hover{opacity:.85}';
        st.textContent += '.coach-bubble .why{opacity:.85;font-style:italic;margin-left:.25em}';
        st.textContent += '.coach-bubble .tip{opacity:.9;margin-left:.25em}';
        st.textContent += '.coach-bubble .hl{background:rgba(0,163,255,.12);border-radius:.25em;padding:0 .15em}';
        st.textContent += '.coach-bubble .row{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"mv badge" "txt txt";gap:.35em .5em;align-items:center}';
        st.textContent += '.coach-bubble .mvno{grid-area:mv;font-weight:700;opacity:.9;min-width:2.5ch;text-align:right;white-space:nowrap}';
        st.textContent += '.coach-bubble .badge{grid-area:badge}';
        st.textContent += '.coach-bubble .txt{grid-area:txt;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}';
        st.textContent += '.coach-bubble .cm-best{white-space:nowrap}';
        document.head.appendChild(st);
      }

      var sync = function(){ var w = Math.round(board.getBoundingClientRect().width); wrap.style.width = w + 'px'; try { fitCoachText(); } catch(_) {} };
      sync(); window.addEventListener('resize', sync, { passive:true });
    } else {
      var hostNow = document.getElementById('cm-coach');
      if (hostNow){ hostNow.setAttribute('role','status'); hostNow.setAttribute('aria-live','polite'); hostNow.setAttribute('aria-atomic','true'); }
    }
    return document.getElementById('cm-coach');
  }

  function findNearestRecord(ply){
    if (analysisByPly[ply]) return { ply: ply, rec: analysisByPly[ply] };
    for (var p = ply; p >= 0; p--){ if (analysisByPly[p]) return { ply: p, rec: analysisByPly[p] }; }
    return null;
  }

  function normalizeMoveNo(v){
    if (v==null) return '';
    var s = String(v);
    var m = s.match(/^\s*(\d+)/);
    return m ? (m[1] + '.') : (/\.$/.test(s) ? s : (s + '.'));
  }

  function renderCurrent(){
    var host = ensurePanel(); if (!host) return;
    if (!coachOn) { host.innerHTML = '<div class="empty">Eğitmen modu <b>kapalı</b>.</div>'; try { fitCoachText(); } catch(_) {} return; }
    var found = findNearestRecord(currentPly);
    if (!found){
      host.innerHTML = welcomeMarkup();
      try { fitCoachText(); } catch(_) {}
      return;
    }
    var rec = found.rec;
    var mv = (rec.moveNo != null) ? normalizeMoveNo(rec.moveNo) : '';
    host.innerHTML =
      '<div class="row">' +
        '<div class="mvno">' + mv + '</div>' +
        '<span class="badge ' + (rec.badgeClass || 'inf') + '">' + (rec.badgeText || '') + '</span>' +
        '<div class="txt">' + (rec.message || '') + '</div>' +
      '</div>';
    try { fitCoachText(); } catch(_) {}
  }

  function setRec(ply, obj){
    var r = analysisByPly[ply] || {};
    r.moveNo    = obj.moveNo != null ? obj.moveNo : r.moveNo;
    r.badgeClass= obj.badgeClass || r.badgeClass || 'inf';
    r.badgeText = (obj.badgeText != null ? obj.badgeText : r.badgeText) || '⏳';
    r.message   = (obj.message != null ? obj.message : r.message) || '';
    analysisByPly[ply] = r; renderCurrent();
  }

  function clearPanel(){
    analysisByPly = Object.create(null);
    pendingKeys.clear(); currentPly = 0;
    clearArrow();
    var host = ensurePanel();
    if (host) host.innerHTML = coachOn ? welcomeMarkup() : '<div class="empty">Eğitmen modu <b>kapalı</b>.</div>';
    try { fitCoachText(); } catch(_) {}
  }

  function getBoard(){ return document.getElementById(BOARD_ID); }
  function boardOrient(){ var b=getBoard(); if(!b) return 'w'; return (b.getAttribute('data-orient')||b.getAttribute('data-orientation')||'w').toLowerCase()==='b'?'b':'w'; }
  function squareToUnitXY(sq){
    if(!sq || sq.length<2) return {x:0,y:0,ok:false};
    var file = sq.charCodeAt(0)-97, rank = parseInt(sq[1],10)-1;
    if(file<0||file>7||rank<0||rank>7) return {x:0,y:0,ok:false};
    var o=boardOrient(), col = (o==='w') ? file : 7-file, row = (o==='w') ? 7-rank : rank;
    return { x: col + 0.5, y: row + 0.5, ok:true };
  }
  function ensureArrowLayer(){
    var b = getBoard(); if(!b) return null;
    var id = 'cm-arrow-layer', svg = document.getElementById(id);
    if(!svg){
      svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('id', id);
      svg.setAttribute('viewBox','0 0 8 8');
      svg.setAttribute('preserveAspectRatio','none');
      svg.style.position='absolute';
      svg.style.left='0'; svg.style.top='0';
      svg.style.width='100%'; svg.style.height='100%';
      svg.style.pointerEvents='none';
      if(getComputedStyle(b).position === 'static'){ b.style.position='relative'; }
      svg.appendChild(document.createElementNS(svg.namespaceURI,'defs'));
      // marker
      var defs   = svg.querySelector('defs');
      var marker = document.createElementNS(svg.namespaceURI,'marker');
      marker.setAttribute('id','cm-arrow-head');
      marker.setAttribute('markerUnits','userSpaceOnUse');
      marker.setAttribute('viewBox','0 0 6 6');
      marker.setAttribute('markerWidth','0.55');
      marker.setAttribute('markerHeight','0.55');
      marker.setAttribute('refX','6'); marker.setAttribute('refY','3'); marker.setAttribute('orient','auto');
      var path = document.createElementNS(svg.namespaceURI,'path');
      path.setAttribute('d','M0,0 L6,3 L0,6 Z');
      path.setAttribute('fill', ARROW_HEAD_COLOR);
      defs.appendChild(marker); marker.appendChild(path);
      b.appendChild(svg);
    }
    return svg;
  }

  function clearArrow(){
    var svg=document.getElementById('cm-arrow-layer'); if(!svg) return;
    Array.from(svg.childNodes).forEach(function(n){ if(!(n.tagName && n.tagName.toLowerCase()==='defs')) svg.removeChild(n); });
  }

  function drawArrow(uci){
    if(!uci || uci.length<4) return;
    var from=uci.slice(0,2), to=uci.slice(2,4);
    var a=squareToUnitXY(from), b=squareToUnitXY(to), svg=ensureArrowLayer(); if(!svg||!a.ok||!b.ok) return;
    clearArrow();

    var circ=document.createElementNS(svg.namespaceURI,'circle');
    circ.setAttribute('cx',a.x); circ.setAttribute('cy',a.y);
    circ.setAttribute('r', 0.20);
    circ.setAttribute('fill', ARROW_RING_COLOR);
    svg.appendChild(circ);

    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 1;
    var nx = dx / len, ny = dy / len;

    var ARROW_SHAFT_BACK = 0.24;
    var sx = b.x - nx * ARROW_SHAFT_BACK;
    var sy = b.y - ny * ARROW_SHAFT_BACK;

    var line=document.createElementNS(svg.namespaceURI,'line');
    line.setAttribute('x1',a.x); line.setAttribute('y1',a.y);
    line.setAttribute('x2',sx);  line.setAttribute('y2',sy);
    line.setAttribute('stroke', ARROW_LINE_COLOR);
    line.setAttribute('stroke-width', String(ARROW_STROKE_W));
    line.setAttribute('stroke-linecap','round'); line.setAttribute('stroke-linejoin','round');
    svg.appendChild(line);

    var tip=document.createElementNS(svg.namespaceURI,'line');
    tip.setAttribute('x1',sx); tip.setAttribute('y1',sy);
    tip.setAttribute('x2',b.x); tip.setAttribute('y2',b.y);
    tip.setAttribute('stroke','rgba(0,0,0,0)');
    tip.setAttribute('stroke-width', String(ARROW_STROKE_W));
    tip.setAttribute('marker-end','url(#cm-arrow-head)');
    svg.appendChild(tip);
  }

  function startEngine() {
    try { if (worker) worker.terminate(); } catch (_){ }
    worker = null;
    var ORIGIN = location.origin;
    try {
      worker = new Worker(TRAMPOLINE_JS + '?origin=' + encodeURIComponent(ORIGIN));
      bindWorker(); try{ worker.postMessage('uci'); }catch(_){}
      try{ worker.postMessage('isready'); }catch(_){}
      try{ worker.postMessage('ucinewgame'); }catch(_){}
      try{ worker.postMessage('setoption name MultiPV value 2'); }catch(_){}
    } catch (_){
      try {
        worker = new Worker(STOCKFISH_JS_LEGACY);
        bindWorker(); try{ worker.postMessage('uci'); }catch(_){}
        try{ worker.postMessage('isready'); }catch(_){}
        try{ worker.postMessage('ucinewgame'); }catch(_){}
        try{ worker.postMessage('setoption name MultiPV value 2'); }catch(_){}
      } catch (e) { setRec(currentPly, {badgeClass:'wrn',badgeText:'Dikkat!',message:'❌ Motor açılamadı.'}); }
    }
  }
  function bindWorker(){ worker.onmessage=function(){}; worker.onerror=function(){ setRec(currentPly, {badgeClass:'wrn',badgeText:'Dikkat!',message:'❌ Motor hatası (Coach).'}); }; }

  function runOnce(cmds, timeoutMs){
    timeoutMs = (timeoutMs==null) ? 4800 : timeoutMs;
    var lines = [], gotBest=false, t=null, tick=null;
    function onLine(e){
      var s=(''+e.data).trim();
      lines.push(s);
      if (s.indexOf('bestmove')===0) gotBest=true;
    }
    function attach(){
      worker.addEventListener('message', onLine);
      for (var i=0;i<cmds.length;i++){ try{ worker.postMessage(cmds[i]); }catch(_){ } }
    }
    function detach(){
      worker.removeEventListener('message', onLine);
      if (t){ clearTimeout(t); t=null; }
      if (tick){ clearInterval(tick); tick=null; }
    }
    return new Promise(function(res){
      if (!worker) return res({ ok:false, lines:[] });
      attach();
      t=setTimeout(function(){ detach(); res({ ok:false, lines:lines }); }, timeoutMs);
      tick=setInterval(function(){ if (gotBest){ detach(); res({ ok:true, lines:lines }); } }, 15);
    });
  }

  function parseMultiPV(lines){
    var pv1=null, pv2=null, lastScore1=null, lastScore2=null;
    for (var i=0;i<lines.length;i++){
      var ln = lines[i];
      if (ln.indexOf('info')===0){
        var mPV = ln.match(/\bmultipv\s+(\d+)/);
        var scM = ln.match(/score\s+mate\s+(-?\d+)/);
        var scC = ln.match(/score\s+cp\s+(-?\d+)/);
        var pvM = ln.match(/\spv\s+(.+)$/);
        var score = scM ? (parseInt(scM[1],10)>0 ? 100000 : -100000) : (scC ? parseInt(scC[1],10) : null);
        if (mPV){
          var idx = parseInt(mPV[1],10);
          if (idx===1){
            if (pvM) pv1 = { cp: score, move: pvM[1].trim().split(/\s+/)[0] || '' };
            if (score!=null) lastScore1 = score;
          } else if (idx===2){
            if (pvM) pv2 = { cp: score, move: pvM[1].trim().split(/\s+/)[0] || '' };
            if (score!=null) lastScore2 = score;
          }
        }
      }
    }
    if (!pv1){
      for (var j=0;j<lines.length;j++){
        var l = lines[j];
        if (l.indexOf('bestmove')===0){
          var m = l.split(/\s+/)[1] || '';
          pv1 = { cp: lastScore1, move: m };
          break;
        }
      }
    }
    return { top1: pv1, top2: pv2 };
  }

  function parseBestAndCP(lines){
    var best=null, lastScore=null;
    for (var i=0;i<lines.length;i++){
      var ln = lines[i];
      if (ln.indexOf('info')===0){
        var scM=ln.match(/score\s+mate\s+(-?\d+)/);
        var scC=ln.match(/score\s+cp\s+(-?\d+)/);
        var pvM=ln.match(/\spv\s+(.+)$/);
        var score=scM ? (parseInt(scM[1],10)>0 ? 100000 : -100000) : (scC ? parseInt(scC[1],10) : null);
        if (pvM) best = { cp: score, pv: pvM[1].trim() };
        if (score != null) lastScore = score;
      }
      if (ln.indexOf('bestmove')===0 && !best){
        best = { cp:lastScore, pv: ln.split(/\s+/)[1] || '' };
      }
    }
    return best;
  }
  function normalizeCp(cp, turn){ if (cp==null) return null; return (turn==='w') ? cp : -cp; }

  function countMaterial(fen, color) {
    var board = fen.split(' ')[0];
    var vals = { p:100, n:320, b:330, r:500, q:900, k:0 };
    var sum = 0;
    for (var i=0;i<board.length;i++){
      var ch = board[i];
      if (ch === '/' || (ch >= '1' && ch <= '8')) continue;
      var isWhite = (ch >= 'A' && ch <= 'Z');
      var lower = ch.toLowerCase();
      var v = vals[lower] || 0;
      if ((color === 'w' && isWhite) || (color === 'b' && !isWhite)) sum += v;
    }
    return sum;
  }
  function isPieceSacrifice(preFEN, postFEN, color) {
    try {
      var before = countMaterial(preFEN, color);
      var after  = countMaterial(postFEN, color);
      var delta  = after - before;
      return delta <= -200;
    } catch(_) { return false; }
  }

  async function analyzeMove(task){
    if (!coachOn) return;
    ensurePanel();
    if (!worker) startEngine();
    if (!SAYS) { try { await loadSAYS(); } catch(_){ SAYS=null; } }

    var ply   = typeof task.ply === 'number' ? task.ply : (currentPly + 1);
    var skill = readSkill();
    var key   = cacheKey(task.preFEN, task.uci, skill);

    var cached = cacheGet(key);
    if (cached){ setRec(ply, cached); return; }

    if (pendingKeys.has(key)) return;
    pendingKeys.add(key);

    var fanSan = sanToFAN(task.san || '?');
    setRec(ply, {
      moveNo: task.moveNo,
      badgeClass: 'inf',
      badgeText: '⏳',
      message: '<span class="san">'+fanSan+'</span> — Analiz bekleniyor...'
    });

    var r1 = await runOnce(['position fen ' + task.preFEN, 'go depth 10'], 5000);
    if (!r1.ok){
      setRec(ply, { badgeClass:'wrn', badgeText:'Dikkat!', message:'Motor cevap vermedi (en iyi hamle).', moveNo: task.moveNo });
      pendingKeys.delete(key); return;
    }
    var mpv  = parseMultiPV(r1.lines);
    var best = parseBestAndCP(r1.lines);

    var top1Move = mpv.top1 && mpv.top1.move || (best && best.pv ? best.pv.split(/\s+/)[0] : null);
    var cp1 = mpv.top1 ? mpv.top1.cp : (best ? best.cp : null);
    var top2Move = mpv.top2 ? mpv.top2.move : null;
    var cp2 = mpv.top2 ? mpv.top2.cp : null;

    var r2 = await runOnce(['position fen ' + task.preFEN, 'go depth 9 searchmoves ' + task.uci], 4500);
    if (!r2.ok){
      setRec(ply, { badgeClass:'wrn', badgeText:'Dikkat!', message:'Motor cevap vermedi (kendi hamlen).', moveNo: task.moveNo });
      pendingKeys.delete(key); return;
    }
    var mine = parseBestAndCP(r2.lines);
    var myCp = mine ? mine.cp : null;

    var cp1n = normalizeCp(cp1, task.color);
    var cp2n = normalizeCp(cp2, task.color);
    var bestCp = cp1n;
    myCp       = normalizeCp(myCp, task.color);
    var delta  = (bestCp!=null && myCp!=null) ? (bestCp - myCp) : null;

    var GAP = uniqueBestGapBySkill(skill);
    var uniqueBest = false;
    if (cp1n != null && (cp2n == null || (cp1n - cp2n) >= GAP)) uniqueBest = true;

    var sac = isPieceSacrifice(task.preFEN, task.postFEN, task.color);
    var userIsTop1 = top1Move && (task.uci && task.uci.indexOf(top1Move)===0);

    var looksDefensiveUnique =
      (userIsTop1 && uniqueBest &&
       ((cp2n==null) || (cp1n - cp2n) >= 150 || (cp2n <= -MATE_CP)) &&
       (cp1n==null || cp1n <= 20));

    var missedWin = false;
    if (bestCp!=null && myCp!=null){
      if (bestCp >= 300 && (bestCp - myCp) >= 150 && (bestCp - myCp) < THRESH.bad){
        missedWin = true;
      }
    }

    var clickable = !userIsTop1 || !!task.suggestNext;
    function ctxFor(){
      return {
        bestText: top1Move || '?',
        bestUci:  top1Move || '',
        userIsTop1: !!userIsTop1,
        suggestNext: !!task.suggestNext,
        clickable: clickable
      };
    }

    var badgeText='', badgeClass='';

    if (task.isBook === true && delta != null && delta <= THRESH.good){
      badgeText='Bilinen Yol'; badgeClass='book';
    } else if (myCp==null || delta==null){
      badgeText='İyi'; badgeClass='good';
    } else if (myCp <= -MATE_CP || (delta > THRESH.bad)){
      badgeText='Kayıp'; badgeClass='lose';
    } else if (sac && (myCp >= MATE_CP || delta <= THRESH.ex)){
      badgeText='Efsanevi!'; badgeClass='leg';
    } else if (looksDefensiveUnique){
      badgeText='Tek Yol'; badgeClass='force';
    } else if (userIsTop1 && uniqueBest){
      badgeText='Altın Hamle!'; badgeClass='ok';
    } else if (missedWin){
      badgeText='Kaçan Fırsat'; badgeClass='missed';
    } else if (delta <= THRESH.ex){
      badgeText='Harika!'; badgeClass='ex';
    } else if (delta <= THRESH.vgood){
      badgeText='Çok Güzel!'; badgeClass='vgood';
    } else if (delta <= THRESH.goodp){
      badgeText='Sağlam Adım'; badgeClass='goodp';
    } else if (delta <= THRESH.good){
      badgeText='İyi'; badgeClass='good';
    } else if (delta <= THRESH.midp){
      badgeText='Daha İyisi Vardı'; badgeClass='midp';
    } else if (delta <= THRESH.mid){
      badgeText='Biraz Riskli'; badgeClass='mid';
    } else if (delta <= THRESH.wrnp){
      badgeText='Zayıf hamle'; badgeClass='wrnp';
    } else if (delta <= THRESH.wrn){
      badgeText='Dikkat!'; badgeClass='wrn';
    } else {
      badgeText='Büyük Hata!'; badgeClass='bad';
    }

    var ctx = ctxFor();
    var messageCore = '';
    try{
      var haveSays = (SAYS && typeof SAYS.render === 'function' && typeof SAYS.narrate === 'function');
      if (haveSays){
        var narr = SAYS.narrate(task.preFEN, task.postFEN || '', {
          uci: task.uci, san: task.san, color: task.color,
          bestText: (top1Move || '?')
        }, {
          category: badgeClass,
          missedWin: (badgeClass==='missed'),
          movesSAN: task.movesSAN,
          skill: skill,
          ply: task.ply,
          moveNo: task.moveNo
        });
        messageCore = fmt(SAYS.render(badgeClass, ctx, narr, {
          skill: skill,
          category: badgeClass,
          suppressPrefix: true
        }), ctx);
        if (narr && narr.tip) messageCore += ' <span class="tip">— ' + narr.tip + '</span>';
      } else {
        messageCore = line(badgeClass, ctx);
      }
    }catch(_){
      messageCore = line(badgeClass, ctx);
    }

    var finalRec = {
      moveNo: task.moveNo,
      badgeClass: badgeClass,
      badgeText:  badgeText,
      message: '<span class="san">'+sanToFAN(task.san || '?')+'</span> — ' + messageCore
    };

    setRec(ply, finalRec);
    cacheSet(key, finalRec);
    pendingKeys.delete(key);
  }

  /* ALT SIRA hedef sıralamayı koru */
  function placeBottomIcons(){
    var bar = document.querySelector(BOTTOM_BAR_SEL);
    if (!bar) return;
    var order = ['cm-theme-toggle','cm-sound-toggle','cm-coach-toggle','cm-hints','cm-board-toggle','cm-undo','cm-redo'];
    for (var i=0;i<order.length;i++){
      var id = order[i], el = document.getElementById(id);
      if (el) bar.appendChild(el); // mevcut elemanı alt sıraya, istenen sırada taşı
    }
  }

  function ensureToggle(){
    var container = document.querySelector(BOTTOM_BAR_SEL) || document.querySelector(TOOLBAR_SEL);
    if (!container) return;

    var btn = document.getElementById('cm-coach-toggle');
    if (!btn){
      btn = document.createElement('button');
      btn.id='cm-coach-toggle'; btn.type='button'; btn.className='cm-btn cm-coach-toggle';
      btn.textContent='🎓'; btn.title='Eğitmen Modu';
      // Konum: ipucu varsa öncesine; yoksa tahtadan önce; hiçbiri yoksa sona
      var hints = document.getElementById('cm-hints');
      var board = document.getElementById('cm-board-toggle');
      if (hints && hints.parentNode === container) container.insertBefore(btn, hints);
      else if (board && board.parentNode === container) container.insertBefore(btn, board);
      else container.appendChild(btn);
    } else {
      // buton zaten var ise alt sıraya taşı
      if (container && btn.parentNode !== container) container.appendChild(btn);
    }

    btn.setAttribute('aria-pressed', coachOn ? 'true' : 'false');
    btn.addEventListener('click', function(){
      coachOn = !coachOn;
      btn.setAttribute('aria-pressed', coachOn ? 'true' : 'false');
      try{ STORE.setItem('cm-coach', coachOn ? 'on' : 'off'); }catch(_){}
      renderCurrent();
      if (coachOn && !worker) startEngine();
    }, { passive:true });

    // hedef sırayı uygula
    placeBottomIcons();

    // 🎯 butonu daha sonra enjekte edilirse sırayı tekrar düzelt
    var obs = new MutationObserver(function(){
      if (document.getElementById('cm-hints')) { placeBottomIcons(); obs.disconnect(); }
    });
    obs.observe(document.body, { childList:true, subtree:true });
  }

  function hook(){
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.cm-best');
      if (!a) return;
      e.preventDefault();
      var uci = a.getAttribute('data-uci');
      if (!uci) return;
      clearArrow(); drawArrow(uci);
    });

    document.addEventListener('cm-move', function(e){
      var d = e.detail || {}; if (!d.preFEN || !d.uci) return;
      analyzeMove({
        preFEN:d.preFEN, postFEN:d.postFEN, uci:d.uci, san:d.san,
        color:d.color, moveNo:d.moveNo, ply:d.ply,
        isBook:d.isBook===true,
        suggestNext: d.suggestNext === true,
        movesSAN: d.movesSAN
      });
      clearArrow();
    });
    window.addEventListener('message', function(e){
      var m = e && e.data; if (!m || m.type!=='cm-move') return;
      analyzeMove({
        preFEN:m.preFEN, postFEN:m.postFEN, uci:m.uci, san:m.san,
        color:m.color, moveNo:m.moveNo, ply:m.ply,
        isBook:m.isBook===true,
        suggestNext: m.suggestNext === true,
        movesSAN: m.movesSAN
      });
      clearArrow();
    });

    document.addEventListener('cm-pointer', function(e){
      var p = e.detail && typeof e.detail.ply==='number' ? e.detail.ply : 0;
      currentPly = p; renderCurrent();
    });
    window.addEventListener('message', function(e){
      var m=e&&e.data; if (!m || m.type!=='cm-pointer') return;
      currentPly = (typeof m.ply==='number') ? m.ply : 0; renderCurrent();
    });

    document.addEventListener('cm-newgame', function(){ clearPanel(); });
    window.addEventListener('resize', function(){}, { passive:true });
  }

  function ensurePanelAndBoardReady(){
    ensurePanel();
    var board = document.getElementById(BOARD_ID);
    if (board && getComputedStyle(board).position==='static'){ board.style.position='relative'; }
  }

  function init(){
    ensurePanelAndBoardReady();
    ensureToggle();          // 🎓 ekle + alt sırayı sırala
    renderCurrent();
    if (coachOn) startEngine();
    hook();
    loadSAYS();
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init, { once: true }); }
  else { init(); }

})();
