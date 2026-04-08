DO $$ BEGIN
 CREATE TYPE "public"."OrderStatus" AS ENUM('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'READY', 'SERVED', 'CLOSED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."PaymentMethod" AS ENUM('CASH', 'CARD', 'SOCIALPAY', 'QPAY', 'POCKET', 'BANK_TRANSFER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."PaymentStatus" AS ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."RoleScope" AS ENUM('GLOBAL', 'TENANT', 'BRANCH');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"branchId" text,
	"actorId" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"payload" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Branch" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DiningTable" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text NOT NULL,
	"code" text NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Discount" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"percentage" numeric(5, 2),
	"fixedAmount" numeric(12, 2),
	"startsAt" timestamp,
	"endsAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "InventoryItem" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"onHand" numeric(12, 3) NOT NULL,
	"reorderLevel" numeric(12, 3) NOT NULL,
	"averageCost" numeric(12, 2) NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "InventoryLedger" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text NOT NULL,
	"inventoryItemId" text NOT NULL,
	"movementType" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unitCost" numeric(12, 2),
	"referenceNo" text,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"menuItemId" text NOT NULL,
	"sku" text,
	"itemName" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unitPrice" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) NOT NULL,
	"lineTotal" numeric(12, 2) NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Order" (
	"id" text PRIMARY KEY NOT NULL,
	"orderNo" text NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text NOT NULL,
	"tableId" text,
	"createdById" text NOT NULL,
	"guestName" text,
	"status" "OrderStatus" DEFAULT 'DRAFT' NOT NULL,
	"paymentStatus" "PaymentStatus" DEFAULT 'UNPAID' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"taxAmount" numeric(12, 2) NOT NULL,
	"serviceAmount" numeric(12, 2) NOT NULL,
	"discountAmount" numeric(12, 2) NOT NULL,
	"totalAmount" numeric(12, 2) NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"closedAt" timestamp,
	CONSTRAINT "Order_orderNo_unique" UNIQUE("orderNo")
);
--> statement-breakpoint
CREATE TABLE "Payment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"branchId" text NOT NULL,
	"orderId" text NOT NULL,
	"createdById" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" "PaymentMethod" NOT NULL,
	"status" "PaymentStatus" NOT NULL,
	"externalRef" text,
	"payload" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	CONSTRAINT "Permission_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "RefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RolePermission" (
	"roleId" text NOT NULL,
	"permissionId" text NOT NULL,
	CONSTRAINT "RolePermission_roleId_permissionId_pk" PRIMARY KEY("roleId","permissionId")
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"branchId" text,
	"name" text NOT NULL,
	"scope" "RoleScope" NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Tenant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "UserRole" (
	"userId" text NOT NULL,
	"roleId" text NOT NULL,
	CONSTRAINT "UserRole_userId_roleId_pk" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text,
	"branchId" text,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"fullName" text NOT NULL,
	"phone" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"isSuperAdmin" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_inventoryItemId_InventoryItem_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_DiningTable_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."DiningTable"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_Permission_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Role" ADD CONSTRAINT "Role_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_Branch_id_fk" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuditLog_tenantId_branchId_action_idx" ON "AuditLog" USING btree ("tenantId","branchId","action");--> statement-breakpoint
CREATE UNIQUE INDEX "Branch_tenantId_code_key" ON "Branch" USING btree ("tenantId","code");--> statement-breakpoint
CREATE UNIQUE INDEX "DiningTable_branchId_code_key" ON "DiningTable" USING btree ("branchId","code");--> statement-breakpoint
CREATE UNIQUE INDEX "Discount_tenantId_code_key" ON "Discount" USING btree ("tenantId","code");--> statement-breakpoint
CREATE UNIQUE INDEX "InventoryItem_branchId_sku_key" ON "InventoryItem" USING btree ("branchId","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "Role_name_tenantId_branchId_key" ON "Role" USING btree ("name","tenantId","branchId");
