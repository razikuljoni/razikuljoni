/**
 * Typed access to PUBLIC_* env variables.
 * These are the canonical defaults that fall through the DB.
 * If the DB has the value, the DB wins. If the DB is empty,
 * we use these. Components should never hardcode the same values
 * a second time.
 */

const e = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

export const env = {
  siteUrl: (e.PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://razikuljoni.xyz",
  siteName: (e.PUBLIC_SITE_NAME as string | undefined) || "MD Razikul Islam Joni",
  siteDescription: (e.PUBLIC_SITE_DESCRIPTION as string | undefined) || "Jr. Full-Stack Developer | Next.js, React, Node.js, PostgreSQL",
  email: (e.PUBLIC_EMAIL as string | undefined) || "razikuljoni@gmail.com",
  location: (e.PUBLIC_LOCATION as string | undefined) || "",
  timezone: (e.PUBLIC_TIMEZONE as string | undefined) || "",
  github: e.PUBLIC_GITHUB
    ? `https://github.com/${e.PUBLIC_GITHUB}`
    : "",
  linkedin: e.PUBLIC_LINKEDIN
    ? `https://linkedin.com/in/${e.PUBLIC_LINKEDIN}`
    : "",
  twitter: e.PUBLIC_TWITTER
    ? `https://twitter.com/${e.PUBLIC_TWITTER}`
    : "",
  youtube: e.PUBLIC_YOUTUBE
    ? `https://youtube.com/@${e.PUBLIC_YOUTUBE}`
    : "",
  gaId: (e.PUBLIC_GA_ID as string | undefined) || "",
};

/**
 * Convert a social handle env var to a full URL.
 * If the value already looks like a URL (starts with http), return as-is.
 */
export function socialUrl(handle: string | undefined, base: string): string {
  if (!handle) return "";
  if (handle.startsWith("http://") || handle.startsWith("https://")) {
    return handle;
  }
  return `${base}${handle.replace(/^@/, "")}`;
}
