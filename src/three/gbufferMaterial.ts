import * as THREE from 'three'

/**
 * Written into a HalfFloat target as scene.overrideMaterial before the beauty
 * pass. Normals are stored RAW (not *0.5+0.5) — which is exactly why the target
 * has to be HalfFloat rather than 8-bit.
 */
export function createGBufferMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uCamFar: { value: 100 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uCamFar;
      varying vec3 vN;
      varying float vD;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vD = clamp(-mv.z / uCamFar, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vN;
      varying float vD;
      void main() {
        gl_FragColor = vec4(vN, vD);
      }
    `,
  })
}

/**
 * The cutout variant: samples the mesh's own alpha map and discards where the
 * cutout is transparent. Without this the prepass renders full quads for the
 * foliage and figure sprites, and the ink pass dutifully outlines rectangles.
 * One instance per cutout mesh, created lazily and cached on the mesh.
 */
export function createGBufferCutoutMaterial(map: THREE.Texture, alphaTest: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uCamFar: { value: 100 }, map: { value: map }, uCut: { value: alphaTest } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uCamFar;
      varying vec3 vN;
      varying float vD;
      varying vec2 vUv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vD = clamp(-mv.z / uCamFar, 0.0, 1.0);
        vUv = uv;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float uCut;
      varying vec3 vN;
      varying float vD;
      varying vec2 vUv;
      void main() {
        if (texture2D(map, vUv).a < uCut) discard;
        gl_FragColor = vec4(vN, vD);
      }
    `,
  })
}

/**
 * The sticker variant: writes a ZERO normal, which the composite reads as
 * "keep this pixel's true colour". Depth still writes, so the contour pass
 * outlines the object; interior crease detection is gated off in the shader.
 * For the few objects that must hold real multi-hue colour (dragon fruit)
 * inside an otherwise two-ink print.
 */
export function createGBufferStickerMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uCamFar: { value: 100 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uCamFar;
      varying float vD;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vD = clamp(-mv.z / uCamFar, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vD;
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, vD);
      }
    `,
  })
}
