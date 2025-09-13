if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/eMAG/sw.js')
      .then(() => console.log("SW înregistrat"))
      .catch(console.error);
  });
}
