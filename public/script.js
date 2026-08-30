const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-menu-toggle]");
const year = document.querySelector("[data-year]");
const appointmentForm = document.querySelector("[data-appointment-form]");
const appointmentStatus = document.querySelector("[data-appointment-status]");
const slides = [...document.querySelectorAll("[data-slide]")];
const slideDots = [...document.querySelectorAll("[data-slide-dot]")];
const mapFacade = document.querySelector("[data-map-facade]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (year) {
  year.textContent = new Date().getFullYear();
}

const updateHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
};

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  document.body.classList.toggle("nav-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (appointmentForm) {
  appointmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    const formData = new FormData(appointmentForm);
    const payload = Object.fromEntries(formData.entries());

    if (appointmentStatus) {
      appointmentStatus.textContent = "Sending your appointment request...";
      appointmentStatus.dataset.state = "loading";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(appointmentForm.action || "/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send appointment request.");
      }

      appointmentForm.reset();

      if (appointmentStatus) {
        appointmentStatus.textContent = result.message || "Appointment sent to Telegram.";
        appointmentStatus.dataset.state = "success";
      }
    } catch (error) {
      if (appointmentStatus) {
        appointmentStatus.textContent = error.message || "Something went wrong while sending the appointment.";
        appointmentStatus.dataset.state = "error";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (mapFacade) {
  const loadMap = () => {
    const src = mapFacade.dataset.mapSrc;
    if (!src || mapFacade.querySelector("iframe")) {
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = "Surya Dental Care Google map location";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.src = src;
    mapFacade.replaceChildren(iframe);
  };

  mapFacade.addEventListener("click", loadMap);
}

if (slides.length && slideDots.length) {
  let activeSlide = 0;
  let slideTimer;

  const loadSlideImage = (index) => {
    const slide = slides[(index + slides.length) % slides.length];
    const image = slide?.querySelector("img");
    if (!image) {
      return;
    }

    if (image.dataset.srcset) {
      image.srcset = image.dataset.srcset;
      image.sizes = image.dataset.sizes || "100vw";
      delete image.dataset.srcset;
    }

    if (image.dataset.src) {
      image.src = image.dataset.src;
      delete image.dataset.src;
    }
  };

  const showSlide = (index) => {
    activeSlide = (index + slides.length) % slides.length;
    loadSlideImage(activeSlide);
    loadSlideImage(activeSlide + 1);

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === activeSlide);
    });
    slideDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === activeSlide);
    });
  };

  const startSlideshow = () => {
    window.clearInterval(slideTimer);
    if (prefersReducedMotion || document.hidden) {
      return;
    }

    slideTimer = window.setInterval(() => {
      showSlide(activeSlide + 1);
    }, 5200);
  };

  slideDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlideshow();
    });
  });

  loadSlideImage(0);
  loadSlideImage(1);
  startSlideshow();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(slideTimer);
      return;
    }

    startSlideshow();
  });
}
