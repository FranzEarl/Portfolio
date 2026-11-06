// ------------------------------------------------------------
// Hero network background
// ------------------------------------------------------------

const hero = document.querySelector(".hero");
const networkCanvas = document.querySelector("#hero-network");

if (hero && networkCanvas) {
    const context = networkCanvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: null, y: null, radius: 150 };

    let nodes = [];
    let width = 0;
    let height = 0;
    let animationFrame;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const connectionDistance = 145;
    const nodeColor = "101, 165, 243";

    function createNodes() {
        const area = width * height;
        const nodeCount = Math.max(24, Math.min(82, Math.round(area / 14500)));

        nodes = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            radius: Math.random() * 1.35 + 1.1
        }));
    }

    function resizeCanvas() {
        const bounds = hero.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        width = bounds.width;
        height = bounds.height;

        networkCanvas.width = Math.round(width * pixelRatio);
        networkCanvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        createNodes();
        drawNetwork(false);
    }

    function updateNodes() {
        nodes.forEach((node) => {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x < -10) node.x = width + 10;
            if (node.x > width + 10) node.x = -10;
            if (node.y < -10) node.y = height + 10;
            if (node.y > height + 10) node.y = -10;

            if (pointer.x !== null) {
                const dx = pointer.x - node.x;
                const dy = pointer.y - node.y;
                const distance = Math.hypot(dx, dy);

                if (distance < pointer.radius && distance > 0) {
                    const influence = (1 - distance / pointer.radius) * 0.012;
                    node.vx += dx * influence;
                    node.vy += dy * influence;
                }
            }

            // Keep movement gentle and prevent pointer interaction from accelerating nodes.
            node.vx *= 0.995;
            node.vy *= 0.995;
            const speed = Math.hypot(node.vx, node.vy);
            const maxSpeed = 0.42;
            if (speed > maxSpeed) {
                node.vx = (node.vx / speed) * maxSpeed;
                node.vy = (node.vy / speed) * maxSpeed;
            }
        });
    }

    function drawNetwork(animate = true) {
        if (!context || !width || !height) return;

        context.clearRect(0, 0, width, height);

        if (animate) updateNodes();

        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];

            for (let j = i + 1; j < nodes.length; j += 1) {
                const other = nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const distance = Math.hypot(dx, dy);

                if (distance < connectionDistance) {
                    const opacity = (1 - distance / connectionDistance) * 0.22;
                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(other.x, other.y);
                    context.strokeStyle = `rgba(${nodeColor}, ${opacity})`;
                    context.lineWidth = 0.8;
                    context.stroke();
                }
            }

            if (pointer.x !== null) {
                const distanceToPointer = Math.hypot(pointer.x - node.x, pointer.y - node.y);
                if (distanceToPointer < pointer.radius) {
                    const opacity = (1 - distanceToPointer / pointer.radius) * 0.34;
                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(pointer.x, pointer.y);
                    context.strokeStyle = `rgba(${nodeColor}, ${opacity})`;
                    context.lineWidth = 0.9;
                    context.stroke();
                }
            }

            context.beginPath();
            context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            context.fillStyle = "rgba(130, 185, 245, 0.72)";
            context.fill();
        }
    }

    function stopAnimation() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }
    }

    function animate() {
        stopAnimation();

        if (reducedMotion.matches || !isVisible || !isPageVisible) {
            drawNetwork(false);
            return;
        }

        function frame() {
            drawNetwork(true);
            animationFrame = requestAnimationFrame(frame);
        }

        animationFrame = requestAnimationFrame(frame);
    }

    hero.addEventListener("pointermove", (event) => {
        const bounds = hero.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
    });

    hero.addEventListener("pointerleave", () => {
        pointer.x = null;
        pointer.y = null;
    });

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", () => {
        isPageVisible = !document.hidden;
        animate();
    });
    reducedMotion.addEventListener("change", animate);

    if ("IntersectionObserver" in window) {
        const networkObserver = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            animate();
        });
        networkObserver.observe(hero);
    }

    resizeCanvas();
    animate();
}



// ------------------------------------------------------------
// Projects network background and project-to-background-node interaction
// ------------------------------------------------------------

const projectsSection = document.querySelector(".projects");
const projectsCanvas = document.querySelector("#projects-network");

if (projectsSection && projectsCanvas) {
    const projectsContext = projectsCanvas.getContext("2d");
    const projectsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projectsPointer = { x: null, y: null, radius: 155 };
    const projectCards = [...projectsSection.querySelectorAll("#all-projects-grid .project-card")];

    let projectNodes = [];
    let projectWidth = 0;
    let projectHeight = 0;
    let projectAnimationFrame;
    let projectsVisible = true;
    let projectsPageVisible = !document.hidden;
    let activeProjectTarget = null;

    const projectConnectionDistance = 150;
    const projectNodeColor = "101, 165, 243";

    function createProjectNodes() {
        const area = projectWidth * projectHeight;
        const count = Math.max(28, Math.min(105, Math.round(area / 12500)));
        projectNodes = Array.from({ length: count }, () => ({
            x: Math.random() * projectWidth,
            y: Math.random() * projectHeight,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            radius: Math.random() * 1.35 + 1.05
        }));
    }

    function resizeProjectsCanvas() {
        const bounds = projectsSection.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        projectWidth = bounds.width;
        projectHeight = bounds.height;
        projectsCanvas.width = Math.round(projectWidth * pixelRatio);
        projectsCanvas.height = Math.round(projectHeight * pixelRatio);
        projectsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        createProjectNodes();
        drawProjectsNetwork(false);
    }

    function updateProjectNodes() {
        const movementScale = activeProjectTarget ? 0.68 : 1;
        projectNodes.forEach((node) => {
            node.x += node.vx * movementScale;
            node.y += node.vy * movementScale;
            if (node.x < -10) node.x = projectWidth + 10;
            if (node.x > projectWidth + 10) node.x = -10;
            if (node.y < -10) node.y = projectHeight + 10;
            if (node.y > projectHeight + 10) node.y = -10;

            if (projectsPointer.x !== null) {
                const dx = projectsPointer.x - node.x;
                const dy = projectsPointer.y - node.y;
                const distance = Math.hypot(dx, dy);
                if (distance < projectsPointer.radius && distance > 0) {
                    const influence = (1 - distance / projectsPointer.radius) * 0.01;
                    node.vx += dx * influence;
                    node.vy += dy * influence;
                }
            }
            node.vx *= 0.995;
            node.vy *= 0.995;
            const speed = Math.hypot(node.vx, node.vy);
            const maxSpeed = 0.38;
            if (speed > maxSpeed) {
                node.vx = (node.vx / speed) * maxSpeed;
                node.vy = (node.vy / speed) * maxSpeed;
            }
        });
    }

    function getCardCenter(card) {
        const cardBounds = card.getBoundingClientRect();
        const sectionBounds = projectsSection.getBoundingClientRect();
        return {
            x: cardBounds.left + cardBounds.width / 2 - sectionBounds.left,
            y: cardBounds.top + cardBounds.height / 2 - sectionBounds.top
        };
    }

    function getCardAnchor(card, node) {
        const cardBounds = card.getBoundingClientRect();
        const center = getCardCenter(card);
        const dx = node.x - center.x;
        const dy = node.y - center.y;
        const scale = Math.min(
            Math.abs(dx) > 0 ? (cardBounds.width * 0.42) / Math.abs(dx) : Infinity,
            Math.abs(dy) > 0 ? (cardBounds.height * 0.42) / Math.abs(dy) : Infinity
        );
        return { x: center.x + dx * scale, y: center.y + dy * scale };
    }

    function drawCardToNodeLinks(card, isActive) {
        if (!card || card.hidden) return;
        const center = getCardCenter(card);
        const nearbyNodes = projectNodes
            .map((node) => ({ node, distance: Math.hypot(node.x - center.x, node.y - center.y) }))
            .sort((a, b) => a.distance - b.distance);

        // A restrained, consistent number of connections keeps the card in focus.
        const connectedNodes = isActive
            ? nearbyNodes.slice(0, Math.min(3, nearbyNodes.length))
            : nearbyNodes.filter((entry) => entry.distance < 245).slice(0, 2);
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 850);

        connectedNodes.forEach(({ node, distance }) => {
            const anchor = getCardAnchor(card, node);
            const opacity = isActive ? 0.27 + pulse * 0.10 : 0.12;
            projectsContext.beginPath();
            projectsContext.moveTo(anchor.x, anchor.y);
            projectsContext.lineTo(node.x, node.y);
            projectsContext.strokeStyle = `rgba(${projectNodeColor}, ${opacity})`;
            projectsContext.lineWidth = isActive ? 1.05 : 0.7;
            projectsContext.shadowColor = isActive ? "rgba(57, 132, 214, 0.45)" : "transparent";
            projectsContext.shadowBlur = isActive ? 3 + pulse * 2 : 0;
            projectsContext.stroke();
            projectsContext.shadowBlur = 0;

            if (isActive) {
                projectsContext.beginPath();
                projectsContext.arc(node.x, node.y, node.radius + 1.7 + pulse * 0.7, 0, Math.PI * 2);
                projectsContext.strokeStyle = `rgba(135, 195, 255, ${0.34 + pulse * 0.16})`;
                projectsContext.lineWidth = 0.85;
                projectsContext.stroke();
            }
        });
    }

    function drawProjectsNetwork(animate = true) {
        if (!projectsContext || !projectWidth || !projectHeight) return;
        projectsContext.clearRect(0, 0, projectWidth, projectHeight);
        if (animate) updateProjectNodes();

        for (let i = 0; i < projectNodes.length; i += 1) {
            const node = projectNodes[i];
            for (let j = i + 1; j < projectNodes.length; j += 1) {
                const other = projectNodes[j];
                const distance = Math.hypot(node.x - other.x, node.y - other.y);
                if (distance < projectConnectionDistance) {
                    const opacity = (1 - distance / projectConnectionDistance) * 0.19;
                    projectsContext.beginPath();
                    projectsContext.moveTo(node.x, node.y);
                    projectsContext.lineTo(other.x, other.y);
                    projectsContext.strokeStyle = `rgba(${projectNodeColor}, ${opacity})`;
                    projectsContext.lineWidth = 0.8;
                    projectsContext.stroke();
                }
            }

            if (!activeProjectTarget && projectsPointer.x !== null) {
                const distance = Math.hypot(projectsPointer.x - node.x, projectsPointer.y - node.y);
                if (distance < projectsPointer.radius) {
                    const opacity = (1 - distance / projectsPointer.radius) * 0.3;
                    projectsContext.beginPath();
                    projectsContext.moveTo(node.x, node.y);
                    projectsContext.lineTo(projectsPointer.x, projectsPointer.y);
                    projectsContext.strokeStyle = `rgba(${projectNodeColor}, ${opacity})`;
                    projectsContext.lineWidth = 0.9;
                    projectsContext.stroke();
                }
            }

            projectsContext.beginPath();
            projectsContext.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            projectsContext.fillStyle = "rgba(130, 185, 245, 0.72)";
            projectsContext.fill();
        }

        // Every visible project connects to nearby background nodes. Hover/focus
        // strengthens only that card's links; projects never connect to each other.
        projectCards.forEach((card) => {
            if (!card.hidden) drawCardToNodeLinks(card, card === activeProjectTarget);
        });
    }

    function stopProjectsAnimation() {
        if (projectAnimationFrame) {
            cancelAnimationFrame(projectAnimationFrame);
            projectAnimationFrame = undefined;
        }
    }

    function animateProjectsNetwork() {
        stopProjectsAnimation();
        if (projectsReducedMotion.matches || !projectsVisible || !projectsPageVisible) {
            drawProjectsNetwork(false);
            return;
        }
        function frame() {
            drawProjectsNetwork(true);
            projectAnimationFrame = requestAnimationFrame(frame);
        }
        projectAnimationFrame = requestAnimationFrame(frame);
    }

    projectsSection.addEventListener("pointermove", (event) => {
        const bounds = projectsSection.getBoundingClientRect();
        projectsPointer.x = event.clientX - bounds.left;
        projectsPointer.y = event.clientY - bounds.top;
    });

    function setActiveProject(card) {
        if (activeProjectTarget === card) return;
        activeProjectTarget = card;
        projectCards.forEach((projectCard) => {
            projectCard.classList.toggle("is-network-active", projectCard === card);
        });

        // Keep the network alive while a card is active; updateProjectNodes()
        // simply reduces movement speed until the pointer/focus leaves the card.
        if (card) {
            if (!projectAnimationFrame) animateProjectsNetwork();
            else drawProjectsNetwork(false);
        } else {
            drawProjectsNetwork(false);
            animateProjectsNetwork();
        }
    }

    projectsSection.addEventListener("pointerleave", () => {
        projectsPointer.x = null;
        projectsPointer.y = null;
        setActiveProject(null);
    });

    projectCards.forEach((card) => {
        card.addEventListener("pointerenter", () => setActiveProject(card));
        card.addEventListener("pointerleave", (event) => {
            if (!card.contains(event.relatedTarget) && activeProjectTarget === card) setActiveProject(null);
        });
        card.addEventListener("focusin", () => setActiveProject(card));
        card.addEventListener("focusout", (event) => {
            if (!card.contains(event.relatedTarget) && activeProjectTarget === card) setActiveProject(null);
        });
    });

    document.querySelectorAll("[data-project-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            requestAnimationFrame(() => {
                if (activeProjectTarget && activeProjectTarget.hidden) setActiveProject(null);
                else drawProjectsNetwork(false);
            });
        });
    });

    window.addEventListener("resize", resizeProjectsCanvas);
    document.addEventListener("visibilitychange", () => {
        projectsPageVisible = !document.hidden;
        animateProjectsNetwork();
    });
    projectsReducedMotion.addEventListener("change", animateProjectsNetwork);

    if ("IntersectionObserver" in window) {
        const projectsNetworkObserver = new IntersectionObserver(([entry]) => {
            projectsVisible = entry.isIntersecting;
            animateProjectsNetwork();
        });
        projectsNetworkObserver.observe(projectsSection);
    }

    resizeProjectsCanvas();
    animateProjectsNetwork();
}


// Navigation
// ------------------------------------------------------------

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const nav = document.querySelector(".navbar");
const navToggle = document.querySelector(".nav-toggle");

function setMenuOpen(isOpen) {
    if (!nav || !navToggle) return;

    nav.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
}

if (nav && navToggle) {
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
}

if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
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

    sections.forEach((section) => navObserver.observe(section));
}

// ------------------------------------------------------------
// Featured project carousel
// ------------------------------------------------------------

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
            || projectSlides.length < 2
        ) return;

        autoAdvanceTimer = window.setInterval(() => {
            showProject(activeProject + 1);
        }, 6500);
    }

    function showProject(index) {
        if (!projectSlides.length) return;

        activeProject = (index + projectSlides.length) % projectSlides.length;

        projectSlides.forEach((slide, slideIndex) => {
            slide.hidden = slideIndex !== activeProject;
            slide.setAttribute(
                "aria-label",
                `${slideIndex + 1} of ${projectSlides.length}: ${slide.querySelector("h3").textContent}`
            );
            slide.classList.toggle("is-visible", slideIndex === activeProject);
        });

        projectDots.forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === activeProject));
        });

        if (projectCount) {
            projectCount.textContent = `${String(activeProject + 1).padStart(2, "0")} / ${String(projectSlides.length).padStart(2, "0")}`;
        }

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

    if ("IntersectionObserver" in window) {
        const carouselObserver = new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            updateAutoAdvance();
        });
        carouselObserver.observe(projectCarousel);
    }

    projectCarousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") showProject(activeProject + 1);
        if (event.key === "ArrowLeft") showProject(activeProject - 1);
    });

    showProject(0);
}

// ------------------------------------------------------------
// Project filters
// ------------------------------------------------------------

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
                filterButton.setAttribute("aria-pressed", String(filterButton === button));
            });

            const label = button.textContent.trim().toLowerCase();
            projectFilterStatus.textContent = category === "all"
                ? `Showing all ${totalProjects} projects.`
                : `Showing ${visibleProjects} ${label}.`;

        });
    });
}

// ------------------------------------------------------------
// Scroll reveal
// ------------------------------------------------------------

if (
    "IntersectionObserver" in window
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
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

// ------------------------------------------------------------
// Portfolio loader
// ------------------------------------------------------------

const portfolioLoader = document.querySelector("#portfolio-loader");

if (portfolioLoader) {
    const startedAt = performance.now();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimumDisplayTime = prefersReducedMotion ? 0 : 5000;

    const dismissPortfolioLoader = () => {
        if (portfolioLoader.classList.contains("is-hidden")) return;

        portfolioLoader.classList.add("is-hidden");
        window.setTimeout(() => portfolioLoader.remove(), 380);
    };

    const finishPortfolioLoading = () => {
        const elapsedTime = performance.now() - startedAt;
        const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);
        window.setTimeout(dismissPortfolioLoader, remainingTime);
    };

    if (document.readyState === "complete") {
        finishPortfolioLoading();
    } else {
        window.addEventListener("load", finishPortfolioLoading, { once: true });
    }
}

// ------------------------------------------------------------
// Custom Cursor
// ------------------------------------------------------------

const customCursorEnabled =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (customCursorEnabled) {
    const cursorDot = document.createElement("div");

    cursorDot.className = "custom-cursor-dot";
    cursorDot.setAttribute("aria-hidden", "true");

    document.body.append(cursorDot);
    document.body.classList.add("has-custom-cursor");

    const particleCount = 10;
    const particles = [];

    const mouse = {
        x: 0,
        y: 0,
        active: false,
        hovering: false,
        speed: 0,
        lastMoveTime: 0
    };

    let animationFrame;

    // Create trail particles.
    for (let i = 0; i < particleCount; i += 1) {
        const particle = document.createElement("div");

        particle.className = "custom-cursor-particle";
        particle.setAttribute("aria-hidden", "true");

        const size = 5 - i * 0.35;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        document.body.append(particle);

        particles.push({
            element: particle,
            x: 0,
            y: 0,
            opacity: 0
        });
    }

    const interactiveSelector = [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "summary",
        "[role='button']",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    function animateCursor() {
        const dx = mouse.x - (particles[0]?.x ?? mouse.x);
        const dy = mouse.y - (particles[0]?.y ?? mouse.y);
    
        // Calculate cursor movement speed.
        const cursorSpeed = Math.sqrt(dx * dx + dy * dy);
    
        // Faster movement produces faster fading.
        const speedFade = Math.min(cursorSpeed / 25, 0.8);
    
        particles.forEach((particle, index) => {
            const previous = index === 0
                ? mouse
                : particles[index - 1];
    
            // Each particle follows the one ahead of it.
            const followSpeed = 0.38 - index * 0.025;
    
            particle.x += (previous.x - particle.x) * followSpeed;
            particle.y += (previous.y - particle.y) * followSpeed;
    
            // Measure distance from the cursor.
            const distanceX = mouse.x - particle.x;
            const distanceY = mouse.y - particle.y;
            const distance = Math.sqrt(
                distanceX * distanceX + distanceY * distanceY
            );
    
            // Fade particles based on speed and distance.
            const maxDistance = 200;
            const distanceFade = Math.max(
                0,
                1 - distance / maxDistance
            );
    
            const targetOpacity =
                mouse.active
                    ? (1 - index / particleCount)
                        * distanceFade
                        * (1 - speedFade)
                    : 0;
    
            const fadeSpeed = targetOpacity < particle.opacity
                ? 0.18
                : 0.08;
    
            particle.opacity +=
                (targetOpacity - particle.opacity) * fadeSpeed;
    
            particle.element.style.transform =
                `translate3d(${particle.x}px, ${particle.y}px, 0) translate(-50%, -50%)`;
    
            particle.element.style.opacity = particle.opacity;
        });
    
        if (
            mouse.active ||
            particles.some(particle => particle.opacity > 0.01)
        ) {
            animationFrame = requestAnimationFrame(animateCursor);
        } else {
            animationFrame = undefined;
        }
    }

    function startAnimation() {
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(animateCursor);
        }
    }

    document.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
    
        const now = event.timeStamp;
    
        if (mouse.lastMoveTime) {
            const elapsed = Math.max(now - mouse.lastMoveTime, 1);
    
            const distance = Math.hypot(
                event.clientX - mouse.x,
                event.clientY - mouse.y
            );
    
            const instantSpeed = Math.min(distance / elapsed / 1.2, 1);
    
            mouse.speed = Math.max(mouse.speed * 0.65, instantSpeed);
        }
    
        mouse.lastMoveTime = now;
    
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.active = true;
    
        cursorDot.style.transform =
            `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
    
        cursorDot.classList.add("is-visible");
    
        startAnimation();
    });

    document.addEventListener("pointerover", (event) => {
        if (event.pointerType !== "mouse") return;

        const target = event.target;

        if (!(target instanceof Element)) return;

        mouse.hovering = Boolean(target.closest(interactiveSelector));

        cursorDot.classList.toggle("is-hovering", mouse.hovering);
    });

    document.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse") return;

        cursorDot.classList.add("is-clicking");
    });

    document.addEventListener("pointerup", () => {
        cursorDot.classList.remove("is-clicking");
    });

    function hideCursor() {
        mouse.active = false;
        mouse.hovering = false;

        cursorDot.classList.remove("is-visible", "is-hovering", "is-clicking");

        startAnimation();
    }

    document.addEventListener("pointerout", (event) => {
        if (event.relatedTarget === null) {
            hideCursor();
        }
    });

    window.addEventListener("blur", hideCursor);
}