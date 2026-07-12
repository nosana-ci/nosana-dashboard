import { createTokenService, Logger } from "@nosana/kit";
import type { Address } from "@nosana/kit";

export type CryptoTopupToken = "USDC" | "NOS";

const TOKEN_DECIMALS: Record<CryptoTopupToken, number> = {
  USDC: 6,
  NOS: 6,
};

export function useCryptoTopup() {
  const { nosana, wallet } = useKit();
  const { userData } = useSuperTokens();
  const config = useRuntimeConfig().public;

  const USDC_MINT =
    config.network === "devnet"
      ? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
      : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  const topup = async (token: CryptoTopupToken, amount: number): Promise<string> => {

    const dest = userData.value?.generatedAddress;
    if (!dest) throw new Error("No generated address found on your account.");
    if (!wallet.value) throw new Error("Wallet not connected.");
    nosana.value.wallet = wallet.value;

    const decimals = TOKEN_DECIMALS[token];
    const rawAmount = BigInt(Math.round(amount * 10 ** decimals));

    let instructions;
    if (token === "NOS") {
      instructions = await nosana.value.nos.transfer({ to: dest, amount: rawAmount });
    } else {
      const logger = Logger.getInstance();
      const usdcService = createTokenService(
        {
          logger,
          solana: nosana.value.solana,
          getWallet: () => wallet.value ?? undefined,
        },
        { tokenAddress: USDC_MINT as Address },
      );
      instructions = await usdcService.transfer({ to: dest, amount: rawAmount });
    }

    const txMsg = await nosana.value.solana.buildTransaction(instructions);
    const signed = await nosana.value.solana.signTransaction(txMsg);
    console.log("signed", signed);
    const sig = await nosana.value.solana.sendTransaction(signed, { commitment: "finalized" });

    await $fetch(`${config.apiBase}/api/payments/topup`, {
      method: "POST",
      credentials: "include",
      body: { txSignature: String(sig) },
    });

    return String(sig);
  };

  return { topup };
}
