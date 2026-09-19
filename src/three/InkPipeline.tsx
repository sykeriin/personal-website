import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import {
  createGBufferCutoutMaterial,
  createGBufferMaterial,
  createGBufferStickerCutoutMaterial,
  createGBufferStickerMaterial,
} from './gbufferMaterial'
import { createInkCompositeShader } from './shaders/inkComposite'
import { type InkParams } from './inkConfig'
import { readInkTheme, type InkPalette } from './theme'

type Rig = {
  gbuffer: THREE.WebGLRenderTarget
  gmat: THREE.ShaderMaterial
  composer: EffectComposer
  inkPass: ShaderPass
}

type Props = {
  params: InkParams
  palette?: InkPalette
  /** Frozen boil for prefers-reduced-motion: lines stay wobbly, they stop moving. */
  frozen?: boolean
  /** 0..1 impact intensity for the route-change slam. Read every frame. */
  slamRef?: { current: number }
  /** Colour bloom target: screen UV + boost. Damped here, read every frame. */
  bloomRef?: { x: number; y: number; boost: number }
}

/** Cleared to "facing camera, infinitely far" so silhouettes register against nothing. */
const FAR_CLEAR = new THREE.Color(0, 0, 1)
const prevClear = new THREE.Color()

export function InkPipeline({ params, palette, frozen = false, slamRef, bloomRef }: Props) {
  const resolved = palette ?? readInkTheme().palette
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  // Creation and disposal share one lifecycle. Building these in useMemo and
  // disposing in an effect cleanup breaks under StrictMode's double-mount: the
  // second mount reuses an already-disposed composer and renders nothing.
  const [rig, setRig] = useState<Rig | null>(null)

  useEffect(() => {
    const gbuffer = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      generateMipmaps: false,
      samples: 0,
    })
    // Beauty holds LDR paper colours and does not need float — keeping the
    // composer's ping-pong targets 8-bit halves the texture memory bill.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.UnsignedByteType,
      samples: 0,
    })
    const composer = new EffectComposer(gl, target)
    composer.addPass(new RenderPass(scene, camera))
    const inkPass = new ShaderPass(createInkCompositeShader())
    inkPass.uniforms.tGBuffer.value = gbuffer.texture
    composer.addPass(inkPass)
    composer.addPass(new OutputPass())
    const gmat = createGBufferMaterial()

    setRig({ gbuffer, gmat, composer, inkPass })
    return () => {
      setRig(null)
      gbuffer.dispose()
      gmat.dispose()
      composer.dispose()
    }
  }, [gl, scene, camera])

  useEffect(() => {
    if (!rig) return
    const w = Math.max(1, Math.floor(size.width * dpr))
    const h = Math.max(1, Math.floor(size.height * dpr))
    rig.gbuffer.setSize(w, h)
    rig.composer.setPixelRatio(dpr)
    rig.composer.setSize(size.width, size.height)
    rig.inkPass.uniforms.uResolution.value.set(w, h)
    rig.inkPass.uniforms.uPixelRatio.value = dpr
  }, [rig, size, dpr])

  useEffect(() => {
    if (!rig) return
    const u = rig.inkPass.uniforms
    u.uBoilFps.value = params.boilFps
    u.uWobbleAmp.value = params.wobbleAmp
    u.uWobbleScale.value = params.wobbleScale
    u.uBaseWidth.value = params.baseWidth
    u.uNearBoost.value = params.nearBoost
    u.uDepthGain.value = params.depthGain
    u.uNormalGain.value = params.normalGain
    u.uEdgeBias.value = params.edgeBias
    u.uEdgeSoft.value = params.edgeSoft
    u.uSlopeComp.value = params.slopeComp
    u.uBreakLow.value = params.breakLow
    u.uBreakHigh.value = params.breakHigh
    u.uBreakScale.value = params.breakScale
    u.uDotPitch.value = params.dotPitch
    u.uToneAngle.value = params.toneAngle
    u.uDotMax.value = params.dotMax
    u.uBands.value = params.bands
    u.uSolidStart.value = params.solidStart
    u.uToneFar.value = params.toneFar
    u.uToneStrength.value = params.toneStrength
  }, [rig, params])

  useEffect(() => {
    if (!rig) return
    const u = rig.inkPass.uniforms
    u.uPaper.value.set(resolved.paper)
    u.uInk.value.set(resolved.ink)
    u.uInkSoft.value.set(resolved.inkSoft)
    u.uAccent.value.set(resolved.accent)
    u.uAccentB.value.set(resolved.accentB ?? resolved.accent)
  }, [rig, resolved])

  // priority > 0 takes rendering over from R3F's default loop
  useFrame((state, delta) => {
    if (!rig) return
    const prevBackground = scene.background
    const prevOverride = scene.overrideMaterial
    gl.getClearColor(prevClear)
    const prevAlpha = gl.getClearAlpha()

    const far = (camera as THREE.PerspectiveCamera).far
    rig.gmat.uniforms.uCamFar.value = far
    scene.background = null

    // Phase 1: everything except cutout sprites, via overrideMaterial (which
    // never touches mesh.material — troika text stays untouched; assigning to
    // its material property is what double-exposed the glyphs).
    const cutouts: THREE.Mesh[] = []
    const texts: THREE.Mesh[] = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.visible) return
      if (mesh.userData.inkCutout || mesh.userData.inkSticker) {
        cutouts.push(mesh)
        mesh.visible = false
        return
      }
      // Troika text: under the override material its glyph quad renders as a
      // solid plane, and the edge pass then outlines that invisible rectangle
      // — the "random boxes" beside every sign. Text is print, not geometry;
      // it gets no ink of its own and simply sits on whatever is behind it.
      if ((mesh.material as { isTroikaTextMaterial?: boolean }).isTroikaTextMaterial) {
        texts.push(mesh)
        mesh.visible = false
      }
    })
    scene.overrideMaterial = rig.gmat
    gl.setRenderTarget(rig.gbuffer)
    gl.setClearColor(FAR_CLEAR, 1)
    gl.clear(true, true, false)
    gl.render(scene, camera)
    scene.overrideMaterial = prevOverride
    for (const mesh of texts) mesh.visible = true

    // Phase 2: cutouts alone, wearing cached cutout depth materials that keep
    // their alpha test, into the same target without clearing.
    if (cutouts.length > 0) {
      const hidden: THREE.Object3D[] = []
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh && !mesh.userData.inkCutout && !mesh.userData.inkSticker && mesh.visible) {
          hidden.push(mesh)
          mesh.visible = false
        }
      })
      for (const mesh of cutouts) {
        mesh.visible = true
        const src = mesh.material as THREE.Material & { map?: THREE.Texture | null }
        mesh.userData.__inkSaved = src
        if (mesh.userData.inkSticker && (src as { map?: THREE.Texture | null }).map) {
          // A textured cutout that must also stay true-colour always — the
          // character sprite, whose whole point is its own multi-hue art.
          let stick = mesh.userData.__inkStickerCutout as THREE.ShaderMaterial | undefined
          if (!stick || stick.uniforms.map.value !== src.map) {
            stick = createGBufferStickerCutoutMaterial(src.map as THREE.Texture, src.alphaTest || 0.35)
            mesh.userData.__inkStickerCutout = stick
          }
          stick.uniforms.uCamFar.value = far
          mesh.material = stick
        } else if (mesh.userData.inkSticker) {
          let stick = mesh.userData.__inkSticker as THREE.ShaderMaterial | undefined
          if (!stick) {
            stick = createGBufferStickerMaterial()
            mesh.userData.__inkSticker = stick
          }
          stick.uniforms.uCamFar.value = far
          mesh.material = stick
        } else {
          let cut = mesh.userData.__inkCutout as THREE.ShaderMaterial | undefined
          if (!cut || cut.uniforms.map.value !== src.map) {
            cut = createGBufferCutoutMaterial(src.map as THREE.Texture, src.alphaTest || 0.35)
            mesh.userData.__inkCutout = cut
          }
          cut.uniforms.uCamFar.value = far
          mesh.material = cut
        }
      }
      const prevAuto = gl.autoClear
      gl.autoClear = false
      gl.render(scene, camera)
      gl.autoClear = prevAuto
      for (const mesh of cutouts) {
        mesh.material = mesh.userData.__inkSaved
        delete mesh.userData.__inkSaved
      }
      for (const obj of hidden) obj.visible = true
    } else {
      for (const mesh of cutouts) mesh.visible = true
    }

    scene.background = prevBackground
    gl.setRenderTarget(null)
    gl.setClearColor(prevClear, prevAlpha)

    rig.inkPass.uniforms.uTime.value = frozen ? 0 : state.clock.elapsedTime
    rig.inkPass.uniforms.uSlam.value = slamRef?.current ?? 0

    if (bloomRef) {
      const target = rig.inkPass.uniforms.uBloom.value as THREE.Vector3
      // Radius in screen heights: a small always-on halo teaches the mechanic;
      // hover and pick-up widen it. Frozen (reduced motion) pins a generous
      // static bloom instead of chasing the pointer.
      const radius = frozen ? 0.5 : 0.07 + bloomRef.boost
      const speed = 4.5
      target.x = THREE.MathUtils.damp(target.x, frozen ? 0.5 : bloomRef.x, speed, delta)
      target.y = THREE.MathUtils.damp(target.y, frozen ? 0.55 : bloomRef.y, speed, delta)
      target.z = THREE.MathUtils.damp(target.z, radius, 3, delta)
    }
    rig.composer.render(delta)
  }, 1)

  return null
}
