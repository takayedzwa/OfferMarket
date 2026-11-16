// /market slug helpers shared by server components (T10/T12).
// Mirrors the API's citySlugOf (slugify convention: lowercase, accents folded,
// separators collapsed) so article-side cross-links resolve to the same slugs.

export function citySlugOf(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
