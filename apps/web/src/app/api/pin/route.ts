// apps/web/src/app/api/pin/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // ensures FormData & Buffer work

// --- Config helpers ---
const IPFS_API = (process.env.IPFS_API || 'http://127.0.0.1:5001').replace(/\/$/, '');
const IPFS_GATEWAY = (process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PINATA_JWT = process.env.PINATA_JWT || '';

function gatewayUrl(cid: string): string {
  return `${IPFS_GATEWAY}/ipfs/${cid}`;
}

// Pin to **local** IPFS HTTP API (Kubo) using /api/v0/add
async function pinLocalIPFS(buffer: Buffer, filename = 'image.png') {
  const endpoint = `${IPFS_API}/api/v0/add?pin=true&cid-version=1&wrap-with-directory=false`;
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch(endpoint, { method: 'POST', body: form });
  const text = await res.text(); // Kubo may stream NDJSON; parse last JSON line
  if (!res.ok) throw new Error(`IPFS add failed: ${res.status} ${text.slice(0, 200)}`);

  let parsed: any = null;
  for (const line of text.split('\n').filter(Boolean)) {
    try { parsed = JSON.parse(line); } catch {}
  }
  if (!parsed) { try { parsed = JSON.parse(text); } catch {} }
  if (!parsed) throw new Error(`IPFS add returned no JSON: ${text.slice(0, 200)}`);

  const hash = parsed.Hash || parsed.IpfsHash;
  const size = Number(parsed.Size || parsed.PinSize || 0);
  if (!hash) throw new Error(`IPFS add returned no CID`);
  return { IpfsHash: hash, PinSize: size, _raw: parsed };
}

// Optional: Pinata (only if PINATA_JWT is configured)
async function pinPinata(buffer: Buffer, filename = 'image.png') {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${PINATA_JWT}` }, body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || res.statusText);
  return { IpfsHash: json.IpfsHash, PinSize: Number(json.PinSize || 0), _raw: json };
}

async function pinFile(buffer: Buffer, filename = 'image.png') {
  if (PINATA_JWT) return pinPinata(buffer, filename);
  return pinLocalIPFS(buffer, filename);
}

export async function POST(req: Request) {
  try {
    const { dataURL, name } = await req.json();

    if (!dataURL) {
      return NextResponse.json({ error: 'Missing dataURL' }, { status: 400 });
    }

    // Convert base64 image → Buffer
    const base64Data = String(dataURL).replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Pin file (local IPFS or Pinata if configured)
    const result = await pinFile(buffer, name || 'image.png');

    return NextResponse.json({
      cid: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      url: gatewayUrl(result.IpfsHash),
      size: result.PinSize || null,
      via: PINATA_JWT ? 'pinata' : 'local-ipfs'
    });
  } catch (err: any) {
    console.error('[api/pin] error:', err);
    return NextResponse.json({ error: err?.message || 'pin failed' }, { status: 500 });
  }
}