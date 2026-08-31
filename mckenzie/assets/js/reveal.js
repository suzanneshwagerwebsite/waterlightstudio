(() => {
  const setupReveals = () => {
    const revealTargets = [...document.querySelectorAll("[data-reveal]")];
    if (!revealTargets.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    revealTargets.forEach((target) => observer.observe(target));
  };

  const setupGalleryFilters = () => {
    const buttons = [...document.querySelectorAll("[data-filter]")];
    if (!buttons.length) return;

    const setFilter = (filter) => {
      buttons.forEach((button) => {
        const isActive = button.getAttribute("data-filter") === filter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      const items = [...document.querySelectorAll("[data-category]")];
      items.forEach((item) => {
        const tags = item.getAttribute("data-category") || "";
        const matches = filter === "all" || tags.split(" ").includes(filter);
        item.hidden = !matches;
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        setFilter(button.getAttribute("data-filter") || "all");
      });
    });

    setFilter("all");
  };

  const setupLightbox = () => {
    const modal = document.querySelector("[data-lightbox]");
    const modalImage = modal && modal.querySelector("[data-lightbox-image]");

    if (!modal || !modalImage) return;

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
    };

    const open = (src, alt) => {
      if (!src) return;
      modalImage.setAttribute("src", src);
      modalImage.setAttribute("alt", alt || "");
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    };

    // Click on any content image to enlarge
    document.addEventListener("click", (event) => {
      const img = event.target.closest("img");
      if (!img) return;
      // Skip images inside the lightbox itself, admin, or nav
      if (img.closest("[data-lightbox]") || img.closest("nav") || img.closest("header .home-brand")) return;
      open(img.src, img.alt);
    });

    // Click anywhere on lightbox to close
    modal.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (!modal.hidden && event.key === "Escape") {
        close();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupReveals();
    setupGalleryFilters();
    setupLightbox();
  });
})();
