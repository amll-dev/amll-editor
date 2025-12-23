export function breakExtension(filename: string): [name: string, extension: string] {
  const lastDotIndex = filename.lastIndexOf('.')
  const name = filename.slice(0, lastDotIndex)
  const extension = filename.slice(lastDotIndex + 1).toLowerCase()
  return [name, extension]
}
