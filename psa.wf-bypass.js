// ==UserScript==
// @name         psa.wf bypass shorlink
// @namespace    https://github.com/cyan-n1d3/PSAbypass
// @version      1.10.0
// @description  bypass and autoredirect shortlink for web psa.wf.
// @author       cyan-n1d3
// @homepage     https://github.com/cyan-n1d3/PSAbypass
// @homepageURL  https://github.com/cyan-n1d3/PSAbypass
// @supportURL   https://github.com/cyan-n1d3/PSAbypass/issues
// @updateURL    https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass.js
// @downloadURL  https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass.js
// @icon         https://psa.wf/favicon.ico
// @match        *://cashgrowth.online/*
// @match        *://*.ravellawfirm.com/*
// @match        *://exe.io/*
// @match        *://exe-links.com/*
// @include      /^https?:\/\/mtc1\./
// @include      /^https?:\/\/mtc2\./
// @match        *://shortxlinks.com/*
// @match        *://*.shrinkme.click/*
// @match        *://*.themezon.net/*
// @match        *://*.en.mrproblogger.com/*
// @match        *://*.mrproblogger.com/*
// @match        *://fc-lc.xyz/*
// @match        *://fc.lc/*
// @match        *://jobzhub.store/*
// @match        *://shrtslug.biz/*
// @match        *://digiztechno.com/*
// @match        *://tournguide.com/*
// @match        *://techmize.net/*
// @match        *://technons.com/*
// @match        *://yrtourguide.com/*
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

  //== helpers
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

  //== start here
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

  //== cashgrowth / ravellawfirm
  if (/cashgrowth\.online|ravellawfirm\.com/.test(host)) {
    say('cashgrowth/ravel');
    try {
      Object.defineProperty(document, 'hidden', { value: false });
      Object.defineProperty(document, 'visibilityState', { value: 'visible' });
      Object.defineProperty(document, 'hasFocus', { value: () => true });
    } catch (e) {}

    const orig = window.fetch;
    window.fetch = async (...args) => {
      const r = await orig(...args);
      try {
        const u = args[0] instanceof Request ? args[0].url : args[0];
        if (typeof u === 'string' && u.includes('/api/session/')) {
          r.clone().json().then(d => {
            const red = d.redirect || (d.data && d.data.finalRedirect);
            if (red) { say('redirect'); location.replace(red); }
          }).catch(() => {});
        }
      } catch (e) {}
      return r;
    };

    const t = setInterval(() => {
      // Auto-click delete session
      const b = document.getElementById('delete-session-btn');
      if (b) b.click();

      // Ravellawfirm
      const el = [...document.querySelectorAll('astro-island')].find(e => (e.getAttribute('props') || '').includes('finalDestination'));
      if (el) {
        const m = el.getAttribute('props').match(/"finalDestination":\[\d+,"([^"]+)"\]/);
        if (m && m[1]) {
          clearInterval(t);
          say('redirect', m[1]);
          location.replace(m[1]);
        }
      }
    }, 500);
    return;
  }

  //== exe.io
  // exe.io & exe-links.com
  if (/exe\.io|exe-links\.com/.test(host)) {
    say('exe');
    window.open = () => {};
    const OSI = setInterval;
    window.setInterval = (f, t, ...a) => OSI(f, t === 1e3 ? 100 : t, ...a);

    const XHR = XMLHttpRequest.prototype, open = XHR.open, send = XHR.send, set = XHR.setRequestHeader;
    XHR.open = function(m, u) { this._u = u; this._h = {}; return open.apply(this, arguments); };
    XHR.setRequestHeader = function(k, v) { this._h[k] = v; return set.apply(this, arguments); };
    XHR.send = function(b) {
      this.addEventListener('load', () => {
        if (this._u && this._u.includes('/links/go')) {
          try {
            const r = JSON.parse(this.responseText);
            if (r.url) location.href = r.url;
            else if (r.message) fetch(this._u, { method: 'POST', headers: { ...this._h, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: b })
              .then(x => x.json()).then(d => d.url && (location.href = d.url));
          } catch (e) {}
        }
      });
      return send.apply(this, arguments);
    };

    let a = false;
    OSI(() => {
      if (!a && document.body) {
        let c = document.createElement('div');
        Object.assign(c.style, {position: 'fixed', top: '0', left: '0', width: '100%', zIndex: '2147483647', background: '#b21d1dff', color: '#fff',padding: '10px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold'});
        c.innerText = 'Solve captcha manual';
        document.body.appendChild(c);
        a = true;
      }

      const b = document.querySelector('#before-captcha .button, button.link-button');
      if (b && b.innerText.includes("Continue")) b.click();
      const c = document.querySelector('#g-recaptcha-response');
      if (c && c.value.length > 20) (document.getElementById('link-view') || document.forms[0]).submit();
    }, 500);
    return;
  }

  // recaptcha
  if (/google\.com|recaptcha\.net/.test(host)) {
    setInterval(() => {
      const b = document.querySelector('.recaptcha-checkbox-border');
      if (b && !b.classList.contains('recaptcha-checkbox-checked')) b.click();
    }, 1000);
    return;
  }

  //== shortxlinks
  // shortxlinks (mtc1/mtc2)
  if (/mtc\d/.test(host)) {
    let check = setInterval(() => {
      const d = s => { try { return JSON.parse(atob(s)); } catch (e) {} };
      const p = new URLSearchParams(location.search).get('safelink_redirect');
      
      // MTC2 (Direct redirect)
      if (p) {
        const res = d(p);
        if (res && res.safelink) { clearInterval(check); location.href = res.safelink; }
      } 
      // MTC1 (Wait & Skip)
      else {
        const e = document.getElementById('value') || document.querySelector('input[name="newwpsafelink"]');
        const v = e ? e.value : window.ad_mem;
        
        if (v && document.body) {
          clearInterval(check);
          const j = d(v);
          if (j && j.linkr) {
            let u = j.linkr, t = (parseInt(j.delay) || 25) + 2; // safest way to not flagged as bot
            try { u = d(new URL(u).searchParams.get('safelink_redirect')).safelink || u; } catch (e) {}
            
            let c = document.createElement('div');
            Object.assign(c.style, {position: 'fixed', top: '300px', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483647', background: '#b21d1dff', color: '#fff', padding: '10px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px'});
            document.body.appendChild(c);
            
            let i = setInterval(() => {
              c.innerText = `Redirecting in ${t--}s...`;
              if (t < 0) { clearInterval(i); location.href = u; }
            }, 1000);
          }
        }
      }
    }, 500); // Check every 0.5s
    return;
  }

  // shortxlinks final redirect
  if (host.includes('shortxlinks')) {
    const X = XMLHttpRequest.prototype;
    const o = X.open;
    const s = X.send;
    X.open = function(m, u) { this._u = u; return o.apply(this, arguments); };
    X.send = function(b) {
      this.addEventListener('load', () => {
        try {
          if (this._u && this._u.includes('/links/go')) {
            const r = JSON.parse(this.responseText);
            if (r.url) location.href = r.url;
          }
        } catch (e) {}
      });
      return s.apply(this, arguments);
    };
  }

  //== shrinkme
  // shrinkme
  if (/shrinkme\.click/.test(host)) {
    say('shrinkme');
    const t = setInterval(() => {
      const v = document.getElementById('div-human-verification');
      if (v && v.dataset.link) { clearInterval(t); location.href = 'https://themezon.net/link.php?link=' + v.dataset.link; }
    }, 500);
    return;
  }

  // themezon
  if (/themezon\.net/.test(host)) {
    say('themezon');
    const t = setInterval(() => {
      const v = document.querySelector('input[name="newwpsafelink"]');
      const n = document.querySelector('#nextPage a');
      if (v) {
        clearInterval(t);
        const f = document.createElement('form');
        f.method = 'POST'; f.action = '/?redirect_to=random';
        const h = document.createElement('input');
        h.type = 'hidden'; h.name = 'newwpsafelink'; h.value = v.value;
        f.appendChild(h); document.body.appendChild(f); f.submit();
      } else if (n) {
        clearInterval(t); location.href = n.href;
      }
    }, 500);
    return;
  }

  // mrproblogger
  if (/mrproblogger\.com/.test(host)) {
    say('mrproblogger');
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    XHR.open = function(method, url) {
        this._u = url;
        return open.apply(this, arguments);
    };
    XHR.send = function(postData) {
        this.addEventListener('load', () => {
            if (this._u && this._u.includes('/links/go')) {
                try {
                    const r = JSON.parse(this.responseText);
                    if (r.url) location.href = r.url;
                } catch(e) {}
            }
        });
        return send.apply(this, arguments);
    };

    let a = false;
    const t = setInterval(() => {
      if (!a && document.body) {
          let c = document.createElement('div');
          Object.assign(c.style, {position: 'fixed', top: '300px', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483647', background: '#b21d1dff', color: '#fff', padding: '10px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px'});
          c.innerText = 'WAIT FOR COUNTDOWN';
          document.body.appendChild(c);
          a = true;
      }

      const b = document.querySelector('a.get-link, #btn-get-link, #get-link-btn, button#go-submit');
      if (b && b.offsetParent && !b.disabled) { clearInterval(t); b.click(); }
    }, 1000);
    return;
  }

  //== fc.lc
  if (/fc-lc|fc\.lc|jobzhub/.test(host)) {
    say('fc.lc');
    let a = false;
    const t = setInterval(() => {
      if (!a && document.body) {
        let c = document.createElement('div');
        Object.assign(c.style, {position: 'fixed', top: '0', left: '0', width: '100%', zIndex: '2147483647', background: '#b21d1dff', color: '#fff',padding: '10px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold'});
        c.innerText = 'Solve captcha manual';
        document.body.appendChild(c);
        a = true;
      }

      const b = document.getElementById('invisibleCaptchaShortlink');
      const c = document.querySelector('textarea[name="h-captcha-response"]') || document.querySelector('textarea[name="g-recaptcha-response"]');
      
      if (b && c) {
        if (c.value.length > 10) {
            clearInterval(t);
            say('Captcha solved, submitting');
            b.disabled = 0;
            b.click();
        }
        return; 
      }

      const m = document.documentElement.innerHTML.match(/REDIRECT_URL\s*=\s*"([^"]+)"/);
      if (m) { clearInterval(t); location.replace(m[1]); return; }

      const f = document.querySelector('input[name="fdata"]');
      if (f) { clearInterval(t); fetch('?start_countdown=1').then(r => r.json()).then(d => { f.value = d.rand; f.closest('form').submit(); }); return; }

      const f12 = document.getElementById('form12');
      if (f12) { clearInterval(t); fetch('https://fc.lc/links/go', { method: 'POST', body: new FormData(f12) }).then(r => r.json()).then(d => { if (d.url) location.href = d.url; }); }
    }, 500);
    return;
  }

  //== shrtslug and others
  // shrtslug / digiztechno / tournguide / techmize / technons
  if (/shrtslug|digiztechno|tournguide|techmize|technons|yrtourguide/.test(host)) {
    say('shrtslug');
    const t = setInterval(() => {
      const f = document.querySelector('div[id$="_final"] a, div[id$="_final"] button');
      if (f && f.offsetParent) { clearInterval(t); f.click(); return; }

      const btns = document.querySelectorAll('button, a.btn, input[type="submit"]');
      for (let b of btns) {
        if (b.offsetParent && !b.disabled) {
          const txt = (b.innerText || b.value || '').toLowerCase();
          if (/verify|proceed|get link/.test(txt)) {
            b.click();
            break; 
          }
        }
      }
    }, 3000); // 3s sleep
    return;
  }

  // get-to.link
  if (host === 'get-to.link') {
    say('tada');
    const t = setInterval(() => {
        const b = document.querySelector('a.btn.btn-primary, a.btn.btn-secondary, a.get-link');
        if (b && b.href && b.href.startsWith('http')) { 
            clearInterval(t); 
            location.href = b.href; 
        }
    }, 500);
    return;
  }
})();
