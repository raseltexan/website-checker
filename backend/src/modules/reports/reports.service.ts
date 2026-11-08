import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildListArgs, buildSearch, paginate, type ListQuery } from "../../utils/query.js";

export const listReports = (query: ListQuery, ownerId?: string) => {
  const where = { ...(ownerId ? { userId: ownerId } : {}), ...buildSearch(query.search, ["title", "url"]) };
  return paginate(
    query,
    () =>
      prisma.report.findMany({
        where,
        ...buildListArgs(query, ["createdAt", "score", "title"]),
        include: {
          website: { select: { id: true, name: true } },
          scan: { select: { id: true, summary: true, completedAt: true } },
          ...(ownerId ? {} : { user: { select: { id: true, name: true, email: true } } }),
        },
      }),
    () => prisma.report.count({ where }),
  );
};

/** Full report payload for the report view / PDF preview, including category metadata. */
export const getReport = async (id: string, ownerId?: string) => {
  const report = await prisma.report.findFirst({
    where: { id, ...(ownerId ? { userId: ownerId } : {}) },
    include: {
      user: { select: { name: true, email: true, company: true } },
      website: { select: { id: true, name: true } },
      scan: { include: { results: { orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!report) throw ApiError.notFound("Report");
  const categories = await prisma.checkerCategory.findMany({
    where: { key: { in: [...new Set(report.scan.results.map((r) => r.categoryKey))] } },
    orderBy: { order: "asc" },
    select: { key: true, name: true, description: true, icon: true },
  });
  return { ...report, categories };
};

export const deleteReport = async (id: string, ownerId?: string) => {
  const report = await prisma.report.findFirst({ where: { id, ...(ownerId ? { userId: ownerId } : {}) } });
  if (!report) throw ApiError.notFound("Report");
  await prisma.report.delete({ where: { id } });
};
