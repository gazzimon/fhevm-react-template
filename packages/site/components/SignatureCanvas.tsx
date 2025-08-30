"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { ethers } from "ethers";

const SignaturePad = dynamic(() => import("react-signature-canvas"), { ssr: false });

function base64ToBytes(base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default function SignatureCanvas({ address }: { address: string }) {
  const sigRef = useRef<any>(null);

  const clear = () => sigRef.current?.clear();

  const save = async () => {
    if (!sigRef.current) return;
    const dataUrl = sigRef.current.toDataURL("image/png");

    // 1) Guardar imagen en backend
    await fetch("http://localhost:3001/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signatureImage: dataUrl })
    });

    try {
      // 2) Calcular hash del PNG en el browser
      const base64 = dataUrl.split(",")[1];
      const bytes = base64ToBytes(base64);
      const hash = ethers.keccak256(bytes);

      // 3) Enviar tx al contrato
      const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS!;
      if (!registryAddress) throw new Error("Falta NEXT_PUBLIC_REGISTRY_ADDRESS");

      if (!(window as any).ethereum) throw new Error("Metamask no detectado");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const abi = [
        "function storeSignature(bytes32 signatureHash) external",
        "function getSignature(address user) external view returns (bytes32)"
      ];
      const contract = new ethers.Contract(registryAddress, abi, signer);

      const tx = await contract.storeSignature(hash);
      await tx.wait();

      alert(`✅ Firma guardada en servidor + blockchain\nHash: ${hash}`);
    } catch (e) {
      console.error(e);
      alert("❌ Error al guardar en blockchain (ver consola)");
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, marginTop:16 }}>
      <SignaturePad
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 200, style:{ border:"2px solid #9ca3af", borderRadius:8 } }}
      />
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={clear} style={{ background:"#ef4444", color:"#fff", padding:"8px 12px", borderRadius:8 }}>
          Borrar
        </button>
        <button onClick={save} style={{ background:"#16a34a", color:"#fff", padding:"8px 12px", borderRadius:8 }}>
          Guardar firma
        </button>
      </div>
    </div>
  );
}
