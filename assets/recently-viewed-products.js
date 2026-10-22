
(() => {
  const STORAGE_KEY = "recently-viewed-products";
  const MAX_HISTORY = 12;

  function getHistory() {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(history)
        ? history.filter((handle) => typeof handle === "string")
        : [];
    } catch {
      return [];
    }
  }

  function trackProduct(handle) {
    if (!handle) return;

    const history = getHistory().filter((item) => item !== handle);
    history.unshift(handle);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(0, MAX_HISTORY))
      );
    } catch {}
  }

  async function getProduct(handle) {
    try {
      const response = await fetch(
        `/products/${encodeURIComponent(handle)}.js`
      );

      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }

  function formatPrice(price) {
    const currency = window.Shopify?.currency?.active || "USD";

    try {
      return new Intl.NumberFormat(document.documentElement.lang || "en", {
        style: "currency",
        currency
      }).format(price / 100);
    } catch {
      return (price / 100).toFixed(2);
    }
  }

  function createCard(product, showPrice) {
    const card = document.createElement("article");
    card.className = "rvp-card";

    const link = document.createElement("a");
    link.className = "rvp-card__link";
    link.href = product.url || `/products/${product.handle}`;

    if (product.featured_image) {
      const image = document.createElement("img");
      image.className = "rvp-card__image";
      image.src = product.featured_image;
      image.alt = product.title || "";
      image.loading = "lazy";
      link.appendChild(image);
    }

    const title = document.createElement("span");
    title.className = "rvp-card__title";
    title.textContent = product.title;
    link.appendChild(title);

    if (showPrice) {
      const price = document.createElement("span");
      price.className = "rvp-card__price";
      price.textContent = formatPrice(product.price);
      link.appendChild(price);
    }

    card.appendChild(link);
    return card;
  }

  async function renderSection(section) {
    const container = section.querySelector("[data-rvp-products]");
    if (!container) return;

    const limit = Math.max(
      2,
      Math.min(8, Number(section.dataset.limit) || 4)
    );
    const showPrice = section.dataset.showPrice === "true";

    const handles = getHistory().slice(0, MAX_HISTORY);
    const products = await Promise.all(handles.map(getProduct));

    const recommendations = products
      .filter(Boolean)
      .slice(0, limit);

    container.replaceChildren();

    if (!recommendations.length) {
      section.hidden = true;
      return;
    }

    recommendations.forEach((product) => {
      container.appendChild(createCard(product, showPrice));
    });

    section.hidden = false;
  }

  function init() {
    trackProduct(window.rvpCurrentProductHandle);

    document.querySelectorAll("[data-rvp-section]").forEach((section) => {
      renderSection(section);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
