(() => {
  const SITE_CONFIG = {
    contactEmail: "hello@waterlightstudio.com",
    emailSubject: "Waterlight Studio Project Inquiry",
    emailBody:
      "Hello Waterlight Studio,%0D%0A%0D%0AI would love to discuss a project.%0D%0AProject type:%0D%0ATimeline:%0D%0ABudget range:%0D%0A%0D%0AThank you!"
  };

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(SITE_CONFIG.emailSubject);
    return `mailto:${SITE_CONFIG.contactEmail}?subject=${subject}&body=${SITE_CONFIG.emailBody}`;
  };

  const applyMailLinks = () => {
    const href = buildMailtoHref();
    document.querySelectorAll(".js-mail-link").forEach((link) => {
      link.setAttribute("href", href);
    });
  };

  const syncYear = () => {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  };

  const markCurrentNav = () => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const linkPath = (new URL(link.href)).pathname.replace(/\/$/, "") || "/";
      if (linkPath === path) {
        link.setAttribute("aria-current", "page");
      }
    });
  };

  const formatCartCount = (value) => {
    const count = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(count) && count > 0 ? `(${count})` : "";
  };

  const syncCartCount = () => {
    document.querySelectorAll(".home-header__cart").forEach((cartLink) => {
      const countEl = cartLink.querySelector(".home-header__cart-count");
      if (!countEl) return;

      const displayCount = formatCartCount(cartLink.getAttribute("data-cart-items") ?? countEl.textContent);
      countEl.textContent = displayCount;
      countEl.toggleAttribute("hidden", displayCount.length === 0);
    });
  };

  const setupMobileNav = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    const closeMenu = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (event.target instanceof Element) {
        if (!nav.contains(event.target) && !toggle.contains(event.target)) {
          closeMenu();
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 52.01rem)").matches) {
        closeMenu();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyMailLinks();
    syncYear();
    markCurrentNav();
    syncCartCount();
    setupMobileNav();
  });
})();
