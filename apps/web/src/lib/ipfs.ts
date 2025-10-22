// apps/web/src/lib/ipfs.ts
import axios from 'axios';
import FormData from 'form-data';

function getEnv() {
  const api = process.env.IPFS_API || 'http://127.0.0.1:5001';
  const gateway = process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080';
  return { api, gateway };
}

// Kubo (go-ipfs) returns this shape from /api/v0/add
export type PinFileResult = { Hash: string; Name: string; Size: string };
export type PinJsonResult = PinFileResult;

export async function pinFile(buffer: Buffer, filename = 'image.png'): Promise<{ IpfsHash: string }> {
  const { api } = getEnv();
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'image/png' });

  const res = await axios.post(`${api}/api/v0/add`, form, {
    headers: form.getHeaders(),
    params: { pin: 'true', cidVersion: 1, wrapWithDirectory: false },
    maxBodyLength: Infinity,
  });

  // { Name, Hash, Size }
  return { IpfsHash: res.data.Hash };
}

export async function pinJSON(json: unknown, name = 'metadata.json'): Promise<{ IpfsHash: string }> {
  const { api } = getEnv();
  const form = new FormData();
  const buf = Buffer.from(JSON.stringify(json));
  form.append('file', buf, { filename: name, contentType: 'application/json' });

  const res = await axios.post(`${api}/api/v0/add`, form, {
    headers: form.getHeaders(),
    params: { pin: 'true', cidVersion: 1, wrapWithDirectory: false },
    maxBodyLength: Infinity,
  });

  return { IpfsHash: res.data.Hash };
}

// Turn a CID (or ipfs://CID/...) into a gateway URL
export function gatewayUrl(cidOrPath: string) {
  const { gateway } = getEnv();
  const clean = cidOrPath.replace(/^ipfs:\/\//, '');
  return `${gateway}/ipfs/${clean}`;
}