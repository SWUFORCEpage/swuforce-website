/** Page editor validation: only server-side authenticated site administrators may write. */
export const CONTENT_PAGES = Object.freeze(['home', 'about', 'study', 'news', 'community', 'members', 'recruit', 'me']);
export function isContentPage(page) {
  return typeof page === 'string' && CONTENT_PAGES.includes(page);
}
export function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  if (text.length > 1000) return null;
  try {
    const u = new URL(text);
    return u.protocol === 'https:' && !u.username && !u.password && u.hostname ? u.href : null;
  } catch { return null; }
}
export function validatePageEntry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { page, title, body: paragraph, category, link_url, link_label, image_url, sort_order, is_published } = body;
  if (!isContentPage(page) || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 120) return null;
  if (typeof paragraph !== 'string' || paragraph.trim().length > 2200) return null;
  if (typeof category !== 'string' || category.trim().length > 35) return null;
  if (typeof link_label !== 'string' || link_label.trim().length > 45) return null;
  if (typeof link_url !== 'string' || typeof image_url !== 'string') return null;
  const link = link_url.trim() ? safeHttpsUrl(link_url) : null;
  const image = image_url.trim() ? safeHttpsUrl(image_url) : null;
  if ((link_url.trim() && !link) || (image_url.trim() && !image)) return null;
  if (typeof sort_order !== 'number' || !Number.isInteger(sort_order) || sort_order < 0 || sort_order > 9999) return null;
  if (typeof is_published !== 'boolean') return null;
  return {
    page, title: title.trim(), body: paragraph.trim(), category: category.trim(),
    link_label: link ? (link_label.trim() || '자세히 보기') : '',
    link_url: link, image_url: image, sort_order, is_published,
  };
}
