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
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeProject = 0;
    let autoAdvanceTimer;
    let isHovered = false;
    let hasFocus = false;
    let isInViewport = false;

    function stopAutoAdvance() {
        window.clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = undefined;
    }

    function updateAutoAdvance() {
        stopAutoAdvance();
        if (
            prefersReducedMotion.matches
            || isHovered
            || hasFocus
            || document.hidden
            || !isInViewport
        ) {
            return;
        }

        autoAdvanceTimer = window.setInterval(() => {
            showProject(activeProject + 1);
        }, 6500);
    }

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
        updateAutoAdvance();
    }

    projectCarousel.querySelectorAll("[data-project-direction]").forEach((button) => {
        button.addEventListener("click", () => {
            showProject(activeProject + Number(button.dataset.projectDirection));
        });
    });

    projectDots.forEach((button) => {
        button.addEventListener("click", () => showProject(Number(button.dataset.projectIndex)));
    });

    projectCarousel.addEventListener("mouseenter", () => {
        isHovered = true;
        updateAutoAdvance();
    });

    projectCarousel.addEventListener("mouseleave", () => {
        isHovered = false;
        updateAutoAdvance();
    });

    projectCarousel.addEventListener("focusin", () => {
        hasFocus = true;
        updateAutoAdvance();
    });

    projectCarousel.addEventListener("focusout", (event) => {
        if (!projectCarousel.contains(event.relatedTarget)) {
            hasFocus = false;
            updateAutoAdvance();
        }
    });

    document.addEventListener("visibilitychange", updateAutoAdvance);
    prefersReducedMotion.addEventListener("change", updateAutoAdvance);

    const carouselObserver = new IntersectionObserver(([entry]) => {
        isInViewport = entry.isIntersecting;
        updateAutoAdvance();
    });
    carouselObserver.observe(projectCarousel);

    projectCarousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") showProject(activeProject + 1);
        if (event.key === "ArrowLeft") showProject(activeProject - 1);
    });
}

const projectFilterButtons = [...document.querySelectorAll("[data-project-filter]")];
const portfolioProjectCards = [...document.querySelectorAll("#all-projects-grid [data-project-category]")];
const projectFilterStatus = document.querySelector("#project-filter-status");

if (projectFilterButtons.length && portfolioProjectCards.length && projectFilterStatus) {
    const totalProjects = portfolioProjectCards.length;

    projectFilterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const category = button.dataset.projectFilter;
            let visibleProjects = 0;
            portfolioProjectCards.forEach((card) => {
                const isVisible = category === "all" || card.dataset.projectCategory === category;
                card.hidden = !isVisible;
                if (isVisible) visibleProjects += 1;
            });
            projectFilterButtons.forEach((filterButton) => {
                filterButton.setAttribute(
                    "aria-pressed",
                    String(filterButton === button)
                );
            });
            const label = button.textContent.trim().toLowerCase();
            projectFilterStatus.textContent = category === "all"
                ? `Showing all ${totalProjects} projects.`
                : `Showing ${visibleProjects} ${label.toLowerCase()}.`;
        });
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
