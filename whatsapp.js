/* Buton flotant WhatsApp (click-to-chat). Inclus pe paginile site-ului.
   Un singur loc de întreținut — schimbi numărul/mesajul aici, se aplică peste tot. */
(function () {
  var PHONE = "40749572087"; // 0749 572 087 în format internațional (fără +)
  var MSG = encodeURIComponent("Bună ziua! Aș dori o ofertă pentru mobilă la comandă.");

  var css =
    ".wa-fab{position:fixed;right:20px;bottom:20px;z-index:120;display:flex;align-items:center;gap:10px;" +
    "background:#25D366;color:#fff;text-decoration:none;border-radius:999px;padding:13px 18px;" +
    "box-shadow:0 10px 26px rgba(0,0,0,.22);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
    "font-weight:600;font-size:14.5px;transition:transform .2s ease,box-shadow .2s ease;}" +
    ".wa-fab:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(0,0,0,.3);}" +
    ".wa-fab svg{width:26px;height:26px;flex:none;}" +
    ".wa-fab .wa-txt{white-space:nowrap;}" +
    "@media(max-width:600px){.wa-fab{right:16px;bottom:16px;padding:14px;}.wa-fab .wa-txt{display:none;}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var a = document.createElement("a");
  a.className = "wa-fab";
  a.href = "https://wa.me/" + PHONE + "?text=" + MSG;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Scrie-ne pe WhatsApp");
  a.innerHTML =
    '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.3 31.7l8-2.1c2.3 1.2 4.9 1.9 7.7 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28.3c-2.5 0-4.8-.7-6.8-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5C3.9 20.8 3.2 18.5 3.2 16 3.2 8.9 9 3.1 16 3.1c3.4 0 6.7 1.3 9.1 3.8 2.4 2.4 3.8 5.7 3.8 9.1 0 7.1-5.8 12.8-12.9 12.8zm7.1-9.6c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.7-.6-.6-.9-.7h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9 0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4z"/></svg>' +
    '<span class="wa-txt">Scrie-ne pe WhatsApp</span>';
  document.body.appendChild(a);
})();
