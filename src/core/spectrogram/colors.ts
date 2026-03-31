import {
  interpolateCubehelixDefault,
  interpolateGreys,
  interpolateInferno,
  interpolateViridis,
} from 'd3-scale-chromatic'

/**
 * @description 频谱图调色板的生成器
 */

export type SpectrogramColor =
  | 'icyBlue'
  | 'inferno'
  | 'cubehelix'
  | 'viridis'
  | 'gray'
  | ColorStop[]

function colorStrToArr(rgbStr: string): [r: number, g: number, b: number] {
  if (rgbStr.startsWith('#')) return parseHexColor(rgbStr)
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return [0, 0, 0]
  return [Number(match[1]!), Number(match[2]!), Number(match[3]!)]
}
function strFnToArrFn(fn: (t: number) => string) {
  return (t: number): [r: number, g: number, b: number] => colorStrToArr(fn(t))
}
function invertColorFn(fn: (t: number) => [r: number, g: number, b: number]) {
  return (t: number): [r: number, g: number, b: number] => fn(1 - t)
}

export function parseSpectrogramColor(input: SpectrogramColor): Uint8Array {
  switch (input) {
    case 'icyBlue': {
      return generatePalette(getIcyBlueColor)
    }
    case 'inferno': {
      return generatePalette(strFnToArrFn(interpolateInferno))
    }
    case 'cubehelix': {
      return generatePalette(strFnToArrFn(interpolateCubehelixDefault))
    }
    case 'viridis': {
      return generatePalette(strFnToArrFn(interpolateViridis))
    }
    case 'gray': {
      return generatePalette(invertColorFn(strFnToArrFn(interpolateGreys)))
    }
    default: {
      if (!Array.isArray(input)) throw new Error('Invalid spectrogram color input')
      return generateLutFromStops(input)
    }
  }
}

/**
 * @description 渐变色标
 *
 * @param pos - 位置，从 0.0 到 1.0
 * @param color - HEX 颜色字符串
 */
export type ColorStop = {
  id: string
  pos: number
  color: string
}

function hslToRgb(h: number, s: number, l: number): [r: number, g: number, b: number] {
  if (s === 0) {
    const gray = Math.trunc(l * 255)
    return [gray, gray, gray]
  }

  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const hPrime = h / 60
  const secondComponent = chroma * (1 - Math.abs((hPrime % 2) - 1))
  const lightnessModifier = l - chroma / 2

  let rPrime = 0,
    gPrime = 0,
    bPrime = 0

  if (hPrime >= 0 && hPrime < 1) {
    ;[rPrime, gPrime, bPrime] = [chroma, secondComponent, 0]
  } else if (hPrime >= 1 && hPrime < 2) {
    ;[rPrime, gPrime, bPrime] = [secondComponent, chroma, 0]
  } else if (hPrime >= 2 && hPrime < 3) {
    ;[rPrime, gPrime, bPrime] = [0, chroma, secondComponent]
  } else if (hPrime >= 3 && hPrime < 4) {
    ;[rPrime, gPrime, bPrime] = [0, secondComponent, chroma]
  } else if (hPrime >= 4 && hPrime < 5) {
    ;[rPrime, gPrime, bPrime] = [secondComponent, 0, chroma]
  } else if (hPrime >= 5 && hPrime < 6) {
    ;[rPrime, gPrime, bPrime] = [chroma, 0, secondComponent]
  }

  const r = Math.trunc((rPrime + lightnessModifier) * 255)
  const g = Math.trunc((gPrime + lightnessModifier) * 255)
  const b = Math.trunc((bPrime + lightnessModifier) * 255)

  return [r, g, b]
}

export function getIcyBlueColor(value: number) {
  const v = Math.max(0, Math.min(value, 1))
  const h = ((((-128 * v + 191) % 256) + 256) % 256) * (360 / 255)
  const s = Math.max(0, Math.min(128 * v + 127, 255)) / 255
  const l = Math.max(0, Math.min(255 * v, 255)) / 255
  return hslToRgb(h, s, l)
}

export function generatePalette(
  colorFn: (value: number) => [r: number, g: number, b: number],
): Uint8Array {
  const lut = new Uint8Array(256 * 4)
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = colorFn(i / 255)
    const idx = i * 4
    lut[idx] = r
    lut[idx + 1] = g
    lut[idx + 2] = b
    lut[idx + 3] = 255
  }
  return lut
}

/**
 * @description 解析 HEX 颜色字符串为 RGB
 */
function parseHexColor(hex: string): [r: number, g: number, b: number] {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

/**
 * @description 线性插值
 */
function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}

/**
 * @description 从色标生成一个 256 色的 LUT
 *
 * @param stops 渐变色标
 * @returns 一个 1024 字节的 Uint8Array (256 * RGBA)
 */
export function generateLutFromStops(stops: ColorStop[]): Uint8Array {
  const lut = new Uint8Array(256 * 4)

  if (stops.length === 0) {
    return lut
  }

  const sortedStops = stops.toSorted((a, b) => a.pos - b.pos)

  const parsedStops = sortedStops.map((s) => ({
    pos: s.pos,
    rgb: parseHexColor(s.color),
  }))

  for (let i = 0; i < 256; i++) {
    const currentPos = i / 255

    // 前面已有 if (stops.length === 0) 检查，所有下面的非空断言都是安全的
    let stopA = parsedStops[0]!
    let stopB = parsedStops.at(-1)!

    if (currentPos <= parsedStops[0]!.pos) {
      stopA = parsedStops[0]!
      stopB = parsedStops[0]!
    } else if (currentPos >= parsedStops.at(-1)!.pos) {
      stopA = parsedStops.at(-1)!
      stopB = parsedStops.at(-1)!
    } else {
      for (let j = 0; j < parsedStops.length - 1; j++) {
        if (currentPos >= parsedStops[j]!.pos && currentPos <= parsedStops[j + 1]!.pos) {
          stopA = parsedStops[j]!
          stopB = parsedStops[j + 1]!
          break
        }
      }
    }

    const range = stopB.pos - stopA.pos
    const t = range < 1e-6 ? 0 : (currentPos - stopA.pos) / range

    const r = lerp(stopA.rgb[0], stopB.rgb[0], t)
    const g = lerp(stopA.rgb[1], stopB.rgb[1], t)
    const b = lerp(stopA.rgb[2], stopB.rgb[2], t)

    const idx = i * 4
    lut[idx] = r
    lut[idx + 1] = g
    lut[idx + 2] = b
    lut[idx + 3] = 255
  }

  return lut
}
