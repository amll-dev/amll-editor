import chalk from 'chalk'
import { join } from 'node:path'
import { Plugin, normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import { injectToHead } from '../shared'

const INJECT_HEAD = /* html */ `
  <script src="coi-serviceworker.min.js" defer></script>
`

const COI_HEADERS = `
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
`

export function coiPlugin() {
  if (!process.env.VITE_COI_WORKAROUND) return [coiHeaderPlugin(), coiBuildHeaderPlugin()]
  return coiServiceWorkerPlugin()
}

function coiHeaderPlugin(): Plugin {
  return {
    name: 'vite-plugin-coi-dev-headers',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
  }
}

function coiBuildHeaderPlugin(): Plugin {
  return {
    name: 'vite-plugin-coi-build-headers',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: COI_HEADERS.trim(),
      })
    },
  }
}

function coiServiceWorkerPlugin() {
  console.log(chalk.yellow('Using COI Service Worker workaround\n'))
  const injectHeadPlugin = {
    name: 'vite-plugin-coi-serviceworker-inject-head',
    transformIndexHtml(html: string) {
      return injectToHead(html, INJECT_HEAD)
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
