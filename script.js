const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const nav = document.querySelector(".navbar");
const navToggle = document.querySelector(".nav-toggle");

function setMenuOpen(isOpen) {
    nav.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
}

navToggle.addEventListener("click", () => {
    setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        navToggle.focus();
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            navLinks.forEach((link) => {
                const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
                link.classList.toggle("active", isCurrent);
                if (isCurrent) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }
    });
}, {
    rootMargin: "-40% 0px -50% 0px"
});

sections.forEach((section) => {
    observer.observe(section);
});

const projectCarousel = document.querySelector(".project-carousel");

if (projectCarousel) {
    const projectSlides = [...projectCarousel.querySelectorAll(".project-slide")];
    const projectDots = [...projectCarousel.querySelectorAll(".project-carousel-dot")];
    const projectCount = projectCarousel.querySelector(".project-carousel-count");
    let activeProject = 0;

    function showProject(index) {
        activeProject = (index + projectSlides.length) % projectSlides.length;
        projectSlides.forEach((slide, slideIndex) => {
            slide.hidden = slideIndex !== activeProject;
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${projectSlides.length}: ${slide.querySelector("h3").textContent}`);
            if (slideIndex === activeProject) {
                slide.classList.add("is-visible");
            }
        });
        projectDots.forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === activeProject));
        });
        projectCount.textContent = `${String(activeProject + 1).padStart(2, "0")} / ${String(projectSlides.length).padStart(2, "0")}`;
    }

    projectCarousel.querySelectorAll("[data-project-direction]").forEach((button) => {
        button.addEventListener("click", () => {
            showProject(activeProject + Number(button.dataset.projectDirection));
        });
    });

    projectDots.forEach((button) => {
        button.addEventListener("click", () => showProject(Number(button.dataset.projectIndex)));
    });

    projectCarousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") showProject(activeProject + 1);
        if (event.key === "ArrowLeft") showProject(activeProject - 1);
    });
}

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealTargets = document.querySelectorAll(
        ".section-heading, .about-text, .detail-card, .project-card, .skill-card, .contact-content"
    );
    const revealObserver = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px"
    });

    revealTargets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
        revealObserver.observe(element);
    });
}
