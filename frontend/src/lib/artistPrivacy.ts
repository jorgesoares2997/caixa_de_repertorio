/**
 * Utility for masking artist names and confidential contact information
 * with blur and privacy notices in portfolio mode.
 */

export const REP_TYPE_LABELS: Record<string, string> = {
  SINGER: "Cantor(a) Solo",
  SOLO_SINGER: "Vocal Solo",
  ACOUSTIC: "Voz & Violão",
  TRIO: "Trio Acústico",
  BAND: "Banda Completa",
  OTHER: "Projeto Especial",
};

/**
 * Returns formatted artist name for artist cards, modals and headers.
 * Admin: Real name (e.g. "Mariana Silva")
 * Visitor: Formal confidential alias with musical format (e.g. "Projeto Confidencial (Vocal Solo)")
 */
export function getMaskedArtistName(
  rep: { id?: string; name: string; type?: string } | null | undefined,
  index: number = 0,
  isAdmin: boolean = false
): string {
  if (!rep) return "Projeto Confidencial";
  if (isAdmin) return rep.name;

  const typeLabel = rep.type ? (REP_TYPE_LABELS[rep.type] || "Projeto") : "Projeto Especial";
  return `Projeto Confidencial (${typeLabel})`;
}

/**
 * Returns a concise pseudonym for badges and tags (e.g. "Projeto Confidencial").
 */
export function getMaskedBadgeName(
  repName?: string | null,
  repIndexOrId?: number | string,
  allReps?: { id: string; name: string }[],
  isAdmin: boolean = false
): string {
  if (isAdmin) return repName || "Artista";
  return "Projeto Confidencial";
}

/**
 * Professional privacy notice for contact fields.
 */
export function getMaskedContactInfo(
  contactInfo: string | null | undefined,
  isAdmin: boolean = false
): string {
  if (isAdmin) return contactInfo || "";
  return "Dados bloqueados para proteger o nome dos artistas parceiros";
}
