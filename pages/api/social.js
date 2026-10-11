import { createHandler, sendJson } from '@/lib/api';
import { getSocialPosts } from '@/lib/social';

/**
 * GET /api/social – latest real Instagram posts (needs INSTAGRAM_ACCESS_TOKEN).
 * Without a token this returns an empty list; the site shows no stand-in posts.
 */
async function get(req, res) {
  const result = await getSocialPosts();
  return sendJson(res, 200, result, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' });
}

export default createHandler({ GET: get });
