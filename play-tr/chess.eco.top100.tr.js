/* chess.eco.top100.tr.js-01 */
(function(){
  'use strict';

  var ECO_TOP100 = {
    "C60": { name:"Ruy Lopez (İspanyol)", lines:[
      "e4 e5 Nf3 Nc6 Bb5",
      "e4 e5 Nf3 Nc6 Bb5 a6"
    ]},
    "C65": { name:"Ruy Lopez: Berlin", lines:[
      "e4 e5 Nf3 Nc6 Bb5 Nf6",
      "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4"
    ]},
    "C84": { name:"Ruy Lopez: Açık Varyant", lines:[
      "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4",
      "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nxe4"
    ]},
    "C88": { name:"Ruy Lopez: Kapalı", lines:[
      "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6",
      "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O h3 d6"
    ]},
    "C50": { name:"İtalyan Oyunu", lines:[
      "e4 e5 Nf3 Nc6 Bc4 Bc5",
      "e4 e5 Nf3 Nc6 Bc4 Nf6 d3"
    ]},
    "C54": { name:"Giuoco Piano", lines:[
      "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3",
      "e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 c3"
    ]},
    "C55": { name:"İki At Savunması", lines:[
      "e4 e5 Nf3 Nc6 Bc4 Nf6",
      "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5"
    ]},
    "C57": { name:"İki At: Fried Liver", lines:[
      "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7"
    ]},
    "C44": { name:"İskoç Oyunu", lines:[
      "e4 e5 Nf3 Nc6 d4 exd4 Nxd4",
      "e4 e5 Nf3 Nc6 d4 exd4 Bc4"
    ]},
    "C45": { name:"İskoç: Mieses", lines:[
      "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Qh4"
    ]},
    "C47": { name:"Dört At Oyunu", lines:[
      "e4 e5 Nf3 Nc6 Nc3 Nf6",
      "e4 e5 Nf3 Nc6 Nc3 Bb4"
    ]},
    "C49": { name:"Dört At: İtalyan Dörtlü", lines:[
      "e4 e5 Nf3 Nc6 Nc3 Bc5"
    ]},
    "C25": { name:"Viyana Oyunu", lines:[
      "e4 e5 Nc3 Nf6",
      "e4 e5 Nc3 Nc6"
    ]},
    "C41": { name:"Philidor Savunması", lines:[
      "e4 e5 Nf3 d6",
      "e4 e5 Nf3 d6 d4 Nf6"
    ]},
    "C42": { name:"Petroff (Rus) Savunması", lines:[
      "e4 e5 Nf3 Nf6",
      "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4"
    ]},
    "C30": { name:"King's Gambit", lines:[
      "e4 e5 f4 exf4",
      "e4 e5 f4 d5"
    ]},
    "C33": { name:"King's Gambit: Kabul", lines:[
      "e4 e5 f4 exf4 Nf3 g5",
      "e4 e5 f4 exf4 Nf3 d5"
    ]},
    "C51": { name:"Evans Gambiti", lines:[
      "e4 e5 Nf3 Nc6 Bc4 Bc5 b4",
      "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4"
    ]},
    "B20": { name:"Sicilya Savunması", lines:[ "e4 c5" ]},
    "B22": { name:"Sicilya: Alapin", lines:[
      "e4 c5 c3",
      "e4 c5 Nf3 e6 c3"
    ]},
    "B23": { name:"Sicilya: 3.d4 (Açık)", lines:[
      "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4",
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4"
    ]},
    "B40": { name:"Sicilya: Scheveningen Yapısı", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6",
      "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Nc3 d6"
    ]},
    "B50": { name:"Sicilya: Klasik", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6"
    ]},
    "B70": { name:"Sicilya: Dragon", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6",
      "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6"
    ]},
    "B77": { name:"Sicilya: Yugoslav Saldırısı", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 O-O-O"
    ]},
    "B80": { name:"Sicilya: Najdorf", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 a6"
    ]},
    "B90": { name:"Najdorf: Ana Hat", lines:[
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5",
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6"
    ]},
    "B33": { name:"Sicilya: Sveshnikov", lines:[
      "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5",
      "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 e5 Ndb5 d6"
    ]},
    "B46": { name:"Sicilya: Taimanov", lines:[
      "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6",
      "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6"
    ]},
    "B27": { name:"Sicilya: Kan", lines:[
      "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6",
      "e4 c5 Nf3 a6"
    ]},
    "C00": { name:"Fransız Savunması (genel)", lines:[ "e4 e6 d4 d5" ]},
    "C11": { name:"Fransız: Klasik", lines:[
      "e4 e6 d4 d5 Nc3 Nf6",
      "e4 e6 d4 d5 Nc3 Bb4"
    ]},
    "C12": { name:"Fransız: Rubinstein", lines:[
      "e4 e6 d4 d5 Nc3 dxe4",
      "e4 e6 d4 d5 Nf3 dxe4"
    ]},
    "C13": { name:"Fransız: Alekhine–Chatard", lines:[
      "e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5"
    ]},
    "C14": { name:"Fransız: 3.Nd2 (Tarrasch/ Rubinstein fikirleri)", lines:[
      "e4 e6 d4 d5 Nd2 c5",
      "e4 e6 d4 d5 Nd2 Nf6"
    ]},
    "C15": { name:"Fransız: Winawer", lines:[
      "e4 e6 d4 d5 Nc3 Bb4",
      "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6"
    ]},
    "B10": { name:"Caro–Kann", lines:[ "e4 c6 d4 d5" ]},
    "B12": { name:"Caro–Kann: İlerleme", lines:[
      "e4 c6 d4 d5 e5",
      "e4 c6 d4 d5 e5 Bf5"
    ]},
    "B13": { name:"Caro–Kann: Panov", lines:[
      "e4 c6 d4 d5 exd5 cxd5 c4",
      "e4 c6 d4 d5 exd5 cxd5 Nf3"
    ]},
    "B07": { name:"Pirc Savunması", lines:[
      "e4 d6 d4 Nf6 Nc3 g6",
      "e4 d6 d4 Nf6 Nc3 g6 f4"
    ]},
    "B06": { name:"Modern Savunma", lines:[
      "e4 g6 d4 Bg7",
      "e4 g6 d4 d6"
    ]},
    "B02": { name:"Alekhine Savunması", lines:[
      "e4 Nf6 e5 Nd5 d4 d6",
      "e4 Nf6 e5 Nd5 d4 d6 c4 Nb6"
    ]},
    "B01": { name:"İskandinav (Merkez Karşı)", lines:[
      "e4 d5 exd5 Qxd5 Nc3 Qa5",
      "e4 d5 exd5 Qxd5 d4"
    ]},
    "D06": { name:"Kraliçe Gambiti", lines:[ "d4 d5 c4" ]},
    "D30": { name:"QGD: Klasik", lines:[
      "d4 d5 c4 e6 Nc3 Nf6 Bg5",
      "d4 d5 c4 e6 Nf3 Nf6"
    ]},
    "D35": { name:"QGD: Değişim", lines:[
      "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5",
      "d4 d5 c4 e6 Nf3 Nf6 cxd5 exd5"
    ]},
    "D37": { name:"QGD: Karpov Yapısı", lines:[
      "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3"
    ]},
    "D10": { name:"Slav Savunması", lines:[
      "d4 d5 c4 c6",
      "d4 d5 c4 c6 Nf3 Nf6"
    ]},
    "D17": { name:"Slav: 4.Nc3 dxc4", lines:[
      "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4"
    ]},
    "D43": { name:"Semi–Slav", lines:[
      "d4 d5 c4 e6 Nc3 c6",
      "d4 d5 c4 e6 Nf3 c6"
    ]},
    "D45": { name:"Semi–Slav: Meran", lines:[
      "d4 d5 c4 e6 Nc3 c6 Nf3 Nf6 e3 Nbd7 Bd3 dxc4"
    ]},
    "E06": { name:"Katalan (Kapalı)", lines:[
      "d4 Nf6 c4 e6 g3 d5 Bg2",
      "d4 Nf6 c4 e6 g3 d5 Nf3"
    ]},
    "E04": { name:"Katalan (Açık)", lines:[
      "d4 Nf6 c4 e6 g3 d5 Nf3 dxc4",
      "d4 Nf6 c4 e6 g3 d5 Bg2 dxc4"
    ]},
    "A45": { name:"Trompowsky Saldırısı", lines:[
      "d4 Nf6 Bg5",
      "d4 Nf6 Bg5 e6"
    ]},
    "D02": { name:"London Sistemi", lines:[
      "d4 d5 Nf3 Nf6 Bf4 e6 e3",
      "d4 Nf6 Nf3 d5 Bf4 e6"
    ]},
    "D04": { name:"Colle Sistemi", lines:[
      "d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3",
      "d4 d5 Nf3 Nf6 e3 e6 Bd3 Bd6 O-O O-O"
    ]},
    "D00": { name:"Stonewall Saldırısı", lines:[
      "d4 d5 e3 Nf3 Bd3 f4",
      "d4 d5 Nf3 e3 Bd3 f4 c3"
    ]},
    "E60": { name:"King’s Indian (Kİ)", lines:[
      "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O",
      "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O"
    ]},
    "E70": { name:"Kİ: Panno/Modern Kurulum", lines:[
      "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 Nc6"
    ]},
    "E80": { name:"Kİ: Mar del Plata Ana Hat", lines:[
      "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7"
    ]},
    "E20": { name:"Nimzo–Hint", lines:[
      "d4 Nf6 c4 e6 Nc3 Bb4",
      "d4 Nf6 c4 e6 Nc3 Bb4 e3"
    ]},
    "E12": { name:"Kraliçe–Hint", lines:[
      "d4 Nf6 c4 e6 Nf3 b6",
      "d4 Nf6 c4 e6 Nf3 b6 g3"
    ]},
    "D85": { name:"Grünfeld Savunması", lines:[
      "d4 Nf6 c4 g6 Nc3 d5",
      "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5"
    ]},
    "A56": { name:"Modern Benoni", lines:[
      "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6"
    ]},
    "A57": { name:"Benko Gambiti", lines:[
      "d4 Nf6 c4 c5 d5 b5",
      "d4 Nf6 c4 c5 d5 b5 cxb5 a6"
    ]},
    "A20": { name:"İngiliz (g3)", lines:[
      "c4 e5 g3 Nf6 Bg2 d5",
      "c4 e5 g3 Nc6 Bg2"
    ]},
    "A25": { name:"İngiliz: Klasik", lines:[
      "c4 e5 Nc3 Nc6 g3 g6 Bg2 Bg7"
    ]},
    "A30": { name:"İngiliz: Simetrik", lines:[
      "c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7",
      "c4 c5 g3 g6 Bg2 Bg7"
    ]},
    "A29": { name:"İngiliz: Dört At", lines:[
      "c4 e5 Nc3 Nf6 Nf3 Nc6 g3"
    ]},
    "A04": { name:"Réti Açılışı", lines:[
      "Nf3 d5 g3",
      "Nf3 d5 c4"
    ]},
    "A06": { name:"Réti: c4’lü", lines:[
      "Nf3 d5 c4",
      "Nf3 d5 g3 c4"
    ]},
    "A80": { name:"Hollanda Savunması", lines:[ "d4 f5" ]},
    "A90": { name:"Hollanda: Stonewall", lines:[
      "d4 f5 c4 Nf6 g3 e6 Bg2 d5 Nf3 c6 O-O Bd6"
    ]},
    "A07": { name:"Kİ’de Saldırı (KİS)", lines:[
      "Nf3 d5 g3 Nf6 Bg2 g6 O-O Bg7 d3 O-O Nbd2"
    ]},
    "A52": { name:"Budapeşte Gambiti", lines:[
      "d4 Nf6 c4 e5",
      "d4 Nf6 c4 e5 dxe5 Ng4"
    ]},
    "A43": { name:"Eski Benoni", lines:[ "d4 c5 d5 e5" ]},
    "D07": { name:"Çigorin Savunması", lines:[
      "d4 d5 c4 Nc6",
      "d4 d5 c4 Nc6 Nf3 Bg4"
    ]},
    "D34": { name:"Tarrasch Savunması", lines:[
      "d4 d5 c4 e6 Nc3 c5",
      "d4 d5 c4 e6 Nf3 c5"
    ]},
    "D08": { name:"Albin Karşı Gambiti", lines:[
      "d4 d5 c4 e5",
      "d4 d5 c4 e5 dxe5 d4"
    ]},
    "D31": { name:"QGD: Harrwitz", lines:[ "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7" ]},
    "D36": { name:"QGD: Tartakower", lines:[
      "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 h6 Bh4 b6"
    ]},
    "D38": { name:"QGD: Ragozin Yapısı", lines:[ "d4 d5 c4 e6 Nc3 Nf6 Bg5 Bb4" ]},
    "D11": { name:"Slav: 3.Nf3", lines:[ "d4 d5 c4 c6 Nf3" ]},
    "D14": { name:"Slav: 4.e3", lines:[ "d4 d5 c4 c6 Nf3 Nf6 e3" ]},
    "D16": { name:"Slav: Ana Hat ...dxc4", lines:[ "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4" ]},
    "A13": { name:"İngiliz: Carls–Bremen", lines:[ "c4 e6 g3 d5 Bg2 Nf6" ]},
    "A15": { name:"İngiliz: 1...Nf6", lines:[ "c4 Nf6 Nc3 e6 Nf3 d5" ]},
    "A17": { name:"İngiliz: Dört At (Simetrik)", lines:[ "c4 Nf6 Nc3 Nc6 Nf3 e5" ]},
    "E14": { name:"Nimzo–Hint: Rubinstein", lines:[ "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3" ]},
    "E15": { name:"Nimzo–Hint: Hübner", lines:[ "d4 Nf6 c4 e6 Nc3 Bb4 e3 c5" ]},
    "E17": { name:"Nimzo–Hint: Saemisch", lines:[ "d4 Nf6 c4 e6 Nc3 Bb4 a3" ]},
    "E21": { name:"Nimzo–Hint: 4.Qc2", lines:[ "d4 Nf6 c4 e6 Nc3 Bb4 Qc2" ]},
    "E11": { name:"Kraliçe–Hint: Petrosyan", lines:[ "d4 Nf6 c4 e6 Nf3 b6 g3 Ba6" ]},
    "D90": { name:"Grünfeld: Ana Hat", lines:[ "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3" ]},
    "D96": { name:"Grünfeld: Rus Varyantı", lines:[ "d4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7 Qb3 dxc4" ]},
    "A40": { name:"Queen’s Pawn (esnek)", lines:[
      "d4 d5 Nf3 Nf6",
      "d4 Nf6 Nf3 d5"
    ]},
    "A46": { name:"Queen’s Pawn: g3 esnek", lines:[
      "d4 Nf6 Nf3 g3",
      "d4 Nf6 g3 d5"
    ]},
    "A48": { name:"London/Barry geçişi", lines:[
      "d4 Nf6 Nf3 g3 Bf4",
      "d4 Nf6 Bf4 g6 Nf3"
    ]},
    "A50": { name:"Esnek Hint Kurulumu", lines:[
      "d4 Nf6 c4 e6",
      "d4 Nf6 c4 e6 Nc3"
    ]},
    "C23": { name:"Bishop’s Opening", lines:[
      "e4 e5 Bc4 Nf6",
      "e4 e5 Bc4 Bc5 Nf3"
    ]},
    "C24": { name:"Bishop’s: Bc4 Bc5", lines:[ "e4 e5 Bc4 Bc5 Nf3" ]},
    "C26": { name:"Viyana’ya Geçiş (c3–Sicilya)", lines:[
      "e4 e5 Nc3 c5",
      "e4 c5 Nc3 e5"
    ]},
    "A08": { name:"KİS (h3–g4 planları)", lines:[ "Nf3 d5 g3 c5 Bg2 Nc6 O-O e5 d3" ]},
    "A09": { name:"KİS: Mar del Plata Kurulumu", lines:[ "Nf3 d5 g3 Nf6 Bg2 g6 O-O Bg7 d3 O-O" ]},
    "B24": { name:"Sicilya: Smith–Morra (kabul)", lines:[
      "e4 c5 d4 cxd4 c3 dxc3 Nxc3"
    ]},
    "B29": { name:"Sicilya: Kan/Paulsen", lines:[ "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 a6" ]},
    "B28": { name:"Sicilya: O’Kelly", lines:[ "e4 c5 Nf3 a6" ]},
    "B32": { name:"Sicilya: Löwenthal", lines:[ "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 e5" ]},
    "B17": { name:"Caro–Kann: Steinitz", lines:[ "e4 c6 d4 d5 Nc3 dxe4 Nxe4" ]},
    "B19": { name:"Caro–Kann: Klasik 4...Bf5", lines:[ "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5" ]},
    "C18": { name:"Fransız: MacCutcheon", lines:[ "e4 e6 d4 d5 Nc3 Nf6 Bg5 Bb4" ]},
    "C19": { name:"Fransız: Winawer – Poisoned Pawn", lines:[
      "e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7"
    ]},
    "C07": { name:"Fransız: Tarrasch", lines:[
      "e4 e6 d4 d5 Nd2 Nf6",
      "e4 e6 d4 d5 Nd2 c5"
    ]},
    "C10": { name:"Fransız: 3.Nc3", lines:[ "e4 e6 d4 d5 Nc3" ]},
    "C03": { name:"Fransız: 2.d3 (Gelişim)", lines:[ "e4 e6 d3 d5 Nd2" ]},
    "B08": { name:"Pirc: Klasik", lines:[ "e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O" ]},
    "B09": { name:"Pirc: Avusturya Saldırısı", lines:[ "e4 d6 d4 Nf6 Nc3 g6 f4" ]},
    "B04": { name:"Alekhine: Dört Piyon", lines:[ "e4 Nf6 e5 Nd5 d4 d6 c4 Nb6 f4" ]},
    "A81": { name:"Hollanda: Leningrad", lines:[ "d4 f5 g3 Nf6 Bg2 g6" ]},
    "D32": { name:"QGD: Tarrasch Savunması", lines:[ "d4 d5 c4 e6 Nc3 c5" ]},
    "D33": { name:"QGD: Tarrasch Ana Hat", lines:[ "d4 d5 c4 e6 Nc3 c5 cxd5 exd5" ]},
    "D95": { name:"Grünfeld: 7.Nf3", lines:[ "d4 Nf6 c4 g6 Nc3 d5 Nf3" ]},
    "D71": { name:"Grünfeld: 4.Nf3", lines:[ "d4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7" ]},
    "E92": { name:"Kİ: Mar del Plata", lines:[ "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 d5 Nc6" ]},
    "E94": { name:"Kİ: Ortodoks", lines:[ "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O" ]},
    "E97": { name:"Kİ: Şah Kanadı Atağı", lines:[ "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O O-O e5 d5 Nh5" ]},
    "A22": { name:"İngiliz: Bremen", lines:[ "c4 e5 Nc3 Nf6 g3 d5" ]},
    "A26": { name:"İngiliz: Keres", lines:[ "c4 e5 Nc3 Nf6 g3 Bb4" ]},
    "A28": { name:"İngiliz: Dört At g3", lines:[ "c4 e5 Nc3 Nf6 Nf3 Nc6 g3" ]},
    "A10": { name:"İngiliz: 1...c6/…e6 kurulumları", lines:[
      "c4 c6 g3 d5 Bg2 Nf6",
      "c4 e6 g3 d5 Bg2 Nf6"
    ]},
    "A12": { name:"İngiliz: 1...c6, e5’li", lines:[ "c4 c6 e4 e5" ]}
  };

  function register(){
    try{
      if (window.CM_COACH_SAYS_TR && typeof window.CM_COACH_SAYS_TR.setEcoTable==='function'){
        window.CM_COACH_SAYS_TR.setEcoTable(ECO_TOP100);
        return true;
      }
    }catch(_){}
    return false;
  }

  if (!register()){
    var iv = setInterval(function(){ if (register()) clearInterval(iv); }, 200);
    setTimeout(function(){ clearInterval(iv); register(); }, 5000);
  }
})();
