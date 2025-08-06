import { KeyMapping } from './mapping';
import type { Keys } from '../types';

export function normalizeKey(code: string) {
  return KeyMapping[code].toLowerCase() || (code.toLowerCase() as Keys);
}
