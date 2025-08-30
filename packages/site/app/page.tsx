"use client";

import { useState } from "react";
import { ethers } from "ethers";
// Asegurate de tener el ABI disponible en el front:
import SignatureRegistryABI from "../contracts/SignatureRegistry.json";

export default function Page() {
  const [text, setText] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      if (!window.ethereum) {
        setStatus("⚠️ No wallet detected");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        SignatureRegistryABI.abi,
        signer
      );

      // 1) Registramos el documento on-chain
      setStatus("⏳ Registering document...");
      const tx = await contract.registerDocument(text);
      await tx.wait();

      // 2) Calculamos el hash localmente igual que en el contrato
      const docHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(text));

      // 3) Generamos el link local
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const url = `${origin}/sign/${docHash}`;
      setLink(url);
      setStatus("✅ Document registered!");
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  return (
    <main style={{ display:"flex", flexDirection:"column", gap:16, padding:24, maxWidth:800, margin:"0 auto" }}>
      <h1 style={{ fontSize:24, fontWeight:700 }}>LIVRA – Create a signing link</h1>

      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the contract text here…"
        style={{ width:"100%", padding:12, border:"1px solid #ddd", borderRadius:8 }}
      />
      <button
        onClick={handleRegister}
        disabled={!text}
        style={{ padding:"10px 14px", background:"#2563eb", color:"#fff", borderRadius:8, width:"fit-content" }}
      >
        Register & Generate Link
      </button>

      {status && <p>{status}</p>}
      {link && (
        <p>
          Share this link (local):{" "}
          <a href={link} style={{ color:"#2563eb", textDecoration:"underline" }}>{link}</a>
        </p>
      )}
    </main>
  );
}
