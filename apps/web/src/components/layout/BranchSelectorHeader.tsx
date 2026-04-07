"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, MapPin, Store } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import Icon from "../AppIcon";

type Option = {
  id: string;
  name: string;
  code?: string;
};

function Selector({
  fullWidth = false,
  label,
  icon,
  options,
  selectedId,
  allMode = false,
  allCount = 0,
  onSelect,
}: {
  fullWidth?: boolean;
  label: string;
  icon: "org" | "branch";
  options: Option[];
  selectedId: string | null;
  allMode?: boolean;
  allCount?: number;
  onSelect: (id: string | null) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const isAllSelected = allMode && selectedId === null;
  const selectedLabel = useMemo(
    () =>
      isAllSelected
        ? "Бүх салбар"
        : (options.find((option) => option.id === selectedId)?.name ?? label),
    [isAllSelected, label, options, selectedId],
  );

  return (
    <div ref={dropdownRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`
          flex items-center gap-2 h-9 px-3 rounded-sm border bg-card
          text-sm font-medium text-foreground
          hover:border-primary hover:bg-muted
          transition-all duration-250 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
          ${fullWidth ? "w-full justify-between" : "w-full md:w-auto md:min-w-55"}
          ${open ? "border-primary ring-2 ring-ring ring-offset-1" : "border-border"}
          ${isAllSelected ? "border-primary/50 bg-primary/5" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Салбар сонгох"
      >
        {icon === "org" ? (
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : isAllSelected ? (
          <Store className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-250 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          className="absolute top-full mt-1.5 right-0 z-150 bg-card border border-border rounded-md shadow-xl min-w-55 overflow-hidden"
          role="listbox"
        >
          {allMode ? (
            <div className="p-1.5 border-b border-border">
              <button
                type="button"
                onClick={async () => {
                  await onSelect(null);
                  setOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm
                  transition-all duration-250
                  ${isAllSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}
                `}
                role="option"
                aria-selected={isAllSelected}
              >
                <div
                  className={`w-4 h-4 rounded bg-amber-300 border flex items-center justify-center shrink-0 ${
                    isAllSelected
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {/* {isAllSelected ? (
                    // <Check className="w-2.5 h-2.5 text-white" />
                    <Icon name="CheckIcon" size={10} className="text-white" />
                  ) : null} */}
                </div>
                <Store
                  className={`w-3.5 h-3.5 ${isAllSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span>Бүх салбар</span>
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {allCount}
                </span>
              </button>
            </div>
          ) : null}

          <div className="p-1.5 max-h-72 overflow-y-auto">
            {options.map((option) => {
              const selected = option.id === selectedId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={async () => {
                    await onSelect(option.id);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm
                    transition-all duration-250
                    ${selected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}
                  `}
                  role="option"
                  aria-selected={selected}
                >
                  <div
                    className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${
                      selected ? "bg-primary border-primary" : "border-border"
                    }`}
                  >
                    {selected ? (
                      <Check className="w-2.5 h-2.5 text-white" />
                    ) : null}
                  </div>
                  <span className="truncate">{option.name}</span>
                  {option.code ? (
                    <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-24">
                      {option.code}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BranchSelectorHeader() {
  const {
    organizations,
    branches,
    activeTenantId,
    activeBranchId,
    setActiveTenant,
    setActiveBranch,
  } = useSession();
  const [switchingOrg, setSwitchingOrg] = useState(false);

  const orgOptions = useMemo(
    () =>
      organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        code: organization.code,
      })),
    [organizations],
  );

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
      })),
    [branches],
  );

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="px-4 md:px-6 py-3">
        <div className="ml-auto w-full flex flex-col md:flex-row gap-2 items-stretch md:items-center md:justify-end">
          <Selector
            label="Org"
            icon="org"
            options={orgOptions}
            selectedId={activeTenantId}
            onSelect={async (id) => {
              setSwitchingOrg(true);
              try {
                await setActiveTenant(id);
              } finally {
                setSwitchingOrg(false);
              }
            }}
          />

          <Selector
            label="Branch"
            icon="branch"
            options={branchOptions}
            selectedId={activeBranchId}
            allMode
            allCount={branchOptions.length}
            onSelect={(id) => {
              if (switchingOrg) return;
              setActiveBranch(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
