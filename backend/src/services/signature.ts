import { verifyMessage } from "viem";

export async function verifyProfileSignature(
  address: string,
  message: string,
  signature: string,
): Promise<boolean> {
  return verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
}
