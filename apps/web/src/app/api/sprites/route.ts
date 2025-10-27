import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Determine sprites directory (probe a few likely locations)
    const candidates = [
      path.join(process.cwd(), 'public', 'assets', 'sprites'),
      path.join(process.cwd(), 'apps', 'web', 'public', 'assets', 'sprites'),
      path.join(process.cwd(), '..', '..', 'apps', 'web', 'public', 'assets', 'sprites'),
    ];

    let baseDir = '';
    for (const c of candidates) {
      if (fs.existsSync(c)) { baseDir = c; break; }
    }

    if (!baseDir) {
      return NextResponse.json({ error: 'sprites directory not found', tried: candidates }, { status: 404 });
    }

    const allPngs: string[] = fs
      .readdirSync(baseDir)
      .filter((f) => f.toLowerCase().endsWith('.png'));

    // Build base manifest: race(+subrace)?+gender.png
    const RE_BASE = /^(?<race>[a-z]+)(?:\+(?<subrace>[a-z]+))?\+(?<gender>male|female)\.png$/i;

    type Item = { file: string; path: string; race: string; subrace?: string; gender: 'male' | 'female' };
    const items: Item[] = [];

    for (const f of allPngs) {
      const m = f.match(RE_BASE);
      if (!m || !m.groups) continue;
      const race = m.groups.race.toLowerCase();
      const subrace = (m.groups.subrace || '').toLowerCase() || undefined;
      const gender = m.groups.gender.toLowerCase() as 'male' | 'female';
      items.push({ file: f, path: `/assets/sprites/${encodeURIComponent(f)}`, race, gender, subrace });
    }

    const manifest: any = {};
    for (const it of items) {
      const { race, subrace, gender, path: p, file } = it;
      if (subrace) {
        manifest[race] ||= { lore: '', races: {} };
        manifest[race].races[subrace] ||= { lore: '', genders: {} };
        manifest[race].races[subrace].genders[gender] ||= {};
        manifest[race].races[subrace].genders[gender].base = { file, path: p };
      } else {
        manifest[race] ||= { lore: '', genders: {} };
        manifest[race].genders[gender] ||= {};
        manifest[race].genders[gender].base = { file, path: p };
      }
    }

    const files = allPngs.map((f) => `/assets/sprites/${encodeURIComponent(f)}`);

    return NextResponse.json({ manifest, files, baseDirUsed: baseDir });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read sprites' }, { status: 500 });
  }
}