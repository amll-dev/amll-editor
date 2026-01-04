import { join } from 'node:path'
import { normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const INJECT_HEAD = /* html */ `
  <script src="coi-serviceworker.min.js" defer></script>
`

export function coiPlugin() {
  if (!process.env.VITE_COI_WORKAROUND) return []
  const injectHeadPlugin = {
    name: 'vite-plugin-coi-serviceworker-inject-head',
    transformIndexHtml(html: string) {
      return html.replace('</head>', `${INJECT_HEAD}</head>`)
    },
  }
  const staticCopyPlugins = viteStaticCopy({
    targets: [
      {
        src: [normalizePath(join(__dirname, 'coi-serviceworker.min.js'))],
        dest: '.',
      },
    ],
  })
  return [injectHeadPlugin, staticCopyPlugins]
}
