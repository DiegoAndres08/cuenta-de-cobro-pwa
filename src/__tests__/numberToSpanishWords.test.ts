import { describe, expect, it } from 'vitest';
import { numberToSpanishPesos } from '../utils/numberToSpanishWords';

describe('numberToSpanishPesos', () => {
  it('handles zero and singular peso', () => {
    expect(numberToSpanishPesos(0)).toBe('Cero pesos');
    expect(numberToSpanishPesos(1)).toBe('Un peso');
    expect(numberToSpanishPesos(-50)).toBe('Cero pesos');
  });

  it('handles units, teens, twenties and tens with proper apocope', () => {
    expect(numberToSpanishPesos(2)).toBe('Dos pesos');
    expect(numberToSpanishPesos(15)).toBe('Quince pesos');
    expect(numberToSpanishPesos(20)).toBe('Veinte pesos');
    expect(numberToSpanishPesos(21)).toBe('Veintiún pesos');
    expect(numberToSpanishPesos(22)).toBe('Veintidós pesos');
    expect(numberToSpanishPesos(31)).toBe('Treinta y un pesos');
  });

  it('handles hundreds and thousands accurately', () => {
    expect(numberToSpanishPesos(100)).toBe('Cien pesos');
    expect(numberToSpanishPesos(101)).toBe('Ciento un pesos');
    expect(numberToSpanishPesos(500)).toBe('Quinientos pesos');
    expect(numberToSpanishPesos(1000)).toBe('Mil pesos');
    expect(numberToSpanishPesos(21000)).toBe('Veintiún mil pesos');
    expect(numberToSpanishPesos(100000)).toBe('Cien mil pesos');
    expect(numberToSpanishPesos(380000)).toBe('Trescientos ochenta mil pesos');
  });

  it('handles exact and non-exact millions with Spanish grammar', () => {
    expect(numberToSpanishPesos(1_000_000)).toBe('Un millón de pesos');
    expect(numberToSpanishPesos(2_000_000)).toBe('Dos millones de pesos');
    expect(numberToSpanishPesos(21_000_000)).toBe('Veintiún millones de pesos');
    expect(numberToSpanishPesos(1_500_000)).toBe('Un millón quinientos mil pesos');
    expect(numberToSpanishPesos(1_250_450)).toBe(
      'Un millón doscientos cincuenta mil cuatrocientos cincuenta pesos'
    );
    expect(numberToSpanishPesos(1_000_000_000)).toBe('Mil millones de pesos');
  });
});
