import { test } from 'node:test';
import assert from 'node:assert';
import { 
  validateAndCanonicalizeYouTubeUrl, 
  validateVideoSource,
  extractYouTubeId 
} from './src/lib/video-source.ts';

test('validateAndCanonicalizeYouTubeUrl', async (t) => {
  await t.test('handles standard watch URLs', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    assert.strictEqual(
      validateAndCanonicalizeYouTubeUrl(url), 
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  await t.test('handles standard watch URLs with extra params', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s';
    assert.strictEqual(
      validateAndCanonicalizeYouTubeUrl(url), 
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  await t.test('handles youtu.be short URLs', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    assert.strictEqual(
      validateAndCanonicalizeYouTubeUrl(url), 
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  await t.test('handles embed URLs', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    assert.strictEqual(
      validateAndCanonicalizeYouTubeUrl(url), 
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  await t.test('handles bare video ID', () => {
    const id = 'dQw4w9WgXcQ';
    assert.strictEqual(
      validateAndCanonicalizeYouTubeUrl(id), 
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  await t.test('rejects invalid YouTube URLs', () => {
    const badUrl = 'https://evil.com/video.mp4';
    assert.strictEqual(validateAndCanonicalizeYouTubeUrl(badUrl), null);
  });

  await t.test('rejects malformed YouTube IDs', () => {
    const badId = 'dQw4w9WgX'; // too short
    assert.strictEqual(validateAndCanonicalizeYouTubeUrl(badId), null);
  });
});

test('extractYouTubeId', async (t) => {
  await t.test('extracts ID correctly', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    assert.strictEqual(extractYouTubeId(url), 'dQw4w9WgXcQ');
  });

  await t.test('returns null for bad input', () => {
    assert.strictEqual(extractYouTubeId(''), null);
    assert.strictEqual(extractYouTubeId('invalid-url'), null);
  });
});

test('validateVideoSource', async (t) => {
  await t.test('allows empty URLs', () => {
    const res = validateVideoSource('', 'youtube');
    assert.deepStrictEqual(res, {
      isValid: true,
      canonicalUrl: null,
      videoType: 'youtube'
    });
  });

  await t.test('validates valid YouTube sources', () => {
    const res = validateVideoSource('https://youtu.be/dQw4w9WgXcQ', 'youtube');
    assert.deepStrictEqual(res, {
      isValid: true,
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoType: 'youtube'
    });
  });

  await t.test('rejects arbitrary embed sources for security', () => {
    const res = validateVideoSource('https://arbitrary-embed.com/play', 'embed');
    assert.deepStrictEqual(res, {
      isValid: false,
      canonicalUrl: null,
      videoType: 'embed'
    });
  });
});
