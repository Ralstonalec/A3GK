import { cached } from './kv';
import { serverConfig } from './server-config';

/**
 * Real social posts only (Instagram Graph API, cached 15 min). With no token —
 * or if Instagram is unreachable — this returns an empty list and the social
 * section stays hidden; there are no stand-in posts.
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
    .filter((p) => p.image && /^https:\/\//.test(p.permalink || ''));
}

/** @returns {Promise<{ source: 'instagram'|'none', posts: object[] }>} */
export async function getSocialPosts() {
  if (!serverConfig.instagramToken) return { source: 'none', posts: [] };
  try {
    const posts = await cached('social:instagram', 900, fetchInstagram);
    return { source: posts.length ? 'instagram' : 'none', posts };
  } catch (error) {
    console.warn('[social] Instagram unavailable:', error.message);
    return { source: 'none', posts: [] };
  }
}
