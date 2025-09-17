/* chess.coach.says.tr.js-01 */
(function(){
  'use strict';

  var VAL = { p:100, n:320, b:330, r:500, q:900, k:0 };

  function fenBoardArray(fen){
    var b = (fen||'').split(' ')[0]||'', rows = b.split('/');
    var out = [];
    for (var r=0;r<8;r++){
      var row = rows[r]||'', arr = [];
      for (var j=0;j<row.length;j++){
        var ch = row[j];
        if (/\d/.test(ch)){ var n=parseInt(ch,10); while(n--) arr.push('.'); }
        else arr.push(ch||'.');
      }
      while (arr.length<8) arr.push('.');
      out.push(arr);
    }
    return out;
  }
  function algebraToIdx(sq){ return { r: 8 - parseInt(sq[1],10), c: sq.charCodeAt(0)-97 }; }
  function getPieceAtFen(fen, sq){
    if(!sq) return '.';
    var B = fenBoardArray(fen), idx = algebraToIdx(sq);
    if (idx.r<0||idx.r>7||idx.c<0||idx.c>7) return '.';
    return B[idx.r][idx.c] || '.';
  }
  function countPawnsOnFile(fen, fileC){
    var f = fileC.charCodeAt(0)-97, B=fenBoardArray(fen), cnt=0;
    for (var r=0;r<8;r++){ var ch=B[r][f]; if (ch==='p'||ch==='P') cnt++; }
    return cnt;
  }
  function materialSum(fen, isWhite){
    var s=0, board=(fen||'').split(' ')[0]||'';
    for (var i=0;i<board.length;i++){
      var ch=board[i]; if (ch==='/'||/\d/.test(ch)) continue;
      var v=VAL[(ch||'.').toLowerCase()]||0, w=(ch>='A'&&ch<='Z');
      if ((isWhite && w) || (!isWhite && !w)) s+=v;
    }
    return s;
  }
  function materialDelta(preFEN, postFEN, color){
    var before=materialSum(preFEN, color==='w'), after=materialSum(postFEN, color==='w');
    return after-before;
  }
  function isCenterSq(sq){ return sq==='d4'||sq==='e4'||sq==='d5'||sq==='e5'; }
  function isCastleUci(uci){
    var f=uci.slice(0,2), t=uci.slice(2,4);
    return (f==='e1'&&(t==='g1'||t==='c1')) || (f==='e8'&&(t==='g8'||t==='c8'));
  }
  function isCapture(preFEN, toSq){ return getPieceAtFen(preFEN, toSq) !== '.'; }
  function isDevelopment(piece, from, to){
    if (!piece) return false;
    var p = piece.toLowerCase();
    if (p==='n') return /(^b1$|^g1$|^b8$|^g8$)/.test(from) && /[a-h][3-6]/.test(to);
    if (p==='b') return /^(c1|f1|c8|f8)$/.test(from) && !/^(c1|f1|c8|f8)$/.test(to);
    if (p==='q') return /^(d1|d8)$/.test(from) && !/^(d1|d8)$/.test(to);
    return false;
  }
  function pawnTwoStep(piece, from, to){
    if (!piece) return false; var p=piece.toLowerCase();
    if (p!=='p') return false;
    var fRank=parseInt(from[1],10), tRank=parseInt(to[1],10);
    return Math.abs(tRank - fRank) === 2;
  }
  function makesPassedPawn(preFEN, postFEN, to){
    var B=fenBoardArray(postFEN), idx=algebraToIdx(to), ch=B[idx.r][idx.c];
    if (!(ch==='p'||ch==='P')) return false;
    var isWhite = ch==='P';
    for (var c=Math.max(0,idx.c-1); c<=Math.min(7,idx.c+1); c++){
      if (isWhite){ for (var r=0;r<idx.r; r++) if (B[r][c]==='p') return false; }
      else { for (var r=idx.r+1;r<8; r++) if (B[r][c]==='P') return false; }
    }
    return true;
  }
  function fileOpenness(preFEN, postFEN, fileC){
    var before=countPawnsOnFile(preFEN, fileC), after=countPawnsOnFile(postFEN, fileC);
    if (after===0) return 'open';
    if (after===1) return 'semi';
    if (after<before) return 'semi';
    return '';
  }
  function sqHL(s){ return '<span class="hl">'+s+'</span>'; }

  var ECO = null;
  function setEcoTable(tbl){ ECO = tbl || null; }
  function detectOpening(movesSAN){
    try{
      if (!ECO || !movesSAN || !movesSAN.length) return null;
      var plain = movesSAN.map(function(s){ return s.replace(/[#+!?]/g,'').replace(/x/g,''); }).join(' ');
      var best=null;
      for (var code in ECO){
        var arr = ECO[code] && ECO[code].lines || [];
        for (var i=0;i<arr.length;i++){
          var ln = arr[i];
          if (plain.indexOf(ln)===0){ best = { code:code, name:ECO[code].name }; break; }
        }
        if (best) break;
      }
      return best;
    }catch(_){ return null; }
  }

  function countChar(s, re){ var m=s.match(re); return m?m.length:0; }
  function detectPhase(fen){
    try{
      var parts = (fen||'').split(' ');
      var board = parts[0] || '';
      var fullMove = parseInt(parts[5]||'1',10) || 1;

      var queens = countChar(board, /q|Q/g);
      var minors = countChar(board, /n|N|b|B/g);
      var pawns  = countChar(board, /p|P/g);

      var B = fenBoardArray(fen), undeveloped = 0;
      function at(r,c){ return (B[r]&&B[r][c])||'.'; }
      var starts = [
        {r:7,c:1},{r:7,c:6},{r:7,c:2},{r:7,c:5},
        {r:0,c:1},{r:0,c:6},{r:0,c:2},{r:0,c:5}
      ];
      for (var i=0;i<starts.length;i++){
        var ch = at(starts[i].r, starts[i].c);
        if (ch==='N'||ch==='B'||ch==='n'||ch==='b') undeveloped++;
      }

      if (queens===0 || (queens===1 && minors<=2 && pawns<=10)) return 'endgame';
      if (fullMove<=12 || undeveloped>=3) return 'opening';
      return 'middlegame';
    }catch(_){ return 'middlegame'; }
  }

  function sanitizeTerminology(s){
    if (!s) return s;
    return s
      .replace(/semi-?açık\s*dosya/gi, 'yarı-açık hat')
      .replace(/açık\s*dosya/gi, 'açık hat')
      .replace(/semi-?açık\s*hat/gi, 'yarı-açık hat');
  }
  function seededRand(seed){
    var x = (seed|0) ^ 0x9e3779b9;
    x = (x ^ (x<<13)); x = (x ^ (x>>>17)); x = (x ^ (x<<5));
    return (x>>>0) / 4294967296;
  }
  function pick(seed, arr){ if(!arr||!arr.length) return ''; var r=seededRand(seed); return arr[Math.floor(r*arr.length)]; }
  function synonymize(phrase, seed, skill){
    var map = {
      'gelişimi tamamlıyor': [
        'gelişimi tamamlıyor',
        'taşı oyuna sokuyor',
        'geliştiriyor'
      ],
      'merkez kontrolünü güçlendiriyor': [
        'merkezi tutuyor',
        'merkeze hakim oluyor',
        'merkez kontrolünü güçlendiriyor'
      ],
      'şah güvenliğini artırıyor (rok)': [
        'rokla şahı güvene alıyor',
        'şah güvenliğini artırıyor (rok)'
      ],
      'açık hat oluşturuyor (kaleler için iyi)': [
        'açık hat oluşturuyor',
        'açık hattı kullanıma açıyor'
      ],
      'yarı-açık hat hazırlıyor': [
        'yarı-açık hat hazırlıyor',
        'yarı-açık hattı hedefliyor'
      ],
      'geçer piyon oluşturuyor': [
        (skill && skill<=6) ? 'serbest piyon yaratıyor' : 'geçer piyon oluşturuyor',
        'piyon çoğunluğunu öne çıkarıyor'
      ],
      'malzeme baskısı kuruyor': [
        'malzeme baskısı kuruyor',
        'taşlarına hedef gösteriyor'
      ],
      'taktik risk içeriyor': [
        (skill && skill<=6) ? 'taş kaybı ihtimali doğuruyor' : 'taktik risk içeriyor',
        'konumu zayıflatıyor'
      ]
    };
    var arr = map[phrase];
    if (!arr) return phrase;
    return pick(seed, arr);
  }
  function applySynonyms(text, seed, skill){
    if (!text) return text;
    var parts = text.split(/\s*,\s*/);
    for (var i=0;i<parts.length;i++){
      var base = sanitizeTerminology(parts[i].trim());
      parts[i] = synonymize(base, (seed+i)|0, skill);
    }
    return parts.join(', ');
  }
  function toneify(text){ return sanitizeTerminology(text); }

  function pruneWhy(arr){
    var pri = [
      /mat ediyor|şah çekiyor/i,
      /(piyonu|atı|fili|kaleyi|veziri) alıyor/i,
      /merkez|alan kazanıyor/i,
      /gelişimi tamamlıyor|taşı oyuna sokuyor|geliştiriyor/i,
      /açık hat|yarı-açık hat/i,
      /geçer piyon|serbest piyon/i
    ];
    var hasCenter = arr.some(function(s){ return /merkez/.test(s); });
    if (hasCenter) arr = arr.filter(function(s){ return !/alan kazanıyor/.test(s); });

    var seen = new Set(), uniq = [];
    arr.forEach(function(s){ if (s && !seen.has(s)){ seen.add(s); uniq.push(s); } });

    uniq.sort(function(a,b){
      function score(x){ for (var i=0;i<pri.length;i++) if (pri[i].test(x)) return i; return 999; }
      return score(a)-score(b);
    });

    return uniq.slice(0,2);
  }

  function nextStep(phase, cat){
    var goodish = { ok:1, ex:1, vgood:1, goodp:1, good:1, leg:1, force:1, book:1 };
    var warning = { mid:1, midp:1, wrnp:1, wrn:1, bad:1, missed:1 };
    var isWarn = !!warning[cat];

    var OPEN = [
      'geliştirmeyi tamamla',
      'kısa rokla güvenliği tamamla',
      'açık ya da yarı-açık hatta kaleleri hizala'
    ];
    var MIDDLE = [
      'en zayıf kareye baskıyı artır',
      'ağır taşları açık hat üzerinden çiftle',
      'aynı hedefe iki kez saldırı kur'
    ];
    var END = [
      'şahı merkeze getir',
      'geçer piyonu ilerlet',
      'piyon kırışlarını hesaplayıp tempo kazan'
    ];

    var pool = (phase==='opening') ? OPEN : (phase==='endgame' ? END : MIDDLE);
    if (isWarn && phase!=='endgame'){ pool = ['merkezi yeniden tut'].concat(pool); }
    if (isWarn && phase==='endgame'){ pool = ['şahını aktif kareye getir','piyon yapını bozmadan ilerle'].concat(pool); }

    return 'Sonraki adım: ' + pool[0] + '.';
  }

  function narrate(preFEN, postFEN, task, opts){
    opts = opts || {};
    var uci = task.uci||'', from=uci.slice(0,2), to=uci.slice(2,4);
    var mover = getPieceAtFen(preFEN, from);
    var why = [];

    var san = task.san||'';
    if (/#/.test(san))      why.push('mat ediyor');
    else if (/\+/.test(san))why.push('şah çekiyor');

    if (isCastleUci(uci)) why.push('şah güvenliğini artırıyor (rok)');
    if (isCenterSq(to))   why.push('merkez kontrolünü güçlendiriyor');
    if (isDevelopment(mover, from, to)) why.push('gelişimi tamamlıyor');

    var capturedCh = isCapture(preFEN, to) ? getPieceAtFen(preFEN, to) : '.';
    if (capturedCh !== '.'){
      var acc = { p:'piyonu', n:'atı', b:'fili', r:'kaleyi', q:'veziri', k:'şahı' };
      var tAcc = (acc[(capturedCh||'.').toLowerCase()] || 'taşı');
      if (tAcc==='şahı') tAcc='taşı';
      why.push(tAcc + ' alıyor');
    } else if (/x/.test(san)){
      why.push('malzeme baskısı kuruyor');
    }

    if (pawnTwoStep(mover, from, to))     why.push('alan kazanıyor');
    if (makesPassedPawn(preFEN, postFEN, to)) why.push('geçer piyon oluşturuyor');

    var open = fileOpenness(preFEN, postFEN, to[0]);
    if (open==='open')      why.push('açık hat oluşturuyor (kaleler için iyi)');
    else if (open==='semi') why.push('yarı-açık hat hazırlıyor');

    var md = materialDelta(preFEN, postFEN, task.color);
    if (md>0)      why.push('somut üstünlük elde ediyor');
    else if (md<0) why.push('taktik risk içeriyor');

    if (opts.movesSAN && ECO){
      var eco = detectOpening(opts.movesSAN);
      if (eco) why.push('('+eco.name+' – '+eco.code+')');
    }

    why = pruneWhy(why);
    if (!why.length) why.push('planı ilerletiyor');

    var phase = detectPhase(preFEN);
    var cat   = opts.category || 'good';
    var seed  = (opts.ply|0);
    var skill = opts.skill;

    var whyText = toneify(applySynonyms(why.join(', '), seed, skill));
    var tipText = nextStep(phase, cat);

    return { why: whyText, tip: tipText };
  }

  var GROUPS = {
    good:   { ok:1, ex:1, vgood:1, goodp:1, good:1, leg:1, force:1, book:1 },
    medium: { mid:1, wrnp:1, missed:1, midp:1 },
    bad:    { wrn:1, bad:1, lose:1 }
  };
  function negateWhyForBad(why){
    var m = sanitizeTerminology(why);
    m = m.replace(/\bmerkezi tutuyor\b/g, 'merkezi ihmal ediyor')
         .replace(/\bmerkeze hakim oluyor\b/g, 'merkezden uzaklaşıyor')
         .replace(/\bmerkez kontrolünü güçlendiriyor\b/g, 'merkezi ihmal ediyor')
         .replace(/\bgelişimi tamamlıyor\b/g, 'gelişimi geciktiriyor')
         .replace(/\btaşı oyuna sokuyor\b/g, 'koordinasyonu zayıflatıyor')
         .replace(/\bplanı ilerletiyor\b/g, 'plana hizmet etmiyor')
         .replace(/\balan kazanıyor\b/g, 'gereksiz zayıflık bırakıyor')
         .replace(/\baçık hat oluşturuyor( \(kaleler için iyi\))?/g, 'yanlış kanatta hat açıyor')
         .replace(/\byarı-açık hat hazırlıyor\b/g, 'yanlış kanatta ilerliyor')
         .replace(/\btaktik risk içeriyor\b/g, 'taktik zafiyet yaratıyor');
    return m;
  }

  var LINES = {
    leg:    "Efsanevi fikir; devamı şöyle: <b>{best}</b> {play}.",
    ok:     "Altın hamle; makinenin tek önerisi: <b>{best}</b> {play}.",
    force:  "Tek yol; çizgiyi tut: <b>{best}</b> {play}.",
    ex:     "Harika; daha iyisi <b>{best}</b> {play}.",
    vgood:  "Çok güzel; makine <b>{best}</b> {play} diyor.",
    goodp:  "Sağlam adım; baskıyı artır: <b>{best}</b> {play}.",
    good:   "İyi; daha iyi hamle <b>{best}</b> {play}.",
    midp:   "Daha iyisi vardı; doğrusu <b>{best}</b> {play}.",
    mid:    "Biraz riskli; denge için <b>{best}</b> {play}.",
    wrnp:   "Fırsat kaçıyor; aktif devam <b>{best}</b> {play}.",
    wrn:    "Dikkat! Toparla: <b>{best}</b> {play}.",
    bad:    "Büyük hata! İlk yardım: <b>{best}</b> {play}.",
    lose:   "Kayıp; en dirençli yol: <b>{best}</b> {play}.",
    book:   "Bilinen yol (teori): <b>{best}</b> {play}.",
    missed: "Kaçan fırsat; kazanç için <b>{best}</b> {play}."
  };

  function render(cat, ctx, narr, extra){
    var why = (narr && narr.why) ? narr.why : 'planı ilerletiyor';

    if (GROUPS.bad[cat]) { why = negateWhyForBad(why); }

    var suppressPrefix = !!(extra && extra.suppressPrefix);
    var s = '';
    if (GROUPS.good[cat]){
      if (cat==='leg')        s = (suppressPrefix ? '' : 'Efsanevi! ')      + why + '.';
      else if (cat==='force') s = (suppressPrefix ? '' : 'Tek yol! ')       + why + '.';
      else if (cat==='book')  s = (suppressPrefix ? '' : 'Teoriye uygun. ') + why + '.';
      else                    s = (suppressPrefix ? '' : 'Harika! ')        + why + '.';
    } else if (GROUPS.medium[cat]){
      s = "Kötü değil, ama <b>{best}</b> daha güçlüydü; çünkü " + why + ".";
    } else if (GROUPS.bad[cat]){
      s = "Dikkat! Bu hamle " + why + ". Bunun yerine <b>{best}</b> oynamalıydın.";
    } else {
      s = why + ', <b>{best}</b> oynanabilir.';
    }
    return toneify(s);
  }

  window.CM_COACH_SAYS_TR = {
    lines: LINES,
    narrate: narrate,
    render: render,
    setEcoTable: setEcoTable,
    detectOpening: detectOpening
  };
})();
