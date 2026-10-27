export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

/** Where `v` sits between `a` and `b`, clamped to 0–1. */
export const range = (v, a, b) => clamp((v - a) / (b - a));

export const smoothstep = (t) => t * t * (3 - 2 * t);

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeInQuad = (t) => t * t;

/**
 * Scroll progress through a tall section whose child is `position: sticky`.
 * 0 when the section's top meets the viewport top, 1 when the sticky child
 * is about to unpin.
 */
export function pinProgress(el) {
  if (!el) return { p: 0, rect: { top: 0, bottom: 0, height: 0 }, vh: 800 };
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const span = Math.max(1, rect.height - vh);
  return { p: clamp(-rect.top / span), rect, vh };
}
