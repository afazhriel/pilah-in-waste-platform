/**
 * Indonesian localization formatters for Pilah.in
 * Standard: IDR, metric system, Asia/Jakarta (WIB) timezone
 */

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  // Financial calculations use integer Rupiah rounding
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);

  // Replace default "IDR" or "Rp" spaces for fintech precision "Rp 150.000"
  return formatted.replace(/\s+/g, ' ');
}

export function formatNumberID(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatWeight(kg: number): string {
  if (isNaN(kg) || kg === null || kg === undefined) return '0,00 kg';
  return `${formatNumberID(kg, 2)} kg`;
}

export function formatWeightGrams(kg: number): string {
  const grams = Math.round(kg * 1000);
  return `${new Intl.NumberFormat('id-ID').format(grams)} g`;
}

export function formatDateID(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateTimeID(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    const datePart = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    return `${datePart}, ${timePart} WIB`;
  } catch {
    return isoString;
  }
}

export function formatTimeOnlyID(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return (
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date) + ' WIB'
    );
  } catch {
    return isoString;
  }
}
