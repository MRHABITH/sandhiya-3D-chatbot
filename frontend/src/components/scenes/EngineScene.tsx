import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cylinder, Box } from '@react-three/drei'
import * as THREE from 'three'

export default function EngineScene() {
  const crankShaftRef = useRef<THREE.Group>(null!)
  const pistonRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!crankShaftRef.current || !pistonRef.current) return;
    // Rotate crankshaft
    crankShaftRef.current.rotation.x += delta * 5

    // Move piston up and down based on crankshaft rotation
    const rotation = crankShaftRef.current.rotation.x
    pistonRef.current.position.y = Math.sin(rotation) * 1.5 + 2
  })

  return (
    <group position={[0, -2, 0]}>
      {/* Engine Block representation */}
      <Box args={[4, 6, 4]}>
        <meshStandardMaterial color="#334155" wireframe transparent opacity={0.3} />
      </Box>

      {/* Crankshaft */}
      <group ref={crankShaftRef} position={[0, 0, 0]}>
        <Cylinder args={[0.3, 0.3, 3]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </Cylinder>
      </group>

      {/* Piston System */}
      <group ref={pistonRef}>
        {/* Piston Head */}
        <Cylinder args={[1.2, 1.2, 1.5]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </Cylinder>
        {/* Connecting Rod (simplified moving part) */}
        <Cylinder args={[0.2, 0.2, 2.5]} position={[0, -2, 0]}>
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </Cylinder>
      </group>
    </group>
  )
}
