/* Beethoven Music School: behaviour (piano, counters, open-now, enquiry form) */
(function () {
  'use strict';

  /* ===== SETUP: paste your Formspree form id here so enquiries reach the owner's email ===== */
  var FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
  /* ========================================================================================= */

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- count-up numbers ---------- */
  var counters = document.querySelectorAll('.count');
  if (counters.length) {
    var run = function (el) {
      var to = parseFloat(el.getAttribute('data-to')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      if (calm) { el.textContent = to.toFixed(dec); return; }
      var t0 = performance.now();
      (function tick(t) {
        var k = Math.min(1, (t - t0) / 1300);
        el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.6 });
      [].forEach.call(counters, function (c) { io.observe(c); });
    } else { [].forEach.call(counters, run); }
  }

  /* ---------- scroll-played piano ---------- */
  var section = document.getElementById('piano-section');
  if (section) {
    var box = document.getElementById('piano');
    var bar = section.querySelector('.p-bar b');
    var WHITE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
    var BLACK = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5], [13, 7], [15, 8], [18, 10], [20, 11], [22, 12]];
    var MELODY = [0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0];
    var keys = {};
    var audio = null;
    var add = function (cls, s, left) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = cls; b.setAttribute('aria-label', 'Piano key ' + (s + 1));
      if (left !== undefined) b.style.left = left + '%';
      b.addEventListener('click', function () { play(s); flash(s, 180); });
      box.appendChild(b); keys[s] = b;
    };
    WHITE.forEach(function (s) { add('wk', s); });
    BLACK.forEach(function (p) { add('bk', p[0], (p[1] + 1) / WHITE.length * 100); });

    var play = function (s) {
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        var o = audio.createOscillator(), gn = audio.createGain();
        o.type = 'triangle'; o.frequency.value = 261.63 * Math.pow(2, s / 12);
        gn.gain.setValueAtTime(0.0001, audio.currentTime);
        gn.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + 0.02);
        gn.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.2);
        o.connect(gn); gn.connect(audio.destination); o.start(); o.stop(audio.currentTime + 1.3);
      } catch (e) {}
    };
    var flash = function (s, ms) { keys[s].classList.add('on'); setTimeout(function () { keys[s].classList.remove('on'); }, ms); };

    var lastStep = -1, queued = false;
    var onScroll = function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var r = section.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
        bar.style.width = (p * 100) + '%';
        var step = (p > 0 && p < 1) ? Math.min(MELODY.length - 1, Math.floor(p * MELODY.length)) : -1;
        if (step !== lastStep) {
          [].forEach.call(box.querySelectorAll('.on'), function (k) { k.classList.remove('on'); });
          if (step >= 0) keys[MELODY[step]].classList.add('on');
          lastStep = step;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- open now (India time) ---------- */
  var HOURS = { 0: [9, 17], 1: [17, 21], 2: [17, 20], 3: [17, 21], 4: [17, 20], 5: [16, 20], 6: [16, 20] };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var fmt = function (h) { var s = h >= 12 ? 'pm' : 'am'; var n = h % 12 || 12; return n + ':00 ' + s; };
  var istNow = function () {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {}; p.forEach(function (q) { o[q.type] = q.value; });
    return { day: DAYS.indexOf(o.weekday), time: parseInt(o.hour, 10) + parseInt(o.minute, 10) / 60 };
  };
  var badges = document.querySelectorAll('.open-badge');
  var now = istNow();
  if (now.day >= 0) {
    var h = HOURS[now.day], text, cls;
    if (now.time >= h[0] && now.time < h[1]) { text = 'Open now, until ' + fmt(h[1]); cls = 'is-open'; }
    else {
      cls = 'is-closed';
      var when = null;
      if (now.time < h[0]) when = 'today at ' + fmt(h[0]);
      else {
        var nd = (now.day + 1) % 7;
        when = 'tomorrow at ' + fmt(HOURS[nd][0]);
      }
      text = 'Closed now, opens ' + when;
    }
    [].forEach.call(badges, function (b) { b.textContent = text; b.classList.add(cls); });
    var row = document.querySelector('.hours-table tr[data-day="' + now.day + '"]');
    if (row) row.classList.add('today');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var q = new URLSearchParams(location.search).get('instrument');
    if (q) { var sel = form.querySelector('[name=instrument]'); [].forEach.call(sel.options, function (o) { if (o.value.toLowerCase() === q.toLowerCase()) sel.value = o.value; }); }
    var msg = document.getElementById('form-msg'), btn = form.querySelector('button[type=submit]');
    var show = function (cls, text) { msg.className = 'form-msg ' + cls; msg.textContent = text; msg.style.display = 'block'; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data._gotcha) return;
      if (FORM_ENDPOINT.indexOf('YOUR_FORM_ID') > -1) { show('err', 'Form setup pending: add the Formspree form id in js/school.js so enquiries reach the owner\u2019s email. Meanwhile, please call +91 72991 11991.'); return; }
      btn.disabled = true; btn.textContent = 'Sending\u2026';
      data._subject = 'New enquiry: ' + data.instrument + ' (' + data.mode + ') from ' + data.name;
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (r.ok) { form.reset(); show('ok', 'Thank you, ' + data.name + '. Your enquiry has reached us and we will contact you soon.'); }
          else { show('err', 'The enquiry did not send. Please try again or call +91 72991 11991.'); }
        })
        .catch(function () { show('err', 'The enquiry did not send. Check your connection or call +91 72991 11991.'); })
        .then(function () { btn.disabled = false; btn.textContent = 'Send enquiry'; });
    });
  }
})();
