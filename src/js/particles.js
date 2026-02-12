/**
 * Particle Animation System
 * Lightweight canvas-based constellation effect for the hero section
 */

const PARTICLE_CONFIG = {
    count: 55,
    color: '255, 85, 0',        // accent orange RGB
    maxSize: 2.5,
    minSize: 0.8,
    speed: 0.3,
    connectionDistance: 140,
    connectionOpacity: 0.15,
    mouseRadius: 120,
    mouseForce: 0.02,
};

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = PARTICLE_CONFIG.minSize + Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
        this.speedX = (Math.random() - 0.5) * PARTICLE_CONFIG.speed;
        this.speedY = (Math.random() - 0.5) * PARTICLE_CONFIG.speed;
        this.opacity = 0.2 + Math.random() * 0.5;
        this.pulseSpeed = 0.005 + Math.random() * 0.01;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(mouseX, mouseY, frame) {
        // Pulse opacity
        this.opacity = 0.25 + Math.sin(frame * this.pulseSpeed + this.pulseOffset) * 0.2;

        // Mouse interaction
        if (mouseX !== null && mouseY !== null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < PARTICLE_CONFIG.mouseRadius) {
                const force = (PARTICLE_CONFIG.mouseRadius - dist) / PARTICLE_CONFIG.mouseRadius;
                this.speedX += (dx / dist) * force * PARTICLE_CONFIG.mouseForce;
                this.speedY += (dy / dist) * force * PARTICLE_CONFIG.mouseForce;
            }
        }

        // Dampen speed
        this.speedX *= 0.99;
        this.speedY *= 0.99;

        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x < -10) this.x = this.canvas.width + 10;
        if (this.x > this.canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = this.canvas.height + 10;
        if (this.y > this.canvas.height + 10) this.y = -10;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PARTICLE_CONFIG.color}, ${this.opacity})`;
        ctx.fill();
    }
}

export class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = null;
        this.mouseY = null;
        this.frame = 0;
        this.isVisible = true;
        this.animationId = null;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.observeVisibility();
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
            // Use display dimensions for particle positioning
            const p = new Particle({ width: this.displayWidth, height: this.displayHeight });
            this.particles.push(p);
        }
    }

    bindEvents() {
        // Throttled resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.particles.forEach(p => {
                    p.canvas = { width: this.displayWidth, height: this.displayHeight };
                });
            }, 200);
        });

        // Mouse tracking relative to canvas
        this.canvas.parentElement.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.parentElement.addEventListener('mouseleave', () => {
            this.mouseX = null;
            this.mouseY = null;
        });
    }

    observeVisibility() {
        const observer = new IntersectionObserver((entries) => {
            this.isVisible = entries[0].isIntersecting;
            if (this.isVisible && !this.animationId) {
                this.animate();
            }
        }, { threshold: 0.05 });

        observer.observe(this.canvas);
    }

    drawConnections() {
        const { connectionDistance, connectionOpacity, color } = PARTICLE_CONFIG;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    const opacity = connectionOpacity * (1 - dist / connectionDistance);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(${color}, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }

        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

        this.particles.forEach(p => {
            p.update(this.mouseX, this.mouseY, this.frame);
            p.draw(this.ctx);
        });

        this.drawConnections();
        this.frame++;

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}
