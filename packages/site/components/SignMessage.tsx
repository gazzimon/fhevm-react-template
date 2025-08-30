"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function SignMessage({ contractAddress, abi }: { contractAddress: string; abi: any }) {
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const msg = e.target.value;
    setMessage(msg);
    if (msg.length > 0) {
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msg));
      setHash(msgHash);
    } else {
      setHash(null);
    }
  };

  const handleSign = async () => {
    try {
      if (!window.ethereum) {
        setStatus("⚠️ No wallet detected");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const signature = await signer.signMessage(message);

      // Si tu contrato tiene otra función, reemplazá registerSignature
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.registerSignature(hash, signature);
      await tx.wait();

      setStatus(`✅ Signed & stored on-chain. Tx: ${tx.hash}`);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, border:"1px solid #ddd", padding:16, borderRadius:8, width:"100%", maxWidth:600 }}>
      <h2 style={{ fontWeight:700 }}>✍️ Sign a Message</h2>
      <textarea
        rows={4}
        value={message}
        onChange={handleChange}
        placeholder="Paste or type the text you want to sign..."
        style={{ padding:8, border:"1px solid #ccc", borderRadius:6 }}
      />
      {hash && <p><strong>Hash:</strong> {hash}</p>}
      <button
        onClick={handleSign}
        disabled={!message}
        style={{ padding:"8px 12px", background:"#2563eb", color:"white", borderRadius:6 }}
      >
        Sign & Register
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
