import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { branches, diningTables } from "../../../infrastructure/database/postgres/schema.js";

export class BranchRepository {
  static listAll() {
    return db.query.branches.findMany({
      with: { tenant: true, users: true, orders: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)]
    });
  }

  static listByTenant(tenantId: string) {
    return db.query.branches.findMany({
      where: eq(branches.tenantId, tenantId),
      with: { users: true, orders: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)]
    });
  }

  static async create(input: {
    tenantId: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
  }) {
    const rows = await db.insert(branches).values(input).returning();
    return rows[0]!;
  }

  static createDefaultTables(tenantId: string, branchId: string) {
    const data = Array.from({ length: 15 }, (_, i) => ({
      tenantId,
      branchId,
      code: `T-${String(i + 1).padStart(2, "0")}`,
      capacity: 4
    }));
    return db.insert(diningTables).values(data).onConflictDoNothing();
  }
}
