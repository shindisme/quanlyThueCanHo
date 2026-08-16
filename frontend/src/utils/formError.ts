type FormErrorNode = {
  message?: unknown;
  [key: string]: unknown;
};

export function getFirstFormErrorMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;

  const node = errors as FormErrorNode;
  if (typeof node.message === "string") return node.message;

  for (const value of Object.values(node)) {
    const message = getFirstFormErrorMessage(value);
    if (message) return message;
  }

  return undefined;
}
