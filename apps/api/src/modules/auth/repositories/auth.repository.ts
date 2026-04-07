import type { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

const authUserInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserInclude;

export class AuthRepository {
  static findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: authUserInclude
    });
  }

  static findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: authUserInclude
    });
  }

  static createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  static revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  static findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
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
    const role = await prisma.role.findFirst({
      where: {
        name: input.roleName,
        tenantId: input.tenantId,
        ...(input.branchId ? { branchId: input.branchId } : { branchId: null })
      }
    });

    if (!role) {
      throw new Error(`Role not found: ${input.roleName}`);
    }

    return prisma.user.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        userRoles: {
          create: {
            roleId: role.id
          }
        }
      },
      include: authUserInclude
    });
  }
}
