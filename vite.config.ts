import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-only. Lets the page POST a canvas data URL so a WebGL frame can be
 * inspected as a real file. Writes under node_modules/.cache so nothing lands
 * in the repo. Never runs in a production build.
 */
function snapshotPlugin(): Plugin {
  const outDir = path.resolve('node_modules/.cache/inkwell-snaps')
  return {
    name: 'inkwell-snapshot',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__snap', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('POST only')
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          const match = /^data:image\/(png|jpeg);base64,(.+)$/s.exec(body)
          if (!match) {
            res.statusCode = 400
            return res.end('expected an image data URL')
          }
          const name = (new URL(req.url ?? '/', 'http://x').searchParams.get('name') ?? 'snap')
            .replace(/[^a-z0-9_-]/gi, '')
          const file = path.join(outDir, `${name}.${match[1] === 'jpeg' ? 'jpg' : 'png'}`)
          fs.mkdirSync(outDir, { recursive: true })
          fs.writeFileSync(file, Buffer.from(match[2], 'base64'))
          res.setHeader('content-type', 'text/plain')
          res.end(file)
        })
      })
    },
  }
}

/**
 * Dev-only. Lets the mark generator page write its output into src/assets/ink
 * so generated marks can be committed as ordinary reviewable files. Names are
 * restricted to a flat allowlist pattern — no traversal.
 */
function assetWritePlugin(): Plugin {
  const baseDir = path.resolve('src/assets/ink')
  return {
    name: 'inkwell-asset-write',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__asset', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('POST only')
        }
        const raw = new URL(req.url ?? '/', 'http://x').searchParams.get('path') ?? ''
        if (!/^[a-z0-9]+\/[a-z0-9][a-z0-9._-]*\.png$/i.test(raw)) {
          res.statusCode = 400
          return res.end('path must look like <folder>/<name>.png')
        }
        const file = path.join(baseDir, raw)
        if (!file.startsWith(baseDir + path.sep)) {
          res.statusCode = 400
          return res.end('outside asset root')
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const match = /^data:image\/png;base64,(.+)$/s.exec(Buffer.concat(chunks).toString('utf8'))
          if (!match) {
            res.statusCode = 400
            return res.end('expected a png data URL')
          }
          fs.mkdirSync(path.dirname(file), { recursive: true })
          fs.writeFileSync(file, Buffer.from(match[1], 'base64'))
          res.setHeader('content-type', 'text/plain')
          res.end(raw)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), snapshotPlugin(), assetWritePlugin()],
  build: {
    target: 'es2022',
    // Default is 4096. Base64-inlining an alpha PNG inflates it ~33% AND buries
    // it inside a JS chunk where it can no longer be cached on its own.
    assetsInlineLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // three is ~170KB gzip and must never sit in the entry chunk, nor be
          // invalidated every time a line of content changes.
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('node_modules/howler')) return 'audio'
          return undefined
        },
      },
    },
  },
})
