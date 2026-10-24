// Sous-ensemble de Three.js utilisé par la scène du hero : importer ces seules classes (au lieu de tout
// le module « three ») laisse Vite écarter le reste de la bibliothèque du fichier téléchargé.
export {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, Vector3, Clock, NormalBlending, AdditiveBlending,
} from 'three';
