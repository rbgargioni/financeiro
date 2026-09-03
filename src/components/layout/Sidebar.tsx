"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Tags,
  Users2,
  UserCog,
  Settings,
  Wallet2,
  Package,
  ArrowLeftRight,
  Upload,
  Receipt,
  Target,
  Landmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/contas-a-receber", label: "Contas a Receber", icon: ArrowDownCircle },
  { href: "/dashboard/contas-a-pagar", label: "Contas a Pagar", icon: ArrowUpCircle },
  { href: "/dashboard/fluxo-de-caixa", label: "Fluxo de Caixa", icon: Wallet },
  { href: "/dashboard/contas-bancarias", label: "Contas Bancárias", icon: Landmark },
  { href: "/dashboard/importar-extrato", label: "Importar Extrato", icon: Upload },
  { href: "/dashboard/notas-fiscais", label: "Notas Fiscais", icon: Receipt },
  { href: "/dashboard/categorias", label: "Categorias", icon: Tags },
  { href: "/dashboard/centros-de-custo", label: "Centros de Custo", icon: Target },
  { href: "/dashboard/clientes-fornecedores", label: "Clientes e Fornecedores", icon: Users2 },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/movimentacoes-estoque", label: "Movimentações de Estoque", icon: ArrowLeftRight },
  { href: "/dashboard/usuarios", label: "Usuários", icon: UserCog },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2 px-5 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Wallet2 size={18} />
      </div>
      <span className="text-lg font-semibold text-slate-900">Fluxa</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <Logo />
        <NavLinks />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
          <div className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Logo />
              <button
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
