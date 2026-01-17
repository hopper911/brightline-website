"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrf, setCsrf] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!csrf) {
        const t = await fetch('/api/csrf', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
        setCsrf(t?.token || null);
      }
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'x-csrf-token': csrf || '' },
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Login failed");
      // Redirect to admin media after login
      router.push("/admin/media");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "4rem auto", padding: 16 }}>
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs uppercase opacity-70">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase opacity-70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
          />
        </div>
        <button disabled={busy} className="rounded border border-white/20 px-3 py-1 text-xs uppercase tracking-widest disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error ? <div className="text-red-400 text-sm">{error}</div> : null}
      </form>
    </main>
  );
}
