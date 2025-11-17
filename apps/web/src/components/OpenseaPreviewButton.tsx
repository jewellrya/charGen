// Opens a new tab that emulates an OpenSea asset page using the
// current sprite + freshly pinned metadata. No mint occurs.
"use client";

import React, { useState } from "react";

function grabPngDataURL(): string {
  const img = document.querySelector<HTMLImageElement>("#charGen img");
  if (!img || !img.complete || img.naturalWidth === 0) {
    throw new Error("No image rendered yet");
  }
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D context");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}

function resolveIpfs(uri: string, gateway = "https://ipfs.io/ipfs/") {
  return uri?.startsWith("ipfs://") ? gateway + uri.slice(7) : uri;
}

type Attr = { trait_type: string; value: string | number | boolean };

export default function OpenseaPreviewButton() {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    try {
      setBusy(true);

      // 1) Capture current sprite
      const dataURL = grabPngDataURL();

      // 2) Pin PNG to IPFS (same API you use for mint flow)
      const imgRes = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataURL, name: `nral-preview-${Date.now()}.png` }),
      });
      const imgJson = await imgRes.json().catch(() => ({}));
      if (!imgRes.ok) throw new Error(imgJson?.error || "Pin image failed");
      const imageIpfs =
        (imgJson?.ipfsUri as string) ||
        (imgJson?.cid ? `ipfs://${imgJson.cid}` : null);
      if (!imageIpfs) throw new Error("Pin image failed (no CID)");

      // 3) Build metadata (emulate ERC-721 tokenURI payload)
      // If you’ve got actual trait data in state somewhere, wire it here.
      const attributes: Attr[] = []; // e.g. [{ trait_type: "Race", value: "Human" }, ...]
      const metadata = {
        name: `Nral Preview #${Date.now()}`,
        description: "Preview of what OpenSea will render for this sprite",
        image: imageIpfs,
        attributes,
      };

      // 4) Pin metadata JSON too
      const metaRes = await fetch("/api/pin-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: metadata, name: "nral-preview.json" }),
      });
      const metaJson = await metaRes.json().catch(() => ({}));
      if (!metaRes.ok) throw new Error(metaJson?.error || "Pin metadata failed");
      const tokenURI =
        (metaJson?.ipfsUri as string) ||
        (metaJson?.cid ? `ipfs://${metaJson.cid}` : null);
      if (!tokenURI) throw new Error("Pin metadata failed (no CID)");

      const gatewayMeta = resolveIpfs(tokenURI);
      const gatewayImage = resolveIpfs(imageIpfs);

      // 5) Open a minimal “OpenSea-like” preview tab (no mint, just render)
      const w = window.open("", "_blank");
      if (!w) throw new Error("Popup blocked");
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Nral – OpenSea Preview (Not Minted)</title>
<style>
  :root { --bg:#0f1115; --panel:#171a21; --muted:#9aa4b2; --text:#e7ecf3; --accent:#3b82f6; }
  html,body { margin:0; height:100%; background:var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
  .wrap { max-width:1100px; margin:0 auto; padding:24px; display:grid; gap:24px; grid-template-columns: 1fr 1fr; }
  .imgWrap { background:var(--panel); border-radius:12px; padding:16px; display:flex; align-items:center; justify-content:center; }
  .imgWrap img { max-width:100%; image-rendering: pixelated; }
  .meta { background:var(--panel); border-radius:12px; padding:16px; }
  .row { display:flex; gap:8px; align-items:center; margin-bottom:10px; }
  .muted { color:var(--muted); font-size:12px; }
  .title { font-size:22px; font-weight:700; margin:8px 0 6px; }
  .links a { color:var(--accent); text-decoration:none; }
  .links a:hover { text-decoration:underline; }
  pre { background:#0b0d12; color:#cbd5e1; padding:12px; border-radius:8px; overflow:auto; font-size:12px; }
  .pill { background:#0b0d12; color:#cbd5e1; border-radius:999px; padding:4px 10px; font-size:12px; }
  .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; margin-top:12px; }
  .attr { background:#0b0d12; border-radius:8px; padding:10px; }
  .attr .tt { color:#9aa4b2; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  .attr .val { font-weight:600; font-size:14px; margin-top:2px; }
  @media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="imgWrap">
      <img alt="preview" src="${gatewayImage}">
    </div>
    <div class="meta">
      <div class="muted">Collection</div>
      <div class="title">Nral (Preview)</div>
      <div class="row">
        <span class="pill">Not Minted</span>
        <span class="pill">tokenURI: ipfs</span>
      </div>
      <div class="links" style="margin:12px 0 16px;">
        <div><a href="${gatewayMeta}" target="_blank" rel="noreferrer">Open metadata (gateway)</a></div>
        <div><a href="${gatewayImage}" target="_blank" rel="noreferrer">Open image (gateway)</a></div>
      </div>
      <div class="muted">Description</div>
      <p style="margin:6px 0 14px;">${metadata.description}</p>

      <div class="muted">Attributes</div>
      <div class="grid" id="attrs"></div>

      <div class="muted" style="margin-top:16px;">Raw metadata</div>
      <pre>${JSON.stringify({ ...metadata, tokenURI }, null, 2)}</pre>
    </div>
  </div>
  <script>
    const attrs = ${JSON.stringify(metadata.attributes || [])};
    const grid = document.getElementById("attrs");
    if (Array.isArray(attrs) && attrs.length) {
      attrs.forEach(a => {
        const el = document.createElement("div");
        el.className = "attr";
        el.innerHTML = '<div class="tt">' + (a.trait_type || "Trait") + '</div><div class="val">' + (a.value ?? "") + '</div>';
        grid.appendChild(el);
      });
    } else {
      grid.innerHTML = '<div class="muted">No attributes</div>';
    }
  </script>
</body>
</html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();

      // Also stash for later (handy if you want to re-open)
      try {
        localStorage.setItem(
          "nral:lastPreview",
          JSON.stringify({
            tokenURI,
            image: imageIpfs,
            gateway: { metadata: gatewayMeta, image: gatewayImage },
            when: Date.now(),
          })
        );
        await navigator.clipboard.writeText([gatewayMeta, gatewayImage].join("\n"));
      } catch {}
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className={`btn btn-sm ${busy ? "btn-disabled" : ""}`} onClick={onClick} disabled={busy}>
      {busy ? "Building preview…" : "Preview (Opensea Test)"}
    </button>
  );
}