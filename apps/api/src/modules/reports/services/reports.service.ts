import dayjs from "dayjs";
import { ReportsRepository } from "../repositories/reports.repository.js";

export class ReportsService {
  static async summary(input: {
    tenantId: string;
    branchId?: string;
    start?: string;
    end?: string;
  }) {
    const start = input.start ? dayjs(input.start).startOf("day") : dayjs().startOf("day");
    const end = input.end ? dayjs(input.end).endOf("day") : dayjs().endOf("day");

    return ReportsRepository.salesSummary({
      tenantId: input.tenantId,
      branchId: input.branchId,
      start: start.toDate(),
      end: end.toDate()
    });
  }
}
