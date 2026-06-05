import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Building2, CreditCard, Receipt, Settings, FileText, Bell, BarChart3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navGroups = [
  {
    title: "PLATFORM ADMIN",
    items: [
      { name: "Companies", icon: Building2, path: "/admin/companies" },
      { name: "Subscription Plans", icon: CreditCard, path: "/admin/plans" },
      { name: "Invoices", icon: Receipt, path: "/admin/invoices" },
      { name: "System Settings", icon: Settings, path: "/admin/settings" },
    ]
  }
];

export default function AdminSidebar() {
  const location = useLocation();
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Listen to mobile menu button toggle trigger
  useEffect(() => {
    const handleToggle = () => {
      setIsOpenOnMobile(prev => !prev);
    };
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  // Close slide-over when page is clicked
  useEffect(() => {
    setIsOpenOnMobile(false);
  }, [location.pathname]);

  return (
    <>
      {/* Dim backdrop layer for administrative mobile layouts */}
      {isOpenOnMobile && (
        <div 
          onClick={() => setIsOpenOnMobile(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        ></div>
      )}

      <aside className={cn(
        "bg-[#0f172a] text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 z-50 transition-all duration-300 ease-in-out border-r border-slate-800",
        // Responsive placements
        "fixed inset-y-0 left-0 lg:sticky lg:translate-x-0 lg:flex",
        isOpenOnMobile ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        // Desktop collapse state layouts
        isCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        
        {/* Platform Branding */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 bg-[#0f172a] border-b border-white/5 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsed || isOpenOnMobile) && (
              <div>
                <h1 className="text-white font-extrabold text-xs tracking-wider">PENTA GUARD</h1>
                <p className="text-[9px] text-blue-400 font-bold tracking-widest uppercase mt-0.5">Super Admin</p>
              </div>
            )}
          </div>
          {isOpenOnMobile && (
            <button 
              onClick={() => setIsOpenOnMobile(false)} 
              className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg lg:hidden"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 select-none">
          {navGroups.map((group) => (
            <div key={group.title}>
              {(!isCollapsed || isOpenOnMobile) ? (
                <h4 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                  {group.title}
                </h4>
              ) : (
                <div className="h-px bg-slate-800 my-4 mx-2"></div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      title={item.name}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 group relative",
                        isActive 
                          ? "bg-blue-600/10 text-blue-400" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      )}
                    >
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md"></div>
                      )}
                      <item.icon className={cn("w-4.5 h-4.5 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                      {(!isCollapsed || isOpenOnMobile) && <span>{item.name}</span>}
                      
                      {isActive && isCollapsed && !isOpenOnMobile && (
                        <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 shrink-0 border-t border-white/5 select-none space-y-1.5">
          <Link 
            to="/" 
            title="Switch back to Nile Insurance S.C Nile Admin Tenant board"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-purple-400 font-extrabold bg-purple-950/30 hover:bg-purple-950/55 transition-colors border border-purple-900/30",
              isCollapsed && !isOpenOnMobile ? "justify-center animate-pulse" : ""
            )}
          >
            <ShieldCheck className="w-4.5 h-4.5 text-purple-500 shrink-0" />
            {(!isCollapsed || isOpenOnMobile) && <span>Tenant Portal</span>}
          </Link>

        </div>
      </aside>
    </>
  );
}
