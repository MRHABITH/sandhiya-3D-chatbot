import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface PlaceholderSceneProps {
  isIdle?: boolean;
}

export default function PlaceholderScene({ isIdle = false }: PlaceholderSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.2
    meshRef.current.rotation.y += delta * 0.3
    
    // Gentle floating
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5
  })

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color={isIdle ? "#cbd5e1" : "#2563eb"} 
          emissive={isIdle ? "#000000" : "#2563eb"}
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.6}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.4}
        color={isIdle ? "#64748b" : "#2563eb"}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKGGKm_O7pMGRMjcD68W4.woff"
      >
        {isIdle ? "Assistant Ready" : "Building 3D Experience..."}
      </Text>
    </group>
  )
}
