"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Store,
  X
} from "lucide-react";
import { useSession } from "@/hooks/use-session";

const navItems = [
  { href: "/executive-overview", label: "Executive" },
  { href: "/financial-analytics", label: "Financial" },
  { href: "/operations-command-center", label: "Operations" },
  { href: "/kitchen-display-system", label: "Kitchen" },
  { href: "/qr-menu-interface", label: "QR Menu" },
  { href: "/tablet-ordering-interface", label: "Tablet" },
  { href: "/kiosk-ordering-system", label: "Kiosk" },
  { href: "/pos", label: "POS" }
];

function BranchSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const { branches, activeBranchId, setActiveBranch } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const isAllBranches = activeBranchId === null;
  const selectedLabel = isAllBranches
    ? "Бүх салбар"
    : (branches.find((branch) => branch.id === activeBranchId)?.name ?? "Салбар сонгох");

  return (
    <div ref={dropdownRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`
          flex items-center gap-2 h-9 px-3 rounded-sm border bg-card
          text-sm font-medium text-foreground
          hover:border-primary hover:bg-muted
          transition-all duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
          ${fullWidth ? "w-full justify-between" : "min-w-40"}
          ${open ? "border-primary ring-2 ring-ring ring-offset-1" : "border-border"}
          ${isAllBranches ? "border-primary/50 bg-primary/5" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Салбар сонгох"
      >
        {isAllBranches ? (
          <Store className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          className="absolute top-full mt-1.5 right-0 z-[150] bg-card border border-border rounded-md shadow-xl min-w-56 overflow-hidden"
          role="listbox"
          aria-label="Салбарын жагсаалт"
        >
          <div className="p-1.5 border-b border-border">
            <button
              type="button"
              onClick={() => {
                setActiveBranch(null);
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm
                transition-all duration-200
                ${isAllBranches ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}
              `}
              role="option"
              aria-selected={isAllBranches}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  isAllBranches ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {isAllBranches ? <Check className="w-2.5 h-2.5 text-white" /> : null}
              </div>
              <Store className={`w-3.5 h-3.5 ${isAllBranches ? "text-primary" : "text-muted-foreground"}`} />
              <span>Бүх салбар</span>
              <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {branches.length}
              </span>
            </button>
          </div>

          <div className="p-1.5 max-h-64 overflow-y-auto">
            {branches.map((branch) => {
              const selected = activeBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    setActiveBranch(branch.id);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm
                    transition-all duration-200
                    ${selected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}
                  `}
                  role="option"
                  aria-selected={selected}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? "bg-primary border-primary" : "border-border"
                    }`}
                  >
                    {selected ? <Check className="w-2.5 h-2.5 text-white" /> : null}
                  </div>
                  <span className="truncate">{branch.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-20" title={branch.code}>
                    {branch.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrganizationSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const { organizations, activeTenantId, setActiveTenant } = useSession();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedLabel =
    organizations.find((organization) => organization.id === (activeTenantId ?? ""))?.name ??
    "Organization";

  return (
    <div ref={dropdownRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        disabled={switching || organizations.length === 0}
        onClick={() => setOpen((value) => !value)}
        className={`
          flex items-center gap-2 h-9 px-3 rounded-sm border bg-card
          text-sm font-medium text-foreground
          hover:border-primary hover:bg-muted
          transition-all duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
          ${fullWidth ? "w-full justify-between" : "min-w-40"}
          ${open ? "border-primary ring-2 ring-ring ring-offset-1" : "border-border"}
          ${switching || organizations.length === 0 ? "opacity-60 cursor-not-allowed" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Организаци сонгох"
      >
        <Building2 className="w-4 h-4 text-primary shrink-0" />
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          className="absolute top-full mt-1.5 right-0 z-[150] bg-card border border-border rounded-md shadow-xl min-w-56 overflow-hidden"
          role="listbox"
          aria-label="Организацийн жагсаалт"
        >
          <div className="p-1.5 max-h-64 overflow-y-auto">
            {organizations.map((organization) => {
              const selected = activeTenantId === organization.id;
              return (
                <button
                  key={organization.id}
                  type="button"
                  onClick={async () => {
                    setSwitching(true);
                    await setActiveTenant(organization.id);
                    setSwitching(false);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm
                    transition-all duration-200
                    ${selected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}
                  `}
                  role="option"
                  aria-selected={selected}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? "bg-primary border-primary" : "border-border"
                    }`}
                  >
                    {selected ? <Check className="w-2.5 h-2.5 text-white" /> : null}
                  </div>
                  <span className="truncate">{organization.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-20" title={organization.code}>
                    {organization.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TopHeader() {
  const pathname = usePathname();
  const { session, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm h-16">
        <div className="h-full px-4 md:px-6 flex items-center gap-4">
          <Link href="/executive-overview" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 14L7 9L10.5 12L14 7L17 10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="17" cy="10" r="1.5" fill="#F59E0B" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-sm text-foreground block leading-none">BIQ</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
                Restaurant Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 min-w-0">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="hidden lg:flex items-center gap-2">
            <OrganizationSwitcher />
            <BranchSwitcher />
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="h-9 rounded-sm border border-border bg-muted px-3 text-sm font-medium text-foreground hover:bg-border transition-all duration-200 inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed top-16 left-0 right-0 z-40 bg-card border-b border-border shadow-lg lg:hidden">
          <div className="px-4 py-4 space-y-3">
            <OrganizationSwitcher fullWidth />
            <BranchSwitcher fullWidth />

            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-sm text-sm text-center font-medium ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="w-full h-9 rounded-sm border border-border bg-muted text-sm font-medium text-foreground hover:bg-border transition-all duration-200"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
