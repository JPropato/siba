import { ModuleHomePage } from '../components/tiles/ModuleHomePage';
import { adminTiles } from '../config/tiles';

export default function AdministracionHomePage() {
  return <ModuleHomePage config={adminTiles} />;
}
