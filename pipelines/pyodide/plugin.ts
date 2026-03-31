import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const PYODIDE_EXCLUDE_DEV = ['!**/*.{md,html}', '!**/*.d.ts', '!**/*.whl', '!**/node_modules']
const PYODIDE_EXCLUDE_PROD = [...PYODIDE_EXCLUDE_DEV, '!**/*.map']
export function viteStaticCopyPyodide(isDev: boolean) {
  const pyodideDir = path.dirname(fileURLToPath(import.meta.resolve('pyodide')))
  return viteStaticCopy({
    targets: [
      {
        src: [
          normalizePath(path.join(pyodideDir, '*')),
          ...(isDev ? PYODIDE_EXCLUDE_DEV : PYODIDE_EXCLUDE_PROD),
        ],
        dest: 'assets',
      },
    ],
  })
}
