// ==UserScript==
// @name         psa.wf bypass shorlink
// @namespace    https://github.com/cyan-n1d3/PSAbypass
// @version      1.1
// @description  bypass and autoredirect shortlink for web psa.wf.
// @author       cyan-n1d3
// @homepage     https://github.com/cyan-n1d3/PSAbypass
// @homepageURL  https://github.com/cyan-n1d3/PSAbypass
// @supportURL   https://github.com/cyan-n1d3/PSAbypass/issues
// @updateURL    https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass1.1.user.js
// @downloadURL  https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass1.1.user.js
// @icon         https://psa.wf/favicon.ico
// @icon64       https://psa.wf/favicon.ico
// @match        *://cashgrowth.online/*
// @match        *://*.ravellawfirm.com/*
// @match        *://psa.wf/goto/*
// @match        *://go2.pics/go2*
// @match        *://get-to.link/*
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const host = location.hostname;
  const href = location.href;

  const lim = Object.freeze({
    go2Depth: 8,
    ravTry: 50,
    ravGap: 100,
  });

  const say = (...msg) => console.log('[Bypass]', ...msg);

  function b64(v) {
    if (!v) return null;
    try {
      return atob(v.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return null;
    }
  }

  function isGo2(u) {
    try {
      const x = new URL(u);
      return x.hostname === 'go2.pics' && x.pathname === '/go2';
    } catch {
      return false;
    }
  }

  function unGo2(u) {
    try {
      const x = new URL(u);
      if (!isGo2(u)) return null;
      const id = x.searchParams.get('id');
      return b64(id);
    } catch {
      return null;
    }
  }

  function go2Chain(start) {
    let cur = start;
    for (let d = 0; d < lim.go2Depth; d++) {
      const dec = unGo2(cur);
      if (!dec) break;
      say('decode', dec);
      if (isGo2(dec)) {
        cur = dec;
        continue;
      }
      location.replace(dec);
      return;
    }
  }

  // psa.wf auto redirect
  if (host === 'psa.wf' && location.pathname.startsWith('/goto/')) {
    say('detected');

    const realSet = window.setTimeout;
    window.setTimeout = (fn, _delay, ...args) => {
      if (typeof fn === 'function') {
        return realSet(fn, 0, ...args);
      }
      return realSet(fn, 0);
    };

    function doJump() {
      const form = document.forms?.redirect;
      if (!form) return false;
      say('inject redirect');
      try {
        form.submit();
      } catch {}
      return true;
    }

    if (!doJump()) {
      document.addEventListener('DOMContentLoaded', doJump, { once: true });
      window.addEventListener('load', doJump, { once: true });
    }
    return;
  }

  // go2.pics decode
  if (host === 'go2.pics' && location.pathname === '/go2') {
    say('decode');
    const dec = unGo2(href);
    if (!dec) {
      say('not found');
      return;
    }
    if (isGo2(dec)) {
      go2Chain(dec);
    } else {
      location.replace(dec);
    }
    return;
  }

  // cashgrowth bypass
  if (host.includes('cashgrowth.online')) {
    say('success');
    try {
        Object.defineProperty(document, 'hidden', { value: false });
        Object.defineProperty(document, 'visibilityState', { value: 'visible' });
        Object.defineProperty(document, 'hasFocus', { value: () => true });
    } catch (err) {
        console.warn('fail', err);
    }

    // auto click delete session button
    const loop = setInterval(() => {
        const btn = document.getElementById('delete-session-btn');
        if (btn) {
            say('delete session');
            btn.click();
        }
    }, 500);
    return;
  }

  // ravellawfirm redirect
  if (host.includes('ravellawfirm.com')) {
    say('ok');

    function getDest() {
      for (const island of document.querySelectorAll('astro-island')) {
        const prop = island.getAttribute('props');
        if (!prop || !prop.includes('finalDestination')) continue;
        const m = prop.match(/"finalDestination":\[\d+,"([^"]+)"\]/);
        if (m) return m[1];
      }
      return null;
    }

    let cnt = 0;
    const t = setInterval(() => {
      cnt++;
      const dest = getDest();
      if (!dest && cnt < lim.ravTry) return;

      clearInterval(t);
      if (!dest) {
        say('fail');
        return;
      }

      say('final', dest);
      if (isGo2(dest)) {
        go2Chain(dest);
      } else {
        location.replace(dest);
      }
    }, lim.ravGap);

    return;
  }

  if (host === 'get-to.link') {
    say('tada');
    return;
  }
})();
