// ĂncarcÄ SW dacÄ este suportat
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(console.error);
  });
}
