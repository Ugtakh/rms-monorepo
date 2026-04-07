import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/app-error.js";
import { env } from "../../../config/env.js";
import type {
  EbarimtCentralResponse,
  PosApiBankAccount,
  PosApiInfoResponse,
  PosApiReceiptRequest,
  PosApiReceiptResponse,
  PosApiEnvironment
} from "../types/posapi.types.js";

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

function toErrorBody(body: unknown): unknown {
  if (body === null) return null;
  if (typeof body === "string") return body;
  if (typeof body === "object") return body;
  return String(body);
}

function resolveCentralApiBase(environment: PosApiEnvironment): string {
  return environment === "production"
    ? env.EBARIMT_PRODUCTION_API_URL
    : env.EBARIMT_STAGING_API_URL;
}

export class EbarimtPosApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const timeoutMs = options.timeoutMs ?? env.EBARIMT_REQUEST_TIMEOUT_MS;
    const retries = Math.max(0, options.retries ?? 0);

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(this.baseUrl + path, {
          method: options.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {})
          },
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timer);

        const contentType = response.headers.get("content-type") ?? "";
        const rawText = await response.text();
        const parsedBody =
          contentType.includes("application/json") || rawText.startsWith("{") || rawText.startsWith("[")
            ? (() => {
                try {
                  return JSON.parse(rawText) as unknown;
                } catch {
                  return rawText;
                }
              })()
            : rawText;

        if (!response.ok) {
          throw new AppError(
            `PosAPI request failed: ${(parsedBody as { message?: string } | undefined)?.message ?? response.statusText}`,
            StatusCodes.BAD_GATEWAY,
            "EBARIMT_POSAPI_HTTP_ERROR",
            {
              path,
              status: response.status,
              body: toErrorBody(parsedBody)
            }
          );
        }

        return parsedBody as T;
      } catch (error) {
        clearTimeout(timer);
        lastError = error;

        if (attempt === retries) {
          if (error instanceof AppError) {
            throw error;
          }

          throw new AppError(
            "PosAPI connection failed",
            StatusCodes.BAD_GATEWAY,
            "EBARIMT_POSAPI_NETWORK_ERROR",
            {
              path,
              reason: error instanceof Error ? error.message : "Unknown error"
            }
          );
        }
      }
    }

    throw new AppError(
      "PosAPI connection failed",
      StatusCodes.BAD_GATEWAY,
      "EBARIMT_POSAPI_NETWORK_ERROR",
      {
        reason: lastError instanceof Error ? lastError.message : "Unknown error"
      }
    );
  }

  postReceipt(payload: PosApiReceiptRequest, timeoutMs: number, retries: number) {
    return this.request<PosApiReceiptResponse>("/rest/receipt", {
      method: "POST",
      body: payload,
      timeoutMs,
      retries
    });
  }

  voidReceipt(payload: { id: string; date: string }, timeoutMs: number, retries: number) {
    return this.request<Record<string, unknown>>("/rest/receipt", {
      method: "DELETE",
      body: payload,
      timeoutMs,
      retries
    });
  }

  getInfo(timeoutMs: number, retries: number) {
    return this.request<PosApiInfoResponse>("/rest/info", {
      method: "GET",
      timeoutMs,
      retries
    });
  }

  sendData(timeoutMs: number, retries: number) {
    return this.request<Record<string, unknown>>("/rest/sendData", {
      method: "GET",
      timeoutMs,
      retries
    });
  }

  getBankAccounts(tin: string, timeoutMs: number, retries: number) {
    const search = new URLSearchParams({ tin });
    return this.request<PosApiBankAccount[]>(`/rest/bankAccounts?${search.toString()}`, {
      method: "GET",
      timeoutMs,
      retries
    });
  }

  static async requestCentral<T>(input: {
    environment: PosApiEnvironment;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    method?: "GET" | "POST";
    body?: unknown;
    xApiKey?: string;
    timeoutMs?: number;
    retries?: number;
  }): Promise<EbarimtCentralResponse<T>> {
    const timeoutMs = input.timeoutMs ?? env.EBARIMT_REQUEST_TIMEOUT_MS;
    const retries = Math.max(0, input.retries ?? 0);
    const baseUrl = resolveCentralApiBase(input.environment).replace(/\/$/, "");

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(input.query ?? {})) {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    }

    const targetUrl = `${baseUrl}${input.path}${search.size > 0 ? `?${search.toString()}` : ""}`;

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(targetUrl, {
          method: input.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...(input.xApiKey ? { "X-API-KEY": input.xApiKey } : {})
          },
          body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timer);

        const rawText = await response.text();
        const parsedBody = rawText.length > 0 ? (JSON.parse(rawText) as unknown) : {};

        if (!response.ok) {
          throw new AppError(
            "Ebarimt central API request failed",
            StatusCodes.BAD_GATEWAY,
            "EBARIMT_CENTRAL_HTTP_ERROR",
            {
              url: targetUrl,
              status: response.status,
              body: toErrorBody(parsedBody)
            }
          );
        }

        return parsedBody as EbarimtCentralResponse<T>;
      } catch (error) {
        clearTimeout(timer);
        lastError = error;

        if (attempt === retries) {
          if (error instanceof AppError) {
            throw error;
          }

          throw new AppError(
            "Ebarimt central API connection failed",
            StatusCodes.BAD_GATEWAY,
            "EBARIMT_CENTRAL_NETWORK_ERROR",
            {
              url: targetUrl,
              reason: error instanceof Error ? error.message : "Unknown error"
            }
          );
        }
      }
    }

    throw new AppError(
      "Ebarimt central API connection failed",
      StatusCodes.BAD_GATEWAY,
      "EBARIMT_CENTRAL_NETWORK_ERROR",
      {
        reason: lastError instanceof Error ? lastError.message : "Unknown error"
      }
    );
  }
}
