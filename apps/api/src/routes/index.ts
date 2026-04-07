import { Router } from "express";
import { healthRouter } from "../modules/health/routes/health.routes.js";
import { authRouter } from "../modules/auth/routes/auth.routes.js";
import { tenantRouter } from "../modules/tenant/routes/tenant.routes.js";
import { branchRouter } from "../modules/branch/routes/branch.routes.js";
import { menuRouter } from "../modules/menu/routes/menu.routes.js";
import { inventoryRouter } from "../modules/inventory/routes/inventory.routes.js";
import { ordersRouter } from "../modules/orders/routes/orders.routes.js";
import { paymentsRouter } from "../modules/payments/routes/payments.routes.js";
import { ebarimtRouter } from "../modules/ebarimt/routes/ebarimt.routes.js";
import { kdsRouter } from "../modules/kds/routes/kds.routes.js";
import { reportsRouter } from "../modules/reports/routes/reports.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/tenants", tenantRouter);
apiRouter.use("/branches", branchRouter);
apiRouter.use("/menu", menuRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/ebarimt", ebarimtRouter);
apiRouter.use("/kds", kdsRouter);
apiRouter.use("/reports", reportsRouter);
