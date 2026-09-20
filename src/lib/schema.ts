import { z } from 'zod';

export const BUILDING_TYPES = [
  'cottage',
  'cafe',
  'bookshop',
  'greenhouse',
  'studio',
  'observatory',
] as const;
export const DECORATIONS = ['flowers', 'tree', 'bench', 'mailbox'] as const;
export const TYPE_LABELS: Record<BuildingType, string> = {
  cottage: 'Cottage',
  cafe: 'Café',
  bookshop: 'Bookshop',
  greenhouse: 'Greenhouse',
  studio: 'Studio',
  observatory: 'Observatory',
};

export const placeSchema = z
  .object({
    id: z
      .string()
      .min(3, 'Choose a file id of at least 3 characters, e.g. moon-cafe.')
      .max(40, 'Keep the file id to 40 characters or fewer.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers, and single hyphens, e.g. moon-cafe.',
      ),
    name: z
      .string()
      .trim()
      .min(3, 'Give your place a name of at least 3 characters.')
      .max(32, 'Keep the name to 32 characters or fewer.'),
    creator: z
      .string()
      .min(1, 'Add your GitHub username so we can credit your contribution.')
      .max(39, 'A GitHub username can have at most 39 characters.')
      .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d]))*$/i, 'Use your GitHub username, without the @.'),
    plot: z.string().regex(/^[A-E][1-5]$/, 'Choose a plot between A1 and E5.'),
    building: z.enum(BUILDING_TYPES),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color, e.g. #A578BD.'),
    decoration: z.enum(DECORATIONS),
    story: z
      .string()
      .trim()
      .min(10, 'Tell us a little about your place (at least 10 characters).')
      .max(180, 'Keep the story to 180 characters or fewer.'),
  })
  .strict();

// Drafts may be unfinished, but their rendering options must always be valid.
export const draftSchema = placeSchema.extend({
  id: z.string().max(40),
  name: z.string().max(32),
  creator: z.string().max(39),
  story: z.string().max(180),
});

export type Place = z.infer<typeof placeSchema>;
export type BuildingType = (typeof BUILDING_TYPES)[number];
export type Decoration = (typeof DECORATIONS)[number];
export type PlaceEntry = { file: string; data: unknown };
export type ValidationResult = { places: Place[]; errors: string[] };

export function validatePlaces(entries: PlaceEntry[]): ValidationResult {
  const errors: string[] = [];
  const places: Place[] = [];
  const ids = new Set<string>();
  const plots = new Map<string, string>();
  for (const { file, data } of entries) {
    const result = placeSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues)
        errors.push(`${file} → ${issue.path.join('.') || 'file'}: ${issue.message}`);
      continue;
    }
    const place = result.data;
    if (file !== `${place.id}.json`)
      errors.push(`${file}: Rename this file to ${place.id}.json so its name matches the id.`);
    if (ids.has(place.id))
      errors.push(`${file}: The id "${place.id}" is already used. Choose another id.`);
    if (plots.has(place.plot))
      errors.push(
        `${file}: Plot ${place.plot} belongs to "${plots.get(place.plot)}". Choose an empty plot in the city.`,
      );
    ids.add(place.id);
    plots.set(place.plot, place.name);
    places.push(place);
  }
  return { places, errors };
}
