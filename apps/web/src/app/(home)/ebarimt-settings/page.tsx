"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { rmsApi } from "@/lib/rms-api";
import type { EbarimtConfigRecord } from "@/types/rms";

const defaultConfig: EbarimtConfigRecord = {
  enabled: false,
  environment: "staging",
  posApiBaseUrl: "http://localhost:7080",
  merchantTin: "",
  branchNo: "001",
  posNo: "001",
  districtCode: "0101",
  defaultBillType: "B2C_RECEIPT",
  defaultTaxType: "VAT_ABLE",
  billIdSuffix: "01",
  fallbackClassificationCode: "0000000",
  defaultMeasureUnit: "ширхэг",
  barCodeType: "UNDEFINED",
  autoSendDataAfterIssue: false,
  strictMode: false,
  timeoutMs: 10000,
  retryCount: 1,
  storeSensitiveFields: true,
  xApiKey: "",
  merchantName: "",
  branchName: "",
  branchAddress: "",
  branchPhone: "",
  logoUrl: ""
};

export default function EbarimtSettingsPage() {
  const [config, setConfig] = useState<EbarimtConfigRecord>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingInfo, setCheckingInfo] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [serviceResult, setServiceResult] = useState<unknown>(null);

  const trimmedTin = useMemo(() => config.merchantTin.trim(), [config.merchantTin]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await rmsApi.getEbarimtConfig();
      setConfig({
        ...defaultConfig,
        ...data
      });
    } catch (error) {
      toast.error((error as Error).message || "Ebarimt config ачаалж чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await rmsApi.updateEbarimtConfig(config);
      setConfig(updated);
      toast.success("Ebarimt тохиргоо хадгалагдлаа");
    } catch (error) {
      toast.error((error as Error).message || "Хадгалах үед алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const checkPosInfo = async () => {
    setCheckingInfo(true);
    try {
      const data = await rmsApi.getEbarimtPosInfo();
      setServiceResult(data);
      toast.success("POS API info амжилттай уншигдлаа");
    } catch (error) {
      toast.error((error as Error).message || "POS API холболтын алдаа");
    } finally {
      setCheckingInfo(false);
    }
  };

  const syncSendData = async () => {
    setSyncing(true);
    try {
      const data = await rmsApi.ebarimtSendData();
      setServiceResult(data);
      toast.success("sendData амжилттай");
    } catch (error) {
      toast.error((error as Error).message || "sendData алдаа");
    } finally {
      setSyncing(false);
    }
  };

  const fetchBankAccounts = async () => {
    if (!trimmedTin) {
      toast.error("Merchant TIN оруулна уу");
      return;
    }

    setLoadingBanks(true);
    try {
      const data = await rmsApi.getEbarimtBankAccounts(trimmedTin);
      setServiceResult(data);
      toast.success("Bank account мэдээлэл татагдлаа");
    } catch (error) {
      toast.error((error as Error).message || "Bank account сервисийн алдаа");
    } finally {
      setLoadingBanks(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Ebarimt settings ачаалж байна...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Ebarimt POS API 3.0
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Салбар тус бүрийн ebarimt тохиргоо, POSAPI холболт, operator reference сервисүүд
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadConfig()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="glass-card rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> Core Config
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Enabled
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Environment</span>
              <Select
                value={config.environment}
                onValueChange={(value: "staging" | "production") =>
                  setConfig((prev) => ({ ...prev, environment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">POS API URL</span>
              <Input
                value={config.posApiBaseUrl}
                onChange={(event) => setConfig((prev) => ({ ...prev, posApiBaseUrl: event.target.value }))}
                placeholder="http://localhost:7080"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Merchant TIN</span>
              <Input
                value={config.merchantTin}
                onChange={(event) => setConfig((prev) => ({ ...prev, merchantTin: event.target.value }))}
                placeholder="110718991986"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">District Code</span>
              <Input
                value={config.districtCode}
                onChange={(event) => setConfig((prev) => ({ ...prev, districtCode: event.target.value }))}
                placeholder="2501"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Branch No</span>
              <Input
                value={config.branchNo}
                onChange={(event) => setConfig((prev) => ({ ...prev, branchNo: event.target.value }))}
                placeholder="001"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">POS No</span>
              <Input
                value={config.posNo}
                onChange={(event) => setConfig((prev) => ({ ...prev, posNo: event.target.value }))}
                placeholder="001"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Bill Type</span>
              <Select
                value={config.defaultBillType}
                onValueChange={(value: EbarimtConfigRecord["defaultBillType"]) =>
                  setConfig((prev) => ({ ...prev, defaultBillType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2C_RECEIPT">B2C_RECEIPT</SelectItem>
                  <SelectItem value="B2B_RECEIPT">B2B_RECEIPT</SelectItem>
                  <SelectItem value="B2C_INVOICE">B2C_INVOICE</SelectItem>
                  <SelectItem value="B2B_INVOICE">B2B_INVOICE</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Tax Type</span>
              <Select
                value={config.defaultTaxType}
                onValueChange={(value: EbarimtConfigRecord["defaultTaxType"]) =>
                  setConfig((prev) => ({ ...prev, defaultTaxType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT_ABLE">VAT_ABLE</SelectItem>
                  <SelectItem value="VAT_FREE">VAT_FREE</SelectItem>
                  <SelectItem value="VAT_ZERO">VAT_ZERO</SelectItem>
                  <SelectItem value="NOT_VAT">NOT_VAT</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Fallback Classification Code</span>
              <Input
                value={config.fallbackClassificationCode}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, fallbackClassificationCode: event.target.value }))
                }
                placeholder="2349010"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Measure Unit</span>
              <Input
                value={config.defaultMeasureUnit}
                onChange={(event) => setConfig((prev) => ({ ...prev, defaultMeasureUnit: event.target.value }))}
                placeholder="ширхэг"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Timeout (ms)</span>
              <Input
                type="number"
                value={config.timeoutMs}
                onChange={(event) => setConfig((prev) => ({ ...prev, timeoutMs: Number(event.target.value) || 10000 }))}
                min={1000}
                max={60000}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Retry Count</span>
              <Input
                type="number"
                value={config.retryCount}
                onChange={(event) => setConfig((prev) => ({ ...prev, retryCount: Number(event.target.value) || 0 }))}
                min={0}
                max={3}
              />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs text-muted-foreground">X-API-KEY (operator endpoints)</span>
              <Input
                value={config.xApiKey}
                onChange={(event) => setConfig((prev) => ({ ...prev, xApiKey: event.target.value }))}
                placeholder="optional"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Strict mode</span>
              <Switch
                checked={config.strictMode}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, strictMode: checked }))}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Auto /sendData</span>
              <Switch
                checked={config.autoSendDataAfterIssue}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, autoSendDataAfterIssue: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Store QR/Lottery</span>
              <Switch
                checked={config.storeSensitiveFields}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, storeSensitiveFields: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Ebarimt Settings
            </Button>
          </div>
        </section>

        <section className="glass-card rounded-xl p-5 space-y-4">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> Integration Checks
          </p>

          <div className="grid gap-2">
            <Button variant="outline" onClick={() => void checkPosInfo()} disabled={checkingInfo}>
              {checkingInfo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Check POS Info (/rest/info)
            </Button>

            <Button variant="outline" onClick={() => void syncSendData()} disabled={syncing}>
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sync sendData (/rest/sendData)
            </Button>

            <Button variant="outline" onClick={() => void fetchBankAccounts()} disabled={loadingBanks}>
              {loadingBanks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Bank Accounts by Merchant TIN
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-2">Service Response Preview</p>
            <pre className="text-[11px] whitespace-pre-wrap break-words text-foreground max-h-[360px] overflow-y-auto">
              {serviceResult ? JSON.stringify(serviceResult, null, 2) : "No response yet"}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
