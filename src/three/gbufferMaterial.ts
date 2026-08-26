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
