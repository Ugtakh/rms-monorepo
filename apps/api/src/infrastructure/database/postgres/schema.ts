import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const orderStatusEnum = pgEnum("OrderStatus", [
  "DRAFT",
  "SUBMITTED",
  "IN_PROGRESS",
  "READY",
  "SERVED",
  "CLOSED",
  "CANCELLED"
]);

export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "REFUNDED"
]);

export const paymentMethodEnum = pgEnum("PaymentMethod", [
  "CASH",
  "CARD",
  "SOCIALPAY",
  "QPAY",
  "POCKET",
  "BANK_TRANSFER"
]);

export const roleScopeEnum = pgEnum("RoleScope", ["GLOBAL", "TENANT", "BRANCH"]);

// ─── TypeScript types derived from enums ────────────────────────────────────

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type RoleScope = (typeof roleScopeEnum.enumValues)[number];

// ─── Tables ─────────────────────────────────────────────────────────────────

export const tenants = pgTable(
  "Tenant",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  }
);

export const branches = pgTable(
  "Branch",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").notNull().references(() => tenants.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  },
  (t) => [uniqueIndex("Branch_tenantId_code_key").on(t.tenantId, t.code)]
);

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").references(() => tenants.id, { onDelete: "set null" }),
    branchId: text("branchId").references(() => branches.id, { onDelete: "set null" }),
    email: text("email").notNull().unique(),
    passwordHash: text("passwordHash").notNull(),
    fullName: text("fullName").notNull(),
    phone: text("phone"),
    isActive: boolean("isActive").notNull().default(true),
    isSuperAdmin: boolean("isSuperAdmin").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  }
);

export const roles = pgTable(
  "Role",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").references(() => tenants.id, { onDelete: "set null" }),
    branchId: text("branchId").references(() => branches.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    scope: roleScopeEnum("scope").notNull(),
    isSystem: boolean("isSystem").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  },
  (t) => [uniqueIndex("Role_name_tenantId_branchId_key").on(t.name, t.tenantId, t.branchId)]
);

export const permissions = pgTable("Permission", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  code: text("code").notNull().unique(),
  description: text("description")
});

export const rolePermissions = pgTable(
  "RolePermission",
  {
    roleId: text("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" })
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const userRoles = pgTable(
  "UserRole",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: text("roleId").notNull().references(() => roles.id, { onDelete: "cascade" })
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const diningTables = pgTable(
  "DiningTable",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").notNull(),
    branchId: text("branchId").notNull().references(() => branches.id),
    code: text("code").notNull(),
    capacity: integer("capacity").notNull().default(4),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  },
  (t) => [uniqueIndex("DiningTable_branchId_code_key").on(t.branchId, t.code)]
);

export const orders = pgTable(
  "Order",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    orderNo: text("orderNo").notNull().unique(),
    tenantId: text("tenantId").notNull().references(() => tenants.id),
    branchId: text("branchId").notNull().references(() => branches.id),
    tableId: text("tableId").references(() => diningTables.id, { onDelete: "set null" }),
    createdById: text("createdById").notNull().references(() => users.id),
    guestName: text("guestName"),
    status: orderStatusEnum("status").notNull().default("DRAFT"),
    paymentStatus: paymentStatusEnum("paymentStatus").notNull().default("UNPAID"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric("taxAmount", { precision: 12, scale: 2 }).notNull(),
    serviceAmount: numeric("serviceAmount", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discountAmount", { precision: 12, scale: 2 }).notNull(),
    totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date()),
    closedAt: timestamp("closedAt")
  }
);

export const orderItems = pgTable("OrderItem", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderId: text("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: text("menuItemId").notNull(),
  sku: text("sku"),
  itemName: text("itemName").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("lineTotal", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const payments = pgTable("Payment", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  tenantId: text("tenantId").notNull().references(() => tenants.id),
  branchId: text("branchId").notNull().references(() => branches.id),
  orderId: text("orderId").notNull().references(() => orders.id),
  createdById: text("createdById").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull(),
  externalRef: text("externalRef"),
  payload: jsonb("payload"),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const inventoryItems = pgTable(
  "InventoryItem",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").notNull().references(() => tenants.id),
    branchId: text("branchId").notNull().references(() => branches.id),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    unit: text("unit").notNull(),
    onHand: numeric("onHand", { precision: 12, scale: 3 }).notNull(),
    reorderLevel: numeric("reorderLevel", { precision: 12, scale: 3 }).notNull(),
    averageCost: numeric("averageCost", { precision: 12, scale: 2 }).notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdateFn(() => new Date())
  },
  (t) => [uniqueIndex("InventoryItem_branchId_sku_key").on(t.branchId, t.sku)]
);

export const inventoryLedgers = pgTable("InventoryLedger", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  tenantId: text("tenantId").notNull().references(() => tenants.id),
  branchId: text("branchId").notNull().references(() => branches.id),
  inventoryItemId: text("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  movementType: text("movementType").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitCost: numeric("unitCost", { precision: 12, scale: 2 }),
  referenceNo: text("referenceNo"),
  note: text("note"),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const discounts = pgTable(
  "Discount",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").notNull().references(() => tenants.id),
    branchId: text("branchId").references(() => branches.id, { onDelete: "set null" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    percentage: numeric("percentage", { precision: 5, scale: 2 }),
    fixedAmount: numeric("fixedAmount", { precision: 12, scale: 2 }),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow()
  },
  (t) => [uniqueIndex("Discount_tenantId_code_key").on(t.tenantId, t.code)]
);

export const refreshTokens = pgTable("RefreshToken", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("tokenHash").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export const auditLogs = pgTable(
  "AuditLog",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    tenantId: text("tenantId").references(() => tenants.id, { onDelete: "set null" }),
    branchId: text("branchId").references(() => branches.id, { onDelete: "set null" }),
    actorId: text("actorId").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("createdAt").notNull().defaultNow()
  },
  (t) => [index("AuditLog_tenantId_branchId_action_idx").on(t.tenantId, t.branchId, t.action)]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  orders: many(orders),
  payments: many(payments),
  inventoryItems: many(inventoryItems),
  inventoryLedgers: many(inventoryLedgers),
  discounts: many(discounts),
  auditLogs: many(auditLogs)
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  users: many(users),
  roles: many(roles),
  diningTables: many(diningTables),
  orders: many(orders),
  payments: many(payments),
  inventoryItems: many(inventoryItems),
  inventoryLedgers: many(inventoryLedgers),
  discounts: many(discounts),
  auditLogs: many(auditLogs)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
  auditLogs: many(auditLogs)
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [roles.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [roles.branchId], references: [branches.id] }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles)
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] })
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] })
}));

export const diningTablesRelations = relations(diningTables, ({ one, many }) => ({
  branch: one(branches, { fields: [diningTables.branchId], references: [branches.id] }),
  orders: many(orders)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  table: one(diningTables, { fields: [orders.tableId], references: [diningTables.id] }),
  createdBy: one(users, { fields: [orders.createdById], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [payments.branchId], references: [branches.id] }),
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  createdBy: one(users, { fields: [payments.createdById], references: [users.id] })
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [inventoryItems.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [inventoryItems.branchId], references: [branches.id] }),
  ledgers: many(inventoryLedgers)
}));

export const inventoryLedgersRelations = relations(inventoryLedgers, ({ one }) => ({
  tenant: one(tenants, { fields: [inventoryLedgers.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [inventoryLedgers.branchId], references: [branches.id] }),
  inventoryItem: one(inventoryItems, { fields: [inventoryLedgers.inventoryItemId], references: [inventoryItems.id] })
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  tenant: one(tenants, { fields: [discounts.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [discounts.branchId], references: [branches.id] })
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [auditLogs.branchId], references: [branches.id] }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] })
}));
