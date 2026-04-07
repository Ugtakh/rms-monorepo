import { DEFAULT_ROLE_PERMISSIONS, type RoleKey } from "@rms/shared";
import { RoleScope } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

export class TenantBootstrapService {
  static async ensurePermissions(): Promise<Map<string, string>> {
    const permissionCodes = Array.from(
      new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flatMap((value) => [...value]))
    );

    await prisma.permission.createMany({
      data: permissionCodes.map((code) => ({ code })),
      skipDuplicates: true
    });

    const permissions = await prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes
        }
      }
    });

    return new Map(permissions.map((item) => [item.code, item.id]));
  }

  static async createTenantRoles(tenantId: string): Promise<void> {
    const permissionMap = await this.ensurePermissions();

    const tenantRoleKeys: RoleKey[] = ["ORG_ADMIN", "MANAGER"];

    for (const roleName of tenantRoleKeys) {
      const existingRole = await prisma.role.findFirst({
        where: {
          name: roleName,
          tenantId,
          branchId: null
        }
      });

      const role =
        existingRole ??
        (await prisma.role.create({
          data: {
            name: roleName,
            tenantId,
            branchId: null,
            scope: RoleScope.TENANT,
            isSystem: true
          }
        }));

      const permissions = DEFAULT_ROLE_PERMISSIONS[roleName];

      for (const permission of permissions) {
        const permissionId = permissionMap.get(permission);
        if (!permissionId) continue;

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId
            }
          },
          create: {
            roleId: role.id,
            permissionId
          },
          update: {}
        });
      }
    }
  }

  static async createBranchRoles(tenantId: string, branchId: string): Promise<void> {
    const permissionMap = await this.ensurePermissions();

    const branchRoleKeys: RoleKey[] = ["CASHIER", "CHEF", "WAITER"];

    for (const roleName of branchRoleKeys) {
      const role = await prisma.role.upsert({
        where: {
          name_tenantId_branchId: {
            name: roleName,
            tenantId,
            branchId
          }
        },
        create: {
          name: roleName,
          tenantId,
          branchId,
          scope: RoleScope.BRANCH,
          isSystem: true
        },
        update: {}
      });

      const permissions = DEFAULT_ROLE_PERMISSIONS[roleName];

      for (const permission of permissions) {
        const permissionId = permissionMap.get(permission);
        if (!permissionId) continue;

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId
            }
          },
          create: {
            roleId: role.id,
            permissionId
          },
          update: {}
        });
      }
    }
  }
}
