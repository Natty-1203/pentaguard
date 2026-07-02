import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Search, Bell, HelpCircle, ChevronDown, Check, User, 
  Shield, LogOut, X, Info, Settings, FileText, Sparkles, Building2, Eye, ShieldCheck
} from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/src/lib/TenantContext';
import { useAuth } from '@/src/lib/AuthContext';

interface SearchResult {
  id: string;
  name: string;
  sub: string;
  path: string;
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getRoleLabel = () => {
    if (!user) return "Company Admin";
    if (user.role === 'agent') return "Agent";
    if (user.role === 'claim_staff') return "Claim Staff";
    if (user.role === 'super_admin') return "Super Admin";
    return "Company Admin";
  };
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { companies, selectedCompanyId, selectedBranchId, selectCompany, selectBranch, selectedCompany, loading } = useTenant();
  const [branches, setBranches] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('Company Admin');
  const [adminEmail, setAdminEmail] = useState('');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ customers: SearchResult[]; policies: SearchResult[]; claims: SearchResult[] }>({
    customers: [], policies: [], claims: []
  });

  const notificationBoxRef = useRef<HTMLDivElement>(null);
  const profileBoxRef = useRef<HTMLDivElement>(null);
  const tenantBoxRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchBranches = async () => {
      try {
        const res = await fetch(`/api/branches?companyId=${selectedCompanyId}`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (e) { console.error('Branch load failed:', e); }
    };
    fetchBranches();
  }, [selectedCompanyId]);
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?companyId=${selectedCompanyId ?? 1}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data || []).slice(0, 5).map((n: any) => ({
            id: n.Notification_Id,
            text: n.Message_Body,
            duration: new Date(n.Sent_At).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            read: n.Status === 'Read',
            channel: n.Channel
          }));
          setNotifications(mapped);
        }
      } catch (e) { console.error('Notifications load failed:', e); }
    };
    fetchNotifs();
  }, []);
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ customers: [], policies: [], claims: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            customers: data.customers || [],
            policies: data.policies || [],
            claims: data.claims || []
          });
        }
      } catch (e) { console.error('Search failed:', e); }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const allMatches: { type: string; result: SearchResult }[] = [
    ...searchResults.customers.map(r => ({ type: 'customer', result: r })),
    ...searchResults.policies.map(r => ({ type: 'policy', result: r })),
    ...searchResults.claims.map(r => ({ type: 'claim', result: r }))
  ];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (notificationBoxRef.current && !notificationBoxRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (profileBoxRef.current && !profileBoxRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (tenantBoxRef.current && !tenantBoxRef.current.contains(target)) {
        setShowTenantDropdown(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setShowNotifications(false);
  };

  const handleSearchItemClick = (path: string) => {
    setSearchQuery('');
    setSearchFocused(false);
    navigate(path);
  };
  const searchMatches = allMatches;
  const toggleMobileSidebar = () => {
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  let title = "Dashboard";
  if (location.pathname.startsWith('/policies/') && location.pathname.split('/').length > 2) {
    title = `Policies > ${location.pathname.split('/').pop()}`;
  }
  else if (location.pathname.startsWith('/policies')) title = "Policies";
  else if (location.pathname.startsWith('/reports')) title = "Reports";
  else if (location.pathname === '/quotes/new') title = "Quotes > New Quote";
  else if (location.pathname.startsWith('/payment-schedules')) title = "Finance > Payment Schedules";
  else if (location.pathname.startsWith('/payments')) title = "Finance > Payments";
  else if (location.pathname.startsWith('/customers/') && location.pathname.split('/').length > 2) {
    title = `Management > Customers > ${location.pathname.split('/').pop()}`;
  }
  else if (location.pathname.startsWith('/customers')) title = "Management > Customers";
  else if (location.pathname.startsWith('/branches')) title = "Management > Branches";
  else if (location.pathname.startsWith('/agents/') && location.pathname.split('/').length > 2) {
    title = `Management > Agents > ${location.pathname.split('/').pop()}`;
  }
  else if (location.pathname.startsWith('/agents')) title = "Management > Agents";
  else if (location.pathname.startsWith('/assets')) title = "Management > Assets";
  else if (location.pathname.includes('/workflow')) title = "Claims > Workflow Timeline";
  else if (location.pathname.startsWith('/claims/') && location.pathname.split('/').length > 2) {
    title = `Claims > ${location.pathname.split('/').pop()}`;
  }
  else if (location.pathname.startsWith('/claims')) title = "Claims";
  else if (location.pathname.startsWith('/documents')) title = "Docs & Comm. > Documents";
  else if (location.pathname.startsWith('/notifications')) title = "Docs & Comm. > Notifications";
  else if (location.pathname.startsWith('/status-badges')) title = "Status Badges";
  else if (location.pathname.startsWith('/confirm-dialog')) title = "(Block) ConfirmDialog";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30 shrink-0 relative">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleMobileSidebar}
          className="text-gray-500 hover:text-gray-700 lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
          title="Toggle Sidebar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-semibold text-base text-gray-900 hidden md:block min-w-32 tracking-tight">{title}</div>
        
        {/* Live Search Container */}
        <div ref={searchBoxRef} className="max-w-md flex-1 ml-0 md:ml-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            id="global-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search customers, policies, claims..." 
            className="pl-9 pr-14 bg-gray-50 border-gray-200 focus-visible:bg-white h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-block bg-white text-gray-400 border border-gray-200 rounded px-1.5 text-[10px] font-sans">Ctrl + /</kbd>
          </div>

          {/* Search Result Float Overlay */}
          {searchFocused && (
            <div className="absolute top-[38px] left-0 right-0 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1 flex items-center justify-between border-b border-gray-100 mb-1">
                <span>Database Search Results</span>
                {searchQuery && <span>{searchMatches.length} matches</span>}
              </div>
              {searchQuery.trim() === '' ? (
                <div className="px-3 py-4 text-center text-xs text-gray-500">
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-blue-500/80 animate-pulse" />
                  <p className="font-medium">Type to reveal instantaneous database lookups</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Enter key searches across customer registry databases.</p>
                </div>
              ) : searchMatches.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-500">
                  <X className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="font-medium">No system records found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {searchMatches.map((m, i) => (
                    <button
                      key={`${m.type}-${m.result.id}-${i}`}
                      onClick={() => handleSearchItemClick(m.result.path)}
                      className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{m.result.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{m.result.id} · {m.result.sub}</div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0 ml-2">
                        {m.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        
        {/* Dynamic Notifications Dropdown */}
        <div ref={notificationBoxRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all relative"
            title="Notifications Tracker"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-white font-bold leading-none animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-150">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-gray-400 font-medium">
                    All clear! No current status alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n.id)}
                      className={`p-3 text-xs flex items-start gap-2 cursor-pointer transition-colors ${n.read ? 'bg-white hover:bg-slate-50/75' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                    >
                      <div className="flex-1">
                        <p className={`text-gray-950 font-medium ${!n.read && 'font-semibold text-blue-950'}`}>{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">{n.duration}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></div>}
                        <button 
                          onClick={(e) => deleteNotification(n.id, e)} 
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-[11px] font-bold text-gray-600 hover:text-gray-900">
                  View Core Notification Centre
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Support Assistance Modal button */}
        <button 
          onClick={() => setShowHelpModal(true)}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors hidden sm:block"
          title="Direct FAQ Help Desk"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

        {/* Company Branch Switcher */}
        <div ref={tenantBoxRef} className="relative hidden sm:block">
          <div 
            onClick={() => setShowTenantDropdown(!showTenantDropdown)}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-950 font-semibold cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-gray-150/50 transition-colors"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="max-w-[150px] truncate">{loading ? 'Loading…' : selectedCompany ? `${selectedCompany.Company_Name}${selectedBranchId ? ` › #${selectedBranchId}` : ''}` : 'No company'}</span> 
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </div>

          {showTenantDropdown && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-2.5 py-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Company</p>
              </div>
              <div className="py-1 max-h-60 overflow-y-auto">
                {companies.length === 0 ? (
                  <p className="text-[11px] text-gray-500 px-2.5 py-2">No companies found.</p>
                ) : companies.map((c) => (
                  <button
                    key={c.Company_Id}
                    onClick={() => {
                      selectCompany(c.Company_Id);
                      setShowTenantDropdown(false);
                    }}
                    className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-lg block transition-colors ${
                      selectedCompanyId === c.Company_Id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate">{c.Company_Name}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{c.Head_Office_Address || c.Headquarters_Location || ''}</div>
                  </button>
                ))}
              </div>
              {branches.length > 0 && (
                <>
                  <div className="px-2.5 py-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Branches</p>
                  </div>
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {branches.map((b) => (
                      <button
                        key={b.Branch_Id}
                        onClick={() => {
                          selectBranch(b.Branch_Id);
                          setShowTenantDropdown(false);
                        }}
                        className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-lg block transition-colors ${
                          selectedBranchId === b.Branch_Id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="truncate">{b.Branch_Name}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{b.City}, {b.Region}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* User Account Context Profile */}
        <div ref={profileBoxRef} className="relative">
          <div 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-gray-55 transition-colors"
          >
            <img 
              src="https://i.pravatar.cc/150?u=a042581f4e29026024d" 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-gray-200 hover:scale-105 transition-transform" 
            />
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-xs text-gray-900 leading-tight">{user ? `${user.firstName} ${user.lastName}` : 'User'}</div>
              <div className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">{getRoleLabel()}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
          </div>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-gray-100 bg-slate-50/50 rounded-t-xl">
                <p className="font-bold text-xs text-gray-900">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user?.email || ''}</p>
                <p className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1.5 inline-block">Role: {getRoleLabel()}</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/settings"
                  onClick={() => setShowProfileDropdown(false)}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-50"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" /> Portal Configurations
                </Link>
                {user?.role === 'super_admin' ? (
                  <Link 
                    to="/admin/companies"
                    onClick={() => setShowProfileDropdown(false)}
                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 hover:bg-purple-50"
                  >
                    <Shield className="w-3.5 h-3.5" /> Super Admin Portal
                  </Link>
                ) : null}
              </div>
              <div className="pt-1 border-t border-gray-100">
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out Session
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Edit Profile Modal Dialog */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-55">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Administrative Profile Details
              </span>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Company Administrator</label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Abebe Kebede" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Support Email Address</label>
                <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="e.g. abebe@email.com" />
              </div>
              <div className="bg-slate-50 rounded-lg p-2 flex gap-1.5 border border-gray-100">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-800">Permissions Status</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Two-factor authenticated (2FA) active with global read/write access.</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowEditProfile(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 bg-white border border-gray-200 rounded-lg shadow-xs"
              >
                Close Window
              </button>
              <button 
                onClick={() => {
                  setShowEditProfile(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                Save Local Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Faq Centre Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-250">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Nile Insurance Help Desk & Guidance
              </span>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">How do I create a new insurance policy?</p>
                <p className="text-xs text-gray-600 leading-relaxed">Navigate to <span className="font-semibold text-slate-900">Management &gt; Quotes</span>, complete the three-tier quote wizard steps including premium tier selections, and confirm user creation.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">Where can I approve pending claim workflows?</p>
                <p className="text-xs text-gray-600 leading-relaxed">Go to <span className="font-semibold text-slate-900">Claims &gt; Claim Workflow</span>. You can drag and drop active claims columns between Review, Approved, or Settled.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">How do I view payment schedules?</p>
                <p className="text-xs text-gray-600 leading-relaxed">Browse to <span className="font-semibold text-slate-900">Finance &gt; Payment Schedules</span> to see upcoming dues, calendar timelines, and historical logs organized by date.</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">To contact engineering support directly about billing, API services, or workspace configurations, please email support@pentaguard.co.</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
