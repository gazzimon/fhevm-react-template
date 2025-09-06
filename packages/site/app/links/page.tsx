"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { ethers } from "ethers"; // ✅ v5

type Link = { id: string; label: string; url: string; createdAt?: string };
type Wallet = { id: string; address: string; kind: string; createdAt?: string };

type ToastVariant = "success" | "error" | "info";
type Toast = { id: string; message: string; variant: ToastVariant };

export default function LinksPage() {
  // ====== Estado (listas) ======
  const [links, setLinks] = useState<Link[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // ====== Crear link ======
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  // ====== Editar link ======
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ====== Flags ======
  const [linking, setLinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);

  // ====== Mini-toast ======
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (message: string, variant: ToastVariant = "info", ttlMs = 2800) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((t) => [...t, { id, message, variant }]);
    // autodestruir
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttlMs);
  };

  const ToastContainer = useMemo(
    () =>
      function ToastContainer() {
        return (
          <div className="pointer-events-none fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={[
                  "pointer-events-auto rounded-xl px-4 py-3 shadow-lg text-sm border",
                  t.variant === "success" && "bg-green-50 border-green-300 text-green-900",
                  t.variant === "error" && "bg-red-50 border-red-300 text-red-900",
                  t.variant === "info" && "bg-slate-50 border-slate-300 text-slate-900",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {t.message}
              </div>
            ))}
          </div>
        );
      },
    [toasts]
  );

  // ====== Helpers ======
  const formatAddress = (a: string) =>
    a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

  async function safeErr(r: Response) {
    try {
      const j = await r.json();
      return j?.error || r.statusText;
    } catch {
      return r.statusText;
    }
  }

  async function loadLinks() {
    const r = await fetch("/api/links");
    if (r.ok) setLinks(await r.json());
  }
  async function loadWallets() {
    const r = await fetch("/api/wallets");
    if (r.ok) setWallets(await r.json());
  }

  useEffect(() => {
    loadLinks();
    loadWallets();
  }, []);

  // ====== Crear link ======
  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      const r = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!r.ok) {
        const err = await safeErr(r);
        throw new Error(err || "No se pudo guardar");
      }
      setLabel("");
      setUrl("");
      await loadLinks();
      pushToast("Enlace guardado", "success");
    } catch (e: any) {
      pushToast(`Error: ${e.message}`, "error");
    } finally {
      setCreating(false);
    }
  }

  // ====== Editar link ======
  function beginEdit(l: Link) {
    setEditId(l.id);
    setEditLabel(l.label);
    setEditUrl(l.url);
  }
  function cancelEdit() {
    setEditId(null);
    setEditLabel("");
    setEditUrl("");
  }
  async function saveEdit() {
    if (!editId) return;
    try {
      setSavingEdit(true);
      const r = await fetch(`/api/links/${editId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: editLabel, url: editUrl }),
      });
      if (!r.ok) {
        const err = await safeErr(r);
        throw new Error(err || "No se pudo actualizar");
      }
      await loadLinks();
      cancelEdit();
      pushToast("Enlace actualizado", "success");
    } catch (e: any) {
      pushToast(`Error: ${e.message}`, "error");
    } finally {
      setSavingEdit(false);
    }
  }

  // ====== Eliminar link ======
  async function deleteLink(id: string) {
    if (!confirm("¿Eliminar este enlace?")) return;
    setDeletingLinkId(id);
    try {
      const r = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await safeErr(r);
        throw new Error(err || "No se pudo eliminar");
      }
      await loadLinks();
      pushToast("Enlace eliminado", "success");
    } catch (e: any) {
      pushToast(`Error: ${e.message}`, "error");
    } finally {
      setDeletingLinkId(null);
    }
  }

  // ====== Vincular MetaMask (ethers v5) ======
  async function linkMetamask() {
    // @ts-ignore
    const { ethereum } = window;
    if (!ethereum) {
      pushToast("Instalá MetaMask para continuar", "error");
      return;
    }
    try {
      setLinking(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      await ethereum.request({ method: "eth_requestAccounts" });

      // 1) pedir nonce
      const nres = await fetch("/api/wallets/nonce");
      if (!nres.ok) throw new Error(await safeErr(nres));
      const { nonce } = await nres.json();

      // 2) firmar mensaje
      const signer = provider.getSigner(); // v5 (sin await)
      const message = `Link wallet to LIVRA\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // 3) enviar al backend
      const lres = await fetch("/api/wallets/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature, nonce, kind: "metamask" }),
      });
      if (!lres.ok) throw new Error(await safeErr(lres));

      await loadWallets();
      pushToast("Wallet vinculada", "success");
    } catch (e: any) {
      pushToast(`Error: ${e.message}`, "error");
    } finally {
      setLinking(false);
    }
  }

  // ====== Desvincular wallet ======
  async function deleteWallet(id: string) {
    if (!confirm("¿Desvincular esta wallet?")) return;
    setDeletingWalletId(id);
    try {
      const r = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await safeErr(r));
      await loadWallets();
      pushToast("Wallet desvinculada", "success");
    } catch (e: any) {
      pushToast(`Error: ${e.message}`, "error");
    } finally {
      setDeletingWalletId(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Toasts */}
      <ToastContainer />

      <h1 className="text-2xl font-semibold">Verificación y enlaces de acceso</h1>

      {/* Conexiones */}
      <section className="grid sm:grid-cols-2 gap-3">
        {/* OAuth opcional (se activan con credenciales en .env) */}
        <button onClick={() => signIn("google")} className="border rounded-xl p-3">
          Conectar Google
        </button>
        <button onClick={() => signIn("github")} className="border rounded-xl p-3">
          Conectar GitHub
        </button>
        <button onClick={() => signIn("facebook")} className="border rounded-xl p-3">
          Conectar Facebook
        </button>

        {/* MetaMask */}
        <button onClick={linkMetamask} disabled={linking} className="border rounded-xl p-3">
          {linking ? "Vinculando..." : "Vincular MetaMask"}
        </button>

        {/* Próximos */}
        <button disabled className="border rounded-xl p-3 opacity-60">
          WalletConnect (próximamente)
        </button>
        <button disabled className="border rounded-xl p-3 opacity-60">
          Verificar teléfono (próximamente)
        </button>
      </section>

      {/* Agregar enlace manual */}
      <section className="border rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Agregar enlace manual</h2>
        <form onSubmit={addLink} className="flex flex-col sm:flex-row gap-2">
          <input
            className="border rounded p-2 flex-1"
            placeholder="Etiqueta (Gmail, Farcaster, LinkedIn…)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="border rounded p-2 flex-1"
            placeholder="URL completa (https://…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button disabled={creating} className="border rounded-xl px-4">
            {creating ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </section>

      {/* Lista de enlaces con acciones */}
      <section className="border rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Mis enlaces</h2>
        <ul className="space-y-3">
          {links.map((l) => {
            const isEditing = editId === l.id;
            if (isEditing) {
              return (
                <li key={l.id} className="border rounded-lg p-3 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="border rounded p-2 w-full"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Etiqueta"
                    />
                    <input
                      className="border rounded p-2 w-full"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="border rounded-lg px-3 py-1"
                    >
                      {savingEdit ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="border rounded-lg px-3 py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              );
            }
            return (
              <li
                key={l.id}
                className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="text-sm">
                  <span className="font-medium">{l.label}:</span>{" "}
                  <a className="underline" href={l.url} target="_blank" rel="noreferrer">
                    {l.url}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => beginEdit(l)}
                    className="border rounded-lg px-3 py-1"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLink(l.id)}
                    disabled={deletingLinkId === l.id}
                    className="border rounded-lg px-3 py-1"
                  >
                    {deletingLinkId === l.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </li>
            );
          })}
          {links.length === 0 && (
            <li className="text-sm text-gray-500">No tienes enlaces guardados.</li>
          )}
        </ul>
      </section>

      {/* Lista de wallets con acción eliminar */}
      <section className="border rounded-2xl p-4">
        <h2 className="font-semibold mb-3">Wallets vinculadas</h2>
        <ul className="space-y-2">
          {wallets.map((w) => (
            <li
              key={w.id}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <span className="text-sm">
                {w.kind}: <span className="font-mono">{formatAddress(w.address)}</span>
              </span>
              <button
                type="button"
                onClick={() => deleteWallet(w.id)}
                disabled={deletingWalletId === w.id}
                className="border rounded-lg px-3 py-1"
              >
                {deletingWalletId === w.id ? "Eliminando..." : "Eliminar"}
              </button>
            </li>
          ))}
          {wallets.length === 0 && (
            <li className="text-sm text-gray-500">No hay wallets vinculadas.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
