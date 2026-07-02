import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Mail, X, Check, Server, Shield, Sparkles, User, Settings, Database, LogOut, Menu } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { useAuth } from '@/src/lib/AuthContext';

interface AdminSearchResult {
  id: string;
  name: string;
  sub: string;
  path: string;
}

export default function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const roleLabel = (r: string) => {
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'admin') return 'Company Admin';
    if (r === 'agent') return 'Agent';
    return 'Claim Staff';
  };

  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ companies: AdminSearchResult[]; plans: AdminSearchResult[]; invoices: AdminSearchResult[] }>({
    companies: [], plans: [], invoices: []
  });

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const bellBoxRef = useRef<HTMLDivElement>(null);
  const mailBoxRef = useRef<HTMLDivElement>(null);
  const profileBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes, iRes, payRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/subscription-plans'),
          fetch('/api/invoices'),
          fetch('/api/payments')
        ]);
        if (cRes.ok) {
          const data = await cRes.json();
          setCompanies(data);
        }
        if (pRes.ok) setPlans(await pRes.json());
        if (iRes.ok) {
          const data = await iRes.json();
          setInvoices(data);
          const overdue = data.filter((i: any) =>
            i.Status === 'Unpaid' && new Date(i.Due_Date) < new Date()
          );
          setOverdueInvoices(overdue);
          setNotifications([
            ...overdue.slice(0, 3).map((inv: any) => ({
              id: `overdue-${inv.Invoice_Id}`,
              text: `Billing anomaly: ${inv.Company_Name || 'Tenant'} invoice overdue past due date`,
              time: `${Math.round((Date.now() - new Date(inv.Due_Date).getTime()) / (1000 * 60 * 60 * 24))} days late`,
              type: 'warning'
            })),
            ...data.filter((d: any) => d.Status === 'Paid').slice(0, 2).map((inv: any) => ({
              id: `paid-${inv.Invoice_Id}`,
              text: `Payment received: ETB ${Number(inv.Amount).toLocaleString()} for invoice INV-${String(inv.Invoice_Id).padStart(4, '0')}`,
              time: new Date(inv.Invoice_Date).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
              type: 'info'
            }))
          ]);
          setInbox([
            ...overdue.slice(0, 2).map((inv: any) => ({
              id: `bill-${inv.Invoice_Id}`,
              sender: `Billing Reminder - ${inv.Company_Name || 'Tenant'}`,
              subject: `Invoice INV-${String(inv.Invoice_Id).padStart(4, '0')} past due date`,
              date: new Date(inv.Due_Date).toLocaleString('en-US', { month: 'short', day: 'numeric' })
            })),
            ...data.filter((d: any) => d.Status === 'Paid').slice(0, 1).map((inv: any) => ({
              id: `pay-${inv.Invoice_Id}`,
              sender: 'Payment Reconciliation',
              subject: `Payment ETB ${Number(inv.Amount).toLocaleString()} posted to Invoice INV-${String(inv.Invoice_Id).padStart(4, '0')}`,
              date: new Date(inv.Invoice_Date).toLocaleString('en-US', { month: 'short', day: 'numeric' })
            }))
          ]);
        }
        if (payRes.ok) {
          const data = await payRes.json();
          setRecentPayments(data.slice(0, 5));
        }
      } catch (e) { console.error('Admin topbar load failed:', e); }
    };
    load();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults({ companies: [], plans: [], invoices: [] });
      return;
    }
    setSearchResults({
      companies: companies
        .filter(c => c.Company_Name?.toLowerCase().includes(q) || String(c.Company_Id).includes(q))
        .slice(0, 5)
        .map(c => ({
          id: `CO-${String(c.Company_Id).padStart(3, '0')}`,
          name: c.Company_Name,
          sub: c.Head_Office_Address || c.Subscription_Plan || '',
          path: '/admin/companies'
        })),
      plans: plans
        .filter(p => p.Plan_Name?.toLowerCase().includes(q) || String(p.Plan_Id).includes(q))
        .slice(0, 5)
        .map(p => ({
          id: `PLN-${String(p.Plan_Id).padStart(3, '0')}`,
          name: p.Plan_Name,
          sub: `ETB ${Number(p.Monthly_Fee).toLocaleString()} / month`,
          path: '/admin/plans'
        })),
      invoices: invoices
        .filter(i =>
          String(i.Invoice_Id).includes(q) ||
          (i.Company_Name || '').toLowerCase().includes(q) ||
          (i.Plan_Name || '').toLowerCase().includes(q) ||
          (i.Status || '').toLowerCase().includes(q)
        )
        .slice(0, 5)
        .map(i => ({
          id: `INV-${String(i.Invoice_Id).padStart(4, '0')}`,
          name: `Invoice INV-${String(i.Invoice_Id).padStart(4, '0')}`,
          sub: `${i.Company_Name || 'Tenant'} · ${i.Status}`,
          path: '/admin/invoices'
        }))
    });
  }, [searchQuery, companies, plans, invoices]);

  const allMatches: { type: string; result: AdminSearchResult }[] = [
    ...searchResults.companies.map(r => ({ type: 'company', result: r })),
    ...searchResults.plans.map(r => ({ type: 'plan', result: r })),
    ...searchResults.invoices.map(r => ({ type: 'invoice', result: r }))
  ];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (bellBoxRef.current && !bellBoxRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (mailBoxRef.current && !mailBoxRef.current.contains(target)) {
        setShowInbox(false);
      }
      if (profileBoxRef.current && !profileBoxRef.current.contains(target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('admin-search') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchMatches = allMatches;

  const toggleMobileAdminSidebar = () => {
    window.dispatchEvent(new Event('toggle-admin-sidebar'));
  };

  let title = "Platform Admin";
  if (location.pathname.startsWith('/admin/companies')) title = "SaaS Admin > Companies";
  else if (location.pathname.startsWith('/admin/plans')) title = "SaaS Admin > Subscription Plans";
  else if (location.pathname.startsWith('/admin/invoices')) title = "SaaS Admin > Invoices";
  else if (location.pathname.startsWith('/admin/settings')) title = "SaaS Admin > System Settings";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30 relative select-none">
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile menu trigger */}
        <button 
          onClick={toggleMobileAdminSidebar}
          className="text-slate-500 hover:text-slate-800 lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors mr-1"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Admin Search Component */}
        <div ref={searchBoxRef} className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            id="admin-search"
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search companies, plans..." 
            className="w-full pl-9 pr-14 py-1.5 bg-gray-50 border-gray-200 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500 focus:bg-white transition-all h-9"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[9px] font-medium text-gray-400 bg-white border border-gray-200 rounded">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Matches dropdown overlay */}
          {searchFocused && (
            <div className="absolute top-[38px] left-0 right-0 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in duration-100">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 flex items-center justify-between border-b border-gray-50 mb-1">
                <span>Platform Indexer DB</span>
                {searchQuery && <span className="text-blue-500">{searchMatches.length} matches</span>}
              </div>
              {searchQuery.trim() === '' ? (
                <div className="px-2 py-4 text-center text-xs text-gray-400">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-purple-500 animate-pulse" />
                  <p className="font-semibold text-gray-700">Live Global Platform Inspector</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Focus and type to lookup system databases</p>
                </div>
              ) : searchMatches.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-gray-400">
                  <p className="font-semibold text-gray-600">No active databases match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {searchMatches.map((m, i) => (
                    <button
                      key={`${m.type}-${m.result.id}-${i}`}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchFocused(false);
                        navigate(m.result.path);
                      }}
                      className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{m.result.name}</div>
                        <div className="text-[9px] text-gray-400 font-mono mt-0.5 truncate">{m.result.id} · {m.result.sub}</div>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0 ml-2">
                        {m.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="font-medium text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 leading-none block sm:hidden uppercase tracking-widest font-mono truncate max-w-[120px]">
          {title.split(' > ').pop()}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        
        {/* Switch context option */}
        <div className="hidden sm:flex">
          <Link 
            to="/" 
            title="Terminate Super Admin Session"
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all border border-gray-150 shadow-xs"
          >
            Exit Super Admin
          </Link>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          
          {/* Notifications Trays Area */}
          <div ref={bellBoxRef} className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowInbox(false); }}
              className="p-1.5 hover:bg-gray-50 rounded-full text-slate-500 hover:text-slate-800 transition-all relative group"
            >
              <Bell className="w-5 h-5 group-hover:scale-105 transition-all text-slate-500" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="p-2.5 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-800">System Alerts</span>
                  {notifications.length > 0 && (
                    <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-red-600 hover:underline">Clear Alerts</button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-medium">No live system metrics pending approval.</div>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className="p-3 bg-white hover:bg-gray-50/75 transition-colors">
                        <p className="text-gray-950 font-medium leading-normal">{item.text}</p>
                        <p className="text-[9px] text-gray-400 mt-1 font-mono font-bold uppercase tracking-wider">{item.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
                  <Link to="/admin/settings" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-gray-500 hover:text-gray-900">View Infrastructure Dashboard</Link>
                </div>
              </div>
            )}
          </div>

          {/* Mail Inbox area */}
          <div ref={mailBoxRef} className="relative">
            <button 
              onClick={() => { setShowInbox(!showInbox); setShowNotifications(false); }}
              className="p-1.5 hover:bg-gray-50 rounded-full text-slate-500 hover:text-slate-800 transition-all relative group"
            >
              <Mail className="w-5 h-5 group-hover:scale-105 transition-all text-slate-500" />
              {inbox.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 border-2 border-white"></span>
              )}
            </button>

            {showInbox && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="p-2.5 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Administrator Inbox</span>
                  {inbox.length > 0 && (
                    <button onClick={() => setInbox([])} className="text-[10px] font-bold text-blue-600 hover:underline">Dismiss All</button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {inbox.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-medium">Inbox fully checked. No pending logs.</div>
                  ) : (
                    inbox.map((mail) => (
                      <div key={mail.id} className="p-3 bg-white hover:bg-gray-50/75 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-gray-900">{mail.sender}</span>
                          <span className="text-[9px] text-gray-400 font-mono">{mail.date}</span>
                        </div>
                        <p className="text-gray-600 font-medium text-xs mt-1 leading-relaxed truncate">{mail.subject}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Superadmin profile settings popup */}
        <div ref={profileBoxRef} className="flex items-center gap-3 pl-3 md:pl-5 border-l border-gray-200 relative">
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="hidden md:block text-right select-none">
              <p className="text-xs font-bold text-gray-900 leading-tight">{user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}</p>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-none">{user ? roleLabel(user.role) : 'Super Admin'}</p>
            </div>
            <img 
              src="https://i.pravatar.cc/150?u=superadmin" 
              alt={user ? `${user.firstName} ${user.lastName}` : 'Admin'} 
              className="w-9 h-9 rounded-full border border-gray-200 group-hover:scale-105 transition-transform"
            />
          </div>

          {showProfile && (
            <div className="absolute right-0 top-[42px] mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 divide-y divide-gray-100 animate-in fade-in duration-100">
              <div className="px-3.5 py-2.5">
                <p className="font-bold text-xs text-gray-900">{user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{user?.email || ''}</p>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded mt-2.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Root Platform Level
                </div>
              </div>
              <div className="py-1">
                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Server className="w-3.5 h-3.5 text-gray-400" /> Infrastructure Config
                </Link>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" /> Terminate Super Admin
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
