import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text } from '@react-three/drei'
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
      <Box ref={meshRef} args={[3, 3, 3]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={isIdle ? "#64748b" : "#6366f1"} 
          wireframe={isIdle} 
          roughness={0.2}
          metalness={0.8}
        />
      </Box>
      <Text
        position={[0, -3, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {isIdle ? "Waiting for Prompt..." : "Loading Scene..."}
      </Text>
    </group>
  )
}
