import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

export class BranchRepository {
  static listAll() {
    return prisma.branch.findMany({
      include: {
        tenant: true,
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  static listByTenant(tenantId: string) {
    return prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  static create(input: {
    tenantId: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
  }) {
    return prisma.branch.create({
      data: {
        tenantId: input.tenantId,
        code: input.code,
        name: input.name,
        address: input.address,
        phone: input.phone
      }
    });
  }

  static createDefaultTables(tenantId: string, branchId: string) {
    return prisma.diningTable.createMany({
      data: Array.from({ length: 15 }, (_, index) => ({
        tenantId,
        branchId,
        code: `T-${String(index + 1).padStart(2, "0")}`,
        capacity: 4
      })),
      skipDuplicates: true
    });
  }
}
