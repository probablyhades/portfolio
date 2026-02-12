/**
 * Works Page JavaScript
 * Loads all works with role filtering
 */

import {
    fetchWorks,
    filterPublishedWorks,
    getUniqueRoles,
    filterWorksByRole,
    getWorkImages,
    getWorkCoverImage
} from './api.js';

// DOM Elements
const worksGrid = document.getElementById('works-grid');
const filterPills = document.getElementById('filter-pills');
const worksEmpty = document.getElementById('works-empty');
const clearFilterBtn = document.getElementById('clear-filter');
const nav = document.getElementById('nav');

// State
let allWorks = [];
let currentFilter = 'all';

/**
 * Create a work card element
 * @param {Object} work - Work data from Craft API
 * @returns {HTMLElement} Work card element
 */
function createWorkCard(work) {
    const card = document.createElement('a');
    card.href = `work.html?id=${work.id}`;
    card.className = 'work-card';
    card.dataset.roles = JSON.stringify(work.properties?.roles || []);

    // Get cover image or fallback to first gallery image
    const coverImage = getWorkCoverImage(work);
    const galleryImages = getWorkImages(work);
    const imageUrl = coverImage || galleryImages[0] || 'assets/images/placeholder.jpg';

    // Get work title
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
 * Create filter pill buttons
 * @param {Array} roles - Unique roles
 */
function createFilterPills(roles) {
    // Keep the "All" button, add role buttons
    roles.forEach(role => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.dataset.role = role;
        pill.textContent = role;
        filterPills.appendChild(pill);
    });
}

/**
 * Handle filter click
 * @param {string} role - Selected role
 */
function handleFilter(role) {
    currentFilter = role;

    // Update active state
    filterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.role === role);
    });

    // Filter works
    const filteredWorks = filterWorksByRole(allWorks, role);

    // Animate out current cards
    const currentCards = worksGrid.querySelectorAll('.work-card');
    currentCards.forEach(card => card.classList.add('hiding'));

    // After animation, update grid
    setTimeout(() => {
        renderWorks(filteredWorks);
    }, 250);
}

/**
 * Render works to grid
 * @param {Array} works - Works to display
 */
function renderWorks(works) {
    worksGrid.innerHTML = '';

    if (works.length === 0) {
        worksEmpty.style.display = 'block';
        return;
    }

    worksEmpty.style.display = 'none';

    works.forEach((work, index) => {
        const card = createWorkCard(work);
        card.classList.add('showing');
        card.style.animationDelay = `${index * 50}ms`;
        worksGrid.appendChild(card);
    });
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
 * Load all works from API
 */
async function loadWorks() {
    try {
        // Show loading state
        renderSkeletons(6);

        // Fetch works from API
        const works = await fetchWorks();

        // Filter to only published works
        allWorks = filterPublishedWorks(works);

        if (allWorks.length === 0) {
            worksGrid.innerHTML = '';
            worksEmpty.style.display = 'block';
            worksEmpty.querySelector('p').textContent = 'No works available yet. Check back soon!';
            worksEmpty.querySelector('button').style.display = 'none';
            return;
        }

        // Get unique roles and create filter pills
        const roles = getUniqueRoles(allWorks);
        createFilterPills(roles);

        // Render initial works
        renderWorks(allWorks);

    } catch (error) {
        console.error('Failed to load works:', error);
        worksGrid.innerHTML = '';
        worksEmpty.style.display = 'block';
        worksEmpty.querySelector('p').textContent = 'Unable to load works. Please try again later.';
        worksEmpty.querySelector('button').style.display = 'none';
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

// Event Listeners
filterPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-pill')) {
        // Brief press animation
        e.target.style.transform = 'scale(0.93)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
        handleFilter(e.target.dataset.role);
    }
});

clearFilterBtn.addEventListener('click', () => {
    handleFilter('all');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWorks();

    // Handle scroll for nav
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Scroll reveal observer for works header and grid
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.works-header, .filter-section').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
});
