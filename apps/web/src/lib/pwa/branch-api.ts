import type {
  BranchConfig,
  KdsTicket,
  LocalOrderPayload,
  MenuItem,
} from "./types";

export async function fetchBranchMenu(config: BranchConfig): Promise<MenuItem[]> {
  const res = await fetch(`${config.branchApiBaseUrl}/local/menu`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `Menu request failed (${res.status})`);
  }

  return data?.data ?? [];
}

export async function createLocalOrder(
  config: BranchConfig,
  payload: LocalOrderPayload
) {
  const res = await fetch(`${config.branchApiBaseUrl}/local/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `Order request failed (${res.status})`);
  }

  return data;
}

export async function fetchKdsTickets(config: BranchConfig): Promise<KdsTicket[]> {
  const res = await fetch(`${config.branchApiBaseUrl}/local/kds/tickets`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `KDS request failed (${res.status})`);
  }

  return data?.data ?? [];
}

export async function updateKdsTicketStatus(
  config: BranchConfig,
  ticketId: string,
  status: KdsTicket["status"]
): Promise<KdsTicket> {
  const res = await fetch(
    `${config.branchApiBaseUrl}/local/kds/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `KDS update failed (${res.status})`);
  }

  return data?.data;
}