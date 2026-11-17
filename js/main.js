(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Hero: split the name into letters that rise in ---------- */
  var delay = 0.15;
  $$('[data-split]').forEach(function (line) {
    var text = line.textContent;
    line.textContent = '';
    text.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      s.style.animationDelay = delay.toFixed(2) + 's';
      delay += 0.045;
      line.appendChild(s);
    });
    delay += 0.08;
  });

  /* ---------- Hero: rotating word ---------- */
  var words = $$('.swap__word');
  if (words.length > 1 && !reduce) {
    var wi = 0;
    setInterval(function () {
      var prev = words[wi];
      wi = (wi + 1) % words.length;
      var next = words[wi];
      prev.classList.remove('is-on');
      prev.classList.add('is-off');
      next.classList.remove('is-off');
      // Jump the incoming word back below the line before sliding it up.
      next.style.transition = 'none';
      next.style.transform = 'translateY(110%)';
      void next.offsetWidth;
      next.style.transition = '';
      next.style.transform = '';
      next.classList.add('is-on');
    }, 1700);
  }

  /* ---------- Intro: wrap words so they light up with scroll ---------- */
  var introText = $('[data-words]');
  var introWords = [];
  if (introText) {
    var parts = introText.textContent.trim().split(/\s+/);
    introText.textContent = '';
    parts.forEach(function (p, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = p;
      introText.appendChild(s);
      if (i < parts.length - 1) introText.appendChild(document.createTextNode(' '));
      introWords.push(s);
    });
  }

  /* ---------- Scroll-linked effects (one rAF loop) ---------- */
  var bar = $('.progress span');
  var shifts = $$('[data-shift]');
  var parallax = $$('[data-parallax]');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';

    if (introText) {
      var r = introText.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.45);
      var lit = Math.round(Math.max(0, Math.min(1, p)) * introWords.length);
      introWords.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
    }
    if (reduce) return;

    shifts.forEach(function (row) {
      var b = row.parentNode.getBoundingClientRect();
      if (b.bottom < -200 || b.top > vh + 200) return;
      var prog = (vh - b.top) / (vh + b.height);
      var dir = parseFloat(row.getAttribute('data-shift')) || 1;
      var x = dir < 0 ? -prog * 32 : -32 + prog * 32;
      row.style.transform = 'translate3d(' + x.toFixed(2) + '%,0,0)';
    });
    parallax.forEach(function (el) {
      var b = el.parentNode.getBoundingClientRect();
      if (b.bottom < -100 || b.top > vh + 100) return;
      var prog = (b.top + b.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (prog * -9).toFixed(2) + '%,0) scale(1.12)';
    });
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Reveal on scroll, count-ups, chapter colour ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    // Stagger siblings that enter together.
    $$('.posters, .numbers, .school__list, .intro__stats').forEach(function (group) {
      $$(':scope > *', group).forEach(function (child, i) {
        child.classList.add('reveal');
        child.style.setProperty('--d', (i % 6) * 0.07 + 's');
      });
    });

    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { revealIO.observe(el); });

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        countIO.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach(function (el) { countIO.observe(el); });

    // The accent colour and nav follow whichever chapter is on screen.
    var navLinks = {};
    $$('[data-nav]').forEach(function (a) { navLinks[a.getAttribute('data-nav')] = a; });
    var chapterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        root.style.setProperty('--accent', e.target.getAttribute('data-accent'));
        var id = e.target.getAttribute('data-chapter');
        Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.toggle('is-current', k === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('[data-chapter]').forEach(function (el) { chapterIO.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Credits filter ---------- */
  var filterButtons = $$('.filters button');
  var posters = $$('.poster');
  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterButtons.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      posters.forEach(function (p) {
        p.hidden = f !== 'all' && p.getAttribute('data-kind') !== f;
      });
    });
  });

  /* ---------- Poster tilt + custom cursor (mouse only) ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    posters.forEach(function (p) {
      p.addEventListener('mousemove', function (e) {
        var b = p.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5;
        var y = (e.clientY - b.top) / b.height - 0.5;
        p.style.transform = 'rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg) translateZ(18px)';
      });
      p.addEventListener('mouseleave', function () { p.style.transform = ''; });
    });
  }
  var cursor = $('.cursor');
  if (cursor && fine) {
    var label = $('.cursor__label', cursor);
    var cx = 0, cy = 0, tx = 0, ty = 0, moving = false;
    function follow() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(follow);
      else moving = false;
    }
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-on');
      if (!moving) { moving = true; requestAnimationFrame(follow); }
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button') : null;
      var text = t && t.getAttribute('data-cursor');
      cursor.classList.toggle('is-label', !!text);
      cursor.classList.toggle('is-link', !!t && !text);
      if (text) label.textContent = text;
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
  }

  /* ---------- Contact form ----------
     Posts to the address in the form's data-endpoint; the visitor stays on
     the page and sees a confirmation. */
  var talk = $('#talk');
  if (talk) {
    var status = $('.talk__status', talk);
    var sendBtn = $('.talk__send', talk);
    var say = function (msg, bad) {
      status.textContent = msg;
      status.classList.toggle('is-bad', !!bad);
    };
    talk.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field && field.classList.contains('is-bad')) {
        field.classList.remove('is-bad');
        if (!$('.field.is-bad', talk)) say('');
      }
    });
    talk.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = talk.elements;
      if (f._gotcha.value) return; // filled in by a bot
      var ok = true;
      ['name', 'email', 'purpose'].forEach(function (n) {
        var bad = !f[n].value.trim() || (n === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f[n].value.trim()));
        f[n].closest('.field').classList.toggle('is-bad', bad);
        if (bad && ok) { ok = false; f[n].focus(); }
      });
      if (!ok) { say('Please fill in your name, a valid email and a short note.', true); return; }

      var data = { name: f.name.value.trim(), email: f.email.value.trim(), purpose: f.purpose.value.trim() };
      var endpoint = talk.getAttribute('data-endpoint');
      if (!endpoint) { say('This form is not connected yet.', true); return; }
      sendBtn.disabled = true;
      say('Sending…');
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('send failed');
        talk.reset();
        say('Thank you. Your message is on its way.');
      }).catch(function () {
        say('That didn\u2019t send. Please try again in a moment.', true);
      }).then(function () { sendBtn.disabled = false; });
    });
  }

  /* ---------- Pictures ----------
     Artwork is looked up by Wikipedia article title (data-wiki), so nothing
     has to be downloaded by hand. To use your own picture for any slot, add
     data-img="img/your-file.jpg" to that element and it wins. */
  var API = 'https://en.wikipedia.org/w/api.php';

  function lookup(titles, size) {
    if (!titles.length) return Promise.resolve({});
    var url = API + '?action=query&format=json&formatversion=2&origin=*&redirects=1' +
      '&prop=pageimages&piprop=thumbnail&pilicense=any&pilimit=50&pithumbsize=' + size +
      '&titles=' + encodeURIComponent(titles.join('|'));
    return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var q = data.query || {};
      var alias = {};
      (q.normalized || []).concat(q.redirects || []).forEach(function (n) { alias[n.from] = n.to; });
      var byTitle = {};
      (q.pages || []).forEach(function (p) {
        if (p.thumbnail && p.thumbnail.source) byTitle[p.title] = p.thumbnail.source;
      });
      var out = {};
      titles.forEach(function (t) {
        var k = t, hops = 0;
        while (alias[k] && hops++ < 4) k = alias[k];
        if (byTitle[k]) out[t] = byTitle[k];
      });
      return out;
    }).catch(function () { return {}; });
  }

  function preload(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  var heroPosters = [];

  function fillPoster(el, src) {
    return preload(src).then(function (img) {
      if (!img) return;
      img.alt = '';
      $('.poster__art', el).appendChild(img);
      requestAnimationFrame(function () { el.classList.add('is-loaded'); });
      heroPosters.push(src);
    });
  }
  function fillShot(el, src) {
    return preload(src).then(function (img) {
      if (!img) return;
      $('.shot__img', el).style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
      el.classList.add('is-loaded');
    });
  }

  // The drifting wall of posters behind the name.
  function buildWall() {
    var wall = $('.hero__wall');
    if (!wall || heroPosters.length < 4) return;
    $$('.hero__col', wall).forEach(function (col, c) {
      var list = [];
      for (var i = 0; i < 6; i++) list.push(heroPosters[(i * 2 + c * 3) % heroPosters.length]);
      list.concat(list).forEach(function (src) {
        var img = document.createElement('img');
        img.src = src; img.alt = ''; img.loading = 'eager';
        col.appendChild(img);
      });
      col.style.animationDuration = (col.getAttribute('data-speed') || 40) + 's';
    });
    wall.classList.add('is-ready');
  }

  function loadPictures() {
    var posterEls = $$('.poster[data-wiki], .poster[data-img]');
    var shotEls = $$('.shot[data-wiki], .shot[data-img]');
    var need = function (els) {
      return els.filter(function (e) { return !e.getAttribute('data-img'); })
        .map(function (e) { return e.getAttribute('data-wiki'); });
    };
    return Promise.all([lookup(need(posterEls), 500), lookup(need(shotEls), 1280)]).then(function (maps) {
      var jobs = posterEls.map(function (el) {
        var src = el.getAttribute('data-img') || maps[0][el.getAttribute('data-wiki')];
        return src ? fillPoster(el, src) : null;
      });
      shotEls.forEach(function (el) {
        var src = el.getAttribute('data-img') || maps[1][el.getAttribute('data-wiki')];
        if (src) fillShot(el, src);
      });
      return Promise.all(jobs);
    }).then(buildWall);
  }

  if (window.fetch && window.Promise) loadPictures();
})();
