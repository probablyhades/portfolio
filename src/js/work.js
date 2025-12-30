/**
 * Work Detail Page JavaScript
 * Loads individual work data and renders the page
 */

import {
    fetchWorks,
    filterPublishedWorks,
    getWorkById,
    getWorkDescription,
    getWorkImages,
    getWorkVideo,
    getYouTubeEmbedUrl
} from './api.js';

// DOM Elements
const workLoading = document.getElementById('work-loading');
const workPage = document.getElementById('work-page');
const workError = document.getElementById('work-error');
const workHeroMedia = document.getElementById('work-hero-media');
const workTitle = document.getElementById('work-title');
const workMeta = document.getElementById('work-meta');
const workRoles = document.getElementById('work-roles');
const workDescriptionSection = document.getElementById('work-description');
const workDescriptionText = document.getElementById('work-description-text');
const workGallery = document.getElementById('work-gallery');
const workGalleryGrid = document.getElementById('work-gallery-grid');

/**
 * Get work ID from URL query parameter
 * @returns {string|null} Work ID or null
 */
function getWorkIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Update page title and meta
 * @param {Object} work - Work data
 */
function updatePageMeta(work) {
    const title = work.production || work.title || 'Work';
    document.title = `${title} | Harry - Film & Video Production`;

    // Update meta description
    const description = getWorkDescription(work);
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
        metaDesc.content = description.substring(0, 160) + '...';
    }
}

/**
 * Render hero section with video or image
 * @param {Object} work - Work data
 */
function renderHero(work) {
    const videoUrl = getWorkVideo(work);
    const images = getWorkImages(work);

    if (videoUrl) {
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (embedUrl) {
            workHeroMedia.innerHTML = `
        <iframe 
          src="${embedUrl}?autoplay=0&rel=0&modestbranding=1" 
          title="${work.production || work.title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
        ></iframe>
      `;
            return;
        }
    }

    // Fallback to first image
    if (images.length > 0) {
        workHeroMedia.innerHTML = `
      <img src="${images[0]}" alt="${work.production || work.title}" loading="eager">
    `;
    } else {
        // No media - hide hero or show placeholder
        document.getElementById('work-hero').style.display = 'none';
        document.querySelector('.work-header').style.marginTop = '80px';
    }
}

/**
 * Render work header info
 * @param {Object} work - Work data
 */
function renderHeader(work) {
    const title = work.production || work.title || 'Untitled Work';
    workTitle.textContent = title;

    // Meta info
    const year = work.properties?.year_of_release;
    const client = work.properties?.client;
    const genres = work.properties?.genre || [];

    let metaHTML = '';

    if (year) {
        metaHTML += `
      <div class="work-header__meta-item">
        <span class="work-header__meta-label">Year</span>
        <span class="work-header__meta-value">${year}</span>
      </div>
    `;
    }

    if (client) {
        metaHTML += `
      <div class="work-header__meta-item">
        <span class="work-header__meta-label">Client</span>
        <span class="work-header__meta-value">${client}</span>
      </div>
    `;
    }

    if (genres.length > 0) {
        metaHTML += `
      <div class="work-header__meta-item">
        <span class="work-header__meta-label">Genre</span>
        <span class="work-header__meta-value">${genres.join(', ')}</span>
      </div>
    `;
    }

    workMeta.innerHTML = metaHTML;

    // Roles
    const roles = work.properties?.roles || [];
    if (roles.length > 0) {
        workRoles.innerHTML = roles
            .map(role => `<span class="work-header__role">${role}</span>`)
            .join('');
    } else {
        workRoles.style.display = 'none';
    }
}

/**
 * Render work description
 * @param {Object} work - Work data
 */
function renderDescription(work) {
    const description = getWorkDescription(work);

    if (description) {
        workDescriptionText.textContent = description;
    } else {
        workDescriptionSection.style.display = 'none';
    }
}

/**
 * Render image gallery
 * @param {Object} work - Work data
 */
function renderGallery(work) {
    const images = getWorkImages(work);

    if (images.length === 0) {
        workGallery.style.display = 'none';
        return;
    }

    workGalleryGrid.innerHTML = images
        .map((url, index) => `
      <img 
        src="${url}" 
        alt="Gallery image ${index + 1}" 
        class="work-gallery__image"
        loading="lazy"
        data-index="${index}"
      >
    `)
        .join('');

    // Add lightbox functionality
    initLightbox(images);
}

/**
 * Initialize lightbox for gallery
 * @param {Array<string>} images - Image URLs
 */
function initLightbox(images) {
    // Create lightbox element
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close lightbox">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <img src="" alt="" class="lightbox__image">
  `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.lightbox__image');
    const closeBtn = lightbox.querySelector('.lightbox__close');

    // Open lightbox on image click
    workGalleryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('work-gallery__image')) {
            const index = parseInt(e.target.dataset.index);
            lightboxImage.src = images[index];
            lightboxImage.alt = `Gallery image ${index + 1}`;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

/**
 * Show error state
 */
function showError() {
    workLoading.style.display = 'none';
    workPage.style.display = 'none';
    workError.style.display = 'flex';
}

/**
 * Load and render work
 */
async function loadWork() {
    const workId = getWorkIdFromUrl();

    if (!workId) {
        showError();
        return;
    }

    try {
        // Fetch all works
        const allWorks = await fetchWorks();
        const publishedWorks = filterPublishedWorks(allWorks);

        // Find the specific work
        const work = getWorkById(publishedWorks, workId);

        if (!work) {
            showError();
            return;
        }

        // Update page meta
        updatePageMeta(work);

        // Render all sections
        renderHero(work);
        renderHeader(work);
        renderDescription(work);
        renderGallery(work);

        // Show page, hide loading
        workLoading.style.display = 'none';
        workPage.style.display = 'block';

    } catch (error) {
        console.error('Failed to load work:', error);
        showError();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadWork);
