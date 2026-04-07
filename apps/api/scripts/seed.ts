import { RoleScope } from "@prisma/client";
import { DEFAULT_ROLE_PERMISSIONS } from "@rms/shared";
import { hashPassword } from "../src/common/utils/hash.js";
import { connectMongo } from "../src/infrastructure/database/mongo/mongoose.js";
import { prisma } from "../src/infrastructure/database/postgres/prisma.js";
import { MenuItemModel } from "../src/modules/menu/schemas/menu-item.schema.js";
import { TenantBootstrapService } from "../src/modules/tenant/services/tenant-bootstrap.service.js";
import mongoose from "mongoose";

const SUPER_ADMIN_EMAIL = "superadmin@rms.local";
const parseCount = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

const SEED_ORGANIZATION_COUNT = parseCount(process.env.SEED_ORGANIZATION_COUNT, 10);
const SEED_BRANCH_PER_ORG = parseCount(process.env.SEED_BRANCH_PER_ORG, 5);

const seedSuperAdmin = async () => {
  const permissionMap = await TenantBootstrapService.ensurePermissions();
  const superAdminPermissionId = permissionMap.get("super_admin:*");

  if (!superAdminPermissionId) {
    throw new Error("super_admin:* permission not found");
  }

  const existingSuperAdminRole = await prisma.role.findFirst({
    where: {
      name: "SUPER_ADMIN",
      tenantId: null,
      branchId: null
    }
  });

  const role =
    existingSuperAdminRole ??
    (await prisma.role.create({
      data: {
        name: "SUPER_ADMIN",
        scope: RoleScope.GLOBAL,
        isSystem: true
      }
    }));

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: superAdminPermissionId
      }
    },
    create: {
      roleId: role.id,
      permissionId: superAdminPermissionId
    },
    update: {}
  });

  const adminPasswordHash = await hashPassword("Admin@123");

  const user = await prisma.user.upsert({
    where: {
      email: SUPER_ADMIN_EMAIL
    },
    create: {
      email: SUPER_ADMIN_EMAIL,
      fullName: "RMS Super Admin",
      passwordHash: adminPasswordHash,
      isSuperAdmin: true
    },
    update: {
      fullName: "RMS Super Admin",
      passwordHash: adminPasswordHash,
      isSuperAdmin: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    create: {
      userId: user.id,
      roleId: role.id
    },
    update: {}
  });
};

const seedOrganization = async (orgIndex: number) => {
  const orgCode = `ORG${String(orgIndex).padStart(2, "0")}`;
  const tenant = await prisma.tenant.upsert({
    where: {
      code: orgCode
    },
    create: {
      code: orgCode,
      name: `Restaurant Group ${orgIndex}`
    },
    update: {
      name: `Restaurant Group ${orgIndex}`,
      isActive: true
    }
  });

  await TenantBootstrapService.createTenantRoles(tenant.id);

  const orgAdminRole = await prisma.role.findFirstOrThrow({
    where: {
      tenantId: tenant.id,
      branchId: null,
      name: "ORG_ADMIN"
    }
  });

  const orgAdmin = await prisma.user.upsert({
    where: {
      email: `admin+org${orgIndex}@rms.local`
    },
    create: {
      tenantId: tenant.id,
      email: `admin+org${orgIndex}@rms.local`,
      fullName: `Org ${orgIndex} Admin`,
      passwordHash: await hashPassword("Admin@123")
    },
    update: {
      tenantId: tenant.id,
      fullName: `Org ${orgIndex} Admin`,
      isActive: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: orgAdmin.id,
        roleId: orgAdminRole.id
      }
    },
    create: {
      userId: orgAdmin.id,
      roleId: orgAdminRole.id
    },
    update: {}
  });

  for (let branchIndex = 1; branchIndex <= SEED_BRANCH_PER_ORG; branchIndex += 1) {
    const branchCode = `B${String(branchIndex).padStart(2, "0")}`;

    const branch = await prisma.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: branchCode
        }
      },
      create: {
        tenantId: tenant.id,
        code: branchCode,
        name: `Org${orgIndex} Branch ${branchIndex}`,
        address: `District ${branchIndex}`,
        phone: `+9769900${String(orgIndex)}${String(branchIndex).padStart(2, "0")}`
      },
      update: {
        name: `Org${orgIndex} Branch ${branchIndex}`,
        isActive: true
      }
    });

    await TenantBootstrapService.createBranchRoles(tenant.id, branch.id);

    await prisma.diningTable.createMany({
      data: Array.from({ length: 15 }, (_, idx) => ({
        tenantId: tenant.id,
        branchId: branch.id,
        code: `T-${String(idx + 1).padStart(2, "0")}`,
        capacity: 4
      })),
      skipDuplicates: true
    });

    const cashierRole = await prisma.role.findFirstOrThrow({
      where: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: "CASHIER"
      }
    });

    const chefRole = await prisma.role.findFirstOrThrow({
      where: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: "CHEF"
      }
    });

    const cashier = await prisma.user.upsert({
      where: {
        email: `cashier+org${orgIndex}b${branchIndex}@rms.local`
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        email: `cashier+org${orgIndex}b${branchIndex}@rms.local`,
        fullName: `Cashier O${orgIndex}B${branchIndex}`,
        passwordHash: await hashPassword("Cashier@123")
      },
      update: {
        tenantId: tenant.id,
        branchId: branch.id,
        fullName: `Cashier O${orgIndex}B${branchIndex}`,
        isActive: true
      }
    });

    const chef = await prisma.user.upsert({
      where: {
        email: `chef+org${orgIndex}b${branchIndex}@rms.local`
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        email: `chef+org${orgIndex}b${branchIndex}@rms.local`,
        fullName: `Chef O${orgIndex}B${branchIndex}`,
        passwordHash: await hashPassword("Chef@123")
      },
      update: {
        tenantId: tenant.id,
        branchId: branch.id,
        fullName: `Chef O${orgIndex}B${branchIndex}`,
        isActive: true
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: cashier.id,
          roleId: cashierRole.id
        }
      },
      create: {
        userId: cashier.id,
        roleId: cashierRole.id
      },
      update: {}
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: chef.id,
          roleId: chefRole.id
        }
      },
      create: {
        userId: chef.id,
        roleId: chefRole.id
      },
      update: {}
    });

    const menuSeed = [
      {
        category: "Main",
        sku: `MN-${branchIndex}-001`,
        name: "Beef Rice Bowl",
        description: "Signature beef rice bowl",
        price: 16500,
        prepStation: "main",
        tags: ["main", "beef", "rice"]
      },
      {
        category: "Main",
        sku: `MN-${branchIndex}-002`,
        name: "Chicken Teriyaki",
        description: "Grilled chicken with teriyaki glaze",
        price: 15800,
        prepStation: "main",
        tags: ["main", "chicken"]
      },
      {
        category: "Main",
        sku: `MN-${branchIndex}-003`,
        name: "Spicy Noodle Bowl",
        description: "House spicy noodle with vegetables",
        price: 14900,
        prepStation: "main",
        tags: ["main", "spicy", "noodle"]
      },
      {
        category: "Main",
        sku: `MN-${branchIndex}-004`,
        name: "Salmon Steak",
        description: "Pan-seared salmon with lemon butter",
        price: 22800,
        prepStation: "main",
        tags: ["main", "seafood"]
      },
      {
        category: "Appetizer",
        sku: `AP-${branchIndex}-001`,
        name: "French Fries",
        description: "Crispy golden fries",
        price: 6200,
        prepStation: "main",
        tags: ["appetizer", "vegetarian"]
      },
      {
        category: "Appetizer",
        sku: `AP-${branchIndex}-002`,
        name: "Chicken Wings",
        description: "Spicy glazed chicken wings",
        price: 9800,
        prepStation: "main",
        tags: ["appetizer", "chicken", "spicy"]
      },
      {
        category: "Appetizer",
        sku: `AP-${branchIndex}-003`,
        name: "Caesar Salad",
        description: "Fresh romaine with parmesan dressing",
        price: 8900,
        prepStation: "main",
        tags: ["appetizer", "salad"]
      },
      {
        category: "Appetizer",
        sku: `AP-${branchIndex}-004`,
        name: "Garlic Bread",
        description: "Toasted bread with garlic butter",
        price: 5400,
        prepStation: "main",
        tags: ["appetizer", "vegetarian"]
      },
      {
        category: "Coffee",
        sku: `CF-${branchIndex}-001`,
        name: "Americano",
        description: "Hot americano",
        price: 7500,
        prepStation: "bar",
        tags: ["coffee", "hot"]
      },
      {
        category: "Coffee",
        sku: `CF-${branchIndex}-002`,
        name: "Cappuccino",
        description: "Espresso with steamed milk foam",
        price: 8900,
        prepStation: "bar",
        tags: ["coffee", "milk"]
      },
      {
        category: "Coffee",
        sku: `CF-${branchIndex}-003`,
        name: "Latte",
        description: "Smooth espresso latte",
        price: 9200,
        prepStation: "bar",
        tags: ["coffee", "milk"]
      },
      {
        category: "Coffee",
        sku: `CF-${branchIndex}-004`,
        name: "Iced Mocha",
        description: "Chocolate espresso on ice",
        price: 9800,
        prepStation: "bar",
        tags: ["coffee", "cold", "chocolate"]
      },
      {
        category: "Drink",
        sku: `DR-${branchIndex}-001`,
        name: "Lemonade",
        description: "Fresh lemon soda",
        price: 6800,
        prepStation: "bar",
        tags: ["drink", "cold"]
      },
      {
        category: "Drink",
        sku: `DR-${branchIndex}-002`,
        name: "Orange Juice",
        description: "Chilled orange juice",
        price: 7200,
        prepStation: "bar",
        tags: ["drink", "juice"]
      },
      {
        category: "Drink",
        sku: `DR-${branchIndex}-003`,
        name: "Mineral Water",
        description: "Sparkling mineral water",
        price: 3200,
        prepStation: "bar",
        tags: ["drink", "water"]
      },
      {
        category: "Drink",
        sku: `DR-${branchIndex}-004`,
        name: "Milk Tea",
        description: "Brown sugar milk tea",
        price: 8400,
        prepStation: "bar",
        tags: ["drink", "tea", "milk"]
      },
      {
        category: "Dessert",
        sku: `DS-${branchIndex}-001`,
        name: "Cheesecake",
        description: "Baked cheesecake",
        price: 9800,
        prepStation: "dessert",
        tags: ["dessert"]
      },
      {
        category: "Dessert",
        sku: `DS-${branchIndex}-002`,
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie",
        price: 7600,
        prepStation: "dessert",
        tags: ["dessert", "chocolate"]
      },
      {
        category: "Dessert",
        sku: `DS-${branchIndex}-003`,
        name: "Fruit Yogurt",
        description: "Greek yogurt with seasonal fruit",
        price: 6900,
        prepStation: "dessert",
        tags: ["dessert", "fruit"]
      },
      {
        category: "Dessert",
        sku: `DS-${branchIndex}-004`,
        name: "Ice Cream Duo",
        description: "Two scoop vanilla and strawberry",
        price: 6100,
        prepStation: "dessert",
        tags: ["dessert", "cold"]
      }
    ];

    await MenuItemModel.bulkWrite(
      menuSeed.map((item) => ({
        updateOne: {
          filter: {
            tenantId: tenant.id,
            branchId: branch.id,
            sku: item.sku
          },
          update: {
            $set: {
              tenantId: tenant.id,
              branchId: branch.id,
              category: item.category,
              sku: item.sku,
              name: item.name,
              description: item.description,
              price: item.price,
              available: true,
              prepStation: item.prepStation,
              tags: item.tags
            }
          },
          upsert: true
        }
      }))
    );

    const inventorySeed = [
      { sku: "INV-BEEF", name: "Beef", unit: "kg", onHand: 30, reorderLevel: 8, averageCost: 22000 },
      { sku: "INV-RICE", name: "Rice", unit: "kg", onHand: 60, reorderLevel: 15, averageCost: 2800 },
      { sku: "INV-COFFEE", name: "Coffee Bean", unit: "kg", onHand: 18, reorderLevel: 5, averageCost: 45000 }
    ];

    await Promise.all(
      inventorySeed.map((item) =>
        prisma.inventoryItem.upsert({
          where: {
            branchId_sku: {
              branchId: branch.id,
              sku: item.sku
            }
          },
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            sku: item.sku,
            name: item.name,
            unit: item.unit,
            onHand: item.onHand,
            reorderLevel: item.reorderLevel,
            averageCost: item.averageCost
          },
          update: {
            name: item.name,
            unit: item.unit,
            onHand: item.onHand,
            reorderLevel: item.reorderLevel,
            averageCost: item.averageCost
          }
        })
      )
    );
  }
};

const main = async () => {
  await prisma.$connect();
  await connectMongo();

  await seedSuperAdmin();

  console.log("Seed started", {
    organizations: SEED_ORGANIZATION_COUNT,
    branchesPerOrg: SEED_BRANCH_PER_ORG
  });

  for (let org = 1; org <= SEED_ORGANIZATION_COUNT; org += 1) {
    console.log(`Seeding organization ${org}/${SEED_ORGANIZATION_COUNT}`);
    await seedOrganization(org);
  }

  const totalUsers = await prisma.user.count();
  const totalTenants = await prisma.tenant.count();
  const totalBranches = await prisma.branch.count();

  console.log("Seed completed", {
    totalTenants,
    totalBranches,
    totalUsers,
    rolesTemplate: Object.keys(DEFAULT_ROLE_PERMISSIONS)
  });
};

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await prisma.$disconnect();
  });
