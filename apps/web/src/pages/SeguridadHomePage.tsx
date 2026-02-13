import { ModuleHomePage } from '../components/tiles/ModuleHomePage';
import { seguridadTiles } from '../config/tiles';

export default function SeguridadHomePage() {
  return <ModuleHomePage config={seguridadTiles} />;
}
