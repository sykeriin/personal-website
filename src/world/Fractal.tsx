import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * A live Julia set, drawn in the site's own ink.
 *
 * The plane outputs only GREYSCALE luminance — the composite pass bands any
 * luminance into screentone, so the fractal arrives as halftone dots without a
 * single new colour, and zero saturation keeps the accent mask off it. The c
 * parameter walks the classic |c| = 0.7885 circle very slowly, so the form is
 * always breathing but never fast enough to upstage the subject in front.
 *
 * One idea, two audiences: engineers recognise the Julia set, everyone else
 * sees a drawing that never repeats.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAspect;
varying vec2 vUv;

void main() {
  vec2 z = (vUv - 0.5) * vec2(uAspect, 1.0) * 3.1;

  // A slow walk around the Julia circle. 0.004 rad/s: a full lap takes ~26
  // minutes, so no two visits show the same page.
  float angle = 1.9 + uTime * 0.004;
  vec2 c = 0.7885 * vec2(cos(angle), sin(angle));

  float escape = 0.0;
  for (int i = 0; i < 44; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 16.0) break;
    escape += 1.0;
  }

  // Smooth iteration count, then mapped into the paper/tone luminance range —
  // never dark enough to hit the solid-ink band, so it stays a background.
  float t = escape / 44.0;
  t += (1.0 - log2(max(1.0, log2(max(1.0, dot(z, z)))))) / 44.0;
  // Dips to 0.30: after the composite's gamma this lands in the MID tone band,
  // so the set prints as screentone dots. 0.66 looked right in isolation but
  // gamma lifted it clean into the lit band and the whole plane printed as
  // blank paper.
  float lum = mix(1.0, 0.30, smoothstep(0.05, 0.95, t));

  // Vignette to paper so the plane has no visible rectangle edge.
  float edge = smoothstep(0.5, 0.28, distance(vUv, vec2(0.5)));
  lum = mix(1.0, lum, edge);

  gl_FragColor = vec4(vec3(lum), 1.0);
}
`

export function FractalPlane({
  frozen = false,
  width = 46,
  height = 26,
  position = [0, 4, -18] as [number, number, number],
}: {
  frozen?: boolean
  width?: number
  height?: number
  position?: [number, number, number]
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 137 },
          uAspect: { value: width / height },
        },
        vertexShader,
        fragmentShader,
        toneMapped: false,
      } as THREE.ShaderMaterialParameters),
    [width, height],
  )
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (frozen) return
    material.uniforms.uTime.value = 137 + state.clock.elapsedTime
  })

  return (
    <mesh ref={ref} position={position} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}
