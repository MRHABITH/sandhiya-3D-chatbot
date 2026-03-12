import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import * as THREE from 'three'

interface BuildingProps {
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  color: string;
}

function Building({ position, height, width, depth, color }: BuildingProps) {
  // Center pivot is 0, so move Y up by half height
  const yPos = position[1] + height / 2;
  
  return (
    <Box args={[width, height, depth]} position={[position[0], yPos, position[2]]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </Box>
  )
}

export default function CityScene() {
  const cityGroup = useRef<THREE.Group>(null!)

  // Generate random city grid
  const buildings = useMemo(() => {
    const list: BuildingProps[] = []
    const colors = ["#cbd5e1", "#e2e8f0", "#94a3b8", "#f1f5f9", "#64748b"]
    
    for (let x = -8; x <= 8; x += 3) {
      for (let z = -8; z <= 8; z += 3) {
        if (Math.random() > 0.3) { // 70% chance of building here
          list.push({
            position: [x + (Math.random() - 0.5), 0, z + (Math.random() - 0.5)],
            height: Math.random() * 8 + 2,
            width: Math.random() * 1.5 + 1,
            depth: Math.random() * 1.5 + 1,
            color: colors[Math.floor(Math.random() * colors.length)]
          })
        }
      }
    }
    return list;
  }, [])

  useFrame((_, delta) => {
    if (!cityGroup.current) return;
    // Very slow pan around the city
    cityGroup.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={cityGroup} position={[0, -2, 0]}>
      {/* Ground plane */}
      <Box args={[22, 0.5, 22]} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#475569" />
      </Box>

      {/* Buildings */}
      {buildings.map((bInfo, i) => (
        <Building key={i} {...bInfo} />
      ))}
    </group>
  )
}
