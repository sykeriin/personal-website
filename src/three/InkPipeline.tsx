import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { createGBufferMaterial } from './gbufferMaterial'
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
}

/** Cleared to "facing camera, infinitely far" so silhouettes register against nothing. */
const FAR_CLEAR = new THREE.Color(0, 0, 1)
const prevClear = new THREE.Color()

export function InkPipeline({ params, palette, frozen = false, slamRef }: Props) {
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
  }, [rig, resolved])

  // priority > 0 takes rendering over from R3F's default loop
  useFrame((state, delta) => {
    if (!rig) return
    const prevBackground = scene.background
    const prevOverride = scene.overrideMaterial
    gl.getClearColor(prevClear)
    const prevAlpha = gl.getClearAlpha()

    rig.gmat.uniforms.uCamFar.value = (camera as THREE.PerspectiveCamera).far
    scene.background = null
    scene.overrideMaterial = rig.gmat
    gl.setRenderTarget(rig.gbuffer)
    gl.setClearColor(FAR_CLEAR, 1)
    gl.clear(true, true, false)
    gl.render(scene, camera)

    scene.overrideMaterial = prevOverride
    scene.background = prevBackground
    gl.setRenderTarget(null)
    gl.setClearColor(prevClear, prevAlpha)

    rig.inkPass.uniforms.uTime.value = frozen ? 0 : state.clock.elapsedTime
    rig.inkPass.uniforms.uSlam.value = slamRef?.current ?? 0
    rig.composer.render(delta)
  }, 1)

  return null
}
