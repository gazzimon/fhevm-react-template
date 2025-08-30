import { useEthersSigner } from "../hooks/useEthersSigner";
import { ethers } from "ethers";

export default function SignInButton({ onSignedIn }: { onSignedIn: (address: string) => void }) {
  const signer = useEthersSigner();

  const handleSignIn = async () => {
    if (!signer) return alert("Conecta tu wallet primero");
    const address = await signer.getAddress();

    const nonceRes = await fetch(`http://localhost:3001/auth/nonce?address=${address}`);
    const { nonce } = await nonceRes.json();

    const signature = await signer.signMessage(nonce);

    const verifyRes = await fetch("http://localhost:3001/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature }),
    });

    const { token } = await verifyRes.json();
    localStorage.setItem("authToken", token);

    alert("✅ Sign In exitoso!");
    onSignedIn(address);
  };

  return (
    <button
      onClick={handleSignIn}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign in con LIVRA
    </button>
  );
}
