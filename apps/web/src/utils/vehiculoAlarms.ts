/**
 * Helpers para calcular alarmas visuales de vehiculos.
 * - Aceite: rojo si > 90 dias desde ultimo cambio, ambar si > 75
 * - VTV: rojo si vencida, ambar si vence en 30 dias
 * - Licencia conductor: rojo si vencida, ambar si vence en 30 dias
 */

type AlarmStatus = { color: 'green' | 'amber' | 'red' | 'slate'; label: string };

/** Dias transcurridos desde una fecha (positivo = dias en el pasado) */
export function getDaysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/** Dias restantes hasta vencimiento (negativo = ya vencido) */
export function getDaysToExpiration(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Estado del cambio de aceite (alarma cada 90 dias) */
export function getOilChangeStatus(fechaCambioAceite: string | null | undefined): AlarmStatus {
  const days = getDaysSince(fechaCambioAceite);
  if (days === null) return { color: 'slate', label: 'Sin dato' };
  if (days > 90) return { color: 'red', label: 'Vencido' };
  if (days > 75) return { color: 'amber', label: 'Próximo' };
  return { color: 'green', label: 'OK' };
}

/** Estado del VTV */
export function getVTVStatus(fechaVencimientoVTV: string | null | undefined): AlarmStatus {
  const days = getDaysToExpiration(fechaVencimientoVTV);
  if (days === null) return { color: 'slate', label: 'Sin dato' };
  if (days < 0) return { color: 'red', label: 'Vencida' };
  if (days <= 30) return { color: 'amber', label: `${days}d` };
  return { color: 'green', label: 'OK' };
}

/** Estado de la licencia del conductor */
export function getLicenseStatus(fechaVencimientoRegistro: string | null | undefined): AlarmStatus {
  const days = getDaysToExpiration(fechaVencimientoRegistro);
  if (days === null) return { color: 'slate', label: 'Sin dato' };
  if (days < 0) return { color: 'red', label: 'Vencida' };
  if (days <= 30) return { color: 'amber', label: `${days}d` };
  return { color: 'green', label: 'OK' };
}
