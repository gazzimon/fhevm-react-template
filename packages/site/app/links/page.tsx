"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { BrowserProvider } from "ethers"; // para firmar el nonce

type Link = { id: string; label: string; url: string };
type Wallet = { id: string; address: string; kind: string };

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [linking, setLinking] = useState(false);

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

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, url }),
    });
    if (r.ok) {
      setLabel("");
      setUrl("");
      loadLinks();
    } else {
      alert("No se pudo guardar el enlace");
    }
  }

  async function linkMetamask() {
    // @ts-ignore
    const { ethereum } = window;
    if (!ethereum) return alert("Instalá MetaMask");

    try {
      setLinking(true);
      const provider = new BrowserProvider(ethereum);
      await ethereum.request({ method: "eth_requestAccounts" });

      // 1) pedir nonce
      const nres = await fetch("/api/wallets/nonce");
      if (!nres.ok) throw new Error("No se pudo obtener nonce");
      const { nonce } = await nres.json();

      // 2) firmar el mensaje
      const signer = await provider.getSigner();
      const message = `Link wallet to LIVRA\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // 3) enviar al backend
      const lres = await fetch("/api/wallets/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature, nonce, kind: "metamask" }),
      });
      if (!lres.ok) throw new Error("Vinculación fallida");

      await loadWallets();
      alert("Wallet vinculada ✔");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al vincular");
    } finally {
      setLinking(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Verificación y enlaces de acceso</h1>

      <section className="grid sm:grid-cols-2 gap-3">
        {/* OAuth opcional: se activan cuando cargues credenciales en .env */}
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
          <button className="border rounded-xl px-4">Guardar</button>
        </form>
        <ul className="mt-3 space-y-2">
          {links.map((l) => (
            <li key={l.id} className="text-sm">
              <span className="font-medium">{l.label}:</span>{" "}
              <a className="underline" href={l.url} target="_blank">
                {l.url}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Wallets vinculadas</h2>
        <ul className="space-y-1 text-sm">
          {wallets.map((w) => (
            <li key={w.id}>
              {w.kind}: {w.address}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
