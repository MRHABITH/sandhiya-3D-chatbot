import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatWidget from './components/ChatWidget'
import ThreeDViewer from './components/ThreeDViewer'

function App() {
  const [expandedScene, setExpandedScene] = useState<{ name: string; dynamicObjects?: unknown[]; assetId?: string } | null>(null)

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative bg-gray-100">
      {/* Main Chat Interface */}
      <div className="w-full h-full max-w-md sm:max-w-lg relative z-10 flex flex-col">
        <ChatWidget onExpandScene={(scene, assetId, dynamicObjects) =>
          setExpandedScene({ name: scene, assetId, dynamicObjects })
        } />
      </div>

      {/* Fullscreen Expanded 3D View Modal */}
      <AnimatePresence>
        {expandedScene && expandedScene.name && expandedScene.name !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-gray-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-semibold text-lg">
                  {expandedScene.name.replace(/Scene$/, '')} - 3D Viewer
                </h2>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={() => setExpandedScene(null)}
                className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Close 3D Viewer"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 3D Viewer Container */}
            <div className="flex-1 relative bg-black overflow-hidden">
              <ThreeDViewer 
                activeScene={expandedScene.name} 
                isMini={false}
                dynamicObjects={expandedScene.dynamicObjects} 
                assetId={expandedScene.assetId} 
              />
              
              {/* Control Instructions */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-black/60 backdrop-blur-sm text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-white/20">
                <p className="font-medium mb-2">Controls:</p>
                <p>🖱️ Drag to rotate • 🔄 Scroll to zoom • 👆 Right-click + drag to pan</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
