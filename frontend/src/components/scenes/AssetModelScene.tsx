import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { getAssetUrl } from '../../lib/assetLibrary'

interface AssetModelSceneProps {
  assetId?: string
}

// Separate component for the actual GLTF model so Suspense handles it
function Model({ url }: { url: string }) {
  // useGLTF inherently caches the model down to the binary level.
  // Instant load for previously seen models.
  const { scene } = useGLTF(url)
  
  // Clone to safely remount
  const clone = scene.clone()

  return (
    <Center>
      <primitive object={clone} scale={2} castShadow receiveShadow />
    </Center>
  )
}

export default function AssetModelScene({ assetId }: AssetModelSceneProps) {
  const groupRef = useRef<THREE.Group>(null!)
  
  // If assetId is already a path/URL, use it directly. Otherwise, fall back to the library.
  const isDirectUrl = assetId?.startsWith('/') || assetId?.startsWith('http');
  let modelUrl = isDirectUrl ? assetId : getAssetUrl(assetId);

  // If it's a relative path (like /models/...), prefix it with the API base URL
  // because the backend is now serving these models.
  if (modelUrl?.startsWith('/') && !modelUrl.startsWith('//')) {
    const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
    modelUrl = `${API_BASE_URL}${modelUrl}`;
  }

  useFrame(() => {
    if (!groupRef.current) return
    // Simple idle rotation
    groupRef.current.rotation.y += 0.005
  })

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.8} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={2} />
      
      {modelUrl ? (
        <Model url={modelUrl} />
      ) : (
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}
