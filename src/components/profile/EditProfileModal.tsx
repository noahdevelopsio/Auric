"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Loader2 } from "lucide-react";
import { AVATAR_GRADIENTS, BANNER_GRADIENTS, useProfileStore } from "@/store/profileStore";
import { useToastStore } from "@/store/toastStore";
import { validateProfile } from "@/lib/utils/validation";
import { MAX_BIO_LENGTH } from "@/lib/utils/constants";
import { buildAuthMessage } from "@/lib/auth/walletAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import type { ApiResponse } from "@/types/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function EditProfileModal({ isOpen, onClose, address }: Props) {
  const { getProfile, setProfile } = useProfileStore();
  const { addToast } = useToastStore();
  const wallet = useWallet();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarGradient, setAvatarGradient] = useState<string>(AVATAR_GRADIENTS[0]);
  const [bannerGradient, setBannerGradient] = useState<string>(BANNER_GRADIENTS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const profile = getProfile(address);
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setAvatarGradient(profile.avatarGradient);
    setBannerGradient(profile.bannerGradient);
    setErrors({});
  }, [isOpen, address, getProfile]);

  const handleSave = async () => {
    const validationErrors = validateProfile({ displayName, bio });
    if (validationErrors.length > 0) {
      setErrors(Object.fromEntries(validationErrors.map((e) => [e.field, e.message])));
      return;
    }

    if (!wallet.signMessage) {
      addToast({ type: "error", message: "Your wallet does not support message signing" });
      return;
    }

    setSaving(true);
    try {
      const timestamp = Date.now();
      const message = buildAuthMessage("update profile", address, timestamp);
      const signatureBytes = await wallet.signMessage(new TextEncoder().encode(message));
      const signature = Buffer.from(signatureBytes).toString("base64");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          timestamp,
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarGradient,
          bannerGradient,
        }),
      });
      const json: ApiResponse<never> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update profile");

      setProfile(address, { displayName: displayName.trim(), bio: bio.trim(), avatarGradient, bannerGradient });
      addToast({ type: "success", message: "Profile updated" });
      onClose();
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to update profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="md">
      <div className="space-y-5">
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Anonymous"
          error={errors.displayName}
          maxLength={50}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell collectors about yourself"
            maxLength={MAX_BIO_LENGTH}
            rows={3}
            className={`w-full rounded-md border bg-bg-overlay px-4 py-2.5 text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong resize-none ${
              errors.bio ? "border-semantic-error focus:ring-semantic-error/50" : "border-border-default hover:border-border-strong"
            }`}
          />
          <p className={`text-xs leading-5 ${errors.bio ? "text-semantic-error" : "text-text-tertiary"}`}>
            {errors.bio ?? `${bio.length}/${MAX_BIO_LENGTH}`}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Avatar color</label>
          <div className="flex gap-3">
            {AVATAR_GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                aria-label="Select avatar color"
                onClick={() => setAvatarGradient(gradient)}
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center transition-all ${
                  avatarGradient === gradient ? "ring-2 ring-text-primary ring-offset-2 ring-offset-bg-surface" : "opacity-70 hover:opacity-100"
                }`}
              >
                {avatarGradient === gradient && <Check className="w-4 h-4 text-bg-base" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">Banner style</label>
          <div className="flex gap-3">
            {BANNER_GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                aria-label="Select banner style"
                onClick={() => setBannerGradient(gradient)}
                className={`h-10 w-16 rounded-lg bg-gradient-to-r ${gradient} border transition-all ${
                  bannerGradient === gradient ? "border-text-primary" : "border-border-default opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="sol" className="flex-1 flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
