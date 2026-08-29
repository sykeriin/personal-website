import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { hotspots, useHotspots } from './hotspots'

/**
 * A drawn silhouette extruded into a solid.
 *
 * Props are shapes rather than assemblies of boxes and spheres because the ink
 * shader draws each object's OUTLINE — so a prop's identity lives entirely in
 * its silhouette, and a silhouette that was authored as a drawing reads as one.
 * A bevel is left on so the rim catches a crease line and the object doesn't
 * look like a flat sticker.
 */
export function InkShape({
  shape,
  depth = 0.09,
  material,
  ...rest
}: {
  shape: THREE.Shape
  depth?: number
  material: THREE.Material
} & Omit<React.ComponentProps<'mesh'>, 'geometry' | 'material'>) {
  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelOffset: 0,
      bevelSegments: 1,
      curveSegments: 14,
    })
    geo.center()
    geo.computeVertexNormals()
    return geo
  }, [shape, depth])

  return <mesh geometry={geometry} material={material} {...rest} />
}

/**
 * Makes a prop clickable in explore mode.
 *
 * Hover changes scale a touch and nothing else — the design rule is that hover
 * is a line-weight change, not a glow, a lift and a shadow all at once.
 *
 * Clicks are ignored when they originated on a DOM control sitting over the
 * canvas: R3F raycasts every pointer event on the root element, so without this
 * guard clicking a link would also activate whatever prop happens to be behind
 * it.
 */
export function Hotspot({
  id,
  enabled,
  children,
}: {
  id: string
  enabled: boolean
  children: ReactNode
}) {
  const { hovered, active } = useHotspots()
  const lit = enabled && (hovered === id || active === id)

  if (!enabled) return <group>{children}</group>

  const fromOverlay = (event: { nativeEvent: Event }) => {
    const target = event.nativeEvent.target as HTMLElement | null
    return Boolean(target?.closest?.('a,button,input,.chapter,.edge-tabs,.reveal'))
  }

  return (
    <group
      scale={lit ? 1.06 : 1}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (fromOverlay(event)) return
        hotspots.hover(id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        hotspots.hover(null)
        document.body.style.cursor = ''
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (fromOverlay(event)) return
        hotspots.activate(id)
      }}
    >
      {children}
    </group>
  )
}
