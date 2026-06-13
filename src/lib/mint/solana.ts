import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { WalletAdapter } from "@metaplex-foundation/js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { PLATFORM_FEE_WALLET_SOLANA, SOLANA_PLATFORM_FEE } from "@/lib/utils/constants";

// @metaplex-foundation/js is large (~400kB); load it on demand so it doesn't
// inflate the initial bundle of every page that can render a listing/buy modal.
const loadMetaplexSdk = () => import("@metaplex-foundation/js");

export interface MintNftParams {
  connection: Connection;
  wallet: WalletAdapter;
  name: string;
  metadataUri: string;
  sellerFeeBasisPoints: number;
}

export interface MintNftResult {
  mintAddress: string;
  txSignature: string;
}

export async function mintSolanaNft(params: MintNftParams): Promise<MintNftResult> {
  const { connection, wallet, name, metadataUri, sellerFeeBasisPoints } = params;
  const { Metaplex, walletAdapterIdentity } = await loadMetaplexSdk();
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

  const { nft, response } = await metaplex.nfts().create({
    uri: metadataUri,
    name,
    sellerFeeBasisPoints,
  });

  return { mintAddress: nft.address.toString(), txSignature: response.signature };
}

// Sends the flat platform minting fee to the configured wallet. No-op if unset.
export async function payPlatformMintFee(
  connection: Connection,
  wallet: WalletContextState,
  fromPubkey: PublicKey
): Promise<string | null> {
  if (!PLATFORM_FEE_WALLET_SOLANA || !wallet.sendTransaction) return null;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(PLATFORM_FEE_WALLET_SOLANA),
      lamports: Math.round(SOLANA_PLATFORM_FEE * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const signature = await wallet.sendTransaction(transaction, connection);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
}
