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

export default defineConfig({
  plugins: [react(), snapshotPlugin()],
})
