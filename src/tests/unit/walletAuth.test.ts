// @vitest-environment node
import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import { buildAuthMessage, verifyWalletAuth, AUTH_MESSAGE_MAX_AGE_MS } from "@/lib/auth/walletAuth";

function signAuthMessage(keypair: Keypair, action: string, timestamp: number) {
  const address = keypair.publicKey.toBase58();
  const message = buildAuthMessage(action, address, timestamp);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.sign.detached(messageBytes, new Uint8Array(keypair.secretKey));
  return { address, signature: Buffer.from(signatureBytes).toString("base64") };
}

describe("buildAuthMessage", () => {
  it("includes the action, address, and timestamp", () => {
    const message = buildAuthMessage("update profile", "abc123", 1700000000000);
    expect(message).toContain("update profile");
    expect(message).toContain("abc123");
    expect(message).toContain("1700000000000");
  });
});

describe("verifyWalletAuth", () => {
  it("returns null for a valid signature", () => {
    const keypair = Keypair.generate();
    const timestamp = Date.now();
    const { address, signature } = signAuthMessage(keypair, "update profile", timestamp);

    const error = verifyWalletAuth({ action: "update profile", address, signature, timestamp });
    expect(error).toBeNull();
  });

  it("rejects a signature for a different action", () => {
    const keypair = Keypair.generate();
    const timestamp = Date.now();
    const { address, signature } = signAuthMessage(keypair, "update profile", timestamp);

    const error = verifyWalletAuth({ action: "create collection", address, signature, timestamp });
    expect(error).toBe("Signature verification failed");
  });

  it("rejects a signature from a different keypair", () => {
    const signer = Keypair.generate();
    const claimedAddress = Keypair.generate().publicKey.toBase58();
    const timestamp = Date.now();
    const { signature } = signAuthMessage(signer, "update profile", timestamp);

    const error = verifyWalletAuth({ action: "update profile", address: claimedAddress, signature, timestamp });
    expect(error).toBe("Signature verification failed");
  });

  it("rejects an expired timestamp", () => {
    const keypair = Keypair.generate();
    const timestamp = Date.now() - AUTH_MESSAGE_MAX_AGE_MS - 1000;
    const { address, signature } = signAuthMessage(keypair, "update profile", timestamp);

    const error = verifyWalletAuth({ action: "update profile", address, signature, timestamp });
    expect(error).toBe("Signed message has expired");
  });

  it("rejects a timestamp in the future", () => {
    const keypair = Keypair.generate();
    const timestamp = Date.now() + 60_000;
    const { address, signature } = signAuthMessage(keypair, "update profile", timestamp);

    const error = verifyWalletAuth({ action: "update profile", address, signature, timestamp });
    expect(error).toBe("Signed message has expired");
  });

  it("rejects an invalid address", () => {
    const error = verifyWalletAuth({
      action: "update profile",
      address: "not-a-real-address",
      signature: Buffer.from(new Uint8Array(64)).toString("base64"),
      timestamp: Date.now(),
    });
    expect(error).toBe("Invalid address or signature encoding");
  });

  it("rejects a malformed signature length", () => {
    const keypair = Keypair.generate();
    const error = verifyWalletAuth({
      action: "update profile",
      address: keypair.publicKey.toBase58(),
      signature: Buffer.from("short").toString("base64"),
      timestamp: Date.now(),
    });
    expect(error).toBe("Invalid signature length");
  });
});
