/**
 * Sky navigation — the five clouds are the site's nav.
 *
 * Clicking a cloud flies the whole sky layer into it (PowerPoint "Zoom to
 * shape") and reveals that section in a frosted panel. Every open/close goes
 * through the URL hash, so cloud clicks, browser Back/Forward and pasted
 * links all take the same code path.
 */

const SECTIONS = ["about", "portfolio", "resume", "contacts", "feedback"];

/** Keep in sync with --zoom-ms / the overlay fade in styles.css. */
const ZOOM_MS = 1000;
const CLOSE_MS = 620;
/** A cloud is ~300px wide, so an uncapped fit-to-viewport scale gets absurd. */
const MAX_SCALE = 8;

const FOCUSABLE = [
    "a[href]", "button:not([disabled])", "input:not([disabled])",
    "textarea:not([disabled])", "select:not([disabled])", "[tabindex]:not([tabindex='-1'])"
].join(",");

document.addEventListener("DOMContentLoaded", () => {
    const sky = document.getElementById("sky");
    const stage = document.getElementById("skyStage");
    const overlay = document.getElementById("sectionOverlay");
    const panel = document.getElementById("sectionPanel");
    const scroller = document.getElementById("sectionScroll");
    const backButton = document.getElementById("backButton");

    if (!sky || !stage || !overlay || !panel || !scroller || !backButton) {
        console.error("skyNav: required elements missing from the DOM; cloud navigation is disabled.");
        return;
    }

    const clouds = Array.from(document.querySelectorAll(".sky-cloud"));
    const panes = Array.from(document.querySelectorAll(".section-content"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let current = null;         // section id currently open, or null for the sky
    let lastFocus = null;       // cloud to hand focus back to on close
    let navigatedInApp = false; // false until we push our first hash
    let closeTimer = null;

    const cloudFor = (id) => clouds.find((c) => c.dataset.section === id) || null;
    const paneFor = (id) => panes.find((p) => p.dataset.section === id) || null;

    function idFromHash() {
        const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
        return SECTIONS.includes(raw) ? raw : null;
    }

    /**
     * Maps the clicked cloud's centre onto the viewport centre while scaling
     * about it, so the sky flies *into* that cloud.
     *
     * With transform-origin at the stage centre (which fills the viewport),
     * `scale(S) translate(t)` sends point p to S*(p - c) + c + S*t. Solving
     * for the cloud centre landing on c gives t = c - cloudCentre.
     */
    function zoomTransform(cloud) {
        const r = cloud.getBoundingClientRect();
        if (!r.width || !r.height) return null;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scale = Math.min(MAX_SCALE, Math.max(vw / r.width, vh / r.height));
        const tx = vw / 2 - (r.left + r.width / 2);
        const ty = vh / 2 - (r.top + r.height / 2);

        return `scale(${scale.toFixed(3)}) translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
    }

    function showPane(id) {
        const pane = paneFor(id);
        if (!pane) return false;

        panes.forEach((p) => { p.hidden = p !== pane; });

        const heading = pane.querySelector("h1");
        if (heading && heading.id) panel.setAttribute("aria-labelledby", heading.id);
        scroller.scrollTop = 0;
        return true;
    }

    function openSection(id, animate) {
        if (!showPane(id)) return;

        // Already open on another section: just swap the pane. Re-running the
        // zoom would measure a cloud that the stage transform has already moved.
        if (current) {
            current = id;
            return;
        }

        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }

        const cloud = cloudFor(id);
        if (cloud) lastFocus = cloud;

        // A cold deep link has no cloud on screen to fly from, so it lands
        // straight on the panel with no zoom.
        if (animate && cloud && !reduceMotion.matches) {
            clouds.forEach((c) => c.classList.toggle("is-target", c === cloud));
            const transform = zoomTransform(cloud);
            if (transform) stage.style.transform = transform;
        }
        document.body.classList.add("is-zooming");

        overlay.hidden = false;
        void overlay.offsetWidth; // commit the un-hide before transitioning
        overlay.classList.add("is-open");

        sky.setAttribute("aria-hidden", "true");
        sky.inert = true;

        current = id;
        backButton.focus({ preventScroll: true });
    }

    function closeSection() {
        if (!current) return;

        overlay.classList.remove("is-open");
        document.body.classList.remove("is-zooming");
        stage.style.transform = "";
        clouds.forEach((c) => c.classList.remove("is-target"));

        sky.removeAttribute("aria-hidden");
        sky.inert = false;

        const restore = lastFocus;
        current = null;

        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            overlay.hidden = true;
            closeTimer = null;
        }, reduceMotion.matches ? 0 : CLOSE_MS);

        if (restore) restore.focus({ preventScroll: true });
    }

    /** Single source of truth: the hash decides what's open. */
    function sync(animate) {
        const id = idFromHash();
        if (id === current) return;
        if (id) openSection(id, animate);
        else closeSection();
    }

    /**
     * Browser Back is the natural way out, but only if we're the ones who put
     * the section on the history stack. A visitor who landed directly on
     * /#resume would otherwise be ejected from the site.
     */
    function goBack() {
        if (navigatedInApp) {
            history.back();
        } else {
            history.replaceState(null, "", location.pathname + location.search);
            closeSection();
        }
    }

    clouds.forEach((cloud) => {
        cloud.addEventListener("click", () => {
            const id = cloud.dataset.section;
            if (!SECTIONS.includes(id)) return;

            navigatedInApp = true;
            if (location.hash.replace(/^#/, "") === id) sync(true);
            else location.hash = id;
        });
    });

    backButton.addEventListener("click", goBack);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) goBack();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && current) {
            event.preventDefault();
            goBack();
        }
    });

    // Keep Tab inside the panel while it's open. `inert` on .sky covers this in
    // modern browsers; this is the fallback and also guards the overlay itself.
    panel.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;

        const items = Array.from(panel.querySelectorAll(FOCUSABLE))
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // Sand props animate on :hover, which touch devices don't have. Tapping
    // one adds .is-playing to run the same keyframes, cleared on animationend
    // so the next tap replays it. They are decorative and live inside the
    // aria-hidden backdrop, so they are deliberately not focusable — a
    // focusable element inside aria-hidden is worse than an unreachable
    // easter egg.
    document.querySelectorAll(".beach-props .prop").forEach((prop) => {
        const play = () => {
            if (prop.classList.contains("is-playing")) return;
            prop.classList.add("is-playing");
        };
        prop.addEventListener("pointerdown", (event) => {
            if (event.pointerType !== "mouse") play();
        });
        prop.addEventListener("animationend", () => prop.classList.remove("is-playing"));
    });

    window.addEventListener("hashchange", () => sync(true));

    // A resize invalidates the stored zoom, but the clouds are hidden while the
    // panel is open — so drop the transform silently and let the close just fade.
    window.addEventListener("resize", () => {
        if (!current) return;
        stage.style.transition = "none";
        stage.style.transform = "";
        requestAnimationFrame(() => { stage.style.transition = ""; });
    });

    sync(false);
});
