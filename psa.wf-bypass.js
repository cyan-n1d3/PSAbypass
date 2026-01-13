// ==UserScript==
// @name         psa.wf bypass shorlink
// @namespace    https://github.com/cyan-n1d3/PSAbypass
// @version      1.9
// @description  bypass and autoredirect shortlink for web psa.wf.
// @author       cyan-n1d3
// @homepage     https://github.com/cyan-n1d3/PSAbypass
// @homepageURL  https://github.com/cyan-n1d3/PSAbypass
// @supportURL   https://github.com/cyan-n1d3/PSAbypass/issues
// @updateURL    https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass.js
// @downloadURL  https://github.com/cyan-n1d3/PSAbypass/raw/main/psa.wf-bypass.js
// @icon         https://psa.wf/favicon.ico
// @icon64       https://psa.wf/favicon.ico
// @match        *://cashgrowth.online/*
// @match        *://*.ravellawfirm.com/*
// @match        *://exe.io/*
// @match        *://exe-links.com/*
// @match        *://mtc1.theglobaldiary.com/*
// @match        *://mtc2.gkvpyqs.com/*
// @match        *://*.theglobaldiary.com/*
// @match        *://*.gkvpyqs.com/*
// @match        *://shortxlinks.com/*
// @match        *://*.shrinkme.click/*
// @match        *://*.themezon.net/*
// @match        *://*.en.mrproblogger.com/*
// @match        *://*.mrproblogger.com/*
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

  //== cashgrowth
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

    // redirect manual mode
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        
        try {
            const url = args[0] instanceof Request ? args[0].url : args[0];
            if (url && typeof url === 'string' && url.includes('/api/session/')) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data.redirect) {
                        console.log('redirect:', data.redirect);
                        location.replace(data.redirect);
                    } 
                    else if (data.data && data.data.finalRedirect) {
                         console.log('final redirect:', data.data.finalRedirect);
                         location.replace(data.data.finalRedirect);
                    }
                }).catch(e => console.error('JSON parse error', e));
            }
        } catch (e) {
            console.error('error', e);
        }
        
        return response;
    };

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

    OSI(() => {
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
  if (/mtc\d|theglobaldiary|gkvpyqs/.test(host)) {
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
            Object.assign(c.style, {position:'fixed',top:'300px',left:'50%',transform:'translateX(-50%)',zIndex:'2147483647',background:'#b21d1dff',color:'#fff',padding:'10px',fontSize:'14px',textAlign:'center'});
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

    const t = setInterval(() => {
      const b = document.querySelector('a.get-link, #btn-get-link, #get-link-btn, button#go-submit');
      if (b && b.offsetParent && !b.disabled) { clearInterval(t); b.click(); }
    }, 1000);
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
