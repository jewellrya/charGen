// apps/web/src/app/api/pin/route.ts
import { NextResponse } from 'next/server';
import { pinFile, gatewayUrl } from '@/lib/ipfs';

export const runtime = 'nodejs'; // ensures FormData & Buffer work

export async function POST(req: Request) {
  try {
    const { dataURL, name } = await req.json();

    if (!dataURL) {
      return NextResponse.json({ error: 'Missing dataURL' }, { status: 400 });
    }

    // Convert base64 image → Buffer
    const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Pin file to IPFS
    const result = await pinFile(buffer, name || 'image.png');

    // Return Pinata’s CID + URLs
    return NextResponse.json({
      cid: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      url: gatewayUrl(result.IpfsHash)
    });
  } catch (err: any) {
    console.error('[api/pin] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}