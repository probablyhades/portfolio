/**
 * Custom Reactive Cursor
 * Dot + Ring cursor that responds to interactive elements
 * Auto-disables on touch devices
 */

class CustomCursor {
    constructor() {
        // Skip on touch devices
        if (this.isTouchDevice()) return;

        this.dot = null;
        this.ring = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.ringX = 0;
        this.ringY = 0;
        this.isHovering = false;
        this.isClicking = false;
        this.isHidden = false;
        this.lerp = 0.15;

        this.init();
    }

    isTouchDevice() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches
        );
    }

    init() {
        this.createElements();
        this.bindEvents();
        this.animate();
        document.body.classList.add('has-custom-cursor');
    }

    createElements() {
        // Dot
        this.dot = document.createElement('div');
        this.dot.className = 'cursor-dot';
        document.body.appendChild(this.dot);

        // Ring
        this.ring = document.createElement('div');
        this.ring.className = 'cursor-ring';
        document.body.appendChild(this.ring);
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            // Show cursor on first move
            if (this.isHidden) {
                this.dot.style.opacity = '1';
                this.ring.style.opacity = '1';
                this.isHidden = false;
            }
        });

        document.addEventListener('mousedown', () => {
            this.isClicking = true;
            this.dot.classList.add('cursor-dot--clicking');
            this.ring.classList.add('cursor-ring--clicking');
        });

        document.addEventListener('mouseup', () => {
            this.isClicking = false;
            this.dot.classList.remove('cursor-dot--clicking');
            this.ring.classList.remove('cursor-ring--clicking');
        });

        document.addEventListener('mouseleave', () => {
            this.dot.style.opacity = '0';
            this.ring.style.opacity = '0';
            this.isHidden = true;
        });

        document.addEventListener('mouseenter', () => {
            this.dot.style.opacity = '1';
            this.ring.style.opacity = '1';
            this.isHidden = false;
        });

        // Delegate hover detection
        this.setupHoverDetection();
    }

    setupHoverDetection() {
        const interactiveSelectors = [
            'a', 'button', '.btn', '.work-card',
            '.work-gallery__image', '.filter-pill',
            '.lightbox__nav', '.lightbox__close',
            'iframe'
        ];

        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest(interactiveSelectors.join(','));
            if (target) {
                this.ring.classList.add('cursor-ring--hover');
                this.dot.classList.add('cursor-dot--hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest(interactiveSelectors.join(','));
            if (target) {
                // Only remove if we're not entering another interactive element
                const relatedTarget = e.relatedTarget?.closest?.(interactiveSelectors.join(','));
                if (!relatedTarget) {
                    this.ring.classList.remove('cursor-ring--hover');
                    this.dot.classList.remove('cursor-dot--hover');
                }
            }
        });
    }

    animate() {
        // Lerp ring position towards mouse
        this.ringX += (this.mouseX - this.ringX) * this.lerp;
        this.ringY += (this.mouseY - this.ringY) * this.lerp;

        // Dot follows exactly
        this.dot.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px)`;
        this.ring.style.transform = `translate(${this.ringX}px, ${this.ringY}px)`;

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CustomCursor());
} else {
    new CustomCursor();
}
