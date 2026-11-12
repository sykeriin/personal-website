import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

function Object3D({ variant }: { variant: string }) {
 const group=useRef<THREE.Group>(null!)
 useFrame((state,delta)=>{if(!group.current)return;group.current.rotation.y += delta*.13;group.current.rotation.x=THREE.MathUtils.lerp(group.current.rotation.x,state.pointer.y*.18, .04)})
 const accent=variant==='wildcard'?'#f3293f':variant==='afterhours'?'#a15c80':'#c4fb42'
 return <group ref={group} rotation={[.2,0,.15]}>
  <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.58,.035,16,128]}/><meshStandardMaterial color="#d7dbd5" metalness={.94} roughness={.2}/></mesh>
  <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.4,.012,12,128]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.6}/></mesh>
  {Array.from({length:24},(_,i)=><mesh key={i} position={[Math.sin(i*Math.PI/12)*1.5,0,Math.cos(i*Math.PI/12)*1.5]} rotation={[0,i*Math.PI/12,0]}><boxGeometry args={[.025,.025,.11]}/><meshStandardMaterial color="#dadada" metalness={1} roughness={.2}/></mesh>)}
  <mesh position={[0,-.08,0]}><cylinderGeometry args={[1.15,1.15,.08,80]}/><meshStandardMaterial color="#15171a" metalness={.85} roughness={.22}/></mesh>
  {Array.from({length:15},(_,i)=><mesh key={i} rotation={[Math.PI/2,0,0]} position={[0,.005,0]}><torusGeometry args={[.63+i*.034,.0025,4,100]}/><meshStandardMaterial color="#73787b" metalness={1} roughness={.4}/></mesh>)}
  <mesh position={[0,.02,0]}><cylinderGeometry args={[.46,.46,.1,64]}/><meshStandardMaterial color="#aaaeb1" metalness={.95} roughness={.15}/></mesh>
  {Array.from({length:8},(_,i)=><group key={i} rotation={[0,i*Math.PI/4,0]}><mesh position={[.55,.25,0]} rotation={[0,0,-.25]} scale={[1,.14,.23]}><sphereGeometry args={[.7,32,16]}/><meshStandardMaterial color={i%2?accent:'#d9d9d2'} metalness={.85} roughness={.2}/></mesh><mesh position={[.67,.34,0]} rotation={[0,0,-.3]}><cylinderGeometry args={[.007,.007,1.3,6]}/><meshStandardMaterial color="#eee" metalness={1} roughness={.2}/></mesh></group>)}
  <mesh position={[0,.42,0]}><sphereGeometry args={[.13,24,24]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1}/></mesh>
  <mesh position={[0,.2,0]} rotation={[0,0,1.1]}><boxGeometry args={[.035,3.7,.04]}/><meshStandardMaterial color="#e2e3dc" metalness={1} roughness={.12}/></mesh>
 </group>
}
export default function Scene({variant}:{variant:string}) {
 const [failed,setFailed]=useState(false)
 if(failed)return <div className="scene-fallback">✳</div>
 return <Canvas camera={{position:[0,3.2,5.3],fov:37}} gl={{antialias:true,alpha:true}} onError={()=>setFailed(true)} dpr={[1,1.5]}><ambientLight intensity={1.3}/><directionalLight position={[3,8,5]} intensity={4}/><pointLight position={[-4,2,-2]} color={variant==='wildcard'?'#ff2542':'#c8ff31'} intensity={25}/><Suspense fallback={null}><Float speed={1.4} rotationIntensity={.1} floatIntensity={.3}><Object3D variant={variant}/></Float><Sparkles count={35} size={2} scale={6} speed={.2} color="#fff"/><OrbitControls enableZoom={false} enablePan={false} autoRotate={false}/></Suspense></Canvas>
}

