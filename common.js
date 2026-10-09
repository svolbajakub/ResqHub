/* ResqHub – sdílené funkce pro hub i admin */
(function () {
  'use strict';
  var DRAFT_KEY = 'resqhub:draft';

  function sGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function sDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function published() {
    return {
      apps: Array.isArray(window.RESQHUB_APPS) ? window.RESQHUB_APPS : [],
      version: Number(window.RESQHUB_VERSION) || 0
    };
  }

  function getDraft() {
    try {
      var d = JSON.parse(sGet(DRAFT_KEY));
      if (d && Array.isArray(d.apps)) return d;
    } catch (e) {}
    return null;
  }

  /* Vrátí aktuální seznam aplikací.
     Koncept z adminu má přednost, dokud publikovaný apps.js nedožene jeho verzi. */
  function current() {
    var pub = published();
    var d = getDraft();
    if (d) {
      if (d.version > pub.version) {
        return { apps: d.apps, version: d.version, source: d.published ? 'pending' : 'draft' };
      }
      sDel(DRAFT_KEY);
    }
    return { apps: pub.apps, version: pub.version, source: 'published' };
  }

  function writeDraft(d) { return sSet(DRAFT_KEY, JSON.stringify(d)); }
  function clearDraft() { sDel(DRAFT_KEY); }

  function buildAppsJs(apps, version) {
    return '// ResqHub – seznam aplikací.\n' +
      '// Generuje admin.html; ruční úpravy jsou možné, jen zachovej formát.\n' +
      'window.RESQHUB_VERSION = ' + version + ';\n' +
      'window.RESQHUB_APPS = ' + JSON.stringify(apps, null, 2) + ';\n';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Náhradní ikona: barva odvozená z názvu, aby každá aplikace měla svou */
  var TINTS = [
    ['#22C1C9', '#0B6E79'], ['#3A9BE8', '#17529A'], ['#2CC48A', '#0D7150'], ['#6E7CF5', '#3843B0'],
    ['#F5A24B', '#C8611A'], ['#EE6170', '#A82A3E'], ['#8C9BA3', '#46565E'], ['#1E8E9A', '#06424A']
  ];
  function tint(key) {
    var h = 0, s = String(key || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TINTS[h % TINTS.length];
  }
  function iconHtml(app, size) {
    var cls = 'icon' + (size ? ' ' + size : '');
    if (app.icon) return '<span class="' + cls + '"><img src="' + esc(app.icon) + '" alt="" loading="lazy"></span>';
    var t = tint(app.id || app.name);
    var ch = (app.name || '?').trim().charAt(0).toUpperCase() || '?';
    return '<span class="' + cls + '" aria-hidden="true" style="background:linear-gradient(150deg,' + t[0] + ',' + t[1] + ')">' + esc(ch) + '</span>';
  }

  /* Potvrzení ve stylu iOS akčního panelu (confirm() na některých místech nefunguje) */
  function confirmSheet(message, actionLabel, danger) {
    return new Promise(function (resolve) {
      var scrim = document.createElement('div'); scrim.className = 'scrim action-scrim';
      var sheet = document.createElement('div'); sheet.className = 'action-sheet'; sheet.setAttribute('role', 'alertdialog');
      sheet.innerHTML = '<div class="box glass"><div class="msg">' + esc(message) + '</div>' +
        '<button type="button" class="ok' + (danger === false ? '' : ' danger') + '">' + esc(actionLabel) + '</button></div>' +
        '<div class="box glass"><button type="button" class="cancel">Zrušit</button></div>';
      document.body.appendChild(scrim); document.body.appendChild(sheet);
      requestAnimationFrame(function () { scrim.classList.add('open'); sheet.classList.add('open'); });
      function done(v) {
        scrim.classList.remove('open'); sheet.classList.remove('open');
        setTimeout(function () { scrim.remove(); sheet.remove(); }, 380);
        resolve(v);
      }
      sheet.querySelector('.ok').onclick = function () { done(true); };
      sheet.querySelector('.cancel').onclick = function () { done(false); };
      scrim.onclick = function () { done(false); };
      sheet.querySelector('.cancel').focus();
    });
  }

  function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function slugify(s) {
    return normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'aplikace';
  }

  var toastTimer;
  function toast(msg, ms) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2600);
  }

  function isLocalPath(p) { return p && !/^[a-z]+:/i.test(p) && !p.startsWith('//'); }

  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return Promise.resolve(null);
    return navigator.serviceWorker.register('sw.js').catch(function () { return null; });
  }

  function precache(paths) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    var urls = paths.filter(isLocalPath);
    if (!urls.length) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (reg.active) reg.active.postMessage({ type: 'precache', urls: urls });
    }).catch(function () {});
  }

  window.RH = {
    current: current, getDraft: getDraft, writeDraft: writeDraft, clearDraft: clearDraft,
    published: published, buildAppsJs: buildAppsJs, esc: esc, iconHtml: iconHtml, confirm: confirmSheet,
    normalize: normalize, slugify: slugify, toast: toast, registerSW: registerSW,
    precache: precache, sGet: sGet, sSet: sSet
  };
})();
