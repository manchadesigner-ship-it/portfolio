(function () {
  'use strict';

  var title = document.querySelector('.hero h1');
  if (!title || !window.gsap || !window.SplitText || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var SplitText = window.SplitText;
  var ScrollTrigger = window.ScrollTrigger;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var forceMotion = new URLSearchParams(window.location.search).has('forceMotion');

  gsap.registerPlugin(SplitText, ScrollTrigger);
  title.classList.add('shuffle-active');
  if (reduced && !forceMotion) return;

  var lines = Array.prototype.slice.call(title.querySelectorAll('.line > span'));
  if (!lines.length) return;

  var duration = 0.35;
  var stagger = 0.03;
  var rolls = 1;
  var ease = 'power3.out';
  var scrambleCharset = '';
  var cells = [];
  var splits = [];
  var timeline = null;
  var playing = false;
  var hoverHandler = null;

  function pick(fallback) {
    return scrambleCharset ? scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length)) : fallback;
  }

  function teardown() {
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
    cells.forEach(function (cell) {
      if (cell.wrap.parentNode) cell.wrap.parentNode.replaceChild(cell.orig, cell.wrap);
    });
    cells = [];
    splits.forEach(function (split) {
      try {
        split.revert();
      } catch (error) {}
    });
    splits = [];
    playing = false;
  }

  function build() {
    teardown();

    lines.forEach(function (line) {
      var split = new SplitText(line, {
        type: 'chars',
        charsClass: 'shuffle-char',
        wordsClass: 'shuffle-word',
        linesClass: 'shuffle-line',
        smartWrap: true,
        reduceWhiteSpace: false
      });
      splits.push(split);

      (split.chars || []).forEach(function (ch) {
        var parent = ch.parentNode;
        if (!parent) return;

        var width = ch.getBoundingClientRect().width;
        if (!width) return;

        var wrap = document.createElement('span');
        wrap.className = 'shuffle-char-wrapper';
        wrap.style.display = 'inline-block';
        wrap.style.verticalAlign = 'bottom';
        wrap.style.width = width + 'px';

        var inner = document.createElement('span');
        inner.style.display = 'inline-flex';
        inner.style.whiteSpace = 'nowrap';
        inner.style.willChange = 'transform';

        parent.insertBefore(wrap, ch);
        wrap.appendChild(inner);

        ch.style.display = 'inline-block';
        ch.style.width = width + 'px';
        ch.style.textAlign = 'center';
        inner.appendChild(ch);

        cells.push({
          wrap: wrap,
          inner: inner,
          orig: ch,
          text: ch.textContent || '',
          size: width,
          from: 0
        });
      });
    });
  }

  function fillStrip(cell, count) {
    var head = cell.orig.cloneNode(true);
    var mids = [];

    for (var k = 0; k < count; k++) {
      var node = cell.orig.cloneNode(true);
      node.textContent = pick(cell.text);
      mids.push(node);
    }

    cell.inner.replaceChildren.apply(cell.inner, [cell.orig].concat(mids, [head]));
    cell.from = -(count + 1) * cell.size;
    gsap.set(cell.inner, { x: cell.from, force3D: true });
  }

  function animateCell(cell, count, durationValue) {
    var tl = gsap.timeline();
    fillStrip(cell, count);
    tl.fromTo(
      cell.inner,
      { x: cell.from },
      {
        x: 0,
        duration: durationValue,
        ease: ease,
        force3D: true,
        immediateRender: false
      },
      0
    );
    return tl;
  }

  function settle(cell) {
    cell.inner.replaceChildren(cell.orig);
    gsap.set(cell.inner, { clearProps: 'transform' });
  }

  function startOffsets() {
    var oddCount = Math.floor(cells.length / 2);
    var evenStart = oddCount ? (duration + Math.max(0, oddCount - 1) * stagger) * 0.7 : 0;

    return cells.map(function (_, index) {
      return index % 2 === 1
        ? Math.floor(index / 2) * stagger
        : evenStart + (index / 2) * stagger;
    });
  }

  function armHover() {
    if (hoverHandler) return;

    hoverHandler = function () {
      if (playing) return;
      build();
      play();
    };

    title.addEventListener('mouseenter', hoverHandler);
  }

  function disarmHover() {
    if (!hoverHandler) return;
    title.removeEventListener('mouseenter', hoverHandler);
    hoverHandler = null;
  }

  function play() {
    if (!cells.length) return;

    playing = true;
    disarmHover();

    var tl = gsap.timeline({
      onComplete: function () {
        playing = false;
        cells.forEach(settle);
        timeline = null;
        armHover();
      }
    });
    var offsets = startOffsets();

    cells.forEach(function (cell, index) {
      tl.add(animateCell(cell, rolls, duration), offsets[index]);
    });

    timeline = tl;
  }

  ScrollTrigger.create({
    trigger: title,
    start: 'top 90%',
    once: true,
    onEnter: function () {
      build();
      play();
    }
  });
})();
