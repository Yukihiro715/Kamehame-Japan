export type ExperienceSort = "default" | "commission" | "popular";

/** Return ranks only; other partners' booking counts are never sent to the client. */
export function popularityRanks(counts: { slug: string; count: number }[]): Map<string, number> {
  const ranked = [...counts].filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  let rank = 0, previous = -1;
  return new Map(ranked.map(x => {
    if (x.count !== previous) { rank++; previous = x.count; }
    return [x.slug, rank];
  }));
}

export function sortExperiences<T extends { referable: boolean; commissionExampleNet: number | null; popularityRank: number | null }>(rows: T[], sort: ExperienceSort): T[] {
  return [...rows].sort((a, b) => {
    const x = sort === "commission" ? (a.referable ? a.commissionExampleNet : null) : a.popularityRank;
    const y = sort === "commission" ? (b.referable ? b.commissionExampleNet : null) : b.popularityRank;
    if (sort === "default") return 0;
    if (x === null) return y === null ? 0 : 1;
    if (y === null) return -1;
    return sort === "commission" ? y - x : x - y;
  });
}
