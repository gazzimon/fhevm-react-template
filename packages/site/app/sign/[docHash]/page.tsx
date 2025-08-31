"use client";

import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import SignatureCanvas from "react-signature-canvas";
import SignatureRegistryABI from "../../../contracts/SignatureRegistry.json";

export default function SignPage({ params }: { params: { docHash: string } }) {
  const { docHash } = params;
  const [text, setText] = useState<string>("");
  const [signatures, setSignatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Cargar documento + firmas
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

  const saveHandSignature = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      console.log("Firma manuscrita (base64 PNG):", dataUrl);
      alert("✍️ Firma manuscrita capturada (ver consola)");
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

          {/* Lienzo manuscrito */}
          <h3 style={{ marginTop:20, fontWeight:600 }}>Optional: Draw your handwritten signature</h3>
          <div style={{ 
            border: "2px solid #ccc", 
            borderRadius: "8px", 
            width: "100%", 
            maxWidth: "500px", 
            height: "200px", 
            backgroundColor: "#fff" 
          }}>
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ 
                width: 500, 
                height: 200, 
                style: { borderRadius: "8px", width: "100%", height: "200px" } 
              }}
            />
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button 
              onClick={() => sigCanvas.current?.clear()} 
              style={{ padding:"6px 12px", border:"1px solid #ccc", borderRadius:6 }}
            >
              Clear
            </button>
            <button 
              onClick={saveHandSignature} 
              style={{ padding:"6px 12px", background:"#3b82f6", color:"#fff", borderRadius:6 }}
            >
              Save Hand Signature
            </button>
          </div>

          {status && <p>{status}</p>}

          <h2 style={{ fontWeight:700, marginTop:8 }}>Signatures (on-chain)</h2>
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
