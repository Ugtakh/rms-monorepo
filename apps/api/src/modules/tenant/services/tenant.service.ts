import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { TenantRepository } from "../repositories/tenant.repository.js";
import { TenantBootstrapService } from "./tenant-bootstrap.service.js";

export class TenantService {
  static async listForUser(input: { isSuperAdmin: boolean; tenantId: string | null }) {
    if (input.isSuperAdmin) {
      return TenantRepository.list();
    }

    if (!input.tenantId) {
      throw new AppError("Tenant context not found", StatusCodes.FORBIDDEN, "TENANT_REQUIRED");
    }

    const tenant = await TenantRepository.findById(input.tenantId);
    return tenant ? [tenant] : [];
  }

  static async create(input: { code: string; name: string }) {
    const created = await TenantRepository.create(input);
    await TenantBootstrapService.createTenantRoles(created.id);
    return created;
  }

  static async getById(id: string) {
    const tenant = await TenantRepository.findById(id);

    if (!tenant) {
      throw new AppError("Tenant not found", StatusCodes.NOT_FOUND, "TENANT_NOT_FOUND");
    }

    return tenant;
  }
}
