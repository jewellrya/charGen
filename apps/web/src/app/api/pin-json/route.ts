// apps/web/src/app/api/pin-json/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

const IPFS_API = (process.env.IPFS_API || 'http://127.0.0.1:5001').replace(/\/$/, '');
const IPFS_GATEWAY = (process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PINATA_JWT = process.env.PINATA_JWT || '';

function gatewayUrl(cid: string): string {
  return `${IPFS_GATEWAY}/ipfs/${cid}`;
}

async function pinJsonLocal(obj: any, name = 'metadata.json') {
  const endpoint = `${IPFS_API}/api/v0/add?pin=true&cid-version=1&wrap-with-directory=false`;
  const jsonStr = JSON.stringify(obj);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const form = new FormData();
  form.append('file', blob, name);

  const res = await fetch(endpoint, { method: 'POST', body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`IPFS add failed: ${res.status} ${text.slice(0, 200)}`);

  let parsed: any = null;
  for (const line of text.split('\n').filter(Boolean)) {
    try { parsed = JSON.parse(line); } catch {}
  }
  if (!parsed) { try { parsed = JSON.parse(text); } catch {} }
  if (!parsed) throw new Error(`IPFS add returned no JSON`);

  const hash = parsed.Hash || parsed.IpfsHash;
  if (!hash) throw new Error('No CID returned');
  return { IpfsHash: hash };
}

async function pinJsonPinata(obj: any, name = 'metadata.json') {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PINATA_JWT}` },
    body: JSON.stringify({ pinataContent: obj, pinataMetadata: { name } })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'pinJSON failed');
  return { IpfsHash: json.IpfsHash };
}

export async function POST(req: Request) {
  try {
    const { json, name } = await req.json();
    if (!json) return NextResponse.json({ error: 'missing json' }, { status: 400 });

    const out = PINATA_JWT ? await pinJsonPinata(json, name || 'nral-meta.json')
                           : await pinJsonLocal(json, name || 'nral-meta.json');

    return NextResponse.json({
      cid: out.IpfsHash,
      ipfsUri: `ipfs://${out.IpfsHash}`,
      url: gatewayUrl(out.IpfsHash),
      via: PINATA_JWT ? 'pinata' : 'local-ipfs'
    });
  } catch (e: any) {
    console.error('[api/pin-json] error:', e);
    return NextResponse.json({ error: e?.message || 'pin-json failed' }, { status: 500 });
  }
}