// ==UserScript==
// @name         psa.wf bypass shorlink
// @namespace    https://github.com/faridzfr/PSAbypass
// @version      1.0
// @description  bypass and autoredirect shortlink.
// @author       https://github.com/faridzfr
// @match        *://cashgrowth.online/*
// @match        *://*.ravellawfirm.com/*
// @match        *://psa.wf/goto/*
// @match        *://go2.pics/go2*
// @match        *://get-to.link/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const HOST = location.hostname;
  const URL_HREF = location.href;

  const LIMITS = Object.freeze({
    GO2_DECODE_DEPTH: 8,
    RAVELLAW_RETRIES: 50,
    RAVELLAW_INTERVAL_MS: 100,
  });

  const log = (...args) => console.log('[Bypass]', ...args);

  /* helper */

  function decodeBase64UrlSafe(value) {
    if (!value) return null;
    try {
      return atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return null;
    }
  }

  function isGo2Redirect(url) {
    try {
      const u = new URL(url);
      return u.hostname === 'go2.pics' && u.pathname === '/go2';
    } catch {
      return false;
    }
  }

  function unwrapGo2Url(url) {
    try {
      const u = new URL(url);
      if (!isGo2Redirect(url)) return null;

      const encoded = u.searchParams.get('id');
      return decodeBase64UrlSafe(encoded);
    } catch {
      return null;
    }
  }

  function followGo2Chain(startUrl) {
    let current = startUrl;

    for (let depth = 0; depth < LIMITS.GO2_DECODE_DEPTH; depth++) {
      const decoded = unwrapGo2Url(current);
      if (!decoded) break;

      log('decode', decoded);

      if (isGo2Redirect(decoded)) {
        current = decoded;
        continue;
      }

      location.replace(decoded);
      return;
    }
  }

  /* auto redirect */

  if (HOST === 'psa.wf' && location.pathname.startsWith('/goto/')) {
    log('detected');

    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = (fn, _delay, ...args) => {
      if (typeof fn === 'function') {
        return nativeSetTimeout(fn, 0, ...args);
      }
      return nativeSetTimeout(fn, 0);
    };

    function submitRedirectForm() {
      const form = document.forms?.redirect;
      if (!form) return false;

      log('inject redirect');
      try { form.submit(); } catch {}
      return true;
    }

    if (!submitRedirectForm()) {
      document.addEventListener('DOMContentLoaded', submitRedirectForm, { once: true });
      window.addEventListener('load', submitRedirectForm, { once: true });
    }

    return;
  }

  /* decode */

  if (HOST === 'go2.pics' && location.pathname === '/go2') {
    log('decode');

    const decoded = unwrapGo2Url(URL_HREF);
    if (!decoded) {
      log('not found');
      return;
    }

    if (isGo2Redirect(decoded)) {
      followGo2Chain(decoded);
    } else {
      location.replace(decoded);
    }

    return;
  }

  /* bypass */

  if (HOST.includes('cashgrowth.online')) {
    log('success');

    try {
      Object.defineProperty(document, 'hidden', { value: false });
      Object.defineProperty(document, 'visibilityState', { value: 'visible' });
      Object.defineProperty(document, 'hasFocus', { value: () => true });
    } catch (e) {
      console.warn('fail', e);
    }

    return;
  }

  /* extract */

  if (HOST.includes('ravellawfirm.com')) {
    log('ok');

    function extractFinalDestination() {
      for (const island of document.querySelectorAll('astro-island')) {
        const props = island.getAttribute('props');
        if (!props || !props.includes('finalDestination')) continue;

        const match = props.match(/"finalDestination":\[\d+,"([^"]+)"\]/);
        if (match) return match[1];
      }
      return null;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;

      const destination = extractFinalDestination();
      if (!destination && attempts < LIMITS.RAVELLAW_RETRIES) return;

      clearInterval(timer);

      if (!destination) {
        log('fail');
        return;
      }

      log('final', destination);

      if (isGo2Redirect(destination)) {
        followGo2Chain(destination);
      } else {
        location.replace(destination);
      }
    }, LIMITS.RAVELLAW_INTERVAL_MS);

    return;
  }

  /* final */

  if (HOST === 'get-to.link') {
    log('tada');
    return;
  }
})();
