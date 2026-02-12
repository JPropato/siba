export {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from './proveedor.controller.js';

export {
  getFacturas,
  getFacturaById,
  createFactura,
  updateFactura,
  anularFactura,
} from './facturaProveedor.controller.js';

export { registrarPago } from './pagoFactura.controller.js';

export {
  getCheques,
  getChequeById,
  createCheque,
  updateCheque,
  depositarCheque,
  cobrarCheque,
  endosarCheque,
  rechazarCheque,
  anularCheque,
  venderCheque,
  venderBatchCheques,
  acreditarVentaCheques,
} from './cheque.controller.js';
