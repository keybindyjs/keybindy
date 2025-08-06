import type { Keys } from '../types';

const keyAliases: Record<string, string[]> = {
  ctrl: ['ctrl (left)', 'ctrl (right)'],
  shift: ['shift (left)', 'shift (right)'],
  alt: ['alt (left)', 'alt (right)'],
  meta: ['meta (left)', 'meta (right)', 'cmd'],
};

export function expandAliases(binding: Keys[]): Keys[][] {
  const expanded: Keys[][] = [[]];

  for (const key of binding) {
    const normalized = key.toLowerCase();
    const variants = keyAliases[normalized] ?? [normalized];

    const newExpanded: Keys[][] = [];

    for (const existing of expanded) {
      for (const variant of variants) {
        newExpanded.push([...existing, variant as Keys]);
      }
    }

    expanded.splice(0, expanded.length, ...newExpanded);
  }

  return expanded;
}
