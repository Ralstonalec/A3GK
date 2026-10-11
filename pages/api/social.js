import sample from '@/data/social.json';
import { createHandler, sendJson } from '@/lib/api';
import { cached } from '@/lib/kv';
import { serverConfig } from '@/lib/server-config';

/**
 * GET /api/social – latest posts for the "live" social feed.
 * Instagram Graph API when INSTAGRAM_ACCESS_TOKEN is set (cached 15 min),
 * otherwise clearly-labelled sample posts.
 */
async function fetchInstagram() {
  const url = new URL('https://graph.instagram.com/me/media');
  url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink');
  url.searchParams.set('limit', '6');
  url.searchParams.set('access_token', serverConfig.instagramToken);
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Instagram responded ${res.status}`);
  const json = await res.json();
  return (json.data || [])
    .map((m) => ({
      id: m.id,
      image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
      caption: (m.caption || '').slice(0, 140),
      permalink: m.permalink,
    }))
    .filter((p) => p.image);
}

async function get(req, res) {
  const headers = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' };
  if (serverConfig.instagramToken) {
    try {
      const posts = await cached('social:instagram', 900, fetchInstagram);
      if (posts.length) return sendJson(res, 200, { source: 'instagram', isSample: false, posts }, headers);
    } catch (error) {
      console.warn('[social] Instagram unavailable, serving samples:', error.message);
    }
  }
  return sendJson(res, 200, { source: 'sample', isSample: true, posts: sample.posts }, headers);
}

export default createHandler({ GET: get });
