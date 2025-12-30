/**
 * Landing Page JavaScript
 * Loads recent works and handles animations
 */

import {
    fetchWorks,
    filterPublishedWorks,
    getLatestWorks,
    getWorkImages
} from './api.js';

// DOM Elements
const worksGrid = document.getElementById('works-grid');
const nav = document.getElementById('nav');

/**
 * Create a work card element
 * @param {Object} work - Work data from Craft API
 * @returns {HTMLElement} Work card element
 */
function createWorkCard(work) {
    const card = document.createElement('a');
    card.href = `work.html?id=${work.id}`;
    card.className = 'work-card';

    // Get first image or use placeholder
    const images = getWorkImages(work);
    const imageUrl = images[0] || 'assets/images/placeholder.jpg';

    // Get work title - use 'production' field from API or fallback to title
    const title = work.production || work.title || 'Untitled Work';

    // Get metadata
    const year = work.properties?.year_of_release || '';
    const client = work.properties?.client || '';
    const roles = work.properties?.roles || [];

    card.innerHTML = `
    <img src="${imageUrl}" alt="${title}" class="work-card__image" loading="lazy">
    <div class="work-card__overlay">
      <h3 class="work-card__title">${title}</h3>
      <div class="work-card__meta">
        ${year ? `<span>${year}</span>` : ''}
        ${client ? `<span>${client}</span>` : ''}
      </div>
      ${roles.length > 0 ? `
        <div class="work-card__roles">
          ${roles.map(role => `<span class="work-card__role">${role}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

    return card;
}

/**
 * Render skeleton loading cards
 * @param {number} count - Number of skeleton cards
 */
function renderSkeletons(count) {
    worksGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton skeleton--card';
        worksGrid.appendChild(skeleton);
    }
}

/**
 * Load and display recent works
 */
async function loadRecentWorks() {
    try {
        // Show loading state
        renderSkeletons(4);

        // Fetch works from API
        const allWorks = await fetchWorks();

        // Filter to only published works
        const publishedWorks = filterPublishedWorks(allWorks);

        // Get latest 4
        const recentWorks = getLatestWorks(publishedWorks, 4);

        // Clear loading state
        worksGrid.innerHTML = '';

        if (recentWorks.length === 0) {
            worksGrid.innerHTML = `
        <div class="works-empty">
          <p>No works available yet. Check back soon!</p>
        </div>
      `;
            return;
        }

        // Add stagger class for animation
        worksGrid.classList.add('stagger');

        // Create and append work cards
        recentWorks.forEach(work => {
            const card = createWorkCard(work);
            worksGrid.appendChild(card);
        });

        // Trigger stagger animation
        setTimeout(() => {
            worksGrid.classList.add('animate');
        }, 100);

    } catch (error) {
        console.error('Failed to load works:', error);
        worksGrid.innerHTML = `
      <div class="works-empty">
        <p>Unable to load works. Please try again later.</p>
      </div>
    `;
    }
}

/**
 * Handle scroll events for navigation styling
 */
function handleScroll() {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

/**
 * Initialize intersection observer for scroll animations
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements with stagger class
    document.querySelectorAll('.stagger').forEach(el => {
        observer.observe(el);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRecentWorks();
    initScrollAnimations();

    // Handle scroll for nav
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
});
