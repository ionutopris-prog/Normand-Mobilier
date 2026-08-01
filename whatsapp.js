/* Contact rapid: buton flotant WhatsApp (desktop) + bară fixă Sună/WhatsApp (mobil).
   O singură sursă comună — schimbi numărul/mesajul aici, se aplică peste tot.
   Pe mobil (unde ajunge traficul din reclame) contactul e mereu la un deget. */
(function () {
  var PHONE_INTL = "40749572087";        // 0749 572 087 în format internațional
  var PHONE_TEL  = "+40749572087";
  var MSG = encodeURIComponent("Bună ziua! Aș dori o ofertă pentru mobilă la comandă.");
  var WA = "https://wa.me/" + PHONE_INTL + "?text=" + MSG;

  var WA_ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.3 31.7l8-2.1c2.3 1.2 4.9 1.9 7.7 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28.3c-2.5 0-4.8-.7-6.8-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5C3.9 20.8 3.2 18.5 3.2 16 3.2 8.9 9 3.1 16 3.1c3.4 0 6.7 1.3 9.1 3.8 2.4 2.4 3.8 5.7 3.8 9.1 0 7.1-5.8 12.8-12.9 12.8zm7.1-9.6c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.7-.6-.6-.9-.7h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9 0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4z"/></svg>';
  var CALL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7A2 2 0 0 1 22 16.9z" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var css =
    /* buton flotant WhatsApp (desktop) */
    ".wa-fab{position:fixed;right:20px;bottom:20px;z-index:120;display:flex;align-items:center;gap:10px;" +
    "background:#25D366;color:#fff;text-decoration:none;border-radius:999px;padding:13px 18px;" +
    "box-shadow:0 10px 26px rgba(0,0,0,.22);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
    "font-weight:600;font-size:14.5px;transition:transform .2s ease,box-shadow .2s ease;}" +
    ".wa-fab:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(0,0,0,.3);}" +
    ".wa-fab svg{width:26px;height:26px;flex:none;}" +
    /* bară fixă Sună + WhatsApp (mobil) */
    ".cta-bar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:121;" +
    "box-shadow:0 -6px 20px rgba(20,28,18,.14);font-family:'Inter',-apple-system,sans-serif;}" +
    ".cta-bar a{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:15px 10px;" +
    "font-weight:700;font-size:15.5px;text-decoration:none;color:#fff;}" +
    ".cta-bar a svg{width:20px;height:20px;flex:none;}" +
    ".cta-bar .cb-call{background:#2f4a37;}" +
    ".cta-bar .cb-wa{background:#25D366;}" +
    "@media(max-width:600px){.wa-fab{display:none;}.cta-bar{display:flex;}body{padding-bottom:58px;}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // buton flotant (desktop)
  var fab = document.createElement("a");
  fab.className = "wa-fab";
  fab.href = WA; fab.target = "_blank"; fab.rel = "noopener";
  fab.setAttribute("aria-label", "Scrie-ne pe WhatsApp");
  fab.innerHTML = WA_ICON + '<span>Scrie-ne pe WhatsApp</span>';
  document.body.appendChild(fab);

  // bară fixă (mobil): Sună + WhatsApp
  var bar = document.createElement("div");
  bar.className = "cta-bar";
  bar.innerHTML =
    '<a class="cb-call" href="tel:' + PHONE_TEL + '">' + CALL_ICON + 'Sună</a>' +
    '<a class="cb-wa" href="' + WA + '" target="_blank" rel="noopener">' + WA_ICON + 'WhatsApp</a>';
  document.body.appendChild(bar);
})();
