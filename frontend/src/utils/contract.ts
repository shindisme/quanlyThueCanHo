type ContractLike = {
  status: string;
  created_at?: string | Date;
  start_date?: string | Date;
};

export function findActiveContract<T extends ContractLike>(
  contracts?: readonly T[] | null
): T | null {
  if (!contracts || contracts.length === 0) return null;
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");
  if (activeContracts.length === 0) return null;
  return (
    activeContracts.sort((a, b) => {
      const timeA = new Date(a.created_at || a.start_date || 0).getTime();
      const timeB = new Date(b.created_at || b.start_date || 0).getTime();
      return timeB - timeA;
    })[0] ?? null
  );
}

export function getPreferredContract<T extends ContractLike>(
  contracts?: readonly T[] | null
): T | null {
  return findActiveContract(contracts) ?? contracts?.[0] ?? null;
}

