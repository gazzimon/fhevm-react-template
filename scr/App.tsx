import { useState } from "react";
import SignInButton from "./components/SignInButton";
import SignatureCanvas from "./components/SignatureCanvas";

function App() {
  const [address, setAddress] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center mt-10">
      {!address ? (
        <SignInButton onSignedIn={setAddress} />
      ) : (
        <SignatureCanvas address={address} />
      )}
    </div>
  );
}

export default App;
