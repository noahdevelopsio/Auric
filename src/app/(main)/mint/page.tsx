"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { useWalletStore } from "@/store/walletStore";
import { useToastStore } from "@/store/toastStore";
import {
  UploadCloud,
  X,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  ImageIcon,
} from "lucide-react";

type ChainType = "solana" | "bitcoin";
type FeeRate = "economy" | "standard" | "priority";
type Attribute = { traitType: string; value: string };

const FEE_RATES: Record<FeeRate, { label: string; satsPerVb: number }> = {
  economy: { label: "Economy", satsPerVb: 10 },
  standard: { label: "Standard", satsPerVb: 25 },
  priority: { label: "Priority", satsPerVb: 50 },
};

const SOL_PRICE_USD = 155;
const BTC_PRICE_USD = 98000;

function calcSolFees(fileBytes: number) {
  const storageSol = Math.max(0.002, (fileBytes / 1024 / 1024) * 0.001);
  return { network: 0.000005, metaplex: 0.01, platform: 0.01, storage: storageSol };
}

function calcBtcFees(fileBytes: number, feeRate: FeeRate) {
  const satsPerVb = FEE_RATES[feeRate].satsPerVb;
  const inscriptionBytes = fileBytes + 500;
  const networkBtc = (inscriptionBytes * satsPerVb) / 1e8;
  return { network: networkBtc, platform: 0.0005 };
}

export default function MintPage() {
  const [targetChain, setTargetChain] = useState<ChainType>("solana");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [royalties, setRoyalties] = useState(5);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [feeRate, setFeeRate] = useState<FeeRate>("standard");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [minting, setMinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { solanaAddress, btcAddress, openModal } = useWalletStore();
  const { addToast } = useToastStore();
  const isConnected = !!(solanaAddress || btcAddress);

  const maxBytes = targetChain === "solana" ? 50 * 1024 * 1024 : 4 * 1024 * 1024;
  const acceptedTypes =
    targetChain === "solana"
      ? "image/png,image/jpeg,image/gif,image/webp,video/mp4"
      : "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,text/html,text/plain";
  const acceptedLabel =
    targetChain === "solana" ? "PNG, JPG, GIF, WEBP, MP4" : "PNG, JPG, GIF, WEBP, SVG, HTML, TXT";
  const maxLabel = targetChain === "solana" ? "50MB" : "4MB";

  const processFile = useCallback(
    (f: File) => {
      if (f.size > maxBytes) {
        addToast({ type: "error", message: `File too large. Max ${maxLabel} for ${targetChain === "solana" ? "Solana" : "Bitcoin"}.` });
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setUploadProgress(1);
      const iv = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 100) {
            clearInterval(iv);
            return 100;
          }
          return Math.min(100, p + Math.floor(Math.random() * 12) + 6);
        });
      }, 300);
    },
    [maxBytes, maxLabel, targetChain, addToast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addAttribute = () => {
    if (attributes.length >= 20) return;
    setAttributes((prev) => [...prev, { traitType: "", value: "" }]);
  };

  const updateAttribute = (idx: number, field: keyof Attribute, val: string) => {
    setAttributes((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));
  };

  const removeAttribute = (idx: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMint = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isConnected) {
      openModal();
      return;
    }
    if (!file || !name) {
      addToast({ type: "error", message: "Please fill in a name and upload a file." });
      return;
    }

    setMinting(true);
    addToast({ type: "info", message: `${targetChain === "solana" ? "Minting" : "Inscribing"}…` });

    await new Promise((r) => setTimeout(r, 2000));

    const mockTx = `${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
    setTxSignature(mockTx);
    setMinting(false);
    setSuccess(true);
    addToast({ type: "success", message: `${targetChain === "solana" ? "NFT minted" : "Inscription confirmed"} successfully!` });
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  }, [targetChain]);

  const fileSizeMB = file ? file.size / 1024 / 1024 : 0;
  const solFees = calcSolFees(file?.size ?? 0);
  const btcFees = calcBtcFees(file?.size ?? 0, feeRate);
  const solTotal = solFees.network + solFees.metaplex + solFees.platform + solFees.storage;
  const btcTotal = btcFees.network + btcFees.platform;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <CheckCircle className="w-16 h-16 text-semantic-success animate-[scaleIn_0.4s_ease-out]" />
          <div>
            <h1 className="text-3xl font-headings font-bold mb-2">
              {targetChain === "solana" ? "Your NFT is Live!" : "Your Inscription is Confirmed!"}
            </h1>
            <p className="text-text-secondary">
              {targetChain === "solana" ? "Your NFT has been minted on Solana." : "Your file has been inscribed on Bitcoin."}
            </p>
          </div>

          {previewUrl && (
            <div className="w-48 h-48 rounded-xl overflow-hidden border border-border-default shadow-xl bg-bg-surface">
              <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <Badge variant={targetChain === "bitcoin" ? "btc" : "sol"} className="text-sm px-3 py-1">
              <span className="flex items-center gap-1.5">
                <ChainIcon chain={targetChain} size={13} />
                {targetChain === "solana" ? "Solana NFT" : "Bitcoin Ordinal"}
              </span>
            </Badge>
            <p className="text-lg font-semibold mt-2">{name}</p>
          </div>

          <a
            href={`https://${targetChain === "solana" ? "explorer.solana.com/tx/" : "ordinals.com/inscription/"}${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            View on Explorer <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button
              variant={targetChain === "solana" ? "sol" : "btc"}
              size="lg"
              className="flex-1"
              onClick={() => alert("Navigate to NFT detail")}
            >
              View Your NFT
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setFile(null);
                setPreviewUrl(null);
                setUploadProgress(0);
                setName("");
                setDescription("");
                setAttributes([]);
                setTxSignature("");
              }}
            >
              Mint Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Create</p>
        <h1 className="text-3xl md:text-4xl font-headings font-bold">Create Your NFT</h1>
        <p className="text-text-secondary mt-2">Mint on Solana or inscribe on Bitcoin. Your art, your chain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Form Column */}
        <form onSubmit={handleMint} className="space-y-8">

          {/* Chain Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["solana", "bitcoin"] as ChainType[]).map((chain) => {
              const selected = targetChain === chain;
              return (
                <button
                  key={chain}
                  type="button"
                  onClick={() => setTargetChain(chain)}
                  className={`relative rounded-xl p-5 text-left transition-all duration-200 border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-strong ${
                    selected
                      ? chain === "solana"
                        ? "border-sol-purple bg-sol-glow shadow-sol"
                        : "border-btc-500 bg-btc-glow shadow-btc"
                      : "border-border-default bg-bg-surface hover:border-border-strong"
                  }`}
                >
                  {selected && (
                    <div
                      className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                        chain === "solana" ? "bg-sol-purple" : "bg-btc-500"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <ChainIcon chain={chain} size={24} />
                    <span className="font-display font-semibold text-text-primary">
                      {chain === "solana" ? "Solana NFT" : "Bitcoin Ordinal"}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mb-1">
                    {chain === "solana" ? "Fast · Low fees · Royalty support" : "Permanent · On-chain · Prestige"}
                  </p>
                  <p className={`text-sm font-medium ${chain === "solana" ? "text-sol-purple" : "text-btc-500"}`}>
                    {chain === "solana" ? "~0.02 SOL (~$3)" : "~0.0006 BTC (~$59)"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">
              File <span className="text-text-tertiary">({acceptedLabel} · Max {maxLabel})</span>
            </label>

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed h-52 flex flex-col items-center justify-center transition-all duration-150 ${
                  isDragOver
                    ? "border-border-strong bg-bg-elevated"
                    : "border-border-default bg-bg-overlay hover:border-border-strong hover:bg-bg-elevated"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={acceptedTypes}
                  onChange={handleFileChange}
                />
                <UploadCloud
                  className={`w-10 h-10 mb-3 transition-all duration-150 ${
                    isDragOver ? "scale-110 text-text-primary" : "text-text-tertiary"
                  }`}
                />
                <p className="text-sm font-medium text-text-primary">
                  {isDragOver ? "Drop it!" : "Drag & drop your file here"}
                </p>
                <p className="text-xs text-text-tertiary mt-1">or click to browse</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border-default bg-bg-overlay overflow-hidden">
                {uploadProgress < 100 ? (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-8 h-8 text-text-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-text-tertiary">{fileSizeMB.toFixed(1)} MB</p>
                      </div>
                    </div>
                    <div>
                      <div className="h-1.5 w-full rounded-full bg-bg-highlight overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            targetChain === "solana" ? "bg-sol-purple" : "bg-btc-500"
                          }`}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-text-tertiary">Uploading to Arweave...</p>
                        <p className="text-xs text-text-tertiary">{uploadProgress}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    {file.type.startsWith("image/") && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-44 object-contain bg-bg-base"
                      />
                    ) : (
                      <div className="h-44 flex items-center justify-center bg-bg-base">
                        <div className="text-center">
                          <ImageIcon className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                          <p className="text-xs text-text-secondary">{file.name}</p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Name <span className="text-semantic-error">*</span>
              </label>
              <span className={`text-xs ${name.length > 80 ? name.length >= 100 ? "text-semantic-error" : "text-semantic-warning" : "text-text-tertiary"}`}>
                {name.length}/100
              </span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="Enter a name for your NFT"
              required
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-secondary">Description</label>
              <span className={`text-xs ${description.length > 1800 ? "text-semantic-warning" : "text-text-tertiary"}`}>
                {description.length}/2000
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={4}
              placeholder="Describe your NFT — tell the story behind the artwork"
              className="w-full rounded-md border border-border-default bg-bg-overlay px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-border-strong hover:border-border-strong transition-colors resize-none"
            />
          </div>

          {/* Royalties — Solana only */}
          {targetChain === "solana" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Creator Royalties</label>
                <span className="text-sm font-semibold text-sol-purple">{royalties}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={royalties}
                onChange={(e) => setRoyalties(Number(e.target.value))}
                className="w-full accent-[var(--color-sol-purple)] cursor-pointer"
                aria-label={`Creator royalties: ${royalties}%`}
              />
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>0%</span>
                <span className="text-text-secondary">You earn {royalties}% on every secondary sale, on-chain.</span>
                <span>50%</span>
              </div>
            </div>
          )}

          {/* Bitcoin fee rate selector */}
          {targetChain === "bitcoin" && (
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-3">Fee Rate</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(FEE_RATES) as [FeeRate, typeof FEE_RATES[FeeRate]][]).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFeeRate(key)}
                    className={`rounded-lg border p-3 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-btc-500 ${
                      feeRate === key
                        ? "border-btc-500 bg-btc-glow"
                        : "border-border-default bg-bg-overlay hover:border-border-strong"
                    }`}
                  >
                    <div className="text-sm font-semibold text-text-primary">{info.label}</div>
                    <div className="text-xs text-text-tertiary mt-0.5">{info.satsPerVb} sat/vB</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-secondary">
                Attributes <span className="text-text-tertiary">(Optional)</span>
              </label>
              <span className="text-xs text-text-tertiary">{attributes.length}/20</span>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-2 mb-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
                    <input
                      type="text"
                      value={attr.traitType}
                      onChange={(e) => updateAttribute(idx, "traitType", e.target.value)}
                      placeholder="Background"
                      className="h-9 rounded-md border border-border-default bg-bg-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(idx, "value", e.target.value)}
                      placeholder="Blue"
                      className="h-9 rounded-md border border-border-default bg-bg-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(idx)}
                      className="h-9 w-9 rounded-md text-text-tertiary hover:text-semantic-error hover:bg-semantic-errorBg flex items-center justify-center transition-colors"
                      aria-label="Remove attribute"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addAttribute}
              disabled={attributes.length >= 20}
              className="text-text-secondary"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Attribute
            </Button>
          </div>

          {/* Desktop submit button */}
          <div className="hidden lg:block pb-24">
            <Button
              type="submit"
              variant={targetChain === "solana" ? "sol" : "btc"}
              size="xl"
              className="w-full"
              isLoading={minting}
              disabled={(!name || !file) && isConnected}
            >
              {!isConnected
                ? "Connect Wallet to Mint"
                : minting
                ? targetChain === "solana"
                  ? "Minting..."
                  : "Inscribing..."
                : targetChain === "solana"
                ? "Mint NFT"
                : "Inscribe on Bitcoin"}
            </Button>
            <p className="text-xs text-text-tertiary text-center mt-3">
              By proceeding, you agree to our Terms of Service.
            </p>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Live Preview */}
          <div className="rounded-xl border border-border-default bg-bg-surface p-4 lg:sticky lg:top-24">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">Preview</p>
            <div className="aspect-square w-full rounded-lg bg-bg-overlay mb-4 overflow-hidden flex items-center justify-center">
              {previewUrl && file?.type.startsWith("image/") ? (
                <img src={previewUrl} alt={name || "Preview"} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-10 h-10 text-text-tertiary" />
                  <p className="text-xs text-text-tertiary">No file selected</p>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-medium text-text-primary truncate">
                  {name || <span className="text-text-tertiary">Your NFT name</span>}
                </p>
                <Badge variant={targetChain === "bitcoin" ? "btc" : "sol"} className="ml-2 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <ChainIcon chain={targetChain} size={11} />
                    {targetChain === "solana" ? "SOL" : "BTC"}
                  </span>
                </Badge>
              </div>
              <p className="text-xs text-text-tertiary line-clamp-2">
                {description || "No description yet"}
              </p>
            </div>
          </div>

          {/* Fee Estimate */}
          <div className="rounded-xl border border-border-default bg-bg-overlay p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4">Fee Breakdown</p>
            {targetChain === "solana" ? (
              <div className="space-y-2 text-sm">
                {[
                  ["Network fee", `~${solFees.network.toFixed(6)} SOL`],
                  ["Metaplex fee", `${solFees.metaplex} SOL`],
                  ["Platform fee", `${solFees.platform} SOL`],
                  ["Arweave storage", `~${solFees.storage.toFixed(4)} SOL`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-text-secondary">
                    <span>{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
                <div className="border-t border-border-subtle pt-2 flex justify-between font-semibold text-text-primary">
                  <span>Total estimated</span>
                  <div className="text-right">
                    <div className="font-mono">~{solTotal.toFixed(4)} SOL</div>
                    <div className="text-xs text-text-tertiary">≈ ${(solTotal * SOL_PRICE_USD).toFixed(2)} USD</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Inscription size</span>
                  <span className="font-mono">{file ? `${((file.size + 500) / 1024).toFixed(1)} vB` : "—"}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Network fee ({FEE_RATES[feeRate].satsPerVb} sat/vB)</span>
                  <span className="font-mono">{btcFees.network.toFixed(6)} BTC</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Platform fee</span>
                  <span className="font-mono">{btcFees.platform} BTC</span>
                </div>
                <div className="border-t border-border-subtle pt-2 flex justify-between font-semibold text-text-primary">
                  <span>Total estimated</span>
                  <div className="text-right">
                    <div className="font-mono">~{btcTotal.toFixed(6)} BTC</div>
                    <div className="text-xs text-text-tertiary">≈ ${(btcTotal * BTC_PRICE_USD).toFixed(2)} USD</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-bg-surface/95 backdrop-blur-md border-t border-border-subtle p-3 flex items-center gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="text-sm text-text-secondary">
          {targetChain === "solana"
            ? `~${solTotal.toFixed(3)} SOL`
            : `~${btcTotal.toFixed(5)} BTC`}
        </div>
        <Button
          variant={targetChain === "solana" ? "sol" : "btc"}
          size="md"
          className="ml-auto"
          isLoading={minting}
          disabled={(!name || !file) && isConnected}
          onClick={handleMint}
          type="button"
        >
          {!isConnected ? "Connect Wallet" : minting ? "Minting..." : "Mint"}
        </Button>
      </div>
    </div>
  );
}
