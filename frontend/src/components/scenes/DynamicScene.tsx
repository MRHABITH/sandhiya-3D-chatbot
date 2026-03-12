import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DynamicObject {
  type: 'box' | 'sphere' | 'cylinder'
  color: string
  position: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
}

interface DynamicSceneProps {
  dynamicObjects?: DynamicObject[]
}

export default function DynamicScene({ dynamicObjects = [] }: DynamicSceneProps) {
  const groupRef = useRef<THREE.Group>(null!)

  // Optional: subtle breathing/swaying animation for the whole dynamic group
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  return (
    <group ref={groupRef}>
      {/* A generic subtle ambient light specifically for the dynamic scene */}
      <ambientLight intensity={0.4} />

      {dynamicObjects.map((obj, index) => {
        // Default values if omitted by LLM
        const pos = obj.position || [0, 0, 0]
        const scale = obj.scale || [1, 1, 1]
        const rot = obj.rotation || [0, 0, 0]

        return (
          <mesh 
            key={`dyn-obj-${index}`} 
            position={pos} 
            scale={scale} 
            rotation={rot as any}
            castShadow 
            receiveShadow
          >
            {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {obj.type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
            {obj.type === 'cylinder' && <cylinderGeometry args={[1, 1, 2, 32]} />}
            
            {/* Fallback Geometry if LLM hallucinates a type */}
            {!['box', 'sphere', 'cylinder'].includes(obj.type) && <boxGeometry args={[1, 1, 1]} />}

            <meshPhysicalMaterial 
               color={obj.color || 'gray'} 
               roughness={0.2}
               metalness={0.1}
               clearcoat={0.8}
               clearcoatRoughness={0.2}
            />
          </mesh>
        )
      })}

      {/* If LLM returns dynamic but no objects, show a fallback message or shape */}
      {dynamicObjects.length === 0 && (
         <mesh castShadow>
           <octahedronGeometry args={[1.5, 0]} />
           <meshStandardMaterial color="purple" wireframe />
         </mesh>
      )}
    </group>
  )
}
