import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Cone, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

export default function HouseScene() {
  const groupRef = useRef<THREE.Group>(null!)

  // Subtle slow rotation for viewing
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.1
  })

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Main Base */}
      <Box args={[6, 4, 5]} position={[0, 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </Box>

      {/* Roof */}
      <Cone args={[4.5, 3, 4]} position={[0, 5.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#991b1b" roughness={0.8} />
      </Cone>

      {/* Door */}
      <Box args={[1.2, 2.5, 0.2]} position={[0, 1.25, 2.6]} castShadow receiveShadow>
        <meshStandardMaterial color="#64748b" />
      </Box>

      {/* Windows */}
      <Box args={[1, 1, 0.2]} position={[-1.8, 2, 2.6]} castShadow>
        <meshStandardMaterial color="#93c5fd" metalness={0.8} roughness={0.1} />
      </Box>
      <Box args={[1, 1, 0.2]} position={[1.8, 2, 2.6]} castShadow>
        <meshStandardMaterial color="#93c5fd" metalness={0.8} roughness={0.1} />
      </Box>

      {/* Chimney */}
      <Cylinder args={[0.4, 0.4, 2]} position={[1.5, 5, -1]} castShadow receiveShadow>
        <meshStandardMaterial color="#78350f" />
      </Cylinder>
      
      {/* Ground/Yard Plot */}
      <Box args={[12, 0.2, 10]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#22c55e" />
      </Box>
      
      {/* Simple Tree */}
      <Cylinder args={[0.2, 0.2, 2]} position={[-4, 1, 2]} castShadow>
        <meshStandardMaterial color="#451a03" />
      </Cylinder>
      <Cone args={[1.5, 3, 8]} position={[-4, 3.5, 2]} castShadow>
        <meshStandardMaterial color="#166534" />
      </Cone>
    </group>
  )
}
