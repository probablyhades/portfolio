/**
 * Custom Cursor
 * A dual-element cursor (dot + ring) that reacts to interactive elements.
 * Automatically disabled on touch devices.
 */

(function () {
    // Skip on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    // Create cursor elements
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // Track mouse position
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;

    // Smooth follow for the ring
    function animate() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

        requestAnimationFrame(animate);
    }
    animate();

    // Update position on mouse move
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            dot.classList.add('cursor--visible');
            ring.classList.add('cursor--visible');
        }
    });

    // Hide when mouse leaves window
    document.addEventListener('mouseleave', () => {
        isVisible = false;
        dot.classList.remove('cursor--visible');
        ring.classList.remove('cursor--visible');
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        dot.classList.add('cursor--visible');
        ring.classList.add('cursor--visible');
    });

    // --- Element reactions ---

    // Selectors for interactive elements
    const hoverSelectors = 'a, button, .btn, .work-card, .filter-pill, .work-gallery__image, .lightbox__nav, .lightbox__close, input, textarea, select';

    // Use event delegation for hover states
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest(hoverSelectors);
        if (target) {
            ring.classList.add('cursor-ring--hover');
            dot.classList.add('cursor-dot--hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest(hoverSelectors);
        if (target) {
            ring.classList.remove('cursor-ring--hover');
            dot.classList.remove('cursor-dot--hover');
        }
    });

    // Mousedown/up press effect
    document.addEventListener('mousedown', () => {
        ring.classList.add('cursor-ring--press');
        dot.classList.add('cursor-dot--press');
    });

    document.addEventListener('mouseup', () => {
        ring.classList.remove('cursor-ring--press');
        dot.classList.remove('cursor-dot--press');
    });

    // Text cursor detection
    const textSelectors = 'p, h1, h2, h3, h4, h5, h6, span, li, blockquote, cite, label';

    document.addEventListener('mouseover', (e) => {
        // Only trigger for text elements that are NOT also interactive
        if (e.target.matches(textSelectors) && !e.target.closest(hoverSelectors)) {
            ring.classList.add('cursor-ring--text');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.matches(textSelectors)) {
            ring.classList.remove('cursor-ring--text');
        }
    });

    // Hide custom cursor when inside iframes (YouTube embeds, etc.)
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.addEventListener('mouseenter', () => {
            dot.classList.remove('cursor--visible');
            ring.classList.remove('cursor--visible');
        });
        iframe.addEventListener('mouseleave', () => {
            dot.classList.add('cursor--visible');
            ring.classList.add('cursor--visible');
        });
    });

    // Also handle dynamically added iframes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'IFRAME') {
                    node.addEventListener('mouseenter', () => {
                        dot.classList.remove('cursor--visible');
                        ring.classList.remove('cursor--visible');
                    });
                    node.addEventListener('mouseleave', () => {
                        dot.classList.add('cursor--visible');
                        ring.classList.add('cursor--visible');
                    });
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Hide native cursor site-wide
    document.documentElement.classList.add('custom-cursor-active');
})();
