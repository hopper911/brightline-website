"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tags, setTags] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const [redirectAfterUpload, setRedirectAfterUpload] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function xhrUpload(url: string, formData: FormData, onProgress?: (p: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        } else {
          reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.upload.onprogress = (evt) => {
        if (!onProgress || !evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
      };
      xhr.send(formData);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const formData = new FormData(e.currentTarget);
      if (tags.trim()) formData.append("tags", tags);
      if (title.trim()) formData.append("title", title.trim());
      if (kind) formData.append("kind", kind);
      const data = await xhrUpload("/api/upload", formData, (p) => setProgress(p));
      setUrl(data.url);
      try { broadcastNewItem(data.item); } catch {}
      if (redirectAfterUpload) {
        setTimeout(() => router.push("/admin/media"), 500);
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    const fd = new FormData();
    fd.append("file", files[0]);
    try { setPreviewUrl(URL.createObjectURL(files[0])); } catch {}
    if (tags.trim()) fd.append("tags", tags);
    if (title.trim()) fd.append("title", title.trim());
    if (kind) fd.append("kind", kind);
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const data = await xhrUpload("/api/upload", fd, (p) => setProgress(p));
      setUrl(data.url);
      if (redirectAfterUpload) setTimeout(() => router.push("/admin/media"), 500);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [tags, title, kind, redirectAfterUpload, router]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  function onPickFileClick() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      try { setPreviewUrl(URL.createObjectURL(f)); } catch {}
    }
  }

  function broadcastNewItem(item: any) {
    try {
      const ch = new (window as any).BroadcastChannel('media-updates');
      ch.postMessage({ type: 'created', item });
      ch.close();
    } catch {}
    try {
      // Fallback: localStorage ping (other tab/page listens and fetches from payload)
      localStorage.setItem('media-updates', JSON.stringify({ ts: Date.now(), type: 'created', item }));
    } catch {}
  }

  return (
    <main style={{ maxWidth: 560, margin: "2rem auto", padding: 16 }}>
      <h1>Upload a File</h1>
      <form onSubmit={onSubmit}>
        <div style={{ margin: "1rem 0" }}>
          <input ref={fileInputRef} name="file" type="file" required onChange={onFileChange} />
        </div>
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: "2px dashed rgba(255,255,255,0.3)",
            padding: 20,
            borderRadius: 8,
            background: dragOver ? "rgba(255,255,255,0.06)" : "transparent",
            transition: "background 120ms ease",
            margin: "1rem 0",
            textAlign: "center",
          }}
        >
          Drag & drop a file here, or
          <button type="button" onClick={onPickFileClick} style={{ marginLeft: 8, textDecoration: "underline" }}>
            browse
          </button>
        </div>
        <div style={{ margin: "1rem 0" }}>
          <input
            name="title"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ margin: "1rem 0" }}>
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div style={{ margin: "1rem 0" }}>
          <label>
            Kind:
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Detect from file</option>
              <option value="IMAGE">IMAGE</option>
              <option value="VIDEO">VIDEO</option>
            </select>
          </label>
        </div>
        <div style={{ margin: "1rem 0" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={redirectAfterUpload}
              onChange={(e) => setRedirectAfterUpload(e.target.checked)}
            />
            Go to media after upload
          </label>
        </div>
        <button type="submit" disabled={busy}>
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
      {previewUrl && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Preview</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      )}
      {progress !== null && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 6, background: "#333", borderRadius: 4 }}>
            <div style={{ width: `${progress}%`, height: 6, background: "#4ade80", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{progress}%</div>
        </div>
      )}
      {url && (
        <p style={{ marginTop: 16 }}>
          Uploaded: <a href={url}>{url}</a>
        </p>
      )}
      {error && (
        <p style={{ marginTop: 16, color: "crimson" }}>{error}</p>
      )}
    </main>
  );
}
