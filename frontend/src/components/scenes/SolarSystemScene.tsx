import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

export default function SolarSystemScene() {
  const sunRef = useRef<THREE.Mesh>(null!)
  const earthGroupRef = useRef<THREE.Group>(null!)
  const earthRef = useRef<THREE.Mesh>(null!)
  const moonRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!sunRef.current || !earthGroupRef.current || !earthRef.current || !moonRef.current) return;
    
    // Rotate Sun
    sunRef.current.rotation.y += delta * 0.2

    // Orbit Earth around Sun
    earthGroupRef.current.rotation.y += delta * 0.5
    
    // Rotate Earth on axis
    earthRef.current.rotation.y += delta * 1.5

    // Fast orbit moon around earth
    moonRef.current.rotation.y += delta * 2.0
  })

  return (
    <group position={[0, -1, 0]}>
      {/* Sun */}
      <Sphere ref={sunRef} args={[2.5, 32, 32]}>
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
        <pointLight intensity={10} distance={50} color="#fcd34d" />
      </Sphere>

      {/* Orbit paths (simple rings) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.95, 8.05, 64]} />
        <meshBasicMaterial color="#334155" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>

      {/* Earth System */}
      <group ref={earthGroupRef}>
        <group position={[8, 0, 0]}>
          {/* Earth */}
          <Sphere ref={earthRef} args={[0.8, 32, 32]} castShadow receiveShadow>
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </Sphere>
          
          {/* Moon System */}
          <group ref={moonRef}>
            <Sphere args={[0.2, 16, 16]} position={[1.5, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
            </Sphere>
          </group>
        </group>
      </group>
    </group>
  )
}
