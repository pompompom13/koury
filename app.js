// Ссылка на Google Таблицу, опубликованную в формате CSV
// (Файл → Поделиться → Опубликовать в интернете → CSV).
// Пока ссылки нет, сайт показывает резервную копию меню из menu.js.
var MENU_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRK29gBfvYxNz9gEFAG0RvjQQ6J7ZI-FkyNBYGTa2-VFRlIntMz2haddNma1nlniAI54qStwU2Dpi2D/pub?gid=1394287552&single=true&output=csv';

(function () {
  var OPEN = 13, CLOSE = 24; // ежедневно 13:00–00:00

  // --- age gate ---
  var root = document.documentElement;
  document.getElementById('ageYes').addEventListener('click', function () {
    try { localStorage.setItem('koury-age', 'yes'); } catch (e) {}
    root.classList.add('age-ok');
  });
  document.getElementById('ageNo').addEventListener('click', function () {
    document.getElementById('ageAsk').hidden = true;
    document.getElementById('ageDeny').hidden = false;
  });

  // --- menu from Google Sheets ---
  var body = document.getElementById('menuBody');
  var tabsBox = document.getElementById('menuTabs');
  var hookahList = document.getElementById('hookahList');
  var showBox = document.getElementById('showCards');
  var HOOKAH_TAB = 'кальяны';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function val(row, key) {
    for (var k in row) if (k.replace(/^﻿/, '').trim().toLowerCase() === key) return String(row[k] == null ? '' : row[k]).trim();
    return '';
  }
  function num(v) {
    var t = v.replace(/[\s  ]/g, '').replace(/(₽|руб\.?|р\.?)$/i, '').replace(',', '.');
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
  }
  // «1190» → «1 190 ₽», «690 / 3000» → «690 / 3 000 ₽», текст выводим как есть
  function price(v) {
    if (!v) return '';
    var nums = v.split('/').map(function (x) { return num(x.trim()); });
    if (nums.every(function (n) { return n !== null; })) {
      return nums.map(function (n) { return n.toLocaleString('ru-RU'); }).join(' / ') + ' ₽';
    }
    return v;
  }
  function hidden(row) { return /^(нет|no|0|false|скрыть)$/i.test(val(row, 'показывать')); }

  // строки таблицы → вкладки → разделы, в порядке первого появления
  function build(rows) {
    var tabs = [], byTab = {};
    rows.forEach(function (r) {
      var tab = val(r, 'вкладка'), sec = val(r, 'раздел'), name = val(r, 'название');
      if (!tab || hidden(r)) return;
      if (!byTab[tab]) { byTab[tab] = { name: tab, sections: [], bySec: {} }; tabs.push(byTab[tab]); }
      var t = byTab[tab];
      if (!t.bySec[sec]) { t.bySec[sec] = { title: sec, note: '', items: [] }; t.sections.push(t.bySec[sec]); }
      if (!name) { t.bySec[sec].note = val(r, 'описание'); return; } // строка без названия = подпись к разделу
      t.bySec[sec].items.push({ name: name, price: price(val(r, 'цена')), desc: val(r, 'описание') });
    });
    return tabs;
  }

  function renderSections(sections) {
    body.innerHTML = sections.filter(function (g) { return g.items.length; }).map(function (g) {
      return '<section class="mgroup"><h3 class="mgroup__title">' + esc(g.title) +
        (g.note ? ' <small>' + esc(g.note) + '</small>' : '') + '</h3><ul class="mlist">' +
        g.items.map(function (it) {
          return '<li><div class="mlist__row"><span class="mlist__name">' + esc(it.name) +
            '</span><i aria-hidden="true"></i><b>' + esc(it.price) + '</b></div>' +
            (it.desc ? '<span class="mlist__desc">' + esc(it.desc) + '</span>' : '') + '</li>';
        }).join('') + '</ul></section>';
    }).join('');
  }

  // вкладка «Кальяны» управляет блоком кальянов выше меню
  function renderHookah(tab) {
    if (!tab) return;
    var cards = showBox ? [].slice.call(showBox.querySelectorAll('.sig')) : [];
    if (hookahList) hookahList.innerHTML = '';
    tab.sections.forEach(function (g) {
      var isShow = /шоу/i.test(g.title);
      if (!isShow && hookahList) {
        hookahList.innerHTML += g.items.map(function (it) {
          return '<li><div><span class="pl__name">' + esc(it.name) + '</span>' +
            (it.desc ? '<span class="pl__note">' + esc(it.desc) + '</span>' : '') +
            '</div><span class="pl__price">' + esc(it.price) + '</span></li>';
        }).join('');
      }
      if (isShow && showBox) {
        var seen = [];
        g.items.forEach(function (it, i) {
          var card = cards.filter(function (c) { return c.querySelector('.sig__title').textContent.trim().toLowerCase() === it.name.toLowerCase(); })[0];
          if (!card) { // новая шоу-подача, добавленная в таблицу
            card = document.createElement('article');
            card.className = 'sig ' + (i % 2 ? 'sig--ice' : 'sig--fire') + ' reveal is-in';
            card.innerHTML = '<p class="sig__tag">' + esc(g.title) + '</p><h3 class="sig__title"></h3><p class="sig__desc"></p><p class="sig__price"></p>';
            showBox.appendChild(card);
          }
          card.querySelector('.sig__title').textContent = it.name;
          if (it.desc) card.querySelector('.sig__desc').textContent = it.desc;
          card.querySelector('.sig__price').textContent = it.price;
          card.hidden = false;
          seen.push(card);
        });
        cards.forEach(function (c) { if (seen.indexOf(c) < 0) c.hidden = true; }); // скрыта в таблице
      }
    });
  }

  function renderAll(rows) {
    var tabs = build(rows);
    renderHookah(tabs.filter(function (t) { return t.name.toLowerCase() === HOOKAH_TAB; })[0]);
    var menuTabs = tabs.filter(function (t) { return t.name.toLowerCase() !== HOOKAH_TAB; });
    tabsBox.innerHTML = menuTabs.map(function (t, i) {
      return '<button role="tab" class="tab' + (i ? '' : ' is-active') + '" aria-selected="' + (i ? 'false' : 'true') + '" data-i="' + i + '">' + esc(t.name) + '</button>';
    }).join('');
    var btns = tabsBox.querySelectorAll('.tab');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('is-active'); b.setAttribute('aria-selected', 'true');
        renderSections(menuTabs[+b.dataset.i].sections);
      });
    });
    if (menuTabs[0]) renderSections(menuTabs[0].sections);
    body.classList.remove('is-loading'); tabsBox.classList.remove('is-loading');
  }

  var done = false;
  function finish(rows) { if (done) return; done = true; renderAll(rows); }
  function fallback() { finish(window.KOURY_FALLBACK || []); }

  if (!MENU_URL || !window.Papa) {
    fallback();
  } else {
    setTimeout(fallback, 5000); // таблица не ответила за 5 секунд – показываем резервную копию
    window.Papa.parse(MENU_URL + (MENU_URL.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), {
      download: true, header: true, skipEmptyLines: true,
      complete: function (res) {
        var rows = (res && res.data) || [];
        var ok = rows.some(function (r) { return val(r, 'вкладка') && val(r, 'название'); });
        if (ok) finish(rows); else fallback();
      },
      error: fallback
    });
  }

  // --- open status & week (Moscow time) ---
  var msk = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
  var h = msk.getHours();
  var isOpen = h >= OPEN && h < CLOSE;
  var st = document.getElementById('status');
  st.textContent = isOpen ? 'Сейчас открыто · до 00:00' : 'Сейчас закрыто · откроемся в 13:00';
  st.classList.add(isOpen ? 'is-open' : 'is-closed');

  var days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  var today = (msk.getDay() + 6) % 7;
  document.getElementById('week').innerHTML = days.map(function (d, i) {
    return '<li' + (i === today ? ' class="is-today"' : '') + '><span>' + d + (i === today ? ' · сегодня' : '') + '</span><span>13:00–00:00</span></li>';
  }).join('');

  // --- header / burger ---
  var bar = document.querySelector('.topbar');
  var onScroll = function () { bar.classList.toggle('is-solid', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  // --- original menu viewer ---
  var dlg = document.getElementById('viewer'), img = document.getElementById('viewerImg');
  document.getElementById('openOriginal').addEventListener('click', function () {
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  document.getElementById('viewerClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.querySelectorAll('.viewer__tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      dlg.querySelectorAll('.viewer__tabs button').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active'); img.src = b.dataset.src;
    });
  });

  // --- reveal on scroll ---
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
