import env from './env';

/* --------------------------------------------------------------------------
   Resolves a media path to something the browser can actually load.

   The problem this solves
   -----------------------
   Two kinds of path live side by side in dbo.GalleryImages:

     /assets/images/villas/canopy-villa-01.jpg   shipped with the frontend
     /uploads/gallery/7d2de338….jpg              uploaded to the API

   Both are root-relative, so the browser resolves both against the page
   origin - http://localhost:5173. The first is correct: Vite serves it. The
   second is not: the file sits in the API's wwwroot at
   https://localhost:7215, and the request 404s.

   Storing an absolute URL in the database would fix the display and break
   the deployment - every row would carry a hostname that is wrong the moment
   the API moves. So the path stays relative and is resolved here, from the
   same configuration the API calls use.
   -------------------------------------------------------------------------- */

/** https://localhost:7215/api -> https://localhost:7215 */
const apiOrigin = env.apiBaseUrl.replace(/\/api\/?$/, '');

/** Paths the API serves from its own wwwroot rather than the Vite public dir. */
const API_SERVED = ['/uploads/'];

export function mediaUrl(path) {
  if (!path) return '';

  // Already absolute, a data URI, or a blob from a local preview.
  if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path;

  const normalised = path.startsWith('/') ? path : `/${path}`;

  return API_SERVED.some((prefix) => normalised.startsWith(prefix))
    ? `${apiOrigin}${normalised}`
    : normalised;
}

export default mediaUrl;