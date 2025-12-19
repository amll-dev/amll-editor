export function splitTextByIndices(orignal: string, indices: number[]): string[] {
  let lastIndex = 0
  const partResult = []
  for (const index of indices) {
    partResult.push(orignal.slice(lastIndex, index))
    lastIndex = index
  }
  partResult.push(orignal.slice(lastIndex))
  return partResult
}

export function splitTextByLengths(orignal: string, lengths: number[]): string[] {
  const indices: number[] = [...lengths]
  for (let i = 1; i < indices.length; i++) indices[i]! += indices[i - 1] ?? 0
  return splitTextByIndices(orignal, indices)
}
