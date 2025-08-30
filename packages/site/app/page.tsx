"use client";

import { useState } from "react";
import SignInButton from "../components/SignInButton";
import SignatureCanvas from "../components/SignatureCanvas";
import SignMessage from "../components/SignMessage";
import SignatureRegistryABI from "../contracts/SignatureRegistry.json"; // exportá el ABI al front

export default function Page() {
  const [addr, setAddr] = useState<string | null>(null);

  return (
    <main style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:24 }}>
      <h1 style={{ fontSize:24, fontWeight:700 }}>LIVRA – Sign In + Firma manuscrita</h1>
      
      {!addr ? (
        <SignInButton onSignedIn={setAddr} />
      ) : (
        <>
          <SignatureCanvas address={addr} />
          <SignMessage
            contractAddress={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!}
            abi={SignatureRegistryABI.abi}
          />
        </>
      )}
    </main>
  );
}
