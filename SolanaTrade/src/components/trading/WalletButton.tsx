import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC } from 'react';

export const WalletButton: FC = () => {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center">
      {connected && publicKey ? (
        <div className="mr-4 flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
          <span className="text-sm text-slate-300">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
      ) : null}
      <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 text-sm text-white" />
    </div>
  );
}; 