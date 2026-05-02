/** Tiny crypto-random ID generator (no external dep needed). */
export function nanoid(size = 12): string {
  return crypto.getRandomValues(new Uint8Array(size))
    .reduce((acc, b) => acc + b.toString(36), '');
}
