/**
 * Prisma generates its own enums from schema.prisma (Role, UserStatus, ...)
 * with the same string values as their @forge-loom/shared-types equivalents,
 * but TypeScript treats distinct string enums as nominally incompatible even
 * with identical members. These are thin, explicit casts for that one gap —
 * not a runtime conversion, just naming the "trust me, same values" cast
 * instead of repeating `as unknown as X` inline at every call site.
 */
export function toPrismaEnum<T>(value: unknown): T {
  return value as T;
}

export function fromPrismaEnum<T>(value: unknown): T {
  return value as T;
}
