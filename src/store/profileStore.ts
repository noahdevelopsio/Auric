import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AVATAR_GRADIENTS = [
  "from-btc-500 to-sol-purple",
  "from-sol-purple to-sol-teal",
  "from-btc-500 to-btc-300",
  "from-sol-teal to-sol-500",
] as const;

export const BANNER_GRADIENTS = [
  "bg-gradient-banner-1",
  "bg-gradient-banner-2",
  "bg-gradient-banner-3",
  "bg-gradient-banner-4",
] as const;

export interface Profile {
  displayName: string;
  bio: string;
  avatarGradient: string;
  bannerGradient: string;
}

export const DEFAULT_PROFILE: Profile = {
  displayName: "",
  bio: "",
  avatarGradient: AVATAR_GRADIENTS[0],
  bannerGradient: BANNER_GRADIENTS[0],
};

interface ProfileState {
  profiles: Record<string, Profile>;
  getProfile: (address: string) => Profile;
  setProfile: (address: string, profile: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: {},
      getProfile: (address) => ({ ...DEFAULT_PROFILE, ...get().profiles[address] }),
      setProfile: (address, profile) =>
        set((s) => ({
          profiles: {
            ...s.profiles,
            [address]: { ...DEFAULT_PROFILE, ...s.profiles[address], ...profile },
          },
        })),
    }),
    { name: "auric-profile" }
  )
);
