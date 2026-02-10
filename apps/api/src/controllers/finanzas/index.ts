export { getBancos, createBanco, updateBanco } from './banco.controller.js';

export {
  getCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  deleteCuenta,
} from './cuenta.controller.js';

export {
  getMovimientos,
  getMovimientoById,
  createMovimiento,
  updateMovimiento,
  anularMovimiento,
  confirmarMovimiento,
} from './movimiento.controller.js';

export { getDashboard, getSaldos } from './dashboard.controller.js';

export { createTransferencia } from './transferencia.controller.js';
