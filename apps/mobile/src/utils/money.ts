/** Convierte "1234,5" o "1234.50" a unidades menores ("123450"). `null` si no es válido. */
export function parseAmountToMinor(value: string): string | null {
  const cleaned = value.trim().replace(/\s/g, '');

  if (cleaned === '') return '0';
  if (!/^\d{1,15}([.,]\d{1,2})?$/.test(cleaned)) return null;

  const [integer = '', fraction = ''] = cleaned.split(/[.,]/);

  return `${integer}${fraction.padEnd(2, '0')}`;
}

/** Solo para mostrar: los cálculos reales viven en `packages/domain`. */
export function formatMinor(minor: string, currency: string): string {
  const value = Number(BigInt(minor)) / 100;

  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);
  } catch {
    return value.toFixed(2);
  }
}
