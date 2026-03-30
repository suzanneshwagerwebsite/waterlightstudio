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
    const modalCaption = modal && modal.querySelector("[data-lightbox-caption]");
    const closeButton = modal && modal.querySelector("[data-lightbox-close]");

    if (!modal || !modalImage || !modalCaption || !closeButton) {
      return;
    }

    let previousFocus = null;

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };

    const open = (trigger) => {
      const image = trigger.getAttribute("data-lightbox-image");
      const caption = trigger.getAttribute("data-lightbox-caption") || "";
      const alt = trigger.getAttribute("data-lightbox-alt") || "Gallery image";
      if (!image) return;

      previousFocus = trigger;
      modalImage.setAttribute("src", image);
      modalImage.setAttribute("alt", alt);
      modalCaption.textContent = caption;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeButton.focus();
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lightbox-trigger]");
      if (trigger) open(trigger);
    });

    closeButton.addEventListener("click", close);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });

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
