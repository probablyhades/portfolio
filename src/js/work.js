/**
 * Work Detail Page JavaScript
 * Loads individual work data and renders the page
 */

import {
    fetchWorks,
    filterPublishedWorks,
    getWorkById,
    getWorkDescription,
    getWorkChallenge,
    getWorkResult,
    getWorkImages,
    getWorkVideo,
    getYouTubeEmbedUrl,
    getWorkCoverImage,
    getWorkVideoUrl,
    getWorkOtherCredits,
    getWorkTestimonials,
    getWorkBlogUrl
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
 * Render hero section with video (prioritized) or cover image
 * @param {Object} work - Work data
 */
function renderHero(work) {
    // Prioritize video from properties, then fall back to content-based video
    const videoUrl = getWorkVideoUrl(work);
    const coverImage = getWorkCoverImage(work);
    const images = getWorkImages(work);

    if (videoUrl) {
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (embedUrl) {
            // Add video modifier class for proper aspect-ratio layout
            document.getElementById('work-hero').classList.add('work-hero--video');
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

    // Fallback to cover image or first gallery image
    const heroImage = coverImage || (images.length > 0 ? images[0] : null);
    if (heroImage) {
        workHeroMedia.innerHTML = `
      <img src="${heroImage}" alt="${work.production || work.title}" loading="eager">
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
 * Convert basic markdown (bold, italic) to HTML
 * @param {string} text - Text with markdown formatting
 * @returns {string} HTML string with formatting applied
 */
function markdownToHtml(text) {
    if (!text) return '';

    // Escape HTML entities first to prevent XSS
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert markdown formatting (order matters: bold+italic first)
    html = html
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')  // ***bold italic***
        .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')        // ___bold italic___
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')               // **bold**
        .replace(/__(.+?)__/g, '<strong>$1</strong>')                   // __bold__
        .replace(/\*(.+?)\*/g, '<em>$1</em>')                           // *italic*
        .replace(/_(.+?)_/g, '<em>$1</em>');                            // _italic_

    return html;
}

/**
 * Render work description
 * @param {Object} work - Work data
 */
function renderDescription(work) {
    const description = getWorkDescription(work);

    if (description) {
        workDescriptionText.innerHTML = markdownToHtml(description);
    } else {
        workDescriptionSection.style.display = 'none';
    }
}

/**
 * Render challenge section
 * @param {Object} work - Work data
 */
function renderChallenge(work) {
    const challenge = getWorkChallenge(work);
    const challengeSection = document.getElementById('work-challenge');
    const challengeText = document.getElementById('work-challenge-text');

    if (!challengeSection) return;

    if (challenge) {
        challengeText.innerHTML = markdownToHtml(challenge);
        challengeSection.style.display = 'block';
    } else {
        challengeSection.style.display = 'none';
    }
}

/**
 * Render result section
 * @param {Object} work - Work data
 */
function renderResult(work) {
    const result = getWorkResult(work);
    const resultSection = document.getElementById('work-result');
    const resultText = document.getElementById('work-result-text');

    if (!resultSection) return;

    if (result) {
        resultText.innerHTML = markdownToHtml(result);
        resultSection.style.display = 'block';
    } else {
        resultSection.style.display = 'none';
    }
}

/**
 * Render blog link section
 * @param {Object} work - Work data
 */
function renderBlog(work) {
    const blogUrl = getWorkBlogUrl(work);
    const blogSection = document.getElementById('work-blog');

    if (!blogSection) return;

    if (blogUrl) {
        const blogLink = document.getElementById('work-blog-link');
        if (blogLink) {
            blogLink.href = blogUrl;
        }
        blogSection.style.display = 'block';
    } else {
        blogSection.style.display = 'none';
    }
}

/**
 * Render image gallery (includes cover image first)
 * @param {Object} work - Work data
 */
function renderGallery(work) {
    const coverImage = getWorkCoverImage(work);
    const galleryImages = getWorkImages(work);

    // Combine cover image + gallery images, avoiding duplicates
    const allImages = [];
    if (coverImage) {
        allImages.push(coverImage);
    }
    for (const img of galleryImages) {
        if (!allImages.includes(img)) {
            allImages.push(img);
        }
    }

    if (allImages.length === 0) {
        workGallery.style.display = 'none';
        return;
    }

    workGalleryGrid.innerHTML = allImages
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
    initLightbox(allImages);
}

/**
 * Initialize lightbox for gallery
 * @param {Array<string>} images - Image URLs
 */
function initLightbox(images) {
    let currentIndex = 0;
    let isTransitioning = false;

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
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <img src="" alt="" class="lightbox__image">
    <button class="lightbox__nav lightbox__nav--next" aria-label="Next image">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 6 15 12 9 18"></polyline>
      </svg>
    </button>
    <div class="lightbox__counter"></div>
  `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.lightbox__image');
    const closeBtn = lightbox.querySelector('.lightbox__close');
    const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    const nextBtn = lightbox.querySelector('.lightbox__nav--next');
    const counter = lightbox.querySelector('.lightbox__counter');

    /**
     * Show an image immediately (no transition), used on first open
     */
    function showImageDirect(index) {
        currentIndex = index;
        lightboxImage.src = images[currentIndex];
        lightboxImage.alt = `Gallery image ${currentIndex + 1}`;
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
        lightboxImage.classList.remove('lightbox__image--fade-out');

        // Hide nav buttons if only one image
        prevBtn.style.display = images.length <= 1 ? 'none' : '';
        nextBtn.style.display = images.length <= 1 ? 'none' : '';
        counter.style.display = images.length <= 1 ? 'none' : '';
    }

    /**
     * Transition to a new image with a fade animation
     */
    function transitionToImage(index) {
        if (isTransitioning || index === currentIndex) return;
        isTransitioning = true;

        // Fade out
        lightboxImage.classList.add('lightbox__image--fade-out');

        setTimeout(() => {
            // Swap image while faded out
            currentIndex = index;
            lightboxImage.src = images[currentIndex];
            lightboxImage.alt = `Gallery image ${currentIndex + 1}`;
            counter.textContent = `${currentIndex + 1} / ${images.length}`;

            // Fade back in
            lightboxImage.classList.remove('lightbox__image--fade-out');
            setTimeout(() => {
                isTransitioning = false;
            }, 70);
        }, 70);
    }

    function showPrev() {
        transitionToImage((currentIndex - 1 + images.length) % images.length);
    }

    function showNext() {
        transitionToImage((currentIndex + 1) % images.length);
    }

    // Open lightbox on image click
    workGalleryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('work-gallery__image')) {
            const index = parseInt(e.target.dataset.index);
            showImageDirect(index);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Navigation click handlers
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
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
 * Render other credits section
 * @param {Object} work - Work data
 */
function renderCredits(work) {
    console.log('renderCredits called, work.content:', work.content);
    const credits = getWorkOtherCredits(work);
    console.log('Credits found:', credits);
    const creditsSection = document.getElementById('work-credits');

    if (!creditsSection || credits.length === 0) {
        console.log('No credits section element or empty credits');
        if (creditsSection) creditsSection.style.display = 'none';
        return;
    }

    const creditsGrid = document.getElementById('work-credits-grid');
    creditsGrid.innerHTML = credits
        .map(credit => {
            const nameHtml = credit.link
                ? `<a href="${credit.link}" class="work-credits__link" target="_blank" rel="noopener">${credit.name}</a>`
                : `<span class="work-credits__name">${credit.name}</span>`;
            return `
                <div class="work-credits__item">
                    ${nameHtml}
                    <span class="work-credits__role">${credit.role}</span>
                </div>
            `;
        })
        .join('');

    creditsSection.style.display = 'block';
}

/**
 * Render testimonials section with highlights
 * @param {Object} work - Work data
 */
function renderTestimonials(work) {
    const testimonials = getWorkTestimonials(work);
    const testimonialsSection = document.getElementById('work-testimonials');

    if (!testimonialsSection || testimonials.length === 0) {
        if (testimonialsSection) testimonialsSection.style.display = 'none';
        return;
    }

    const testimonialsGrid = document.getElementById('work-testimonials-grid');
    testimonialsGrid.innerHTML = testimonials
        .map(testimonial => {
            // Apply highlight markup to the quote
            let quoteHtml = testimonial.quote;
            for (const highlight of testimonial.highlights) {
                quoteHtml = quoteHtml.replace(
                    highlight,
                    `<mark class="testimonial__highlight">${highlight}</mark>`
                );
            }

            return `
                <blockquote class="testimonial">
                    <p class="testimonial__quote">"${quoteHtml}"</p>
                    ${testimonial.name ? `<cite class="testimonial__author">— ${testimonial.name}</cite>` : ''}
                </blockquote>
            `;
        })
        .join('');


    testimonialsSection.style.display = 'block';
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
        renderChallenge(work);
        renderResult(work);
        renderBlog(work);
        renderCredits(work);
        renderTestimonials(work);
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
