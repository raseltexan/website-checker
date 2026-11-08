import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Prisma skip/take/orderBy with a whitelist of sortable fields. */
export const buildListArgs = (query: ListQuery, sortable: readonly string[], defaultSort = "createdAt") => {
  const sortBy = query.sortBy && sortable.includes(query.sortBy) ? query.sortBy : defaultSort;
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { [sortBy]: query.sortOrder },
  };
};

/** Case-insensitive "contains" search over several string fields. */
export const buildSearch = (search: string | undefined, fields: readonly string[]) =>
  search ? { OR: fields.map((f) => ({ [f]: { contains: search, mode: "insensitive" as const } })) } : {};

export const buildMeta = (query: ListQuery, total: number): PaginationMeta => ({
  page: query.page,
  limit: query.limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / query.limit)),
});

/** Runs findMany + count in parallel and returns `{ data, meta }`. */
export const paginate = async <T>(query: ListQuery, findMany: () => Promise<T[]>, count: () => Promise<number>) => {
  const [data, total] = await Promise.all([findMany(), count()]);
  return { data, meta: buildMeta(query, total) };
};
