import { BranchRepository } from "../repositories/branch.repository.js";
import { TenantBootstrapService } from "../../tenant/services/tenant-bootstrap.service.js";

export class BranchService {
  static async list(input: { tenantId?: string; isSuperAdmin: boolean }) {
    if (input.isSuperAdmin && !input.tenantId) {
      return BranchRepository.listAll();
    }

    if (!input.tenantId) {
      return [];
    }

    return BranchRepository.listByTenant(input.tenantId);
  }

  static async create(input: {
    tenantId: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
  }) {
    const branch = await BranchRepository.create(input);

    await Promise.all([
      TenantBootstrapService.createBranchRoles(input.tenantId, branch.id),
      BranchRepository.createDefaultTables(input.tenantId, branch.id)
    ]);

    return branch;
  }
}
