"use client";
import { useEffect, useState } from "react";

type User = { id: string; username: string; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load users");
      setUsers(j.users || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const csrf = await fetch('/api/csrf', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'x-csrf-token': csrf?.token || '' },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to create user");
      setMessage("User created");
      setUsername("");
      setPassword("");
      load();
    } catch (e: any) {
      setError(e?.message || "Failed to create user");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold tracking-wide">Admin — Users</h1>

      <form onSubmit={onCreate} className="mt-6 space-y-3 rounded border border-white/10 p-4">
        <div>
          <label className="block text-xs uppercase opacity-70">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase opacity-70">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm" />
        </div>
        <button className="rounded border border-white/20 px-3 py-1 text-xs uppercase tracking-widest">Create</button>
        {message ? <span className="ml-2 text-green-400">{message}</span> : null}
        {error ? <span className="ml-2 text-red-400">{error}</span> : null}
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Existing Users</h2>
        {loading ? (
          <div className="opacity-70">Loading…</div>
        ) : users.length === 0 ? (
          <div className="opacity-70">No users</div>
        ) : (
          <ul className="mt-3 divide-y divide-white/10 rounded border border-white/10">
            {users.map((u) => (
              <li key={u.id} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{u.username}</div>
                    <div className="opacity-60 text-xs">{new Date(u.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded border border-white/20 px-2 py-1 hover:border-white/40"
                      onClick={() => setChangingId(changingId === u.id ? null : u.id)}
                    >
                      Change Password
                    </button>
                    <button
                      className="rounded border border-red-400/40 px-2 py-1 text-red-300 hover:border-red-400"
                    onClick={async () => {
                      if (!confirm(`Delete user ${u.username}?`)) return;
                      try {
                          const csrf = await fetch('/api/csrf', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
                          const r = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', headers: { 'x-csrf-token': csrf?.token || '' } });
                          const j = await r.json();
                          if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to delete user');
                          setMessage('User deleted');
                          load();
                        } catch (e: any) {
                          setError(e?.message || 'Failed to delete user');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {changingId === u.id && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const csrf = await fetch('/api/csrf', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
                        const r = await fetch(`/api/admin/users/${u.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf?.token || '' },
                          body: JSON.stringify({ password: newPass }),
                        });
                        const j = await r.json();
                        if (!r.ok || !j.ok) throw new Error(j?.error || 'Failed to update');
                        setMessage('Password updated');
                        setChangingId(null);
                        setNewPass('');
                      } catch (e: any) {
                        setError(e?.message || 'Failed to update');
                      }
                    }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="New password"
                      className="w-64 rounded border border-white/20 bg-transparent p-2 text-sm"
                    />
                    <button className="rounded border border-white/20 px-2 py-1 text-xs uppercase tracking-widest">Save</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
