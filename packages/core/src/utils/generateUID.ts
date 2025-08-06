export function generateUID(): string {
  return 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}
