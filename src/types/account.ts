export interface LinkedWallet {
  address: string;
  chain: "solana" | "bitcoin";
  isPrimary: boolean;
}

export interface ProfileDto {
  address: string;
  displayName: string;
  bio: string;
  avatarGradient: string;
  bannerGradient: string;
  linkedAddresses: LinkedWallet[];
  primaryAddress: string;
}
