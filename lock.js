/* ResqHub – zamykání aplikací heslem
   Aplikace se zašifruje přímo v telefonu (AES-256-GCM, klíč z hesla přes PBKDF2).
   Na GitHub se nahraje jen zamykací stránka se zašifrovaným obsahem. Heslo se nikam neukládá. */
(function () {
  'use strict';
  var ITERATIONS = 600000;

  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  async function encrypt(html, password) {
    if (!window.crypto || !crypto.subtle) throw new Error('Šifrování funguje jen na zabezpečené adrese (https).');
    var enc = new TextEncoder();
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    var data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(html)));
    return { v: 1, iter: ITERATIONS, salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(data) };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Samostatná zamykací stránka – funguje v hubu i otevřená napřímo, i offline. */
  function page(payload, id, name) {
    var json = JSON.stringify(payload).replace(/</g, '\\u003c');
    return '<!doctype html>\n<html lang="cs">\n<head>\n<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
'<meta name="robots" content="noindex">\n' +
'<title>' + esc(name) + '</title>\n' +
'<style>\n' +
':root{--bg:#E4EEEF;--ink:#0A1F23;--ink2:rgba(10,31,35,.58);--petrol:#0B6E79;--on:#fff;--glass:rgba(255,255,255,.6);--edge:rgba(255,255,255,.8);--field:rgba(10,31,35,.06);--glow:rgba(11,110,121,.45);--err:#E5383B;color-scheme:light}\n' +
'@media (prefers-color-scheme:dark){:root{--bg:#03141A;--ink:#EAF6F7;--ink2:rgba(234,246,247,.62);--petrol:#3CC0CB;--on:#03141A;--glass:rgba(255,255,255,.07);--edge:rgba(255,255,255,.13);--field:rgba(255,255,255,.08);--glow:rgba(11,110,121,.6);--err:#FF6B6E;color-scheme:dark}}\n' +
'*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink)}\n' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px 16px;\n' +
'background:radial-gradient(90% 60% at 20% 0%,var(--glow),transparent 70%),var(--bg)}\n' +
'.card{width:100%;max-width:360px;padding:30px 22px 24px;border-radius:30px;text-align:center;background:var(--glass);border:1px solid var(--edge);\n' +
'-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);box-shadow:0 20px 50px -20px rgba(0,0,0,.3)}\n' +
'.lock{width:64px;height:64px;margin:0 auto 16px;border-radius:18px;display:grid;place-items:center;color:#fff;background:linear-gradient(150deg,#22C1C9,#0B6E79)}\n' +
'.lock svg{width:30px;height:30px}h1{margin:0;font-size:24px;letter-spacing:-.02em}p{margin:6px 0 22px;color:var(--ink2);font-size:15px}\n' +
'form{display:flex;flex-direction:column;gap:12px}\n' +
'input[type=password]{width:100%;height:50px;border:0;border-radius:16px;background:var(--field);padding:0 16px;font-size:17px;color:var(--ink);outline:none}\n' +
'input[type=password]:focus{box-shadow:0 0 0 2px var(--petrol)}\n' +
'label{display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;color:var(--ink2)}\n' +
'label input{width:18px;height:18px;accent-color:var(--petrol)}\n' +
'button{height:50px;border:0;border-radius:25px;background:var(--petrol);color:var(--on);font-size:17px;font-weight:650}\n' +
'button:disabled{opacity:.6}.err{margin:2px 0 0;color:var(--err);font-size:14px;font-weight:550}\n' +
'.shake{animation:shake .4s}@keyframes shake{25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-4px)}}\n' +
'@media (prefers-reduced-motion:reduce){.shake{animation:none}}\n' +
'</style>\n</head>\n<body>\n' +
'<main class="card" id="card">\n' +
'<div class="lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg></div>\n' +
'<h1>' + esc(name) + '</h1>\n<p>Aplikace je zamčená heslem.</p>\n' +
'<form id="form">\n' +
'<input type="password" id="pw" placeholder="Heslo" autocomplete="current-password" aria-label="Heslo" required>\n' +
'<label><input type="checkbox" id="remember" checked> Zapamatovat v tomto telefonu</label>\n' +
'<button type="submit" id="go">Odemknout</button>\n' +
'<div class="err" id="err" role="alert" hidden>Špatné heslo. Zkus to znovu.</div>\n' +
'</form>\n</main>\n' +
'<script>\n' +
'(function(){\n' +
'var P=' + json + ',ID=' + JSON.stringify(String(id)) + ',KEY="resqhub:key:"+ID;\n' +
'function u8(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}\n' +
'function b64(u){var s="";for(var i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}\n' +
'function render(buf){var html=new TextDecoder().decode(buf);function go(){document.open();document.write(html);document.close()}\n' +
'if(document.readyState==="complete")go();else window.addEventListener("load",go)}\n' +
'function show(k){return crypto.subtle.decrypt({name:"AES-GCM",iv:u8(P.iv)},k,u8(P.data)).then(render)}\n' +
'function fromPw(pw){return crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]).then(function(b){\n' +
'return crypto.subtle.deriveKey({name:"PBKDF2",salt:u8(P.salt),iterations:P.iter,hash:"SHA-256"},b,{name:"AES-GCM",length:256},true,["decrypt"])})}\n' +
'var saved=null;try{saved=JSON.parse(localStorage.getItem(KEY))}catch(e){}\n' +
'if(saved&&saved.salt===P.salt){crypto.subtle.importKey("raw",u8(saved.k),"AES-GCM",false,["decrypt"]).then(show).catch(function(){try{localStorage.removeItem(KEY)}catch(e){}});}\n' +
'var f=document.getElementById("form"),pw=document.getElementById("pw"),go=document.getElementById("go"),err=document.getElementById("err");\n' +
'f.addEventListener("submit",function(e){e.preventDefault();err.hidden=true;go.disabled=true;go.textContent="Odemykám…";var key;\n' +
'fromPw(pw.value).then(function(k){key=k;return crypto.subtle.decrypt({name:"AES-GCM",iv:u8(P.iv)},k,u8(P.data))}).then(function(buf){\n' +
'if(document.getElementById("remember").checked){return crypto.subtle.exportKey("raw",key).then(function(raw){try{localStorage.setItem(KEY,JSON.stringify({salt:P.salt,k:b64(new Uint8Array(raw))}))}catch(e){}return buf})}return buf;\n' +
'}).then(render\n' +
').catch(function(){go.disabled=false;go.textContent="Odemknout";err.hidden=false;pw.select();var c=document.getElementById("card");c.classList.remove("shake");void c.offsetWidth;c.classList.add("shake");});});\n' +
'})();\n' +
'</script>\n</body>\n</html>\n';
  }

  function forget(id) { try { localStorage.removeItem('resqhub:key:' + id); } catch (e) {} }

  window.RH_LOCK = { encrypt: encrypt, page: page, forget: forget };
})();
