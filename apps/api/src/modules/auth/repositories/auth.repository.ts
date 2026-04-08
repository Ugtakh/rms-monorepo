import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "../../../infrastructure/database/postgres/db.js";
import {
  users,
  roles,
  userRoles,
  refreshTokens
} from "../../../infrastructure/database/postgres/schema.js";

const userWithRoles = {
  with: {
    userRoles: {
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
} as const;

export class AuthRepository {
  static findUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
      ...userWithRoles
    });
  }

  static findUserById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      ...userWithRoles
    });
  }

  static async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    const rows = await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt }).returning();
    return rows[0]!;
  }

  static revokeRefreshToken(tokenHash: string) {
    return db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
  }

  static findRefreshToken(tokenHash: string) {
    return db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    });
  }

  static async createEmployee(input: {
    tenantId: string;
    branchId: string | null;
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    roleName: string;
  }) {
    const role = await db.query.roles.findFirst({
      where: and(
        eq(roles.name, input.roleName),
        eq(roles.tenantId, input.tenantId),
        input.branchId ? eq(roles.branchId, input.branchId) : isNull(roles.branchId)
      )
    });

    if (!role) {
      throw new Error(`Role not found: ${input.roleName}`);
    }

    const [user] = await db
      .insert(users)
      .values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        phone: input.phone
      })
      .returning();

    await db.insert(userRoles).values({ userId: user!.id, roleId: role.id });

    return db.query.users.findFirst({
      where: eq(users.id, user!.id),
      ...userWithRoles
    });
  }
}
