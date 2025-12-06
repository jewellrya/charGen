"use client";
import React, { useState } from "react";
import { mintNft, requestAccount, readNextId, readOwner, readTokenURI, resolveIpfs } from "@/lib/nral721";
import type { ImmutableTraits } from "@/lib/metadata";
import { buildMetadataForImage } from "@/lib/metadata";
import { getHideEquipment, setHideEquipment, applyClassArmorAndRedraw, getImmutableTraitsSnapshot } from "@/app/app-logic/charGen";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NRAL721_ADDRESS as string;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureSepolia(): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet installed");

  // Request accounts first
  await eth.request({ method: "eth_requestAccounts", params: [] });

  // Switch/add Sepolia if needed
  const current = await eth.request({ method: "eth_chainId" });
  if (current !== SEPOLIA_CHAIN_ID_HEX) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      } else {
        throw err;
      }
    }
  }
}

function grabPngDataURL(): string {
  const img = document.querySelector<HTMLImageElement>("#charGen img");
  if (!img || !img.complete || img.naturalWidth === 0) {
    throw new Error("No image rendered yet");
  }
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D context");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}

function humanError(e: any): string {
  if (!e) return "Unknown error";
  if (e.code === 4001) return "User rejected";
  const msg = e?.shortMessage || e?.message || String(e);
  if (/OwnableUnauthorizedAccount/i.test(msg)) return "Mint is owner-only (connected wallet isn’t the owner)";
  if (/insufficient funds/i.test(msg)) return "Insufficient ETH for gas";
  return msg;
}

type MintButtonProps = {
  traits?: ImmutableTraits | null;
  onClickSound?: () => void;
};

export default function MintButton({ traits, onClickSound }: MintButtonProps) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    onClickSound?.();
    try {
      setBusy(true);
      if (!CONTRACT_ADDRESS) throw new Error("Set NEXT_PUBLIC_NRAL721_ADDRESS in .env.local");

      // 1) Ensure wallet on Sepolia + get recipient address
      await ensureSepolia();
      const to = await requestAccount();

      // If equipment is hidden, confirm and then turn it off permanently before mint
      try {
        const isHidden = typeof getHideEquipment === "function" ? !!getHideEquipment() : false;
        if (isHidden) {
          const ok = confirm("Hide equipment is ON. For minting, armor must be shown. We'll turn off 'Hide equipment' and keep it off. Continue?");
          if (!ok) { setBusy(false); return; }
          setHideEquipment(false);
          try { applyClassArmorAndRedraw(); } catch {}
          await sleep(140);
        }
      } catch {}

      // 2) Export current sprite (with armor visible)
      const dataURL = grabPngDataURL();

      // 3) Pin PNG to IPFS
      const imgRes = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataURL, name: `nral-${Date.now()}.png` }),
      });
      const imgJson = await imgRes.json().catch(() => ({}));
      if (!imgRes.ok) throw new Error(imgJson?.error || "Pin image failed");
      const imageIpfs = (imgJson?.ipfsUri as string) || (imgJson?.cid ? `ipfs://${imgJson.cid}` : null);
      if (!imageIpfs) throw new Error("Pin image failed (no CID)");

      // 4) Build metadata + pin (include immutable traits)
      const snap = (typeof getImmutableTraitsSnapshot === "function") ? getImmutableTraitsSnapshot() : null;
      const metadata = buildMetadataForImage(imageIpfs, snap);
      const metaRes = await fetch("/api/pin-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: metadata, name: "nral-meta.json" }),
      });
      const metaJson = await metaRes.json().catch(() => ({}));
      if (!metaRes.ok) throw new Error(metaJson?.error || "Pin metadata failed");
      const tokenURI = (metaJson?.ipfsUri as string) || (metaJson?.cid ? `ipfs://${metaJson.cid}` : null);
      if (!tokenURI) throw new Error("Pin metadata failed (no CID)");

      // 5) (Optional) heads-up if owner-only
      try {
        const owner = await readOwner();
        if (owner && owner.toLowerCase() !== to.toLowerCase()) {
          console.warn("Connected wallet is not the owner; mint may revert if onlyOwner");
        }
      } catch { /* ignore */ }

      // 6) Mint via viem helpers
      const receipt = await mintNft(to, tokenURI);

      // 7) Derive tokenId (nextId() - 1) after the tx is mined
      let tokenId = "UNKNOWN";
      try {
        const afterNext = await readNextId();
        tokenId = (afterNext - 1n).toString();
      } catch { /* ignore */ }

      // 8) Read tokenURI from chain (truth), fall back to the pinned one
      let onchainURI: string | null = null;
      try {
        if (tokenId !== "UNKNOWN") {
          onchainURI = await readTokenURI(BigInt(tokenId));
        }
      } catch { /* ignore */ }
      const finalTokenURI = onchainURI || tokenURI;
      const gatewayURI = resolveIpfs(finalTokenURI);

      const etherscanTx = `https://sepolia.etherscan.io/tx/${receipt.transactionHash}`;
      const etherscanNft = tokenId !== "UNKNOWN"
        ? `https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/${tokenId}`
        : null;

      // 9) Persist + copy for convenience
      const payload = {
        contract: CONTRACT_ADDRESS,
        tokenId,
        tokenURI: finalTokenURI,
        image: imageIpfs,
        tx: receipt.transactionHash,
        links: { etherscanTx, etherscanNft, metadata: gatewayURI },
        when: Date.now(),
      };
      try { localStorage.setItem("nral:lastMint", JSON.stringify(payload)); } catch {}
      try {
        await navigator.clipboard.writeText(
          [etherscanTx, etherscanNft, gatewayURI].filter(Boolean).join("\n")
        );
      } catch {}

      // 10) Open metadata (or image) via gateway so you can view immediately
      window.open(gatewayURI, "_blank");

      alert(
        `Minted!\n\n` +
        `Etherscan tx:\n${etherscanTx}\n\n` +
        (etherscanNft ? `Etherscan NFT:\n${etherscanNft}\n\n` : ``) +
        `Metadata / image (gateway):\n${gatewayURI}\n\n(Links copied to clipboard)`
      );
    } catch (e: any) {
      console.error(e);
      alert(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className={`btn btn-sm btn-game secondary ${busy ? "btn-disabled" : ""}`} onClick={onClick} disabled={busy}>
      {busy ? "Minting…" : "Mint on Sepolia"}
    </button>
  );
}
