export type ImmutableTraits = {
  name?: string | null;
  gender?: string | null;
  race?: string | null;        // subrace label if present (e.g. "High Elf")
  className?: string | null;

  skin?: number | null;        // index
  hair?: number | null;        // index
  hairColor?: string | null;   // e.g. "brown3"
  facialHair?: number | null;  // index (only meaningful for male)
  tattoo?: number | null;      // index
  tattooColor?: string | null; // e.g. "red2"
  adornment?: number | null;   // index
};

// Normalize/capitalize race label for metadata
function prettyRaceLabel(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const key = s.toLowerCase().replace(/[\s_-]+/g, '');
  const MAP: Record<string, string> = {
    human: 'Human',
    dwarf: 'Dwarf',
    elf: 'Elf',
    halforc: 'Half-Orc',
    deepelf: 'Deep Elf',
    highelf: 'High Elf',
    woodelf: 'Wood Elf',
  };

  if (MAP[key]) return MAP[key];

  // Generic title-case fallback (split on space/underscore/hyphen)
  const parts = s.split(/[\s_-]+/g).filter(Boolean);
  if (!parts.length) return null;
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// Normalize/capitalize gender label for metadata
function prettyGender(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const key = s.toLowerCase();
  if (key === 'male') return 'Male';
  if (key === 'female') return 'Female';
  // Generic title-case fallback
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export type NralAttribute = {
  trait_type: string;
  value: string | number | boolean;
};

// Omit these numeric features from attributes if their value is 0
const OMIT_ZERO_FEATURES = new Set<keyof ImmutableTraits>(['tattoo', 'adornment']);
function omitZero<K extends keyof ImmutableTraits>(key: K, val: ImmutableTraits[K]) {
  // treat both number 0 and string '0' as zero for safety
  return OMIT_ZERO_FEATURES.has(key) && (val === 0 || val === '0');
}

export function buildAttributesFromTraits(traits?: ImmutableTraits | null): NralAttribute[] {
  if (!traits) return [];

  const attrs: NralAttribute[] = [];

  if (traits.name) attrs.push({ trait_type: "Name", value: traits.name });

  const raceLabel = prettyRaceLabel(traits.race);
  if (raceLabel) attrs.push({ trait_type: "Race", value: raceLabel });
  const genderLabel = prettyGender(traits.gender);
  if (genderLabel) attrs.push({ trait_type: "Gender", value: genderLabel });
  if (traits.className) attrs.push({ trait_type: "Class", value: traits.className });

  if (traits.skin != null) attrs.push({ trait_type: "Skin", value: traits.skin });
  if (traits.hair != null) attrs.push({ trait_type: "Hair", value: traits.hair });
  if (traits.hairColor) attrs.push({ trait_type: "Hair Color", value: traits.hairColor });

  if (traits.facialHair != null) attrs.push({ trait_type: "Facial Hair", value: traits.facialHair });

  // Tattoo value and color (only include color if tattoo is actually present)
  const hasTattoo = (traits.tattoo != null) && !omitZero('tattoo', traits.tattoo);
  if (hasTattoo) {
    attrs.push({ trait_type: "Tattoo", value: traits.tattoo as number });
  }
  if (hasTattoo && traits.tattooColor) {
    attrs.push({ trait_type: "Tattoo Color", value: traits.tattooColor });
  }

  if (traits.adornment != null && !omitZero('adornment', traits.adornment)) {
    attrs.push({ trait_type: "Adornment", value: traits.adornment });
  }

  return attrs;
}

export function buildMetadataForImage(imageIpfs: string, traits?: ImmutableTraits | null) {
  const attributes = buildAttributesFromTraits(traits);
  const baseName = traits?.name?.trim() || "Nral Character";

  return {
    name: baseName,
    description: "Trials of Nral character",
    image: imageIpfs,
    attributes,
  };
}
