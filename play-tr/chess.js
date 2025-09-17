/* chess.js-01 */
(function () {
  'use strict';

  const STOCKFISH_JS_WASM   = '/wp-content/uploads/chess/engine/stockfish.js';
  const STOCKFISH_WASM      = '/wp-content/uploads/chess/engine/stockfish.wasm';
  const TRAMPOLINE_JS       = '/wp-content/uploads/chess/engine/stockfish.trampoline.worker.js';
  const STOCKFISH_JS_LEGACY = '/wp-content/uploads/chess/libs/stockfish.js';
  const PIECES_PATH         = '/wp-content/uploads/chess/img/chesspieces/wikipedia/{piece}.png';
  const MOVE_SOUND          = '/wp-content/uploads/chess/sound/move.wav';

  const elBoard  = document.getElementById('cm-board');
  const elStatus = document.getElementById('cm-status');
  const elPgn    = document.getElementById('cm-pgn');
  const elToast  = document.getElementById('cm-toast');

  const selSide  = document.getElementById('cm-side');
  const selSkill = document.getElementById('cm-skill');
  const btnNew   = document.getElementById('cm-new');
  const btnFlip  = document.getElementById('cm-flip');
  const btnUndo  = document.getElementById('cm-undo');

  let btnRedo=null, btnHints=null;

  const resBack   = document.getElementById('cm-result-back');
  const resTitle  = document.getElementById('cm-result-title');
  const resSub    = document.getElementById('cm-result-sub');
  const resStats  = document.getElementById('cm-result-stats');
  const btnResClose = document.getElementById('cm-res-close');
  const btnResRem   = document.getElementById('cm-res-rematch');
  const btnResFlip  = document.getElementById('cm-res-flip');
  const btnResPgn   = document.getElementById('cm-res-pgn');

  const moveAudio = new Audio(MOVE_SOUND); moveAudio.preload='auto';
  let audioCtx=null, moveBuf=null, audioPrimed=false;
  let soundOn=true;
  function readStoreItem(key){ try{const v=localStorage.getItem(key); if(v!=null)return v;}catch(_){ } try{const v2=sessionStorage.getItem(key); if(v2!=null)return v2;}catch(_){ } return null; }
  function initSoundFlag(){ const v=readStoreItem('cm-sound'); soundOn=(v==null)?true:(v==='on'); }
  initSoundFlag();
  function soundEnabledNow(){ return !!soundOn; }
  document.addEventListener('cm-sound',e=>{ try{ soundOn=!!(e && e.detail && e.detail.on); }catch(_){}} ,{passive:true});
  window.addEventListener('storage',e=>{ if(e && e.key==='cm-sound') soundOn=(e.newValue==='on'); });
  function installAudioUnlock(){
    if(audioPrimed) return;
    const prime=async()=>{
      audioPrimed=true;
      try{
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(Ctx){
          if(!audioCtx) audioCtx=new Ctx();
          if(audioCtx.state==='suspended'){ try{ await audioCtx.resume(); }catch(_){ } }
          if(!moveBuf){
            const resp=await fetch(MOVE_SOUND,{cache:'force-cache'});
            const arr=await resp.arrayBuffer();
            moveBuf=await new Promise((res,rej)=>{ const p=audioCtx.decodeAudioData(arr,res,rej); if(p&&p.then)p.then(res).catch(rej); });
          }
        }
        try{ moveAudio.muted=true; await moveAudio.play().catch(()=>{}); moveAudio.pause(); moveAudio.currentTime=0; moveAudio.muted=false; }catch(_){}
      }finally{
        window.removeEventListener('pointerdown',prime,true);
        window.removeEventListener('touchend',prime,true);
        window.removeEventListener('keydown',prime,true);
      }
    };
    window.addEventListener('pointerdown',prime,true);
    window.addEventListener('touchend',prime,true);
    window.addEventListener('keydown',prime,true);
  }
  function playMove(){
    if(!soundEnabledNow()) return;
    if(audioCtx&&moveBuf){ try{ const src=audioCtx.createBufferSource(); src.buffer=moveBuf; src.connect(audioCtx.destination); src.start(0); return; }catch(_){ } }
    try{ moveAudio.currentTime=0; moveAudio.play().catch(()=>{});}catch(_){}
  }

  function whenChessReady(cb,tries=0){ if(window.Chess) return cb(); if(tries>60){ setStatus('Hata: chess.js yüklenemedi.'); return; } setTimeout(()=>whenChessReady(cb,tries+1),100); }
  whenChessReady(init);

  function init(){
    let game = new Chess();
    let engine=null, engineBusy=false, engineTimer=null;
    let playerColor = selSide?.value || 'white';
    let allowResultModal=true;
    let redoStack=[];
    let redoGroups=[];

    let elStatusTxt=null;
    function ensureStatusBar(){
      if(!elStatus) return;
      if(document.getElementById('cm-status-txt')){ elStatusTxt=document.getElementById('cm-status-txt'); return; }
      const us=document.createElement('div'); us.id='cm-caps-us';   us.className='caps us';
      const txt=document.createElement('div'); txt.id='cm-status-txt'; txt.className='txt'; txt.textContent=elStatus.textContent||'';
      const th=document.createElement('div'); th.id='cm-caps-them'; th.className='caps them';
      elStatus.textContent=''; elStatus.appendChild(us); elStatus.appendChild(txt); elStatus.appendChild(th);
      elStatusTxt=txt;
    }
    ensureStatusBar();

    function resizePGN(){
      if(!elBoard||!elPgn) return;
      const w=Math.round(elBoard.getBoundingClientRect().width);
      elPgn.style.width=w+'px';
      elPgn.style.maxWidth=w+'px';
      elPgn.style.marginLeft='auto';
      elPgn.style.marginRight='auto';
    }
    function resizeStatus(){
      if(!elBoard||!elStatus) return;
      const w=Math.round(elBoard.getBoundingClientRect().width);
      elStatus.style.width=w+'px';
      elStatus.style.maxWidth=w+'px';
      elStatus.style.marginLeft='auto';
      elStatus.style.marginRight='auto';
    }

    const FIG = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' };
    const pieceFig = (ch)=> FIG[ch] || ch;
    const sanToFAN = (san)=>{
      if(!san) return '';
      if(/^O-O/.test(san)) return san;
      let s = san.replace(/=([QRBN])/g, (_,p)=>'='+pieceFig(p));
      s = s.replace(/^([KQRBN])/, (_,p)=>pieceFig(p));
      if (!/^[♔♕♖♗♘]/.test(s)) s = '♙' + s;
      return s;
    };
    function buildFANLine(){
      try{
        const moves = game.history({ verbose:true });
        if (!moves || !moves.length) return '';
        const out=[];
        for (let i=0;i<moves.length;i+=2){
          const w=moves[i], b=moves[i+1];
          const no = Math.floor(i/2)+1;
          let seg = no+'. '+ sanToFAN(w.san||'');
          if (b) seg += ' ' + sanToFAN(b.san||'');
          out.push(seg);
        }
        return out.join(' ');
      }catch(_){ return ''; }
    }
    function scrollPGNToEnd(){
      if(!elPgn) return;
      (window.requestAnimationFrame||setTimeout)(()=>{
        try{ elPgn.scrollLeft = elPgn.scrollWidth; }catch(_){}
      },0);
    }
    function renderPGN(){
      if(!elPgn) return;
      elPgn.textContent = buildFANLine();
      scrollPGNToEnd();
    }

    let hintsOn = (function(){ try{ return (localStorage.getItem('cm-hints')||'on')==='on'; }catch(_){ return true; } })();
    let hintSquares=[];

    function setHints(on){
      hintsOn=!!on;
      try{ localStorage.setItem('cm-hints', hintsOn?'on':'off'); }catch(_){}
      if(btnHints) btnHints.setAttribute('aria-pressed', hintsOn?'true':'false');
      if(!hintsOn) clearHints();
    }
    function addHintClass(sq,cls){
      const el=document.querySelector('.square-'+sq);
      if(el) el.classList.add(cls);
      hintSquares.push({sq,cls});
    }
    function clearHints(){
      if(!hintSquares.length) return;
      hintSquares.forEach(({sq,cls})=>{
        const el=document.querySelector('.square-'+sq);
        if(el) el.classList.remove(cls);
      });
      hintSquares.length=0;
      if(elBoard) elBoard.classList.remove('hints-active');
    }
    function showHintsFor(srcSquare){
      clearHints();
      if(!hintsOn) return;
      try{
        const moves = game.moves({ square:srcSquare, verbose:true }) || [];
        if(elBoard) elBoard.classList.add('hints-active');
        moves.forEach(m=>{
          const target=m.to;
          if(m.captured || (m.flags && m.flags.indexOf('c')>=0)) addHintClass(target,'square-hint-cap');
          else addHintClass(target,'square-hint');
        });
      }catch(_){}
    }

    const IS_ADMIN=!!document.getElementById('wpadminbar');
    const READYLESS=IS_ADMIN?true:false;

    const ELO_MAP={0:{skill:0,mt:400},5:{skill:5,mt:800},10:{skill:10,mt:1200},13:{skill:13,mt:1600},16:{skill:16,mt:2200},18:{skill:18,mt:2600},20:{skill:20,mt:3200}};
    const getSkill=()=>{ const v=parseInt(selSkill&&selSkill.value,10); return Number.isFinite(v)?v:20; };

    const board = Chessboard(elBoard,{draggable:true,position:'start',orientation:playerColor,showNotation:true,pieceTheme:(p)=>PIECES_PATH.replace('{piece}',p),onDragStart,onDrop,onSnapEnd});

    function debounce(fn,ms){ let t; return function(){ clearTimeout(t); t=setTimeout(fn,ms); }; }
    const onWindowResize=debounce(()=>{ try{board.resize();}catch(_){ } try{resizePGN();}catch(_){ } try{resizeStatus();}catch(_){ } try{resizeToolbar();}catch(_){ } try{refreshLastMoveHighlight();}catch(_){ } },120);
    window.addEventListener('resize',onWindowResize,{passive:true});
    window.addEventListener('orientationchange',onWindowResize,{passive:true});
    (typeof requestAnimationFrame==='function'?requestAnimationFrame:setTimeout)(onWindowResize,0);

    function setupPGNBar(){
      if(!elPgn||!elBoard) return;
      try{ elBoard.insertAdjacentElement('afterend',elPgn); }catch(_){}
      elPgn.style.whiteSpace='nowrap';
      elPgn.style.overflowX='auto';
      elPgn.style.overflowY='hidden';
      elPgn.style.maxHeight='none';
      elPgn.style.height='auto';
      elPgn.style.margin='6px auto 12px';
      elPgn.setAttribute('tabindex','0');
      elPgn.setAttribute('role','region');
      elPgn.setAttribute('aria-label','Hamle listesi (PGN) – yatay kaydırılabilir');
      resizePGN();
      window.addEventListener('resize',resizePGN,{passive:true});
    }
    setupPGNBar();
    resizeStatus();

    function resizeToolbar(){
      const toolbar=document.querySelector('#cm-app .cm-toolbar');
      if(!elBoard||!toolbar) return;
      const w=Math.round(elBoard.getBoundingClientRect().width);
      toolbar.style.width=w+'px';
      toolbar.style.maxWidth=w+'px';
      toolbar.style.marginLeft='auto';
      toolbar.style.marginRight='auto';
    }
    if(window.ResizeObserver){
      const ro=new ResizeObserver(()=>{ resizeToolbar(); resizePGN(); resizeStatus(); });
      if(elBoard) ro.observe(elBoard);
    }

    function emitPointer(){ const ply=game.history().length; try{document.dispatchEvent(new CustomEvent('cm-pointer',{detail:{ply}}));}catch(_){ } try{window.postMessage({type:'cm-pointer',ply},'*');}catch(_){ } }

    function broadcastCoachMove(preFEN,postFEN,uci,san,color,moveNo){
      const ply=game.history().length;
      const movesSAN = game.history() || [];
      try{
        document.dispatchEvent(new CustomEvent('cm-move',{
          detail:{preFEN,postFEN,uci,san,color,moveNo,ply,movesSAN}
        }));
      }catch(_){}
      try{
        window.postMessage({type:'cm-move',preFEN,postFEN,uci,san,color,moveNo,ply,movesSAN},'*');
      }catch(_){}
    }

    if(elBoard){ const prevent=e=>{ e.preventDefault(); }; elBoard.addEventListener('touchstart',prevent,{passive:false}); elBoard.addEventListener('touchmove',prevent,{passive:false}); }
    installAudioUnlock();

    let uciOk=false, readyOk=false;
    let readyWaiters={uciok:[],readyok:[]};
    function notify(tok){ const arr=readyWaiters[tok]; if(!arr) return; let cb; while((cb=arr.shift())) try{cb();}catch(_){ } }
    function waitFor(tok){ return new Promise(res=>{ if(tok==='uciok'&&uciOk) return res(); if(tok==='readyok'&&readyOk) return res(); readyWaiters[tok].push(res); }); }
    async function ensureReady(timeoutMs=6000){ if(READYLESS) return; const start=Date.now(); await waitFor('uciok'); await Promise.race([(engine.postMessage('isready'),waitFor('readyok')), new Promise((_,rej)=>setTimeout(()=>rej(new Error('ready-timeout')), Math.max(1500, timeoutMs-(Date.now()-start))))]); }
    function buildBlobURL(){ const ORIGIN=location.origin; const code=`var ORIGIN=${JSON.stringify(ORIGIN)};var JS_URL=ORIGIN+${JSON.stringify(STOCKFISH_JS_WASM)};var WASM_URL=ORIGIN+${JSON.stringify(STOCKFISH_WASM)};self.Module={locateFile:function(p){return (p&&p.endsWith('.wasm'))?WASM_URL:p;}};importScripts(JS_URL);`; return URL.createObjectURL(new Blob([code],{type:'application/javascript'})); }

    async function startEngine(){
      if(engine){ try{engine.terminate();}catch(_){ } }
      uciOk=false; readyOk=false; readyWaiters={uciok:[],readyok:[]};
      const ORIGIN=location.origin; let started=false;
      try{ engine=new Worker(TRAMPOLINE_JS+'?origin='+encodeURIComponent(ORIGIN)); wireEngine(); engine.postMessage('uci'); const ok=await Promise.race([waitFor('uciok').then(()=>true), new Promise(r=>setTimeout(()=>r(false),2200))]); if(ok) started=true; }catch(_){}
      if(!started){ try{ engine=new Worker(STOCKFISH_JS_WASM); wireEngine(); engine.postMessage('uci'); const ok2=await Promise.race([waitFor('uciok').then(()=>true), new Promise(r=>setTimeout(()=>r(false),2000))]); if(ok2) started=true; }catch(_){ } }
      if(!started){ try{ const url=buildBlobURL(); engine=new Worker(url); wireEngine(); engine.postMessage('uci'); const ok3=await Promise.race([waitFor('uciok').then(()=>true), new Promise(r=>setTimeout(()=>r(false),2000))]); if(ok3) started=true; }catch(_){ } }
      if(!started){ try{ engine=new Worker(STOCKFISH_JS_LEGACY); wireEngine(); engine.postMessage('uci'); started=true; }catch(e4){ setStatus('Hata: Motor başlatılamadı.'); } }
      try{
        await ensureReady(7000);
        setSkill(getSkill());
        engine.postMessage('ucinewgame');
        engine.postMessage('isready');
      }catch(e){
        try{ engine.terminate(); }catch(_){}
        try{ engine=new Worker(STOCKFISH_JS_LEGACY); wireEngine(); engine.postMessage('uci'); setSkill(getSkill()); engine.postMessage('ucinewgame'); }catch(e2){ setStatus('Hata: Motor hazır değil.'); }
      }
    }

    let capsUs=[];
    let capsThem=[];

    function pieceCode(color,type){ return (color==='w'?'w':'b') + String(type||'').toUpperCase(); }
    function isPlayerMoveColor(c){ return (playerColor==='white'&&c==='w')||(playerColor==='black'&&c==='b'); }

    const ORDER_VAL={P:1,N:2,B:3,R:4,Q:5,K:6};

    function countsByCode(arr){
      const m=new Map();
      arr.forEach(c=> m.set(c,(m.get(c)||0)+1));
      const list=[...m.entries()].map(([code,count])=>({code,count}));
      list.sort((a,b)=> ORDER_VAL[a.code[1]]-ORDER_VAL[b.code[1]]);
      return list;
    }

    function figurineForCode(code){
      const t = (code && code[1]) || 'P';
      const MAP = {K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙'};
      return MAP[t] || '♙';
    }

    function chipEl(code,count){
      const wrap=document.createElement('span'); wrap.className='fcap';
      const fig=document.createElement('span'); fig.className='fig'; fig.textContent=figurineForCode(code);
      wrap.appendChild(fig);
      if(count>1){
        const mul=document.createElement('span'); mul.className='mul'; mul.textContent='×'+count;
        wrap.appendChild(mul);
      }
      wrap.title=(count>1?('×'+count+' '):'')+code;
      return wrap;
    }

    function renderCaps(){
      ensureStatusBar();
      const elUs=document.getElementById('cm-caps-us');
      const elTh=document.getElementById('cm-caps-them');
      if(elUs){
        elUs.innerHTML='';
        countsByCode(capsUs).forEach(({code,count})=> elUs.appendChild(chipEl(code,count)));
      }
      if(elTh){
        elTh.innerHTML='';
        countsByCode(capsThem).forEach(({code,count})=> elTh.appendChild(chipEl(code,count)));
      }
    }

    function recordCaptureIfAny(mv){
      if(!mv || !mv.captured) return;
      const takenColor = (mv.color==='w'?'b':'w');
      const code = pieceCode(takenColor, mv.captured);
      if (isPlayerMoveColor(mv.color)) capsUs.push(code); else capsThem.push(code);
      renderCaps();
    }
    function removeCaptureForUndoneMove(mv){
      if(!mv || !mv.captured) return;
      const takenColor = (mv.color==='w'?'b':'w');
      const code = pieceCode(takenColor, mv.captured);
      const arr = isPlayerMoveColor(mv.color) ? capsUs : capsThem;
      for(let i=arr.length-1;i>=0;i--){ if(arr[i]===code){ arr.splice(i,1); break; } }
      renderCaps();
    }

    function wireEngine(){
      engine.onmessage=(e)=>{
        const line=(''+e.data).trim();
        if(line==='uciok'){ uciOk=true; notify('uciok'); return; }
        if(line==='readyok'){ readyOk=true; notify('readyok'); return; }
        if(line.startsWith('bestmove')){
          engineBusy=false; clearTimeout(engineTimer);
          const mv=line.split(' ')[1];
          if(mv && mv.length>=4){
            const from=mv.substring(0,2), to=mv.substring(2,4), promo=mv[4];
            try{
              const applied=game.move({from,to,promotion:promo||'q'});
              redoStack.length=0; redoGroups.length=0;
              board.position(game.fen());
              highlightLastMove(from,to);
              recordCaptureIfAny(applied);
              clearHints(); playMove(); updateStatus(); savePrefs();
              renderPGN(); resizeToolbar(); emitPointer(); renderCaps();
            }catch(_){}
          }
        }
      };
      engine.onerror=()=>{
        try{ engine.terminate(); }catch(_){}
        (async()=>{ try{ engine=new Worker(STOCKFISH_JS_LEGACY); wireEngine(); engine.postMessage('uci'); setSkill(getSkill()); engine.postMessage('ucinewgame'); }catch(e2){ setStatus('Hata: Motor toparlanamadı.'); } })();
      };
    }

    startEngine();

    function setSkill(level){ const row=ELO_MAP[level]||{skill:level,mt:1500}; try{ engine.postMessage('setoption name Skill Level value '+row.skill); }catch(_){ } selSkill && (selSkill._mt=row.mt); }

    selSide && selSide.addEventListener('change',()=>{ playerColor=selSide.value; board.orientation(playerColor); newGame(); savePrefs(); });
    selSkill && selSkill.addEventListener('change',()=>{ setSkill(getSkill()); savePrefs(); });
    btnNew && btnNew.addEventListener('click', newGame);
    if(btnFlip){ btnFlip.style.display='none'; btnFlip.disabled=true; }
    btnUndo && btnUndo.addEventListener('click', onUndo);

    if(resBack){
      (btnResClose)&&btnResClose.addEventListener('click',()=> resBack.style.display='none');
      resBack.addEventListener('click',e=>{ if(e.target===resBack) resBack.style.display='none'; });
      document.addEventListener('keydown',e=>{ if(e.key==='Escape' && resBack.style.display==='flex') resBack.style.display='none'; });
      (btnResRem)&&btnResRem.addEventListener('click',()=>{ resBack.style.display='none'; newGame(); });
      (btnResPgn)&&btnResPgn.addEventListener('click',()=>{ const txt=buildFANLine()||''; if(navigator.clipboard) navigator.clipboard.writeText(txt); toast('PGN (FAN) kopyalandı.'); });
    }

    (function loadPrefs(){
      const str=localStorage.getItem('cm-prefs'); if(!str){ updateStatus(); emitPointer(); resizeToolbar(); resizeStatus(); return; }
      try{
        const p=JSON.parse(str);
        if(p.side){ playerColor=p.side; selSide&&(selSide.value=p.side); board.orientation(p.side); }
        if(Number.isFinite(p.skill)){ selSkill&&(selSkill.value=String(p.skill)); }
        if(p.fen){ game.load(p.fen); board.position(p.fen); }
      }catch(_){}
      allowResultModal=false; updateStatus(); allowResultModal=true;
      setTimeout(()=>{ try{ setSkill(getSkill()); }catch(_){ } }, 600);
      redoStack.length=0; redoGroups.length=0; updateRedoUI();
      capsUs=[]; capsThem=[]; renderCaps();
      renderPGN(); resizeToolbar(); resizeStatus(); emitPointer();
    })();

    let lastMoveSquares=[];
    let afterSnap=null, snapGuard=null;

    async function newGame(){
      if(engineBusy) return;
      game.reset(); board.position('start'); clearLastMoveHighlight(); clearHints(); setStatus('Hazır.');
      redoStack.length=0; redoGroups.length=0; updateRedoUI();
      capsUs=[]; capsThem=[]; renderCaps();
      try{ await ensureReady(6000); engine.postMessage('ucinewgame'); if(playerColor==='black') thinkAndMove(); }
      catch(_){ await startEngine(); if(playerColor==='black') thinkAndMove(); }
      savePrefs();
      try{ document.dispatchEvent(new Event('cm-newgame')); }catch(_){}
      try{ window.postMessage({type:'cm-newgame'},'*'); }catch(_){}
      renderPGN(); resizeToolbar(); resizeStatus(); emitPointer();
    }

    function onUndo(){
      if(engineBusy) return;
      const h=game.history({verbose:true}); if(!h.length) return;
      const isPlayerToMoveNow=(playerColor==='white'&&game.turn()==='w')||(playerColor==='black'&&game.turn()==='b');
      const steps=isPlayerToMoveNow?2:1;
      let undone=[];
      for(let i=0;i<steps;i++){ const mv=game.undo(); if(!mv) break; undone.push(mv); }
      undone.forEach(removeCaptureForUndoneMove);
      if(undone.length>0){
        undone.reverse().forEach(mv=>{ redoStack.push({from:mv.from,to:mv.to,promotion:mv.promotion}); });
        redoGroups.push(undone.length);
      }
      board.position(game.fen()); refreshLastMoveHighlight(); clearHints(); updateStatus(); savePrefs(); updateRedoUI(); renderPGN(); resizeToolbar(); resizeStatus();
      emitPointer(); renderCaps();
    }

    function decorateControls(){
      if(btnUndo){ btnUndo.textContent='⏪'; btnUndo.setAttribute('title','Geri al'); btnUndo.setAttribute('aria-label','Geri al'); }
      const toolbar=document.querySelector('#cm-app .cm-toolbar');
      if(toolbar && !document.getElementById('cm-redo')){
        btnRedo=document.createElement('button'); btnRedo.id='cm-redo'; btnRedo.type='button'; btnRedo.className='cm-btn'; btnRedo.textContent='⏩'; btnRedo.title='İleri al'; btnRedo.setAttribute('aria-label','İleri al');
        if(btnUndo && btnUndo.nextSibling) toolbar.insertBefore(btnRedo, btnUndo.nextSibling); else toolbar.appendChild(btnRedo);
        btnRedo.addEventListener('click', onRedo, {passive:true});
      } else {
        btnRedo=document.getElementById('cm-redo'); if(btnRedo) btnRedo.addEventListener('click', onRedo, {passive:true});
      }

      if(toolbar && !document.getElementById('cm-hints')){
        btnHints=document.createElement('button');
        btnHints.id='cm-hints'; btnHints.type='button'; btnHints.className='cm-btn';
        btnHints.textContent='🎯'; btnHints.title='Hamle ipuçları';
        btnHints.setAttribute('aria-pressed', hintsOn?'true':'false');
        toolbar.appendChild(btnHints);
        btnHints.addEventListener('click', ()=>setHints(!hintsOn), {passive:true});
      } else {
        btnHints=document.getElementById('cm-hints');
        if(btnHints){ btnHints.addEventListener('click', ()=>setHints(!hintsOn), {passive:true}); btnHints.setAttribute('aria-pressed', hintsOn?'true':'false'); }
      }

      updateRedoUI();
      resizeToolbar(); resizeStatus();
    }
    decorateControls();

    function updateRedoUI(){ if(!btnRedo) return; const enabled=redoStack.length>0; btnRedo.disabled=!enabled; btnRedo.style.opacity=enabled?'1':'0.5'; }

    function onRedo(){
      if(engineBusy) return; if(!redoStack.length) return;
      const groupSize = (redoGroups.length ? redoGroups.pop() : 1);
      const n = Math.max(1, Math.min(groupSize, redoStack.length));
      try{
        for(let i=0;i<n;i++){
          const mv=redoStack.shift();
          if(!mv) break;
          const applied=game.move({from:mv.from,to:mv.to,promotion:mv.promotion||'q'});
          if(!applied){ redoStack.length=0; redoGroups.length=0; updateRedoUI(); return; }
          recordCaptureIfAny(applied);
          board.position(game.fen());
          highlightLastMove(applied.from,applied.to);
          clearHints(); playMove(); updateStatus();
        }
        savePrefs();
        if(redoStack.length===0){
          const engineTurnNow=(playerColor==='white'&&game.turn()==='b')||(playerColor==='black'&&game.turn()==='w');
          if(!game.game_over()&&engineTurnNow&&!engineBusy){ thinkAndMove(); }
        }
        renderPGN(); resizeToolbar(); resizeStatus(); emitPointer(); renderCaps();
      }catch(_){
        redoStack.length=0; redoGroups.length=0;
      } finally{
        updateRedoUI();
      }
    }

    function onDragStart(src,piece){
      if(engineBusy||game.game_over()) return false;
      if(playerColor==='white'&&piece.startsWith('b')) return false;
      if(playerColor==='black'&&piece.startsWith('w')) return false;
      showHintsFor(src);
    }

    function onDrop(src,tgt){
      const moving=game.get(src);
      const isPawn=moving&&moving.type==='p';
      const tr=tgt[1];
      const willPromote=isPawn&&((moving.color==='w'&&tr==='8')||(moving.color==='b'&&tr==='1'));
      const preFEN_now=game.fen();

      clearHints();

      if(willPromote){
        openPromotion(choice=>{
          const mv=game.move({from:src,to:tgt,promotion:choice});
          if(!mv) return;
          redoStack.length=0; redoGroups.length=0; updateRedoUI();
          board.position(game.fen());
          highlightLastMove(mv.from,mv.to);
          recordCaptureIfAny(mv);
          playMove(); updateStatus();
          const uci=mv.from+mv.to+(mv.promotion||'');
          const moveNo=(mv.moveNumber||Math.floor((game.history().length+1)/2))+'.';
          broadcastCoachMove(preFEN_now, game.fen(), uci, mv.san, mv.color, moveNo);
          emitPointer();
          if(!game.game_over()) thinkAndMove();
          savePrefs();
          renderPGN(); resizeToolbar(); resizeStatus(); renderCaps();
        });
        return 'snapback';
      }

      const move=game.move({from:src,to:tgt,promotion:'q'});
      if(!move) return 'snapback';

      redoStack.length=0; redoGroups.length=0; updateRedoUI();
      recordCaptureIfAny(move);

      afterSnap=()=>{
        highlightLastMove(move.from,move.to);
        playMove(); updateStatus();
        const uci=move.from+move.to+(move.promotion||'');
        const moveNo=(move.moveNumber||Math.floor((game.history().length+1)/2))+'.';
        broadcastCoachMove(preFEN_now, game.fen(), uci, move.san, move.color, moveNo);
        emitPointer();
        if(!game.game_over()&&!engineBusy) thinkAndMove();
        savePrefs();
        renderPGN(); resizeToolbar(); resizeStatus(); renderCaps();
      };

      if(!game.game_over()&&!engineBusy){ thinkAndMove(); }

      clearTimeout(snapGuard);
      snapGuard=setTimeout(()=>{ if(afterSnap){ board.position(game.fen()); const fn=afterSnap; afterSnap=null; try{ fn(); }catch(_){ } } },180);
    }

    function onSnapEnd(){ clearTimeout(snapGuard); board.position(game.fen()); if(afterSnap){ try{ afterSnap(); } finally{ afterSnap=null; } } }

    function thinkAndMove(){
      if(game.game_over()) return;
      engineBusy=true;
      const mt=(selSkill&&selSkill._mt) ? selSkill._mt : 1500;
      try{
        (async()=>{ try{ await ensureReady(6000); engine.postMessage('position fen '+game.fen()); engine.postMessage('go movetime '+mt); setStatus('Motor düşünüyor… ('+mt+' ms)'); }catch(_){ engineBusy=false; } })();
        clearTimeout(engineTimer);
        engineTimer=setTimeout(async()=>{ if(!engineBusy) return; try{ engine.terminate(); }catch(_){ } await startEngine(); engineBusy=true; engine.postMessage('position fen '+game.fen()); engine.postMessage('go movetime '+Math.max(800,mt)); setStatus('Motor toparlanıyor…'); }, Math.min(mt+5000,15000));
      }catch(_){ engineBusy=false; }
    }

    function clearLastMoveHighlight(){ lastMoveSquares.forEach(sq=>{ const el=document.querySelector('.square-'+sq); if(el) el.classList.remove('square-highlight'); }); lastMoveSquares=[]; }
    function highlightLastMove(f,t){ clearLastMoveHighlight(); lastMoveSquares=[f,t]; [f,t].forEach(s=>{ const el=document.querySelector('.square-'+s); if(el) el.classList.add('square-highlight'); }); }
    function refreshLastMoveHighlight(){ const h=game.history({verbose:true}); if(h.length){ const lm=h[h.length-1]; highlightLastMove(lm.from,lm.to);} else clearLastMoveHighlight(); }

    function setStatus(s){
      ensureStatusBar();
      const tgt=document.getElementById('cm-status-txt');
      if(tgt) tgt.textContent=s; else if(elStatus) elStatus.textContent=s;
    }
    function loadStats(){ try{return JSON.parse(localStorage.getItem('cm-stats')||'{"W":0,"L":0,"D":0}');}catch(_){return {W:0,L:0,D:0};} }
    function saveStats(s){ localStorage.setItem('cm-stats', JSON.stringify(s)); }
    function renderStats(){ if(!resStats) return; const s=loadStats(); ['W','L','D'].forEach(k=>{ const el=resStats.querySelector('[data-k="'+k+'"]'); if(el) el.textContent=s[k]; }); }
    function showResultModal(type,winnerColor){
      if(!resBack||!allowResultModal) return;
      if(type==='draw'){ resTitle.textContent='Beraberlik'; resSub.textContent='Oyun berabere bitti.'; }
      else {
        const youWin=(winnerColor==='w'&&playerColor==='white')||(winnerColor==='b'&&playerColor==='black');
        resTitle.textContent=(winnerColor==='w'?'Beyaz':'Siyah')+' kazandı';
        resSub.textContent=youWin?'Sen kazandın 🎉':'Bir oyuna daha ne dersin?';
      }
      const s=loadStats();
      if(type==='draw') s.D++; else { ((winnerColor==='w'&&playerColor==='white')||(winnerColor==='b'&&playerColor==='black')) ? s.W++ : s.L++; }
      saveStats(s); renderStats(); resBack.style.display='flex';
    }

    function updateStatus(){
      const sideToMove=game.turn()==='w'?'Beyaz':'Siyah';
      if(game.in_checkmate()){
        const winnerColor=(game.turn()==='w'?'b':'w');
        setStatus('Oyun bitti, '+(winnerColor==='w'?'Beyaz':'Siyah')+' mat etti.');
        renderPGN();
        try{ engine.postMessage('stop'); }catch(_){}
        engineBusy=false; showResultModal('win',winnerColor); return;
      }
      if(game.in_draw()){
        setStatus(game.insufficient_material()?'Oyun bitti, yetersiz taş nedeniyle beraberlik.':'Oyun bitti, beraberlik.');
        renderPGN();
        try{ engine.postMessage('stop'); }catch(_){}
        engineBusy=false; showResultModal('draw'); return;
      }
      setStatus(sideToMove+' oynuyor.'+(game.in_check()?' (ŞAH!)':'')); renderPGN();
    }

    function openPromotion(cb){
      const back=document.getElementById('cm-promote-back'); const box=document.getElementById('cm-promote');
      if(!back||!box){ cb('q'); return; }
      back.style.display='flex';
      const q=document.getElementById('cm-promote-q'), r=document.getElementById('cm-promote-r'),
            b=document.getElementById('cm-promote-b'), n=document.getElementById('cm-promote-n');
      const pick=v=>{ back.style.display='none'; cleanup(); cb(v); };
      q.onclick=()=>pick('q'); r.onclick=()=>pick('r'); b.onclick=()=>pick('b'); n.onclick=()=>pick('n');
      back.addEventListener('click', back._closer=(e)=>{ if(e.target===back){ back.style.display='none'; cleanup(); }});
      document.addEventListener('keydown', back._esc=(e)=>{ if(e.key==='Escape'){ back.style.display='none'; cleanup(); }});
      function cleanup(){ [q,r,b,n].forEach(x=>x&&(x.onclick=null)); back.removeEventListener('click', back._closer); document.removeEventListener('keydown', back._esc); }
    }

    function toast(msg){ if(!elToast) return; elToast.textContent=msg; elToast.style.display='inline'; clearTimeout(elToast._t); elToast._t=setTimeout(()=>{elToast.style.display='none';},1400); }
    function savePrefs(){ const prefs={side:playerColor,skill:getSkill(),fen:game.fen()}; localStorage.setItem('cm-prefs', JSON.stringify(prefs)); }
  }
})();
