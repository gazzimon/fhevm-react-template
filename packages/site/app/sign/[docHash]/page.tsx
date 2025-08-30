"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import SignatureRegistryABI from "../../../contracts/SignatureRegistry.json";

export default function SignPage({ params }: { params: { docHash: string } }) {
  const { docHash } = params;
  const [text, setText] = useState<string>("");
  const [signatures, setSignatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Cargar documento + firmas con provider de solo lectura (RPC local)
  const loadData = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        SignatureRegistryABI.abi,
        provider
      );
      const [docText] = await contract.getDocument(docHash);
      setText(docText);
      const sigs = await contract.getSignatures(docHash);
      setSignatures(sigs);
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  const handleSign = async () => {
    try {
      if (!window.ethereum) {
        setStatus("⚠️ No wallet detected");
        return;
      }
      // Intentar geolocalización del browser (opcional)
      const getGeo = () =>
        new Promise<string>((resolve) => {
          if (!navigator.geolocation) return resolve("");
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
            () => resolve("")
          );
        });

      const geo = await getGeo();

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        SignatureRegistryABI.abi,
        signer
      );

      setStatus("⏳ Signing...");
      const tx = await contract.signDocument(docHash, geo);
      await tx.wait();
      setStatus(`✅ Signed! Tx: ${tx.hash}`);

      await loadData();
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docHash]);

  return (
    <main style={{ display:"flex", flexDirection:"column", gap:16, padding:24, maxWidth:800, margin:"0 auto" }}>
      <h1 style={{ fontSize:24, fontWeight:700 }}>Sign Document</h1>

      {!text ? (
        <p>Loading…</p>
      ) : (
        <>
          <p style={{ whiteSpace:"pre-wrap", border:"1px solid #eee", padding:12, borderRadius:8 }}>{text}</p>

          <button
            onClick={handleSign}
            style={{ padding:"10px 14px", background:"#16a34a", color:"#fff", borderRadius:8, width:"fit-content" }}
          >
            Sign with LIVRA
          </button>

          {status && <p>{status}</p>}

          <h2 style={{ fontWeight:700, marginTop:8 }}>Signatures</h2>
          <ul style={{ paddingLeft:18, listStyle:"disc" }}>
            {signatures.map((s, i) => (
              <li key={i}>
                {s.signer} — {new Date(Number(s.timestamp) * 1000).toLocaleString()} — {s.geo}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
