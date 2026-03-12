// A registry mapping AI-generated asset_ids to actual GLB/GLTF file URLs.
// In a full production app, these would be hosted alongside the app (e.g. /models/car.glb) 
// or on a fast CDN.

export const ASSET_LIBRARY: Record<string, string> = {
  // Example dummy mappings. 
  // We point to some reliable public GLTF models or local paths here.
  // For demonstration, these can be replaced with actual hosted models.
  "car_accident": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  "dinosaur": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb",
  "spaceship": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb",
  "duck": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
}

export function getAssetUrl(assetId: string | undefined): string | null {
  if (!assetId) return null;
  // Try to find the exact asset, or fallback to the damaged helmet as a generic placeholder
  // so the user always sees a high-quality model instead of a crash.
  return ASSET_LIBRARY[assetId] || ASSET_LIBRARY["car_accident"];
}
