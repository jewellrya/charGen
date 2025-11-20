// Opens a new tab that emulates an OpenSea asset page using either
// (A) real pinned IPFS (current behavior) or
// (B) a local emulation without pinning (dev-only). No mint occurs.
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useRef, useState } from "react";
import type { ImmutableTraits } from "@/lib/metadata";
import { buildAttributesFromTraits } from "@/lib/metadata";

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

// Friendlier error text when the pin routes cannot reach IPFS
function friendlyPinError(e: any, httpStatus?: number) {
  const raw = String(e?.message || e || "");
  if (
    /fetch failed|Failed to fetch|ECONNREFUSED|connection refused|ENOTFOUND|ECONNRESET|The user aborted a request/i.test(
      raw
    )
  ) {
    return "IPFS is offline. Start IPFS Desktop or run `ipfs daemon`, then try again.";
  }
  if (httpStatus && httpStatus >= 500) {
    return "Pin service returned a server error. Is the IPFS node running?";
  }
  return raw || "Pin failed";
}

function htmlTemplate({
  metadata,
  tokenURI,
  gatewayMeta,
  gatewayImage,
  attributes,
}: {
  metadata: any;
  tokenURI: string;
  gatewayMeta: string;
  gatewayImage: string;
  attributes: Attr[];
}) {
  return `<!doctype html>
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
        <div><a href="${gatewayMeta}" target="_blank" rel="noreferrer">Open metadata</a></div>
        <div><a href="${gatewayImage}" target="_blank" rel="noreferrer">Open image</a></div>
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
    const inputAttrs = ${JSON.stringify(attributes)};
    const grid = document.getElementById("attrs");
    const show = Array.isArray(inputAttrs) ? inputAttrs : [];
    if (show.length) {
      show.forEach(a => {
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
}

type PreviewButtonProps = {
  traits?: ImmutableTraits | null;
};

export default function PreviewButton({ traits }: PreviewButtonProps) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function previewWithPinnedIpfs() {
    setBusy(true);
    try {
      
      // 1) Capture current sprite
      const dataURL = grabPngDataURL();

      // Short timeout so it doesn’t hang forever
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 15000);

      // 2) Pin PNG to IPFS
      let imgRes: Response;
      try {
        imgRes = await fetch("/api/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataURL, name: `nral-preview-${Date.now()}.png` }),
          signal: ac.signal,
        });
      } catch (e) {
        alert(friendlyPinError(e));
        return;
      } finally {
        clearTimeout(t);
      }

      const imgJson = (await imgRes.json().catch(() => ({}))) as any;
      if (!imgRes.ok) {
        throw new Error(imgJson?.error || friendlyPinError(null, imgRes.status));
      }
      const imageIpfs =
        (imgJson?.ipfsUri as string) || (imgJson?.cid ? `ipfs://${imgJson.cid}` : null);
      if (!imageIpfs) throw new Error("Pin image failed (no CID)");

      // 3) Build metadata
      const attributes: Attr[] = buildAttributesFromTraits(traits);
      const metadata = {
        name: `Nral Preview #${Date.now()}`,
        description: "Preview of what OpenSea will render for this sprite",
        image: imageIpfs,
        attributes,
      };

      // 4) Pin metadata JSON
      let metaRes: Response;
      try {
        metaRes = await fetch("/api/pin-json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json: metadata, name: "nral-preview.json" }),
        });
      } catch (e) {
        alert(friendlyPinError(e));
        return;
      }

      const metaJson = (await metaRes.json().catch(() => ({}))) as any;
      if (!metaRes.ok) {
        throw new Error(metaJson?.error || friendlyPinError(null, metaRes.status));
      }
      const tokenURI =
        (metaJson?.ipfsUri as string) || (metaJson?.cid ? `ipfs://${metaJson.cid}` : null);
      if (!tokenURI) throw new Error("Pin metadata failed (no CID)");

      const gatewayMeta = resolveIpfs(tokenURI);
      const gatewayImage = resolveIpfs(imageIpfs);

      // 5) Open preview tab
      const w = window.open("", "_blank");
      if (!w) throw new Error("Popup blocked");
      w.document.open();
      w.document.write(
        htmlTemplate({ metadata, tokenURI, gatewayMeta, gatewayImage, attributes })
      );
      w.document.close();

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
      alert(friendlyPinError(e));
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function previewEmulatedNoPin() {
    setBusy(true);
    try {
      const dataURL = grabPngDataURL();

      function dataUrlToBlob(url: string) {
        const [head, b64] = url.split(",");
        const mime = head.split(":")[1].split(";")[0] || "image/png";
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: mime });
      }
      const imgBlob = dataUrlToBlob(dataURL);
      const imgURL = URL.createObjectURL(imgBlob);

      const fakeImgCid = `dev-img-${Date.now()}`;
      const fakeMetaCid = `dev-meta-${Date.now()}`;
      const imageIpfs = `ipfs://${fakeImgCid}`;
      const tokenURI = `ipfs://${fakeMetaCid}`;

      const attributes: Attr[] = buildAttributesFromTraits(traits);
      const metadata = {
        name: `Nral Preview #${Date.now()}`,
        description: "Preview (emulated, not pinned)",
        image: imageIpfs,
        attributes,
      };

      const metaBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const metaURL = URL.createObjectURL(metaBlob);

      const gatewayMeta = metaURL;
      const gatewayImage = imgURL;

      const w = window.open("", "_blank");
      if (!w) throw new Error("Popup blocked");
      w.document.open();
      w.document.write(
        htmlTemplate({ metadata, tokenURI, gatewayMeta, gatewayImage, attributes })
      );
      w.document.close();

      try {
        localStorage.setItem(
          "nral:lastPreview",
          JSON.stringify({
            tokenURI,
            image: imageIpfs,
            gateway: { metadata: gatewayMeta, image: gatewayImage },
            when: Date.now(),
            emulated: true,
          })
        );
      } catch {}
    } catch (e: any) {
      alert(e?.message || "Preview failed");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        className={`btn btn-sm ${busy ? "btn-disabled" : ""}`}
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? "Working…" : "Preview"}
        {!busy && (
          <FontAwesomeIcon icon={open ? faCaretUp : faCaretDown} size="sm" className="mb-1" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Preview options"
          className="nral-menu"
          style={{
            position: "absolute",
            marginTop: 8,
            minWidth: 260,
            right: 0,
            zIndex: 1000,
            background: "var(--menu-bg, #fff)",
            color: "var(--menu-fg, #16181d)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
            overflow: "hidden",
          }}
        >
          <button
            role="menuitem"
            className="menuItem"
            onClick={previewWithPinnedIpfs}
            disabled={busy}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              border: 0,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Preview with pinned IPFS
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Upload image + metadata to IPFS (dev pin) and render preview
            </div>
          </button>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} aria-hidden="true" />
          <button
            role="menuitem"
            className="menuItem"
            onClick={previewEmulatedNoPin}
            disabled={busy}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              border: 0,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Emulate without pin
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              No upload. Use in-memory blobs but keep the same layout
            </div>
          </button>
        </div>
      )}
      <style jsx>{`
        .menuItem { background: #fff; transition: background 0.2s ease; }
        .menuItem:hover { background: #f3f4f6; }
      `}</style>
    </div>
  );
}