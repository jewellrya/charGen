export type ImmutableTraits = {
  name?: string | null;
  gender?: string | null;
  race?: string | null;        // subrace label if present (e.g. "High Elf")
  className?: string | null;

  skin?: number | null;        // index
  hair?: number | null;        // index
  hairColor?: string | null;   // e.g. "brown3"
  beard?: number | null;       // index (only meaningful for male)
  tattoo?: number | null;      // index
  tattooColor?: string | null; // e.g. "red2"
  adornment?: number | null;   // index
};

export type NralAttribute = {
  trait_type: string;
  value: string | number | boolean;
};

export function buildAttributesFromTraits(traits?: ImmutableTraits | null): NralAttribute[] {
  if (!traits) return [];

  const attrs: NralAttribute[] = [];

  if (traits.name) attrs.push({ trait_type: "Name", value: traits.name });

  if (traits.race) attrs.push({ trait_type: "Race", value: traits.race });
  if (traits.gender) attrs.push({ trait_type: "Gender", value: traits.gender });
  if (traits.className) attrs.push({ trait_type: "Class", value: traits.className });

  if (traits.skin != null) attrs.push({ trait_type: "Skin", value: traits.skin });
  if (traits.hair != null) attrs.push({ trait_type: "Hair", value: traits.hair });
  if (traits.hairColor) attrs.push({ trait_type: "Hair Color", value: traits.hairColor });

  if (traits.beard != null) attrs.push({ trait_type: "Beard", value: traits.beard });

  if (traits.tattoo != null) attrs.push({ trait_type: "Tattoo", value: traits.tattoo });
  if (traits.tattooColor) attrs.push({ trait_type: "Tattoo Color", value: traits.tattooColor });

  if (traits.adornment != null) attrs.push({ trait_type: "Adornment", value: traits.adornment });

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