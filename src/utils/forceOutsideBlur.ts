export function forceOutsideBlur() {
  const focusedInput = document.activeElement
  const isInputElement = (el: Element | null): el is HTMLInputElement =>
    el !== null && el.tagName === 'INPUT'
  if (!isInputElement(focusedInput)) return
  if (focusedInput.closest('[data-escape-auto-blur]')) return
  focusedInput.blur()
}
