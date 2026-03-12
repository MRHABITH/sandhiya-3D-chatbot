import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Tube } from '@react-three/drei'
import * as THREE from 'three'

export default function HeartScene() {
  const heartRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!heartRef.current) return;
    // Beating animation: scale up and down using a sine wave
    const time = state.clock.elapsedTime
    // Heart rate ~60-80 bpm
    const beat = 1 + Math.sin(time * 5) * 0.05 + Math.sin(time * 5 + 0.5) * 0.05
    heartRef.current.scale.set(beat, beat, beat)

    // Gentle slow rotation to see all sides
    heartRef.current.rotation.y = time * 0.2
  })

  // Dummy curve for an artery
  class CustomCurve extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super();
    }
    getPoint(t: number, optionalTarget = new THREE.Vector3()) {
      const x = Math.sin(t * Math.PI) * 2;
      const y = t * 3 + 1;
      const z = Math.cos(t * Math.PI) * 2 - 2;
      return optionalTarget.set(x, y, z);
    }
  }

  const arteryPath = new CustomCurve()

  return (
    <group ref={heartRef} position={[0, -1, 0]}>
      {/* Main Heart Chambers (Simplified as dual spheres) */}
      <Sphere args={[2, 32, 32]} position={[-0.8, 1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.1} />
      </Sphere>
      <Sphere args={[1.8, 32, 32]} position={[1, 0.8, 0.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#b91c1c" roughness={0.4} metalness={0.1} />
      </Sphere>
      
      {/* Lower Ventricle area */}
      <Sphere args={[2.2, 32, 32]} position={[0, -1, 0.2]} scale={[1, 1.2, 0.8]} castShadow receiveShadow>
        <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.1} />
      </Sphere>

      {/* Aorta / Artery */}
      <Tube args={[arteryPath, 20, 0.6, 8, false]} castShadow receiveShadow>
         <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </Tube>
    </group>
  )
}
