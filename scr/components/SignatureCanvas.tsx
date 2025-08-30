import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { ethers } from "ethers";

export default function SignatureCanvas({ address }: { address: string }) {
  const sigCanvas = useRef<SignaturePad>(null);

  const clear = () => sigCanvas.current?.clear();

  const save = async () => {
    if (!sigCanvas.current) return;
    const data = sigCanvas.current.toDataURL("image/png");

    // 1. Guardar en backend
    await fetch("http://localhost:3001/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signatureImage: data }),
    });

    // 2. Guardar en blockchain
    try {
      // convertir base64 a buffer
      const buffer = Buffer.from(data.split(",")[1], "base64");
      const hash = ethers.keccak256(buffer);

      // conectar a Metamask
      if (!window.ethereum) throw new Error("Metamask no detectado");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // contrato desplegado
      const registryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // tu contrato
      const abi = [
        "function storeSignature(bytes32 signatureHash) external",
        "function getSignature(address user) external view returns (bytes32)"
      ];
      const contract = new ethers.Contract(registryAddress, abi, signer);

      // guardar hash en blockchain
      const tx = await contract.storeSignature(hash);
      await tx.wait();

      alert("✅ Firma guardada en servidor + blockchain!\nHash: " + hash);
    } catch (err) {
      console.error("Error guardando en blockchain:", err);
      alert("❌ Error al guardar en blockchain. Mira la consola.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <SignaturePad
        ref={sigCanvas}
        penColor="black"
        canvasProps={{
          width: 400,
          height: 200,
          className: "border-2 border-gray-400 rounded-md"
        }}
      />
      <div className="flex gap-4">
        <button
          onClick={clear}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Borrar
        </button>
        <button
          onClick={save}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Guardar firma
        </button>
      </div>
    </div>
  );
}
