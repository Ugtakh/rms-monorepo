import { prisma } from "../../../infrastructure/database/postgres/prisma.js";

export class TenantRepository {
  static list() {
    return prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            branches: true,
            users: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  static findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      }
    });
  }

  static create(input: { code: string; name: string }) {
    return prisma.tenant.create({
      data: {
        code: input.code,
        name: input.name
      }
    });
  }
}
