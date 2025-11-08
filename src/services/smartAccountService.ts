// src/services/smartAccountService.ts

import { createSmartAccountClient } from "permissionless";
import { http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { base } from "viem/chains";
import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";

/**
 * Creates a new ERC-4337 smart account on the Base network.
 * @returns The address and private key of the new smart account.
 */
export async function createSmartAccount(): Promise<{ address: `0x${string}`; privateKey: `0x${string}` }> {
  const privateKey = generatePrivateKey();
  const signer = privateKeyToAccount(privateKey);

  const bundlerUrl = process.env.PIMLICO_API_KEY
    ? `https://api.pimlico.io/v1/base/rpc?apikey=${process.env.PIMLICO_API_KEY}`
    : "https://api.pimlico.io/v1/base/rpc?apikey=YOUR_PIMLICO_API_KEY";

  const smartAccount = await createSmartAccountClient({
    account: signer,
    chain: base,
    bundlerUrl,
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  });

  if (!smartAccount.account) {
    throw new Error("Failed to create smart account");
  }

  const address = smartAccount.account.address;
  console.log(`Smart account created at address: ${address}`);
  return { address, privateKey };
}

/**
 * Generates a new Hedera DID for the user.
 * @returns The new Hedera DID as a string.
 */
export async function createHederaDID(): Promise<string> {
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const didPrivateKey = PrivateKey.generateED25519();
  const didPublicKey = didPrivateKey.publicKey;
  const did = `did:hedera:testnet:${didPublicKey.toStringRaw()}_${operatorId.toString()}`;

  console.log(`Hedera DID created: ${did}`);
  return did;
}

/**
 * Associates a smart account address with a Hedera DID.
 * NOTE: This is a placeholder.
 * @param did The Hedera DID string.
 * @param smartAccountAddress The address of the smart account.
 */
export async function associateDIDWithSmartAccount(did: string, smartAccountAddress: string): Promise<void> {
  console.log(`[PLACEHOLDER] Associating DID ${did} with smart account ${smartAccountAddress}...`);
  console.log("[PLACEHOLDER] Association complete.");
}
