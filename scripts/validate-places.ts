import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validatePlaces, type PlaceEntry } from '../src/lib/schema';

const directory = new URL('../places/', import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith('.json')).sort();
const entries: PlaceEntry[] = [];
const parseErrors: string[] = [];
for (const file of files) {
  try {
    entries.push({ file, data: JSON.parse(await readFile(new URL(file, directory), 'utf8')) });
  } catch (error) {
    parseErrors.push(
      `${file}: This is not valid JSON. Check quotation marks, commas, and brackets. ${error instanceof Error ? error.message : ''}`,
    );
  }
}
const result = validatePlaces(entries);
const errors = [...parseErrors, ...result.errors];
if (files.length === 0) errors.push(`No place files found in ${fileURLToPath(directory)}.`);
if (errors.length) {
  console.error(
    `\nLet's fix ${errors.length} thing${errors.length === 1 ? '' : 's'} before your place opens:\n`,
  );
  errors.forEach((error) => console.error(`  • ${error}`));
  process.exitCode = 1;
} else console.log(`All ${result.places.length} places look good. Welcome to the neighborhood!`);
