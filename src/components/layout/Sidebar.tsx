import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  UserCircle, 
  FileText, 
  ShieldCheck, 
  Box, 
  AlertCircle, 
  GitMerge, 
  CreditCard, 
  CalendarDays, 
  FolderOpen, 
  Bell, 
  PieChart, 
  History, 
  Settings, 
  ChevronLeft,
  ChevronDown,
  X,
  Percent
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '@/src/lib/TenantContext';
import { useAuth } from '@/src/lib/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);
  const { user } = useAuth();
  const role = user?.role || 'admin';
  const { selectedCompanyId } = useTenant();
  const [firstAgentId, setFirstAgentId] = useState<number | null>(null);

  const roleLabel = (r: string) => {
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'admin') return 'Company Admin';
    if (r === 'agent') return 'Agent';
    return 'Claim Staff';
  };

  useEffect(() => {
    const loadFirstAgent = async () => {
      try {
        const res = await fetch(`/api/agents?companyId=${selectedCompanyId ?? 1}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setFirstAgentId(data[0].Agent_Id);
        }
      } catch (e) { /* silent */ }
    };
    loadFirstAgent();
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpenOnMobile(prev => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsOpenOnMobile(false);
  }, [location.pathname]);

  const getSidebarGroups = () => {
    if (role === 'agent') {
      return [
        {
          label: "AGENT WORKFLOW",
          items: [
            { name: "Customers", icon: Users, path: "/customers" },
            { name: "Quotes", icon: FileText, path: "/quotes/new" },
            { name: "Policies", icon: ShieldCheck, path: "/policies" },
          ]
        },
        {
          label: "AGENT TRACKING",
          items: [
            { name: "Commissions", icon: Percent, path: firstAgentId ? `/agents/${firstAgentId}` : "/agents" },
          ]
        }
      ];
    }

    if (role === 'claim_staff') {
      return [
        {
          label: "OPERATIONAL ROLES",
          items: [
            { name: "Claims", icon: AlertCircle, path: "/claims" },
            { name: "Claim Workflow", icon: GitMerge, path: "/claims/workflow" },
          ]
        },
        {
          label: "DOCUMENTS & WORKFLOW",
          items: [
            { name: "Documents", icon: FolderOpen, path: "/documents" },
            { name: "Notifications", icon: Bell, path: "/notifications" },
          ]
        }
      ];
    }

    return [
      {
        label: "MANAGEMENT",
        items: [
          { name: "Customers", icon: Users, path: "/customers" },
          { name: "Branches", icon: Building2, path: "/branches" },
          { name: "Agents", icon: UserCircle, path: "/agents" },
          { name: "Quotes", icon: FileText, path: "/quotes/new" },
          { name: "Policies", icon: ShieldCheck, path: "/policies" },
          { name: "Reports", icon: PieChart, path: "/reports" },
        ]
      },
      {
        label: "CLAIMS",
        items: [
          { name: "Claims", icon: AlertCircle, path: "/claims" },
          { name: "Claim Workflow", icon: GitMerge, path: "/claims/workflow" },
        ]
      },
      {
        label: "FINANCE",
        items: [
          { name: "Payments", icon: CreditCard, path: "/payments" },
        ]
      },
      {
        label: "DOCS & SYSTEM",
        items: [
          { name: "Documents", icon: FolderOpen, path: "/documents" },
          { name: "Settings", icon: Settings, path: "/settings" },
        ]
      }
    ];
  };

  const sidebarGroups = getSidebarGroups();


  return (
    <>
      {/* Dim overlay backdrop for mobile drawers */}
      {isOpenOnMobile && (
        <div 
          onClick={() => setIsOpenOnMobile(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        ></div>
      )}

      <aside className={cn(
        "bg-slate-950 text-slate-300 flex flex-col h-screen font-sans border-r border-slate-800 z-50 transition-all duration-300 ease-in-out lg:w-64",
        "fixed inset-y-0 left-0 lg:static lg:translate-x-0 w-64",
        isOpenOnMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header Brand */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-900 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-bold text-white tracking-wide text-xs leading-none">
              PENTA GUARD
              <span className="block text-[9px] text-slate-400 font-normal mt-0.5 uppercase tracking-widest">Insurance Co</span>
            </div>
          </div>
          {isOpenOnMobile && (
            <button 
              onClick={() => setIsOpenOnMobile(false)} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-b border-slate-900 bg-slate-950/60 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
              {user ? user.firstName[0] : 'U'}
            </div>
            <div className="text-xs text-slate-300 font-semibold leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
              <span className="block text-[9px] text-slate-500 font-normal uppercase tracking-wider">{roleLabel(role)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin select-none">
          <div className="px-3 mb-5">
            <Link 
              to="/" 
              title="Dashboard Overview"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                location.pathname === "/" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-900 hover:text-white"
              )}
            >
              <BarChart3 className="w-5 h-5 shrink-0 text-blue-500" />
              <span className="font-semibold text-sm">Dashboard</span>
            </Link>
          </div>

          {sidebarGroups.map((group, i) => (
            <div key={i} className="mb-5 px-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">
                {group.label}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.path === '/' 
                    ? location.pathname === '/' 
                    : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={item.name}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative",
                        isActive ? "bg-slate-850 text-white font-bold" : "hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300")} />
                      <span className="text-xs font-semibold flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </aside>
    </>
  );
}
