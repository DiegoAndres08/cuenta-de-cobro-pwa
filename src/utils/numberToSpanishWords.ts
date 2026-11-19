const UNITS = [
  '',
  'un',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
];

const TEENS = [
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
];

const TWENTIES = [
  'veinte',
  'veintiún',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];

const TENS = [
  '',
  '',
  'veinte',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
];

const HUNDREDS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

/**
 * Converts an integer from 1 to 999 into Spanish words (apocopated form before masculine nouns:
 * "un", "veintiún", "treinta y un", ideal for "mil", "millón", "pesos").
 */
function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]);
  }

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(UNITS[remainder]);
    } else if (remainder < 20) {
      parts.push(TEENS[remainder - 10]);
    } else if (remainder < 30) {
      parts.push(TWENTIES[remainder - 20]);
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (unit === 0) {
        parts.push(TENS[ten]);
      } else {
        parts.push(`${TENS[ten]} y ${UNITS[unit]}`);
      }
    }
  }

  return parts.join(' ');
}

function convertThousandsGroup(n: number): string {
  if (n === 0) return '';
  if (n === 1) return 'mil';
  return `${convertHundreds(n)} mil`;
}

/**
 * Converts a non-negative integer into Colombian Spanish currency wording with "pesos".
 * Examples:
 *  - 0 -> "Cero pesos"
 *  - 1 -> "Un peso"
 *  - 380000 -> "Trescientos ochenta mil pesos"
 *  - 1000000 -> "Un millón de pesos"
 *  - 1500000 -> "Un millón quinientos mil pesos"
 */
export function numberToSpanishPesos(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;

  if (safeAmount === 0) {
    return 'Cero pesos';
  }

  if (safeAmount === 1) {
    return 'Un peso';
  }

  const parts: string[] = [];

  // Supports up to 999,999,999,999 (novecientos noventa y nueve mil novecientos noventa y nueve millones...)
  const millions = Math.floor(safeAmount / 1_000_000);
  const restAfterMillions = safeAmount % 1_000_000;
  const thousands = Math.floor(restAfterMillions / 1_000);
  const units = restAfterMillions % 1_000;

  if (millions > 0) {
    if (millions === 1) {
      parts.push('un millón');
    } else if (millions < 1_000) {
      parts.push(`${convertHundreds(millions)} millones`);
    } else {
      const thousandsOfMillions = Math.floor(millions / 1_000);
      const remMillions = millions % 1_000;
      const millionParts: string[] = [];
      if (thousandsOfMillions > 0) {
        millionParts.push(convertThousandsGroup(thousandsOfMillions));
      }
      if (remMillions > 0) {
        millionParts.push(convertHundreds(remMillions));
      }
      parts.push(`${millionParts.join(' ')} millones`);
    }
  }

  if (thousands > 0) {
    parts.push(convertThousandsGroup(thousands));
  }

  if (units > 0) {
    parts.push(convertHundreds(units));
  }

  const numberWords = parts.join(' ').trim();
  const isExactMillions = millions > 0 && restAfterMillions === 0;
  const suffix = isExactMillions ? 'de pesos' : 'pesos';

  const fullSentence = `${numberWords} ${suffix}`;
  return fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1);
}
