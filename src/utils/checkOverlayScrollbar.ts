/**
 * Check if the browser has overlay scrollbars (scrollbars that do not take up space).
 * If the browser has overlay scrollbars, don't use CSS to customize the scrollbar to avoid experience degradation
 */
export function hasOverlayScrollbar() {
  const div = document.createElement('div')
  div.style.width = '100px'
  div.style.height = '100px'
  div.style.overflow = 'scroll'
  div.style.position = 'absolute'
  div.style.top = '-9999px'

  document.body.appendChild(div)

  const scrollbarWidth = div.offsetWidth - div.clientWidth

  document.body.removeChild(div)

  return scrollbarWidth === 0
}
