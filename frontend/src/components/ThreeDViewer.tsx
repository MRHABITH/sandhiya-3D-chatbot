import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useProgress
} from '@react-three/drei'
import { Suspense, lazy, useMemo } from 'react'

// Lazy load scenes for better performance
const SolarSystemScene = lazy(() => import('./scenes/SolarSystemScene'))
const HouseScene = lazy(() => import('./scenes/HouseScene'))
const EngineScene = lazy(() => import('./scenes/EngineScene'))
const HeartScene = lazy(() => import('./scenes/HeartScene'))
const CityScene = lazy(() => import('./scenes/CityScene'))
const PlaceholderScene = lazy(() => import('./scenes/PlaceholderScene'))
const DynamicScene = lazy(() => import('./scenes/DynamicScene'))
const AssetModelScene = lazy(() => import('./scenes/AssetModelScene'))

interface ThreeDViewerProps {
  activeScene: string
  isMini?: boolean
  dynamicObjects?: unknown[]
  assetId?: string
}

/* --------------------------------------------------
   LOADING COMPONENT
-------------------------------------------------- */

function Loader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg">
        Loading 3D Scene... {progress.toFixed(0)}%
      </div>
    </Html>
  )
}

/* --------------------------------------------------
   SCENE REGISTRY
   (Central control for all scenes)
-------------------------------------------------- */

const sceneRegistry: Record<string, React.ComponentType<Record<string, unknown>>> = {
  SolarSystemScene,
  HouseScene,
  EngineScene,
  HeartScene,
  CityScene,
  PlaceholderScene,
  DynamicScene,
  AssetModelScene
}

/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */

export default function ThreeDViewer({ activeScene, isMini = false, dynamicObjects = [], assetId = "" }: ThreeDViewerProps) {

  const SceneComponent = useMemo(() => {
    return sceneRegistry[activeScene] || PlaceholderScene
  }, [activeScene])

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      
      {/* Sleek Floating Scene Indicator */}
      {!isMini && activeScene !== 'none' && (
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 text-white/90 px-4 py-2 rounded-full text-sm font-medium tracking-wide shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Visualizing: {activeScene.replace(/Scene$/, '')}
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 5, 15], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >

        {/* Background Color */}
        {!isMini && <color attach="background" args={['#020617']} />}

        {/* Global Lighting */}
        <ambientLight intensity={0.6} />

        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.8}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <spotLight
          position={[0, 20, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* HDR Environment */}
        <Environment preset="sunset" background={false} />

        {/* Suspense Loader */}
        <Suspense fallback={<Loader />}>

          {/* Dynamic Scene Rendering */}
          <SceneComponent dynamicObjects={dynamicObjects} assetId={assetId} />

          {/* Contact Shadow */}
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.5}
            scale={50}
            blur={3}
            far={10}
          />

        </Suspense>

        {/* Camera Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={2}
          maxDistance={100}
          maxPolarAngle={Math.PI / 1.6}
          enableZoom={!isMini}
          enablePan={!isMini}
          autoRotate={isMini}
          autoRotateSpeed={2}
        />

      </Canvas>

    </div>
  )
}