/**
 * Checks whether an event target is an interactive text input or editable element.
 * @param target - The event target to check.
 * @returns `true` if target is an input, textarea, select, or contenteditable element.
 */
export const isInputTarget = (target: EventTarget | null): boolean => {
  if (typeof HTMLElement === 'undefined' || !target) return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
};
