import { onUnmounted, ref } from 'vue'

interface UseSpectrogramResizeOptions {
  initialHeight: number
  minHeight?: number
  maxHeight?: number
}

export function useSpectrogramResize(options: UseSpectrogramResizeOptions) {
  const { initialHeight, minHeight = 100, maxHeight = 800 } = options

  const height = ref(initialHeight)
  const isResizing = ref(false)

  let startY = 0
  let startHeight = 0

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return

    const deltaY = startY - e.clientY

    const newHeight = startHeight + deltaY

    height.value = Math.max(minHeight, Math.min(newHeight, maxHeight))
  }

  const handleMouseUp = () => {
    isResizing.value = false
    globalThis.removeEventListener('mousemove', handleMouseMove)
    globalThis.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseDown = (e: MouseEvent) => {
    isResizing.value = true
    startY = e.clientY
    startHeight = height.value
    globalThis.addEventListener('mousemove', handleMouseMove)
    globalThis.addEventListener('mouseup', handleMouseUp)
  }

  onUnmounted(() => {
    globalThis.removeEventListener('mousemove', handleMouseMove)
    globalThis.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    height,
    isResizing,
    resizeHandleProps: {
      onMousedown: handleMouseDown,
    },
  }
}
