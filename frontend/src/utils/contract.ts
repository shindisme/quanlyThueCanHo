type ContractLike = { status: string };

export function findActiveContract<T extends ContractLike>(
  contracts?: readonly T[] | null
): T | null {
  return contracts?.find((contract) => contract.status === "ACTIVE") ?? null;
}

export function getPreferredContract<T extends ContractLike>(
  contracts?: readonly T[] | null
): T | null {
  return findActiveContract(contracts) ?? contracts?.[0] ?? null;
}
