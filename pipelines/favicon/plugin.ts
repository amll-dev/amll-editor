import 'dotenv/config'
import path from 'node:path'
import { normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export function faviconPlugin() {
  const faviconDir = path.join(
    process.cwd(),
    'favicons',
    process.env.VITE_BUILD_CHANNEL === 'BETA' ? 'beta' : 'normal',
  )
  return viteStaticCopy({
    targets: [
      {
        src: [normalizePath(path.join(faviconDir, '*'))],
        dest: 'favicons',
      },
    ],
  })
}
