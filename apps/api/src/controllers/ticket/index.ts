export {
  getAll,
  getById,
  create,
  update,
  deleteOne,
  getHistorial,
} from './ticket-crud.controller.js';

export { cambiarEstado } from './ticket-status.controller.js';

export { addNota } from './ticket-notes.controller.js';

export { getDashboard } from './ticket-dashboard.controller.js';

export { getReferenceData } from './ticket-reference.controller.js';

export { getPendientesPorZona, getPendientesPorZonaPDF } from './ticket-envio.controller.js';
