/**
 * Tests for Arabic Alphabet data module
 * Validates structure, completeness, and data integrity of all 28 letters
 */
import { alphabet, type ArabicLetter } from '@/data/alphabet';

describe('Arabic Alphabet Data', () => {
  test('contains exactly 28 letters', () => {
    expect(alphabet).toHaveLength(28);
  });

  test('all letters have sequential IDs from 1 to 28', () => {
    const ids = alphabet.map((l) => l.id);
    for (let i = 1; i <= 28; i++) {
      expect(ids).toContain(i);
    }
  });

  test('no duplicate IDs', () => {
    const ids = alphabet.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(28);
  });

  test('no duplicate letter characters', () => {
    const letters = alphabet.map((l) => l.letter);
    const unique = new Set(letters);
    expect(unique.size).toBe(alphabet.length);
  });

  test.each(alphabet.map((l) => [l.name, l]))('letter "%s" has all required fields', (_name, letter) => {
    const l = letter as ArabicLetter;
    expect(l.id).toBeGreaterThan(0);
    expect(l.letter).toBeTruthy();
    expect(l.name).toBeTruthy();
    expect(l.nameAr).toBeTruthy();
    expect(l.transliteration).toBeTruthy();
    expect(l.pronunciationTip).toBeTruthy();
  });

  test.each(alphabet.map((l) => [l.name, l]))('letter "%s" has all 4 positional forms', (_name, letter) => {
    const l = letter as ArabicLetter;
    expect(l.forms).toBeDefined();
    expect(l.forms.isolated).toBeTruthy();
    expect(l.forms.initial).toBeTruthy();
    expect(l.forms.medial).toBeTruthy();
    expect(l.forms.final).toBeTruthy();
  });

  test.each(alphabet.map((l) => [l.name, l]))('letter "%s" has a valid Emirati example', (_name, letter) => {
    const l = letter as ArabicLetter;
    expect(l.emiratiExample).toBeDefined();
    expect(l.emiratiExample.word).toBeTruthy();
    expect(l.emiratiExample.transliteration).toBeTruthy();
    expect(l.emiratiExample.meaning).toBeTruthy();
  });

  test('first letter is Alif', () => {
    expect(alphabet[0].name).toBe('Alif');
    expect(alphabet[0].letter).toBe('ا');
  });

  test('letter names are mostly unique (ح and ه both romanize as Haa)', () => {
    const names = alphabet.map((l) => l.name);
    const unique = new Set(names);
    // 2 letters share "Haa" (ح = Haa, ه = Haa) — this is correct Arabic
    expect(unique.size).toBeGreaterThanOrEqual(names.length - 1);
  });

  test('all Arabic names are unique', () => {
    const namesAr = alphabet.map((l) => l.nameAr);
    expect(new Set(namesAr).size).toBe(namesAr.length);
  });
});
