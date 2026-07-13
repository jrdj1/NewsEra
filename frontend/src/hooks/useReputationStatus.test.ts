/**
 * Tests unitarios de useReputationStatus — wagmi (useReadContract /
 * useWatchContractEvent) mockeado con vi.fn(), sin cadena ni RPC real.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReputationStatus } from "./useReputationStatus";

const useReadContractMock = vi.fn();
const useWatchContractEventMock = vi.fn();

vi.mock("wagmi", () => ({
  useReadContract: (...args: unknown[]) => useReadContractMock(...args),
  useWatchContractEvent: (...args: unknown[]) => useWatchContractEventMock(...args),
}));

vi.mock("@/lib/contracts", () => ({
  reputationSystem: { address: "0xabc", abi: [] },
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";

function mockReadContract(reputationData: unknown, canValidateData: unknown, loadingFlags = { rep: false, can: false }) {
  const refetchReputation = vi.fn();
  const refetchCanValidate = vi.fn();
  let call = 0;
  useReadContractMock.mockImplementation(({ functionName }: { functionName: string }) => {
    call++;
    if (functionName === "getReputation") {
      return { data: reputationData, isLoading: loadingFlags.rep, refetch: refetchReputation };
    }
    return { data: canValidateData, isLoading: loadingFlags.can, refetch: refetchCanValidate };
  });
  return { refetchReputation, refetchCanValidate, callCount: () => call };
}

describe("useReputationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve reputation=0 cuando la lectura on-chain todavía no tiene datos", () => {
    mockReadContract(undefined, undefined);
    useWatchContractEventMock.mockImplementation(() => {});

    const { result } = renderHook(() => useReputationStatus(ADDRESS));

    expect(result.current.reputation).toBe(0);
    expect(result.current.canValidate).toBeUndefined();
  });

  it("convierte el resultado de getReputation (bigint) a number", () => {
    mockReadContract(15n, true);
    useWatchContractEventMock.mockImplementation(() => {});

    const { result } = renderHook(() => useReputationStatus(ADDRESS));

    expect(result.current.reputation).toBe(15);
    expect(result.current.canValidate).toBe(true);
  });

  it("isLoading es true si cualquiera de las dos lecturas está cargando", () => {
    mockReadContract(10n, false, { rep: true, can: false });
    useWatchContractEventMock.mockImplementation(() => {});

    const { result } = renderHook(() => useReputationStatus(ADDRESS));

    expect(result.current.isLoading).toBe(true);
  });

  it("no habilita las queries si no se pasa dirección (evita leer con args undefined)", () => {
    mockReadContract(undefined, undefined);
    useWatchContractEventMock.mockImplementation(() => {});

    renderHook(() => useReputationStatus(undefined));

    const calls = useReadContractMock.mock.calls as Array<[{ query: { enabled: boolean }; args?: unknown[] }]>;
    for (const [options] of calls) {
      expect(options.query.enabled).toBe(false);
      expect(options.args).toBeUndefined();
    }
  });

  it("refresca reputación y elegibilidad cuando ReputationUpdated afecta a mi dirección", () => {
    const { refetchReputation, refetchCanValidate } = mockReadContract(10n, false);
    let onLogsCallback: ((logs: unknown[]) => void) | undefined;
    useWatchContractEventMock.mockImplementation(({ onLogs }: { onLogs: (logs: unknown[]) => void }) => {
      onLogsCallback = onLogs;
    });

    renderHook(() => useReputationStatus(ADDRESS));

    onLogsCallback?.([{ args: { validator: ADDRESS.toUpperCase() } }]);

    expect(refetchReputation).toHaveBeenCalledTimes(1);
    expect(refetchCanValidate).toHaveBeenCalledTimes(1);
  });

  it("no refresca nada cuando ReputationUpdated afecta a otra dirección", () => {
    const { refetchReputation, refetchCanValidate } = mockReadContract(10n, false);
    let onLogsCallback: ((logs: unknown[]) => void) | undefined;
    useWatchContractEventMock.mockImplementation(({ onLogs }: { onLogs: (logs: unknown[]) => void }) => {
      onLogsCallback = onLogs;
    });

    renderHook(() => useReputationStatus(ADDRESS));

    onLogsCallback?.([{ args: { validator: "0x9999999999999999999999999999999999999999" } }]);

    expect(refetchReputation).not.toHaveBeenCalled();
    expect(refetchCanValidate).not.toHaveBeenCalled();
  });
});
