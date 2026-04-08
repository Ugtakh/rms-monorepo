import { eq, and, isNull, inArray } from "drizzle-orm";
import { DEFAULT_ROLE_PERMISSIONS, type RoleKey } from "@rms/shared";
import { db } from "../../../infrastructure/database/postgres/db.js";
import {
  permissions,
  roles,
  rolePermissions
} from "../../../infrastructure/database/postgres/schema.js";
import type { RoleScope } from "../../../infrastructure/database/postgres/schema.js";

export class TenantBootstrapService {
  static async ensurePermissions(): Promise<Map<string, string>> {
    const permissionCodes = Array.from(
      new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flatMap((v) => [...v]))
    );

    await db
      .insert(permissions)
      .values(permissionCodes.map((code) => ({ code })))
      .onConflictDoNothing();

    const rows = await db.query.permissions.findMany({
      where: inArray(permissions.code, permissionCodes)
    });

    return new Map(rows.map((p) => [p.code, p.id]));
  }

  static async createTenantRoles(tenantId: string): Promise<void> {
    const permissionMap = await this.ensurePermissions();
    const tenantRoleKeys: RoleKey[] = ["ORG_ADMIN", "MANAGER"];

    for (const roleName of tenantRoleKeys) {
      let role = await db.query.roles.findFirst({
        where: and(eq(roles.name, roleName), eq(roles.tenantId, tenantId), isNull(roles.branchId))
      });

      if (!role) {
        const [created] = await db
          .insert(roles)
          .values({ name: roleName, tenantId, branchId: null, scope: "TENANT" as RoleScope, isSystem: true })
          .returning();
        role = created!;
      }

      for (const permCode of DEFAULT_ROLE_PERMISSIONS[roleName]) {
        const permId = permissionMap.get(permCode);
        if (!permId) continue;
        await db
          .insert(rolePermissions)
          .values({ roleId: role.id, permissionId: permId })
          .onConflictDoNothing();
      }
    }
  }

  static async createBranchRoles(tenantId: string, branchId: string): Promise<void> {
    const permissionMap = await this.ensurePermissions();
    const branchRoleKeys: RoleKey[] = ["CASHIER", "CHEF", "WAITER"];

    for (const roleName of branchRoleKeys) {
      const [role] = await db
        .insert(roles)
        .values({ name: roleName, tenantId, branchId, scope: "BRANCH" as RoleScope, isSystem: true })
        .onConflictDoNothing()
        .returning();

      const existingRole =
        role ??
        (await db.query.roles.findFirst({
          where: and(eq(roles.name, roleName), eq(roles.tenantId, tenantId), eq(roles.branchId, branchId))
        }));

      if (!existingRole) continue;

      for (const permCode of DEFAULT_ROLE_PERMISSIONS[roleName]) {
        const permId = permissionMap.get(permCode);
        if (!permId) continue;
        await db
          .insert(rolePermissions)
          .values({ roleId: existingRole.id, permissionId: permId })
          .onConflictDoNothing();
      }
    }
  }
}
