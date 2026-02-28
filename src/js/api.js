/**
 * Craft API Service
 * Fetches portfolio data from Craft's multi-document API
 */

const API_BASE = 'https://connect.craft.do/links/pEuFum8B8X/api/v1';
const COLLECTION_ID = '98E866EA-AE41-4560-9F38-D22495346770';

const CACHE_KEY = 'craft_works_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if the secret cache refresh parameter is present
 * @returns {boolean}
 */
function shouldForceRefresh() {
  const params = new URLSearchParams(window.location.search);
  return params.get('refresh_cache') === 'true';
}

/**
 * Remove the refresh_cache parameter from the URL without reload
 */
function cleanRefreshParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('refresh_cache');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Fetch all portfolio works from Craft collection (with localStorage caching)
 * Cache expires after 24 hours. Append ?refresh_cache=true to any page URL to force refresh.
 * @returns {Promise<Array>} Array of work items
 */
export async function fetchWorks() {
  const forceRefresh = shouldForceRefresh();

  // If forcing refresh, clean the URL param
  if (forceRefresh) {
    cleanRefreshParam();
  }

  // Try reading from cache (unless forced refresh)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          console.log('[Cache] Serving works from cache');
          return data;
        }
        console.log('[Cache] Cache expired, fetching fresh data');
      }
    } catch (e) {
      // Cache read failed, proceed to fetch
      console.warn('[Cache] Failed to read cache:', e);
    }
  } else {
    console.log('[Cache] Force refresh requested');
  }

  try {
    const response = await fetch(`${API_BASE}/collections/${COLLECTION_ID}/items`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    // Store in cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: items
      }));
      console.log('[Cache] Works cached successfully');
    } catch (e) {
      console.warn('[Cache] Failed to write cache:', e);
    }

    return items;
  } catch (error) {
    console.error('Failed to fetch works:', error);

    // Fallback: try serving stale cache if available
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log('[Cache] Serving stale cache as fallback');
        return data;
      }
    } catch (e) { /* ignore */ }

    return [];
  }
}

/**
 * Filter works to only include published items
 * @param {Array} works - Array of work items
 * @returns {Array} Filtered works with published_to_portfolio: true
 */
export function filterPublishedWorks(works) {
  return works.filter(work => {
    // Check if work has content and published_to_portfolio is true
    return work.properties?.published_to_portfolio === true;
  });
}

/**
 * Get unique roles from all works
 * @param {Array} works - Array of work items
 * @returns {Array} Unique role strings
 */
export function getUniqueRoles(works) {
  const roles = new Set();
  works.forEach(work => {
    if (work.properties?.roles) {
      work.properties.roles.forEach(role => roles.add(role));
    }
  });
  return Array.from(roles).sort();
}

/**
 * Filter works by role
 * @param {Array} works - Array of work items
 * @param {string} role - Role to filter by
 * @returns {Array} Filtered works
 */
export function filterWorksByRole(works, role) {
  if (!role || role === 'all') return works;
  return works.filter(work =>
    work.properties?.roles?.includes(role)
  );
}

/**
 * Get a specific work by ID
 * @param {Array} works - Array of work items
 * @param {string} id - Work ID
 * @returns {Object|null} Work item or null
 */
export function getWorkById(works, id) {
  return works.find(work => work.id === id) || null;
}

/**
 * Helper to extract callout content under a specific heading
 * @param {Object} work - Work item
 * @param {RegExp} headingPattern - Pattern to match the heading
 * @returns {string} Callout text content or empty string
 */
function getCalloutUnderHeading(work, headingPattern) {
  if (!work.content) return '';

  let inSection = false;

  for (const block of work.content) {
    // Check for heading match
    if (block.type === 'text' && block.markdown) {
      if (block.markdown.match(headingPattern)) {
        inSection = true;
        continue;
      }
      // Stop at next heading
      if (inSection && block.markdown.match(/^#\s+/)) {
        break;
      }
    }

    // Look for callout in section
    if (inSection && block.type === 'text' && block.decorations?.includes('callout')) {
      let text = block.markdown || '';
      text = text.replace(/<callout>|<\/callout>/g, '');
      return text.trim();
    }
  }
  return '';
}

/**
 * Extract description from work content
 * Looks for callout blocks under "About this Work" or first callout
 * @param {Object} work - Work item
 * @returns {string} Description text
 */
export function getWorkDescription(work) {
  // First try to find callout under "About this Work" heading
  const aboutContent = getCalloutUnderHeading(work, /^#\s*(About\s*(this\s*)?Work)/i);
  if (aboutContent) return aboutContent;

  // Fallback: return first callout that's not under Challenge/Result
  if (!work.content) return '';

  for (const block of work.content) {
    if (block.type === 'text' && block.decorations?.includes('callout')) {
      let text = block.markdown || '';
      text = text.replace(/<callout>|<\/callout>/g, '');
      return text.trim();
    }
  }
  return '';
}

/**
 * Extract challenge section from work content
 * Looks for callout blocks under "Challenge" heading
 * @param {Object} work - Work item
 * @returns {string} Challenge text
 */
export function getWorkChallenge(work) {
  return getCalloutUnderHeading(work, /^#\s*Challenge/i);
}

/**
 * Extract result section from work content
 * Looks for callout blocks under "Result" heading
 * @param {Object} work - Work item
 * @returns {string} Result text
 */
export function getWorkResult(work) {
  return getCalloutUnderHeading(work, /^#\s*Result/i);
}


/**
 * Extract images from work content
 * @param {Object} work - Work item
 * @returns {Array<string>} Array of image URLs
 */
export function getWorkImages(work) {
  if (!work.content) return [];

  return work.content
    .filter(block => block.type === 'image' && block.url)
    .map(block => block.url);
}

/**
 * Extract video URL from work content (YouTube, etc.)
 * @param {Object} work - Work item
 * @returns {string|null} Video URL or null
 */
export function getWorkVideo(work) {
  if (!work.content) return null;

  const richUrl = work.content.find(block =>
    block.type === 'richUrl' &&
    (block.url?.includes('youtube.com') || block.url?.includes('vimeo.com'))
  );

  return richUrl?.url || null;
}

/**
 * Convert YouTube URL to embed URL
 * @param {string} url - YouTube watch URL
 * @returns {string} Embed URL
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  // Handle youtube.com/live/ URLs
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) {
    return `https://www.youtube.com/embed/${liveMatch[1]}`;
  }

  // Handle youtube.com/watch?v= URLs
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Handle youtu.be/ URLs
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

/**
 * Get the latest N published works
 * @param {Array} works - Array of work items
 * @param {number} limit - Max number of works to return
 * @returns {Array} Limited array of works
 */
export function getLatestWorks(works, limit = 4) {
  return works.slice(0, limit);
}

/**
 * Get cover image URL from work properties
 * @param {Object} work - Work item
 * @returns {string|null} Cover image URL or null
 */
export function getWorkCoverImage(work) {
  // Check for cover_image in properties (as URL string or file object)
  const coverImage = work.properties?.cover_image;
  if (coverImage) {
    // If it's a string URL
    if (typeof coverImage === 'string') return coverImage;
    // If it's an object with url property
    if (coverImage.url) return coverImage.url;
  }

  // Also check content blocks for an image marked as cover
  if (work.content) {
    for (const block of work.content) {
      if (block.type === 'image' && block.url) {
        // Check if this is under a "Cover Image" heading
        return block.url;
      }
    }
  }

  return null;
}

/**
 * Get video URL from work properties or content
 * @param {Object} work - Work item
 * @returns {string|null} Video URL or null
 */
export function getWorkVideoUrl(work) {
  // First check properties.video
  const videoUrl = work.properties?.video;
  if (videoUrl) {
    if (typeof videoUrl === 'string') return videoUrl;
    if (videoUrl.url) return videoUrl.url;
  }

  // Fall back to existing content-based video extraction
  return getWorkVideo(work);
}

/**
 * Get blog URL from work properties
 * @param {Object} work - Work item
 * @returns {string|null} Blog URL or null
 */
export function getWorkBlogUrl(work) {
  const blogUrl = work.properties?.blog;
  if (blogUrl) {
    if (typeof blogUrl === 'string') return blogUrl;
    if (blogUrl.url) return blogUrl.url;
  }
  return null;
}

/**
 * Get other credits from work content
 * Looks for credits table with Name, Role, and Link columns
 * @param {Object} work - Work item
 * @returns {Array<{name: string, role: string, link?: string}>} Credits array
 */
export function getWorkOtherCredits(work) {
  if (!work.content) return [];

  const credits = [];
  let inCreditsSection = false;
  let tableHeaders = [];

  for (let i = 0; i < work.content.length; i++) {
    const block = work.content[i];

    // Look for "Other Credits" or "Credits" heading
    if (block.type === 'text' && block.markdown) {
      const headingMatch = block.markdown.match(/^#+\s*(Other\s*)?Credits/i);
      if (headingMatch) {
        inCreditsSection = true;
        continue;
      }
      // Stop at next major heading (but allow sub-headings)
      if (inCreditsSection && block.markdown.match(/^#{1,2}\s+(?!.*credit)/i)) {
        break;
      }
    }

    // Handle Craft's native table block type
    if (inCreditsSection && block.type === 'table') {
      const rows = block.rows || block.content || [];
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const cells = row.cells || row;

        // Skip header row or separator - include .value for Craft API
        if (rowIdx === 0) {
          tableHeaders = cells.map(c => (typeof c === 'string' ? c : c.text || c.value || '').toLowerCase());
          continue;
        }

        const nameIdx = tableHeaders.findIndex(h => h.includes('name'));
        const roleIdx = tableHeaders.findIndex(h => h.includes('role'));
        const linkIdx = tableHeaders.findIndex(h => h.includes('link') || h.includes('portfolio') || h.includes('social'));

        // Include .value for Craft API table cells
        const getCellText = (cell) => typeof cell === 'string' ? cell : cell.text || cell.value || cell.markdown || '';
        const getCellLink = (cell) => typeof cell === 'object' ? cell.url || cell.link : null;

        const name = getCellText(cells[nameIdx >= 0 ? nameIdx : 0]);
        const role = getCellText(cells[roleIdx >= 0 ? roleIdx : 1]);
        const link = getCellLink(cells[linkIdx >= 0 ? linkIdx : 2]) ||
          (linkIdx >= 0 ? getCellText(cells[linkIdx]) : '');

        if (name && name.toLowerCase() !== 'name') {
          credits.push({
            name,
            role,
            ...(link && link.match(/^https?:\/\//) && { link })
          });
        }
      }
      continue;
    }

    // Parse markdown table when in section
    if (inCreditsSection && block.type === 'text' && block.markdown) {
      const lines = block.markdown.split('\n').filter(l => l.trim());

      for (const line of lines) {
        // Skip separator lines (|---|---|---|) and heading lines
        if (line.match(/^\|?\s*[-:]+\s*\|/) || line.match(/^#+/)) continue;

        // Check if this is a table row
        if (line.includes('|')) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c);

          // First row with content is headers - strip markdown bold (**) formatting
          if (tableHeaders.length === 0 && cells.length >= 2) {
            tableHeaders = cells.map(h => h.replace(/\*\*/g, '').toLowerCase().trim());
            continue;
          }

          // Parse data rows
          if (cells.length >= 2) {
            const nameIdx = tableHeaders.findIndex(h => h.includes('name'));
            const roleIdx = tableHeaders.findIndex(h => h.includes('role'));
            const linkIdx = tableHeaders.findIndex(h => h.includes('link') || h.includes('portfolio') || h.includes('social'));

            let name = cells[nameIdx >= 0 ? nameIdx : 0] || '';
            const role = cells[roleIdx >= 0 ? roleIdx : 1] || '';
            const linkCell = linkIdx >= 0 && cells[linkIdx] ? cells[linkIdx] : '';

            // Extract URL from markdown link format [text](url) or plain URL
            let link = '';
            const mdLinkMatch = linkCell.match(/\[([^\]]*)\]\(([^)]+)\)/);
            if (mdLinkMatch) {
              link = mdLinkMatch[2];
            } else if (linkCell.match(/^https?:\/\//)) {
              link = linkCell;
            }

            // Clean markdown links from name column too
            const nameLinkMatch = name.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (nameLinkMatch) {
              name = nameLinkMatch[1];
              if (!link) link = nameLinkMatch[2];
            }

            if (name && !name.toLowerCase().includes('name')) {
              credits.push({
                name,
                role,
                ...(link && { link })
              });
            }
          }
        }
      }
    }
  }

  console.log('Parsed credits:', credits); // Debug log
  return credits;
}


/**
 * Get testimonials from work content
 * Looks for testimonials section with quotes and highlights
 * @param {Object} work - Work item
 * @returns {Array<{quote: string, name?: string, highlights: string[]}>} Testimonials array
 */
export function getWorkTestimonials(work) {
  if (!work.content) return [];

  const testimonials = [];
  let inTestimonialsSection = false;

  for (const block of work.content) {
    // Look for "Testimonials" or "Testimonial" heading
    if (block.type === 'text' && block.markdown) {
      const headingMatch = block.markdown.match(/^#+\s*Testimonials?/i);
      if (headingMatch) {
        inTestimonialsSection = true;
        continue;
      }
      // Stop at next heading (but not sub-headings within testimonials)
      if (inTestimonialsSection && block.markdown.match(/^#{1,2}\s+[^#]/)) {
        break;
      }
    }

    // Parse testimonial content when in section
    if (inTestimonialsSection && block.type === 'text' && block.markdown) {
      const text = block.markdown.trim();
      if (!text || text.match(/^#+/)) continue; // Skip empty or heading lines

      // Extract highlights (text wrapped in == or <highlight>)
      const highlights = [];
      let processedText = text;

      // Find ==highlighted== text
      const highlightMatches = text.matchAll(/==([^=]+)==/g);
      for (const match of highlightMatches) {
        highlights.push(match[1].trim());
      }
      processedText = processedText.replace(/==([^=]+)==/g, '$1');

      // Find <highlight color="...">text</highlight> tags (Craft format)
      const craftHighlightMatches = text.matchAll(/<highlight[^>]*>([^<]+)<\/highlight>/g);
      for (const match of craftHighlightMatches) {
        highlights.push(match[1].trim());
      }
      processedText = processedText.replace(/<highlight[^>]*>([^<]+)<\/highlight>/g, '$1');

      // Try to parse "Quote text" — Name format (quote and author on same line)
      const quoteAuthorMatch = processedText.match(/^[">]?\s*["""]?(.+?)["""]?\s*[—–-]\s*(.+)$/s);
      if (quoteAuthorMatch) {
        testimonials.push({
          quote: quoteAuthorMatch[1].replace(/^[>"\s]+/, '').replace(/["\s]+$/, '').trim(),
          name: quoteAuthorMatch[2].trim(),
          highlights
        });
        continue;
      }

      // Try blockquote format: > quote text
      const blockquoteMatch = processedText.match(/^>\s*(.+)/s);
      if (blockquoteMatch) {
        // Check if next line has author
        testimonials.push({
          quote: blockquoteMatch[1].replace(/^["\s]+/, '').replace(/["\s]+$/, '').trim(),
          highlights
        });
        continue;
      }

      // Plain text that looks like a quote (contains quotes or is substantial text)
      if (processedText.startsWith('"') || processedText.startsWith('"') || processedText.length > 50) {
        const cleanQuote = processedText
          .replace(/^[""'"]+/, '')
          .replace(/[""'"]+$/, '')
          .trim();

        if (cleanQuote.length > 20) {
          testimonials.push({
            quote: cleanQuote,
            highlights
          });
        }
        continue;
      }

      // Check if this line is a name for the previous testimonial (starts with — or is short)
      if (testimonials.length > 0 && !testimonials[testimonials.length - 1].name) {
        if (processedText.match(/^[—–-]\s*/) || (processedText.length < 50 && !processedText.includes(' — '))) {
          testimonials[testimonials.length - 1].name = processedText.replace(/^[—–-]\s*/, '').trim();
        }
      }
    }
  }

  return testimonials;
}

