const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
  "#x2F": "/",
  "#160": " ",
};

/** Decodes the handful of entities that job feeds actually emit. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#?[\w\d]+);/g, (match, code: string) => ENTITIES[code] ?? match);
}

/** Job feeds return HTML bodies; the UI wants readable plain text. */
export function toPlainText(html: string, maxLength = 1200): string {
  const decoded = decodeEntities(decodeEntities(html ?? ""));
  const text = decoded
    .replace(/<\s*(br|\/p|\/div|\/li)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

/** Best-effort domain for a company, derived from an apply URL. */
export function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
