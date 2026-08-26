import * as THREE from 'three'

/** Hard cel banding for MeshToonMaterial. Nearest-filtered, so no interpolation. */
export function makeToonGradient(steps = 3) {
  const data = new Uint8Array(steps)
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / Math.max(steps - 1, 1)) * 255)
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}
