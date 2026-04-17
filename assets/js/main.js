(() => {
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
    syncYear();
    markCurrentNav();
    setupMobileNav();
  });
})();
