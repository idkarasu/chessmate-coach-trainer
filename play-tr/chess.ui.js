/* chess.ui.js-01 */
(function () {
  'use strict';

  window.CM_NO_CHROME = true;

  function safeStorage() {
    try { const t='__cm_t_'+Math.random(); localStorage.setItem(t,'1'); localStorage.removeItem(t); return localStorage; }
    catch (_) { try { const t='__cm_t_'+Math.random(); sessionStorage.setItem(t,'1'); sessionStorage.removeItem(t); return sessionStorage; }
      catch(_2){ const mem={}; return { getItem:k=> (k in mem?mem[k]:null), setItem:(k,v)=>{mem[k]=String(v)}, removeItem:k=>{delete mem[k]} }; } }
  }
  const STORE = safeStorage();

  const $ = (id) => document.getElementById(id);
  const HTML  = document.documentElement;
  const BODY  = document.body;
  const APP   = () => document.getElementById('cm-app');
  const BOARD = () => document.getElementById('cm-board');
  function applyToTargets(fn){ [HTML, BODY, APP(), BOARD()].filter(Boolean).forEach(fn); }

  function applyTheme(mode){
    const isLight = (mode === 'light');
    applyToTargets((n)=>{
      n.classList.remove('cm-theme-light','cm-theme-dark','cm-light','cm-dark','light','dark');
      n.classList.add(isLight ? 'cm-theme-light' : 'cm-theme-dark');
      n.classList.add(isLight ? 'cm-light' : 'cm-dark');
      n.classList.add(isLight ? 'light' : 'dark');
      n.setAttribute('data-cm-theme', isLight ? 'light' : 'dark');
      n.setAttribute('data-theme',    isLight ? 'light' : 'dark');
    });
    try { STORE.setItem('cm-theme', isLight ? 'light' : 'dark'); } catch(_) {}

    const btn = $('cm-theme-toggle');
    if (btn){
      btn.textContent = isLight ? '☀️' : '🌙';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      btn.title = isLight ? 'Karanlık moda geç' : 'Aydınlık moda geç';
    }
    document.dispatchEvent(new CustomEvent('cm-theme', {detail:{mode:isLight?'light':'dark'}}));
  }

  const BOARD_LIST = ['classic','green','cmink'];
  function applyBoard(name){
    const val = BOARD_LIST.includes(name) ? name : 'classic';
    applyToTargets((n)=>{
      n.classList.remove('cm-board-classic','cm-board-green','cm-board-cmink','board-classic','board-green','board-cmink','cm-green','cm-classic','cm-cmink');
      n.classList.add('cm-board-' + val);
      if (val==='classic'){ n.classList.add('board-classic','cm-classic'); }
      if (val==='green'){   n.classList.add('board-green','cm-green'); }
      if (val==='cmink'){   n.classList.add('board-cmink','cm-cmink'); }
      n.setAttribute('data-cm-board', val);
    });
    try { STORE.setItem('cm-board', val); } catch(_) {}
    const btn = $('cm-board-toggle'); if (btn) btn.setAttribute('aria-label','Tahta: '+val);
    document.dispatchEvent(new CustomEvent('cm-board', {detail:{board:val}}));
  }

  function applySound(on){
    try { STORE.setItem('cm-sound', on ? 'on' : 'off'); } catch(_) {}
    const btn = $('cm-sound-toggle');
    if (btn){
      btn.textContent = on ? '🔊' : '🔇';
      btn.setAttribute('aria-pressed', on ? 'true':'false');
      btn.title = on ? 'Sesi kapat' : 'Sesi aç';
    }
    document.dispatchEvent(new CustomEvent('cm-sound', {detail:{on}}));
  }

  function initState(){
    const theme = STORE.getItem('cm-theme') || 'dark';
    const board = STORE.getItem('cm-board') || 'classic';
    const sound = (STORE.getItem('cm-sound') || 'on') === 'on';
    applyTheme(theme); applyBoard(board); applySound(sound);
  }

  function bindEvents(){
    const btTheme = $('cm-theme-toggle');
    const btBoard = $('cm-board-toggle');
    const btSound = $('cm-sound-toggle');

    btTheme && btTheme.addEventListener('click', ()=>{
      const cur = BODY.classList.contains('cm-theme-light') ? 'light' : (STORE.getItem('cm-theme') || 'dark');
      applyTheme(cur==='dark' ? 'light' : 'dark');
    }, {passive:true});

    btBoard && btBoard.addEventListener('click', ()=>{
      const cur = (BODY.getAttribute('data-cm-board') || STORE.getItem('cm-board') || 'classic');
      const idx = (BOARD_LIST.indexOf(cur) + 1) % BOARD_LIST.length;
      applyBoard(BOARD_LIST[idx]);
    }, {passive:true});

    btSound && btSound.addEventListener('click', ()=>{
      const on = (STORE.getItem('cm-sound') || 'on') === 'on';
      applySound(!on);
    }, {passive:true});

    document.addEventListener('contextmenu', (e)=>{ e.preventDefault(); return false; }, {capture:true});
  }

  (function cmFitViewport(){
    function ceil(n){ return Math.ceil(n || 0); }
    function setVHVars(){
      var r   = document.documentElement;
      var hdr = document.getElementById('cm-site-header');
      var ftr = document.getElementById('cm-site-footer');
      var ab  = document.getElementById('wpadminbar');

      r.style.setProperty('--vh',  window.innerHeight + 'px');
      r.style.setProperty('--hdr', (hdr ? ceil(hdr.getBoundingClientRect().height) : 0) + 'px');
      r.style.setProperty('--ftr', (ftr ? ceil(ftr.getBoundingClientRect().height) : 0) + 'px');

      var abH = 0;
      if (ab) {
        var comp = getComputedStyle(ab);
        if (comp.position === 'fixed' || comp.position === 'sticky') {
          abH = ceil(ab.getBoundingClientRect().height);
        }
      }
      r.style.setProperty('--ab', abH + 'px');
    }
    setVHVars();
    requestAnimationFrame(setVHVars);
    window.addEventListener('resize', setVHVars, {passive:true});
    window.addEventListener('orientationchange', setVHVars, {passive:true});
    document.addEventListener('load', setVHVars, true);
    document.addEventListener('cm-theme', setVHVars);
  })();

  function start(){
    initState();
    bindEvents();
    window.CMUI = {
      get theme(){ return BODY.classList.contains('cm-theme-light') ? 'light' : 'dark'; },
      get board(){ return BODY.getAttribute('data-cm-board'); },
      get soundOn(){ return (STORE.getItem('cm-sound') || 'on') === 'on'; },
      setTheme: applyTheme, setBoard: applyBoard, setSound: applySound
    };
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', start, {once:true}); }
  else { start(); }

})();
