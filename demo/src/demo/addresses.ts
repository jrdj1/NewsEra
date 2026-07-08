import { mnemonicToAccount } from "viem/accounts";

// Mismo mnemonic estándar de Hardhat usado por blockchain/scripts/seed.ts y
// backend/scripts/seed-offchain.ts — se reutiliza aquí solo para derivar
// direcciones deterministas y creíbles (idénticas a las de un entorno local
// real), sin firmar nada ni necesitar una cuenta real.
const HARDHAT_MNEMONIC = "test test test test test test test test test test test junk";

const cache = new Map<number, `0x${string}`>();

export function addressOf(index: number): `0x${string}` {
  let address = cache.get(index);
  if (!address) {
    address = mnemonicToAccount(HARDHAT_MNEMONIC, { addressIndex: index }).address;
    cache.set(index, address);
  }
  return address;
}
