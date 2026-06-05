import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/utils/constants';

export type SupportedChain = 'solana' | 'bitcoin' | null;

interface WalletState {
  isModalOpen: boolean;
  activeChain: SupportedChain;
  // Solana State
  solanaAddress: string | null;
  // Bitcoin State
  btcAddress: string | null;
  btcPaymentAddress: string | null; // For ordinals usually payment and taproot addresses differ
  btcPublicKey: string | null;
  
  // Actions
  openModal: (chain?: SupportedChain) => void;
  closeModal: () => void;
  setActiveChain: (chain: SupportedChain) => void;
  
  setSolanaAddress: (address: string | null) => void;
  setBtcState: (address: string | null, paymentAddress: string | null, publicKey: string | null) => void;
  disconnectAll: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isModalOpen: false,
      activeChain: null,
      solanaAddress: null,
      btcAddress: null,
      btcPaymentAddress: null,
      btcPublicKey: null,
      
      openModal: (chain = null) => set({ isModalOpen: true, ...(chain && { activeChain: chain }) }),
      closeModal: () => set({ isModalOpen: false, activeChain: null }),
      setActiveChain: (chain) => set({ activeChain: chain }),
      
      setSolanaAddress: (address) => set({ solanaAddress: address }),
      setBtcState: (address, paymentAddress, publicKey) => set({ 
        btcAddress: address, 
        btcPaymentAddress: paymentAddress, 
        btcPublicKey: publicKey 
      }),
      disconnectAll: () => set({
        solanaAddress: null,
        btcAddress: null,
        btcPaymentAddress: null,
        btcPublicKey: null,
        activeChain: null,
      })
    }),
    {
      name: STORAGE_KEYS.WALLET_STATE,
      partialize: (state) => ({ 
        solanaAddress: state.solanaAddress,
        btcAddress: state.btcAddress,
        btcPaymentAddress: state.btcPaymentAddress,
        btcPublicKey: state.btcPublicKey
      }),
    }
  )
);
