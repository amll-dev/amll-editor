const inputSelectors = ['input[type="text"]', 'textarea', '[contenteditable="true"]', '.cm-editor']

const joinedSelectors = inputSelectors.join(', ')
export function isInputEl(el: HTMLElement): boolean {
  return el.closest(joinedSelectors) !== null
}
