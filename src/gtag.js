const gtagId = import.meta.env.VITE_GTAG_ID;

if (gtagId) {
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', gtagId);
}
