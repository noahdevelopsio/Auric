import { request, AddressPurpose } from 'sats-connect';

export interface BitcoinWalletConnection {
  ordinalsAddress: string;
  paymentAddress: string;
  publicKey: string;
}

export async function connectBitcoinWallet() {
  const response = await request('getAccounts', {
    purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
    message: 'Address for receiving Ordinals and payments',
  });

  if (response.status !== 'success') {
    throw new Error(response.error?.message ?? 'Bitcoin wallet connection failed');
  }

  const ordinalsAccount = response.result.find((account) => account.purpose === AddressPurpose.Ordinals);
  const paymentAccount = response.result.find((account) => account.purpose === AddressPurpose.Payment);

  if (!ordinalsAccount || !paymentAccount) {
    throw new Error('Bitcoin wallet did not return both ordinals and payment addresses');
  }

  return {
    ordinalsAddress: ordinalsAccount.address,
    paymentAddress: paymentAccount.address,
    publicKey: ordinalsAccount.publicKey,
  } satisfies BitcoinWalletConnection;
}
