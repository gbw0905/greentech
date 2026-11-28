export function ownedDocumentPath(
  path: string | null | undefined,
  userId: string,
  analysisId: string,
) {
  if (!path) return null;
  const prefix = `${userId}/${analysisId}.`;
  return path.startsWith(prefix) && /^(pdf|docx|xlsx|csv|txt|md)$/.test(path.slice(prefix.length))
    ? path
    : null;
}
