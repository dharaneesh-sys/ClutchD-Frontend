if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    // Unregister any stale SW first — prevents caching conflicts
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      await existing.unregister();
    }

    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (err) {
      console.warn("SW registration skipped (non-critical):", err);
    }
  });
}
