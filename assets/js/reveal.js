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
    const items = [...document.querySelectorAll("[data-category]")];
    if (!buttons.length || !items.length) return;

    const setFilter = (filter) => {
      buttons.forEach((button) => {
        const isActive = button.getAttribute("data-filter") === filter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

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
    const modalImage = document.querySelector("[data-lightbox-image]");
    const modalCaption = document.querySelector("[data-lightbox-caption]");
    const closeButton = document.querySelector("[data-lightbox-close]");
    const triggers = [...document.querySelectorAll("[data-lightbox-trigger]")];

    if (!modal || !modalImage || !modalCaption || !closeButton || !triggers.length) {
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

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => open(trigger));
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
