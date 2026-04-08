import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import { tenants } from "../../../infrastructure/database/postgres/schema.js";

export class TenantRepository {
  static list() {
    return db.query.tenants.findMany({
      with: {
        branches: true,
        users: true,
        orders: true
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)]
    });
  }

  static findById(id: string) {
    return db.query.tenants.findFirst({
      where: eq(tenants.id, id),
      with: {
        branches: true,
        users: true,
        orders: true
      }
    });
  }

  static async create(input: { code: string; name: string }) {
    const rows = await db.insert(tenants).values(input).returning();
    return rows[0]!;
  }
}
