/* chess.theme.js-01 */
(function () {
  'use strict';

  var KEY = 'cm-theme';
  var BTN_ID = 'cm-theme-toggle';
  var TOOLBAR_SEL = '#cm-app .cm-toolbar';
  var hasExplicitChoice = false;

  function lsGet(k){ try{ return localStorage.getItem(k); }catch(_){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k, v); }catch(_){ } }

  function systemPrefersLight(){
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; }
    catch(_){ return false; }
  }

  function currentTheme(){
    var saved = lsGet(KEY);
    if (saved === 'dark' || saved === 'light') { hasExplicitChoice = true; return saved; }
    hasExplicitChoice = false;
    return systemPrefersLight() ? 'light' : 'dark';
  }

  function updateButtonFace(theme){
    var btn = document.getElementById(BTN_ID);
    if (!btn) return;
    btn.textContent = theme === 'light' ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    btn.setAttribute('title', theme === 'light' ? 'Karanlık moda geç' : 'Aydınlık moda geç');
  }

  function applyThemeFallback(theme){
    var isLight = theme === 'light';
    var nodes = [document.documentElement, document.body];
    for (var i=0;i<nodes.length;i++){
      var n = nodes[i]; if(!n) continue;
      n.classList.remove('cm-theme-light','cm-theme-dark','light','dark','cm-light','cm-dark');
      n.classList.add(isLight ? 'cm-theme-light' : 'cm-theme-dark');
      n.classList.add(isLight ? 'light' : 'dark');
      n.classList.add(isLight ? 'cm-light' : 'cm-dark');
      n.setAttribute('data-cm-theme', isLight ? 'light' : 'dark');
      n.setAttribute('data-theme',    isLight ? 'light' : 'dark');
    }
  }

  function applyTheme(theme){
    if (window.CMUI && typeof window.CMUI.setTheme === 'function') {
      window.CMUI.setTheme(theme);
    } else {
      applyThemeFallback(theme);
    }
    updateButtonFace(theme);
    try { document.dispatchEvent(new CustomEvent('cm-theme', { detail: { mode: theme } })); } catch(_) {}
  }

  function ensureButton(toolbar, theme){
    var btn = document.getElementById(BTN_ID);
    if (!btn){
      btn = document.createElement('button');
      btn.id = BTN_ID; btn.type = 'button'; btn.className = 'cm-btn';
      btn.setAttribute('aria-label','Tema değiştir');
      toolbar && toolbar.appendChild(btn);
    }
    updateButtonFace(theme);
    return btn;
  }

  function init(){
    var toolbar = document.querySelector(TOOLBAR_SEL);
    if (!toolbar) { setTimeout(init, 60); return; }

    var theme = currentTheme();
    applyTheme(theme);

    var btn = ensureButton(toolbar, theme);
    if (!window.CMUI || typeof window.CMUI.setTheme !== 'function') {
      btn && btn.addEventListener('click', function(){
        theme = (theme === 'light') ? 'dark' : 'light';
        lsSet(KEY, theme); hasExplicitChoice = true;
        applyTheme(theme);
      }, { passive: true });
    }

    try {
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        var handler = function(e){
          if (!hasExplicitChoice) {
            theme = e.matches ? 'light' : 'dark';
            applyTheme(theme);
          }
        };
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq.addListener) mq.addListener(handler);
      }
    } catch(_){}

    window.addEventListener('storage', function(e){
      if (!e) return;
      if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        hasExplicitChoice = true;
        theme = e.newValue;
        applyTheme(theme);
      }
    });

    document.addEventListener('cm-theme', function(ev){
      var m = ev && ev.detail && ev.detail.mode;
      if (m === 'light' || m === 'dark') {
        theme = m;
        updateButtonFace(theme);
        try { lsSet(KEY, theme); }catch(_){}
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
