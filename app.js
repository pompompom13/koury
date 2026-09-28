(function () {
  var OPEN = 13, CLOSE = 24; // ежедневно 13:00–00:00

  // --- menu ---
  var body = document.getElementById('menuBody');
  var tabs = document.querySelectorAll('.tab');

  function fmt(p) {
    return p.split(' / ').map(function (v) {
      return v.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }).join(' / ') + ' ₽';
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render(key) {
    var groups = window.KOURY_MENU[key] || [];
    body.innerHTML = groups.map(function (g) {
      return '<section class="mgroup"><h3 class="mgroup__title">' + esc(g.title) +
        (g.note ? ' <small>' + esc(g.note) + '</small>' : '') + '</h3><ul class="mlist">' +
        g.items.map(function (it) {
          return '<li><div class="mlist__row"><span class="mlist__name">' + esc(it[0]) +
            '</span><i aria-hidden="true"></i><b>' + fmt(it[1]) + '</b></div>' +
            (it[2] ? '<span class="mlist__desc">' + esc(it[2]) + '</span>' : '') + '</li>';
        }).join('') + '</ul></section>';
    }).join('');
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('is-active'); t.setAttribute('aria-selected', 'true');
      render(t.dataset.tab);
    });
  });
  render('kitchen');

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
