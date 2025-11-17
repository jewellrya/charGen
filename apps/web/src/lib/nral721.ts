// src/lib/nral721.ts
import { Address, Abi, createPublicClient, createWalletClient, custom, getContract } from 'viem';
import { sepolia } from 'viem/chains';
import Nral721Abi from '@/lib/abi/Nral721.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NRAL721_ADDRESS as Address;
if (!CONTRACT_ADDRESS) throw new Error('NEXT_PUBLIC_NRAL721_ADDRESS missing');

const CHAIN = sepolia;

const abi = Nral721Abi as unknown as Abi;

function wallet() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No injected wallet (MetaMask/Rabby) found');
  }
  return createWalletClient({ chain: CHAIN, transport: custom((window as any).ethereum) });
}

function rpc() {
  // use the injected provider for reads too, so we don’t care which chain you deployed on
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No injected wallet (MetaMask/Rabby) found');
  }
  return createPublicClient({ chain: CHAIN, transport: custom((window as any).ethereum) });
}

function contract(client: any) {
  return getContract({
    address: CONTRACT_ADDRESS,
    abi,
    client,
  });
}

export async function requestAccount(): Promise<Address> {
  const w = wallet();
  const [acct] = await w.requestAddresses();
  return acct as Address;
}

export async function readOwner(): Promise<Address> {
  const c = contract(rpc());
  const owner = (await c.read.owner()) as Address;
  return owner;
}

export async function readNextId(): Promise<bigint> {
  const c = contract(rpc());
  return (await c.read.nextId()) as bigint;
}

export function resolveIpfs(uri: string, gateway = "https://ipfs.io/ipfs/") {
  return uri?.startsWith("ipfs://") ? gateway + uri.slice(7) : uri;
}

export async function readTokenURI(id: bigint): Promise<string> {
  const c = contract(rpc());
  return (await c.read.tokenURI([id])) as string;
}

export async function mintNft(to: Address, uri: string) {
  const w = wallet();
  const account = (await w.requestAddresses())[0] as Address;
  const c = contract(w);
  const hash = await c.write.mint([to, uri], { account, chain: CHAIN });
  const receipt = await rpc().waitForTransactionReceipt({ hash });
  return receipt;
}