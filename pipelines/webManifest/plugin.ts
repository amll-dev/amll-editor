import 'dotenv/config'
import type { Plugin } from 'vite'

import { injectToHead } from '../shared'
import { generateManifest } from './generate'

const VIRTUAL_MANIFEST_FILENAME = 'app.webmanifest'
const VIRTUAL_MANIFEST_PATH = `/${VIRTUAL_MANIFEST_FILENAME}`

const SUFFIX = process.env.VITE_BUILD_CHANNEL === 'BETA' ? ' BETA' : ''
const INJECTED_HEAD = /* html */ `
  <link rel="manifest" href="${VIRTUAL_MANIFEST_PATH}">
  <title>AMLL Editor${SUFFIX}</title>
  <meta name="application-title" content="AMLL Editor${SUFFIX}" />
  <meta name="description" content="基于 Vue 的开源逐字（逐音节）歌词编辑器" />
  <meta name="keywords" content="歌词编辑器, 逐字歌词编辑器, 逐音节歌词编辑器, LRC编辑器, 歌词制作, 歌词同步, 歌词打轴" />
`

export function manifestPlugin(): Plugin {
  const manifest = generateManifest()

  return {
    name: 'vite-plugin-manifest',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== VIRTUAL_MANIFEST_PATH) return next()
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(JSON.stringify(manifest, null, 2))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: VIRTUAL_MANIFEST_FILENAME,
        source: JSON.stringify(manifest, null, 2),
      })
    },
    transformIndexHtml(html) {
      return injectToHead(html, INJECTED_HEAD)
    },
  }
}
