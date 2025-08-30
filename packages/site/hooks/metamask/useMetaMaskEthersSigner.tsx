import { ethers } from "ethers";
import { useMetaMask } from "./useMetaMaskProvider";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface UseMetaMaskEthersSignerState {
  provider: ethers.providers.ExternalProvider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.Signer | undefined) => boolean>;
  ethersWeb3Provider: ethers.providers.Web3Provider | undefined;
  ethersReadonlyProvider: ethers.providers.Provider | undefined;
  ethersSigner: ethers.Signer | undefined;
  initialMockChains: Readonly<Record<number, string>> | undefined;
}

function useMetaMaskEthersSignerInternal(parameters: {
  initialMockChains?: Readonly<Record<number, string>>;
}): UseMetaMaskEthersSignerState {
  const { initialMockChains } = parameters;
  const { provider, chainId, accounts, isConnected, connect, error } =
    useMetaMask();
  const [ethersSigner, setEthersSigner] = useState<ethers.Signer | undefined>(
    undefined
  );
  const [ethersWeb3Provider, setEthersWeb3Provider] = useState<
    ethers.providers.Web3Provider | undefined
  >(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    ethers.providers.Provider | undefined
  >(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.Signer | undefined>(undefined);

  const sameChain = useRef((c: number | undefined) => {
    return c === chainIdRef.current;
  });

  const sameSigner = useRef((s: ethers.Signer | undefined) => {
    return s === ethersSignerRef.current;
  });

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    if (
      !provider ||
      !chainId ||
      !isConnected ||
      !accounts ||
      accounts.length === 0
    ) {
      ethersSignerRef.current = undefined;
      setEthersSigner(undefined);
      setEthersWeb3Provider(undefined);
      setEthersReadonlyProvider(undefined);
      return;
    }

    console.warn(
      `[useMetaMaskEthersSignerInternal] create new ethers.providers.Web3Provider(), chainId=${chainId}`
    );

    // Provider conectado a MetaMask
    const wp = new ethers.providers.Web3Provider(provider as any);

    // Por defecto, usamos ese mismo provider también como readonly
    let rop: ethers.providers.Provider = wp;

    const rpcUrl: string | undefined = initialMockChains?.[chainId];
    if (rpcUrl) {
      rop = new ethers.providers.JsonRpcProvider(rpcUrl);
      console.warn(
        `[useMetaMaskEthersSignerInternal] create new readonly provider ethers.providers.JsonRpcProvider(${rpcUrl}), chainId=${chainId}`
      );
    } else {
      console.warn(
        `[useMetaMaskEthersSignerInternal] using ethers.providers.Web3Provider as readonly provider`
      );
    }

    const s = wp.getSigner();
    ethersSignerRef.current = s;
    setEthersSigner(s);
    setEthersWeb3Provider(wp);
    setEthersReadonlyProvider(rop);
  }, [provider, chainId, isConnected, accounts, initialMockChains]);

  return {
    sameChain,
    sameSigner,
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersWeb3Provider,
    ethersReadonlyProvider,
    ethersSigner,
    error,
    initialMockChains,
  };
}

const MetaMaskEthersSignerContext =
  createContext<UseMetaMaskEthersSignerState | undefined>(undefined);

interface MetaMaskEthersSignerProviderProps {
  children: ReactNode;
  initialMockChains: Readonly<Record<number, string>>;
}

export const MetaMaskEthersSignerProvider: React.FC<
  MetaMaskEthersSignerProviderProps
> = ({ children, initialMockChains }) => {
  const props = useMetaMaskEthersSignerInternal({ initialMockChains });
  return (
    <MetaMaskEthersSignerContext.Provider value={props}>
      {children}
    </MetaMaskEthersSignerContext.Provider>
  );
};

export function useMetaMaskEthersSigner() {
  const context = useContext(MetaMaskEthersSignerContext);
  if (context === undefined) {
    throw new Error(
      "useMetaMaskEthersSigner must be used within a MetaMaskEthersSignerProvider"
    );
  }
  return context;
}
