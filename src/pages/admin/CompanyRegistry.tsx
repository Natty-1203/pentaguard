import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { 
  Building2, Plus, Download, Search, MoreVertical, ShieldCheck, Focus, Users, MapPin, 
  ChevronLeft, ChevronRight, X, Check, Edit2, Trash2, Heart, Scale
} from 'lucide-react';

export default function CompanyRegistryPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const computePricingPlans = (companies: any[], subPlans: any[]) => {
    const subCount: Record<string, number> = {};
    companies.forEach((c: any) => {
      const plan = c.plan || 'Starter';
      subCount[plan] = (subCount[plan] || 0) + 1;
    });
    return subPlans.map((sp: any) => {
      const name = sp.Plan_Name || 'Starter';
      const subs = subCount[name] || 0;
      return {
        id: `plan_${name.toLowerCase()}`,
        name,
        badge: name === 'Enterprise' ? 'Max' : name === 'Professional' ? 'Pro' : 'Basic',
        price: `ETB ${Number(sp.Monthly_Fee || 0).toLocaleString()}`,
        subscribers: subs,
        features: sp.Features
          ? (typeof sp.Features === 'string'
              ? sp.Features.split(',').map((f: string) => f.trim())
              : Object.keys(sp.Features).filter((k: string) => sp.Features[k]).map((k: string) =>
                  k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())))
          : ['Basic Reporting', 'Standard Support'],
        disabledFeatures: name === 'Enterprise' ? [] : name === 'Professional' ? ['White-labeling', 'Custom API'] : ['Advanced analytics', 'API access', 'White-labeling'],
        mostPopular: name === 'Professional'
      };
    });
  };

  const fetchCompanies = async () => {
    try {
      const [comRes, plansRes] = await Promise.all([
        fetch('/api/companies-with-stats'),
        fetch('/api/subscription-plans')
      ]);
      let subPlans: any[] = [];
      if (plansRes.ok) subPlans = await plansRes.json();
      if (comRes.ok) {
        const rawData = await comRes.json();
        const mapped = rawData.map((dbRow: any, idx: number) => ({
          id: `COM-${(dbRow.Company_Id !== undefined && dbRow.Company_Id !== null ? dbRow.Company_Id : idx + 1).toString().padStart(3, '0')}`,
          dbId: dbRow.Company_Id,
          name: dbRow.Company_Name,
          location: dbRow.Head_Office_Address || dbRow.Headquarters_Location || 'Ethiopia',
          plan: dbRow.Subscription_Plan || 'Starter',
          status: (dbRow.Subscription_Status || dbRow.Status || 'active').toLowerCase(),
          users: dbRow.users || 0,
          policies: dbRow.policy_count || 0,
          customers: dbRow.customer_count || 0,
          revenue: (dbRow.revenue || 0).toLocaleString(),
          logo: (dbRow.Company_Name || 'CO').substring(0, 2).toUpperCase()
        }));
        setCompanies(mapped);
        if (subPlans.length > 0) {
          setPricingPlans(computePricingPlans(mapped, subPlans));
        }
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isAddEditPlanOpen, setIsAddEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [newCompany, setNewCompany] = useState({ name: '', location: '', plan: 'Professional', status: 'active', users: '10', policies: '150', revenue: '7,999' });
  const [planForm, setPlanForm] = useState({ name: '', badge: 'Basic', price: 'ETB 5,000', features: '', disabledFeatures: '', subscribers: '0' });
  const [pricingPlans, setPricingPlans] = useState([
  { id: 'plan_starter', name: 'Starter', badge: 'Basic', price: 'ETB 2,999', subscribers: 2, features: ['Up to 10 users', 'Up to 500 policies', 'Basic claims management', 'Email support'], disabledFeatures: ['Advanced analytics', 'API access'] },
  { id: 'plan_professional', name: 'Professional', badge: 'Pro', mostPopular: true, price: 'ETB 7,999', subscribers: 18, features: ['Up to 100 users', 'Unlimited policies', 'Full claims workflow', 'Advanced analytics & reports', 'Priority support'], disabledFeatures: ['White-labeling'] },
  { id: 'plan_enterprise', name: 'Enterprise', badge: 'Max', price: 'ETB 19,999', subscribers: 5, features: ['Unlimited users', 'Unlimited policies', 'Full claims + SLA workflows', 'Custom analytics & BI export', 'White-labeling & custom domain', 'Dedicated account manager'], disabledFeatures: [] }
]);

  const filteredCompanies = companies.filter(c => {
    if (activeFilter !== 'All' && c.status !== activeFilter.toLowerCase()) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.location) return;
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Company_Name: newCompany.name,
          Headquarters_Location: newCompany.location,
          Website: ''
        })
      });
      if (res.ok) {
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
    setIsAddCompanyOpen(false);
    setNewCompany({ name: '', location: '', plan: 'Professional', status: 'active', users: '10', policies: '150', revenue: '7,999' });
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      const res = await fetch(`/api/companies/${parseInt(selectedCompany.id.replace('COM-',''), 10)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Company_Name: selectedCompany.name,
          Headquarters_Location: selectedCompany.location
        })
      });
      if (res.ok) {
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
    setSelectedCompany(null);
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${parseInt(id.replace('COM-',''), 10)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) return;
    
    const feats = planForm.features.split(',').map(f => f.trim()).filter(Boolean);
    const limitFeats = planForm.disabledFeatures.split(',').map(f => f.trim()).filter(Boolean);

    if (selectedPlan) {
      setPricingPlans(pricingPlans.map(p => p.id === selectedPlan.id ? {
        ...p,
        name: planForm.name,
        badge: planForm.badge,
        price: planForm.price,
        features: feats,
        disabledFeatures: limitFeats,
        subscribers: parseInt(planForm.subscribers) || 0
      } : p));
    } else {
      const newId = `plan_${planForm.name.toLowerCase().replace(/\s+/g, '_')}`;
      const created = {
        id: newId,
        name: planForm.name,
        badge: planForm.badge,
        price: planForm.price,
        subscribers: parseInt(planForm.subscribers) || 0,
        features: feats,
        disabledFeatures: limitFeats,
        mostPopular: false
      };
      setPricingPlans([...pricingPlans, created]);
    }
    setIsAddEditPlanOpen(false);
    setSelectedPlan(null);
  };

  const openEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name,
      badge: plan.badge || 'Basic',
      price: plan.price,
      features: plan.features.join(', '),
      disabledFeatures: (plan.disabledFeatures || []).join(', '),
      subscribers: String(plan.subscribers || 0)
    });
    setIsAddEditPlanOpen(true);
  };

  const openAddPlan = () => {
    setSelectedPlan(null);
    setPlanForm({
      name: '',
      badge: 'Basic',
      price: 'ETB 5,000',
      features: 'Up to 20 users, Unlimited policies, Standard analytics',
      disabledFeatures: 'API Access, Custom Branding',
      subscribers: '0'
    });
    setIsAddEditPlanOpen(true);
  };
  const totalCount = companies.length;
  const activeCount = companies.filter(c => c.status === 'active').length;
  const suspendedCount = companies.filter(c => c.status === 'suspended').length;
  const trialCount = companies.filter(c => c.status === 'trial').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all tenant companies on the Penta Guard platform</p>
        </div>
        <Button onClick={() => setIsAddCompanyOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 leading-none">{totalCount}</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Total Companies</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 leading-none">{activeCount}</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Active</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Focus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 leading-none">{suspendedCount}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Suspended</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 leading-none">{trialCount}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Trial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="relative w-full sm:w-72">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search companies..." className="pl-9 bg-gray-50/50 border-gray-250/60" />
             </div>
             <div className="hidden sm:flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg">
                <button onClick={() => { setActiveFilter('All'); setCurrentPage(1); }} className={`px-4 py-1.5 text-xs font-semibold rounded-md ${activeFilter === 'All' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>All</button>
                <button onClick={() => { setActiveFilter('Active'); setCurrentPage(1); }} className={`px-4 py-1.5 text-xs font-semibold rounded-md ${activeFilter === 'Active' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Active</button>
                <button onClick={() => { setActiveFilter('Suspended'); setCurrentPage(1); }} className={`px-4 py-1.5 text-xs font-semibold rounded-md ${activeFilter === 'Suspended' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Suspended</button>
                <button onClick={() => { setActiveFilter('Trial'); setCurrentPage(1); }} className={`px-4 py-1.5 text-xs font-semibold rounded-md ${activeFilter === 'Trial' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Trial</button>
             </div>
           </div>
           <Button onClick={() => { console.info("Exporting Company Registry list directly into CSV..."); }} variant="outline" className="hidden gap-2 text-gray-700 w-full sm:w-auto">
             <Download className="w-4 h-4" />
             Export
           </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-gray-100 bg-gray-50/50">
                <TableHead className="py-4 font-semibold text-gray-500 w-[300px]">COMPANY</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500">PLAN</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500">STATUS</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500">USERS</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500">POLICIES</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500">MONTHLY REVENUE (ETB)</TableHead>
                <TableHead className="py-4 font-semibold text-gray-500 text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.map((company) => (
                <TableRow key={company.id} className="border-b-gray-50">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0 bg-blue-600`}>
                        {company.logo}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{company.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          Ethiopia · {company.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
                       <div className={`w-1.5 h-1.5 rounded-full 
                          ${company.plan === 'Enterprise' ? 'bg-purple-500' : ''}
                          ${company.plan === 'Professional' ? 'bg-blue-500' : ''}
                          ${company.plan === 'Starter' ? 'bg-gray-400' : ''}
                       `}></div>
                       {company.plan}
                     </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge status={company.status as any} pill />
                  </TableCell>
                  <TableCell className="py-4 font-medium text-gray-700">{company.users}</TableCell>
                  <TableCell className="py-4 font-medium text-gray-700">{company.policies.toLocaleString()}</TableCell>
                  <TableCell className="py-4 font-semibold text-gray-900">ETB {company.revenue}</TableCell>
                  <TableCell className="py-4 text-right">
                     <div className="flex items-center justify-end gap-2">
                       {company.status === 'suspended' ? (
                         <Button onClick={async () => {
                           try {
                             await fetch(`/api/companies/${parseInt(company.id.replace('COM-',''), 10)}`, {
                               method: 'PUT',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ status: 'active' })
                             });
                             fetchCompanies();
                           } catch (err) {}
                         }} variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300">
                           Reinstate
                         </Button>
                       ) : (
                         <Button onClick={() => setSelectedCompany(company)} variant="outline" size="sm" className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white">
                           Manage
                         </Button>
                       )}
                       <Button onClick={() => handleDeleteCompany(company.id)} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-650" title="Delete tenant">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-900">
              {filteredCompanies.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredCompanies.length)}
            </span> of <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> companies
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-gray-500 bg-white border-gray-200"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-gray-500 bg-white border-gray-200"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Subscription Pricing Modules</h2>
            <p className="text-sm text-gray-500">Create, customize, and edit the corporate software bundles and tier benefits</p>
          </div>
          <Button onClick={openAddPlan} variant="outline" className="gap-2 text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/50">
            <Plus className="w-4 h-4" />
            Add Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
             <div key={plan.id} className={`rounded-2xl border p-6 shadow-sm flex flex-col relative bg-white transition-all hover:shadow-md
               ${plan.mostPopular ? 'border-2 border-blue-550 bg-blue-50/20' : 'border-gray-250'}
             `}>
               {plan.mostPopular && (
                 <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                   Most Popular
                 </div>
               )}
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                 <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-750 text-xs font-bold uppercase tracking-wider">{plan.badge}</span>
               </div>
               <div className="mb-6">
                 <span className="text-3xl font-black text-gray-950">{plan.price}</span>
                 <span className="text-gray-550 text-xs"> /mo</span>
               </div>
               <div className="space-y-3 mb-8 flex-1">
                 {plan.features.map((feat, idx) => (
                   <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                     <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</div>
                     <span>{feat}</span>
                   </div>
                 ))}
                 {(plan.disabledFeatures || []).map((feat, idx) => (
                   <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-450 italic">
                     <div className="w-4.5 h-4.5 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border">×</div>
                     <span>{feat}</span>
                   </div>
                 ))}
               </div>
               <div className="text-xs font-bold text-gray-500 mb-4 bg-slate-50 p-2 rounded-lg border flex justify-between items-center">
                 <span>Active Tenants:</span>
                 <span className="text-blue-650 font-extrabold text-sm">{plan.subscribers} companies</span>
               </div>
               <Button onClick={() => openEditPlan(plan)} variant="outline" className="w-full bg-slate-50 border-gray-300 font-bold text-xs hover:bg-slate-100">Edit Plan Details</Button>
             </div>
          ))}
        </div>
      </div>

      {/* Add Company Modal */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <Building2 className="w-4 h-4 text-blue-600" /> onboard new company tenant
              </span>
              <button onClick={() => setIsAddCompanyOpen(false)} className="text-gray-450 hover:text-gray-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleAddCompany}>
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Company Name *</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Company name" 
                    value={newCompany.name} 
                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Regional Headquarters location *</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="City" 
                    value={newCompany.location} 
                    onChange={e => setNewCompany({ ...newCompany, location: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Subscription Tier</label>
                    <select 
                      value={newCompany.plan} 
                      onChange={e => setNewCompany({ ...newCompany, plan: e.target.value })}
                      className="w-full bg-gray-50 hover:border-gray-355 focus:border-blue-500 focus:bg-white border text-gray-800 border-gray-200 h-10 px-3 rounded-lg text-xs font-semibold"
                    >
                      <option value="Starter">Starter Plan</option>
                      <option value="Professional">Professional Plan</option>
                      <option value="Enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Account status</label>
                    <select 
                      value={newCompany.status} 
                      onChange={e => setNewCompany({ ...newCompany, status: e.target.value })}
                      className="w-full bg-gray-50 hover:border-gray-355 focus:border-blue-500 focus:bg-white border text-gray-800 border-gray-200 h-10 px-3 rounded-lg text-xs font-semibold"
                    >
                      <option value="active">Active Service</option>
                      <option value="trial">Free Trial</option>
                      <option value="suspended">Suspended Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-gray-400 font-bold text-[8px] uppercase tracking-wider">Users Limit</label>
                    <Input type="number" value={newCompany.users} onChange={e => setNewCompany({ ...newCompany, users: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-gray-400 font-bold text-[8px] uppercase tracking-wider">Policies Limit</label>
                    <Input type="number" value={newCompany.policies} onChange={e => setNewCompany({ ...newCompany, policies: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-gray-400 font-bold text-[8px] uppercase tracking-wider">Revenue (ETB)</label>
                    <Input type="number" value={newCompany.revenue} onChange={e => setNewCompany({ ...newCompany, revenue: e.target.value })} className="h-9 text-xs" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs">
                  <Button type="button" size="sm" variant="outline" className="text-gray-750 h-10" onClick={() => setIsAddCompanyOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 flex items-center gap-1.5 shadow">
                    <Check className="w-4 h-4" /> Save Partner
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Company Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" /> Manage Tenant: {selectedCompany.name}
              </span>
              <button onClick={() => setSelectedCompany(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCompany} className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">System Code</span>
                  <span className="block font-mono font-bold text-gray-900 mt-0.5">{selectedCompany.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Monthly SaaS Bill</span>
                  <span className="block text-blue-650 font-black mt-0.5 text-sm">ETB {selectedCompany.revenue}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Registered Legal Name</label>
                <Input 
                  type="text" 
                  value={selectedCompany.name} 
                  required
                  onChange={e => setSelectedCompany({ ...selectedCompany, name: e.target.value })} 
                  className="h-10 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Subscription Plan</label>
                  <select 
                    value={selectedCompany.plan} 
                    onChange={e => setSelectedCompany({ ...selectedCompany, plan: e.target.value, revenue: e.target.value === 'Starter' ? '2,999' : e.target.value === 'Professional' ? '7,999' : '19,999' })}
                    className="w-full bg-gray-50 hover:border-gray-355 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-850"
                  >
                    <option value="Starter">Starter Plan (Basic)</option>
                    <option value="Professional">Professional Plan (Pro)</option>
                    <option value="Enterprise">Enterprise Plan (Max)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">SaaS Status</label>
                  <select 
                    value={selectedCompany.status} 
                    onChange={e => setSelectedCompany({ ...selectedCompany, status: e.target.value })}
                    className="w-full bg-gray-50 hover:border-gray-355 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-850"
                  >
                    <option value="active">Active System</option>
                    <option value="trial">Free Trial Runway</option>
                    <option value="suspended">Suspended (Locked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <label className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Users</label>
                  <Input type="number" value={selectedCompany.users} onChange={e => setSelectedCompany({ ...selectedCompany, users: parseInt(e.target.value) || 0 })} className="h-9 text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Policies</label>
                  <Input type="number" value={selectedCompany.policies} onChange={e => setSelectedCompany({ ...selectedCompany, policies: parseInt(e.target.value) || 0 })} className="h-9 text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Location</label>
                  <Input type="text" value={selectedCompany.location} onChange={e => setSelectedCompany({ ...selectedCompany, location: e.target.value })} className="h-9 text-xs font-semibold" />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={async () => {
                    if (confirm("Are you absolutely sure you want to terminate this corporate tenant? All client data will be permanently purged.")) {
                      try {
                        await fetch(`/api/companies/${parseInt(selectedCompany.id.replace('COM-',''), 10)}`, { method: 'DELETE' });
                        fetchCompanies();
                      } catch (err) {}
                      setSelectedCompany(null);
                    }
                  }}
                  className="text-red-650 hover:bg-red-50 hover:text-red-700 font-semibold text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Terminate Tenant
                </Button>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setSelectedCompany(null)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex items-center gap-1 px-4.5">
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Subscription Plan Modal */}
      {isAddEditPlanOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 focus-within:text-blue-600">
                <Scale className="w-4 h-4 text-blue-600" /> {selectedPlan ? 'Edit Pricing Plan Configuration' : 'Create New Pricing Plan'}
              </span>
              <button onClick={() => setIsAddEditPlanOpen(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleAddEditPlan} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Plan Title Designation *</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Plan name" 
                    value={planForm.name} 
                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Badge Identifier *</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Plan tier" 
                    value={planForm.badge} 
                    onChange={e => setPlanForm({ ...planForm, badge: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Pricing Rate (ETB) *</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Price" 
                    value={planForm.price} 
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Subscribers Offset</label>
                  <Input 
                    type="number" 
                    placeholder="Numeric value" 
                    value={planForm.subscribers} 
                    onChange={e => setPlanForm({ ...planForm, subscribers: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Enabled System Benefits (Comma separated)</label>
                <textarea 
                  required
                  placeholder="Feature description" 
                  value={planForm.features}
                  rows={2} 
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })} 
                  className="w-full bg-gray-50 focus:bg-white border text-gray-800 p-2.5 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Restricted Limitations (Comma separated)</label>
                <textarea 
                  placeholder="Limitation description" 
                  value={planForm.disabledFeatures}
                  rows={2} 
                  onChange={e => setPlanForm({ ...planForm, disabledFeatures: e.target.value })} 
                  className="w-full bg-gray-50 focus:bg-white border text-gray-800 p-2.5 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setIsAddEditPlanOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 px-4.5 shadow">
                  <Check className="w-3.5 h-3.5" /> Save Plan Tier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
