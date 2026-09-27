/**
 * Video source validation and canonicalization utilities
 * 
 * This module provides strict parsing and validation for video URLs,
 * ensuring only safe, legal sources are allowed for synchronized playback.
 */

// Pattern for YouTube video IDs (11 characters, alphanumeric + -_)
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

// Patterns for YouTube URLs
const YOUTUBE_WATCH_PATTERN = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&#?].*)?$/i;
const YOUTUBE_EMBED_PATTERN = /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[?#].*)?$/i;

// Trusted hosts for direct video files (empty by default, can be configured)
const TRUSTED_VIDEO_HOSTS = (process.env.NEXT_PUBLIC_TRUSTED_VIDEO_HOSTS || '')
  .split(',').map(host => host.trim().toLowerCase()).filter(Boolean);

/**
 * Validates and canonicalizes a YouTube URL to its canonical watch URL format
 * @param url - The YouTube URL to validate and canonicalize
 * @returns The canonical YouTube watch URL or null if invalid
 */
export function validateAndCanonicalizeYouTubeUrl(url: string): string | null {
  // First try to extract ID from standard watch URLs or youtu.be URLs
  const watchMatch = url.match(YOUTUBE_WATCH_PATTERN);
  if (watchMatch) {
    const id = watchMatch[1];
    if (YOUTUBE_ID_PATTERN.test(id)) {
      return `https://www.youtube.com/watch?v=${id}`;
    }
  }

  // Then try to extract ID from embed URLs
  const embedMatch = url.match(YOUTUBE_EMBED_PATTERN);
  if (embedMatch) {
    const id = embedMatch[1];
    if (YOUTUBE_ID_PATTERN.test(id)) {
      return `https://www.youtube.com/watch?v=${id}`;
    }
  }

  // If it looks like a bare ID
  if (YOUTUBE_ID_PATTERN.test(url)) {
    return `https://www.youtube.com/watch?v=${url}`;
  }

  // Invalid YouTube URL
  return null;
}

/**
 * Validates a direct video URL against trusted hosts
 * @param url - The video URL to validate
 * @returns True if valid and from a trusted host, false otherwise
 */
export function validateDirectVideoUrl(url: string): boolean {
  if (TRUSTED_VIDEO_HOSTS.length === 0) {
    return false; // No trusted hosts configured
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check if the hostname is in our trusted list
    return parsedUrl.protocol === 'https:' && /\.(mp4|webm|ogv)$/i.test(parsedUrl.pathname) && TRUSTED_VIDEO_HOSTS.some(trustedHost => 
      hostname === trustedHost || hostname.endsWith('.' + trustedHost)
    );
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Determines the type of video source and validates it
 * @param url - The URL to analyze
 * @param type - The declared type ('youtube', 'custom', or 'embed')
 * @returns Object with validation result and canonical URL, or null if invalid
 */
export function validateVideoSource(url: string, type: 'youtube' | 'custom' | 'embed'): {
  isValid: boolean;
  canonicalUrl: string | null;
  videoType: 'youtube' | 'custom' | 'embed';
} | null {
  // Empty URL is valid (means no video yet)
  if (!url || url.trim() === '') {
    return {
      isValid: true,
      canonicalUrl: null,
      videoType: type
    };
  }

  switch (type) {
    case 'youtube':
      const canonicalYouTubeUrl = validateAndCanonicalizeYouTubeUrl(url);
      return {
        isValid: !!canonicalYouTubeUrl,
        canonicalUrl: canonicalYouTubeUrl,
        videoType: 'youtube'
      };

    case 'custom':
      const isTrustedDirect = validateDirectVideoUrl(url);
      return {
        isValid: isTrustedDirect,
        canonicalUrl: isTrustedDirect ? url : null,
        videoType: 'custom'
      };

    case 'embed':
      // For embed, we don't allow it for security reasons
      return {
        isValid: false,
        canonicalUrl: null,
        videoType: 'embed'
      };

    default:
      return null;
  }
}

/**
 * Extracts YouTube video ID from a canonical URL
 * @param url - Canonical YouTube URL
 * @returns YouTube video ID or null if not a valid YouTube URL
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const match = url.match(YOUTUBE_WATCH_PATTERN);
  if (match && YOUTUBE_ID_PATTERN.test(match[1])) {
    return match[1];
  }
  
  return null;
}
