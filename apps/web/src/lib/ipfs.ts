// apps/web/src/lib/ipfs.ts
import FormData from 'form-data';
import axios from 'axios';

const PINATA_API = 'https://api.pinata.cloud';

function getEnv() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('Missing env PINATA_JWT');
  const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
  return { jwt, gateway };
}

export type PinFileResult = { IpfsHash: string; PinSize: number; Timestamp: string };
export type PinJsonResult = { IpfsHash: string; PinSize: number; Timestamp: string };

export async function pinFile(buffer: Buffer, filename = 'image.png'): Promise<PinFileResult> {
  const { jwt } = getEnv();

  const form = new FormData();
  // Ensure Pinata sees a real file part named "file"
  form.append('file', buffer, { filename, contentType: 'image/png' });
  // These must be string (JSON), not File/Blob
  form.append('pinataMetadata', JSON.stringify({ name: filename }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const url = `${PINATA_API}/pinning/pinFileToIPFS`;

  const res = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
  });

  return res.data as PinFileResult;
}

export async function pinJSON(json: unknown, name = 'metadata.json'): Promise<PinJsonResult> {
  const { jwt } = getEnv();

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: json,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pinJSON failed: ${res.status} ${text}`);
  }
  return res.json();
}

// helper to turn a CID into a gateway URL for quick previews
export function gatewayUrl(cidOrPath: string) {
  const { gateway } = getEnv();
  const clean = cidOrPath.replace(/^ipfs:\/\//, '');
  return `${gateway}/ipfs/${clean}`;
}