"use client";
import { ethers } from "ethers";

export default function SignInButton({ onSignedIn }: { onSignedIn: (address: string) => void }) {
  const handleSignIn = async () => {
    if (!(window as any).ethereum) return alert("Metamask no detectado");

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // pedir nonce al backend
    const nonceRes = await fetch(`http://localhost:3001/auth/nonce?address=${address}`);
    const { nonce } = await nonceRes.json();

    // firmar y verificar
    const signature = await signer.signMessage(nonce);
    const verifyRes = await fetch("http://localhost:3001/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature })
    });
    const { token } = await verifyRes.json();
    localStorage.setItem("authToken", token);

    alert("✅ Sign In correcto");
    onSignedIn(address);
  };

  return (
    <button
      onClick={handleSignIn}
      style={{ background:"#2563eb", color:"#fff", padding:"10px 16px", borderRadius:8 }}
    >
      Sign in con LIVRA
    </button>
  );
}
