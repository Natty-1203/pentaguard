import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { Badge } from '@/src/components/ui/badge';
import { Mail, Phone, MapPin, Building, Edit2, ShieldCheck, Download, Award, TrendingUp, DollarSign, Calendar, Target, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';

export default function AgentProfilePage() {
  const { selectedCompanyId } = useTenant();
  const { id } = useParams();
  const rawId = id ? parseInt(id, 10) : NaN;
  const [activeTab, setActiveTab] = useState('Overview');
  const [policiesData, setPoliciesData] = useState<any[]>([]);
  const [commissionsData, setCommissionsData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [agentPerf, setAgentPerf] = useState<any>(null);

  const [profile, setProfile] = useState({
    name: '',
    licence: '',
    tier: '',
    email: '',
    phone: '',
    branch: '',
    hiredDate: '',
    status: 'active'
  });

  const fetchAgentDetails = async () => {
    if (!rawId || Number.isNaN(rawId)) return;
    try {
      const [agRes, polRes, comRes, brRes, perfRes] = await Promise.all([
        fetch(`/api/agents?companyId=${selectedCompanyId ?? 1}`),
        fetch(`/api/policies?companyId=${selectedCompanyId ?? 1}`),
        fetch(`/api/commissions?companyId=${selectedCompanyId ?? 1}`),
        fetch(`/api/branches?companyId=${selectedCompanyId ?? 1}`),
        fetch(`/api/agent-performance?companyId=${selectedCompanyId ?? 1}`)
      ]);
      const agData = agRes.ok ? await agRes.json() : [];
      const polData = polRes.ok ? await polRes.json() : [];
      const comData = comRes.ok ? await comRes.json() : [];
      const brData = brRes.ok ? await brRes.json() : [];
      const perfData = perfRes.ok ? await perfRes.json() : [];
      setBranches(brData);
      setAgentPerf(perfData.find((p: any) => p.id === rawId) || null);

      const branchName = (bid: number) => brData.find((b: any) => b.Branch_Id === bid)?.Branch_Name || '';

      const currentAgent = agData.find((a: any) => a.Agent_Id === rawId);
      if (currentAgent) {
        const branch = branchName(currentAgent.Branch_Id);
        setProfile({
          name: `${currentAgent.First_Name} ${currentAgent.Last_Name}`,
          licence: currentAgent.License_No || '',
          tier: currentAgent.Commission_Rate >= 15 ? 'Platinum Tier' : currentAgent.Commission_Rate >= 12 ? 'Gold Tier' : currentAgent.Commission_Rate >= 10 ? 'Silver Tier' : 'Bronze Tier',
          email: currentAgent.Email || '',
          phone: currentAgent.Phone || '',
          branch,
          hiredDate: currentAgent.Hired_Date || '',
          status: currentAgent.Status?.toLowerCase() || 'active'
        });
        setEditForm({
          name: `${currentAgent.First_Name} ${currentAgent.Last_Name}`,
          licence: currentAgent.License_No || '',
          tier: currentAgent.Commission_Rate >= 15 ? 'Platinum Tier' : currentAgent.Commission_Rate >= 12 ? 'Gold Tier' : currentAgent.Commission_Rate >= 10 ? 'Silver Tier' : 'Bronze Tier',
          email: currentAgent.Email || '',
          phone: currentAgent.Phone || '',
          branch,
          hiredDate: currentAgent.Hired_Date || '',
          status: currentAgent.Status?.toLowerCase() || 'active'
        });
      }

      setPoliciesData(polData.slice(0, 5).map((p: any, idx: number) => ({
        id: `POL-${(p.Policy_Id !== undefined && p.Policy_Id !== null ? p.Policy_Id : idx + 1).toString().padStart(4, '0')}`,
        customer: `Customer #${p.Customer_Id || idx + 1}`,
        type: 'Insurance Plan',
        premium: `ETB ${Number(p.Total_Premium || p.Premium_Amount || 0).toLocaleString()}`,
        status: p.Status,
        date: p.Start_Date || '-'
      })));

      setCommissionsData(comData.map((c: any, idx: number) => ({
        id: `COM-${(c.Commission_Id !== undefined && c.Commission_Id !== null ? c.Commission_Id : idx + 1).toString().padStart(3, '0')}`,
        policyId: `POL-${(c.Policy_Id !== undefined && c.Policy_Id !== null ? c.Policy_Id : 0).toString().padStart(4, '0')}`,
        amount: `ETB ${Number(c.Amount || 0).toLocaleString()}`,
        date: c.Payment_Date || '-',
        status: c.Status
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgentDetails();
  }, [rawId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = editForm.name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ') || '';

    try {
      const res = await fetch(`/api/agents/${rawId}?companyId=${selectedCompanyId ?? 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: first,
          Last_Name: last,
          Email: editForm.email,
          License_No: editForm.licence,
          Status: editForm.status === 'active' ? 'Active' : 'Inactive'
        })
      });
      if (res.ok) {
        setProfile({ ...editForm });
        await fetchAgentDetails();
      }
    } catch (err) {
      console.error(err);
    }
    setIsEditing(false);
  };


  const tabs = ['Overview', 'Policies Sold', 'Commissions', 'Documents'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Agent')}&background=random`} alt="Agent" className="w-16 h-16 rounded-full border border-gray-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border bg-slate-800 text-slate-100 border-slate-700`}>
                {profile.tier}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">License: <span className="font-semibold text-gray-700">{profile.licence}</span> <span className="mx-2">•</span> ID: <span className="font-semibold text-gray-700">AGT-{String(rawId).padStart(3, '0')}</span></p>
          </div>
          <StatusBadge status={profile.status as any} className="ml-2" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-10 text-gray-700 bg-white border-gray-200 shadow-sm">
            <Download className="w-4 h-4" />
            Download Summary
          </Button>
          <Button onClick={() => { setEditForm({ ...profile }); setIsEditing(true); }} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
            <Edit2 className="w-4 h-4" />
            Edit Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Policies (YTD)</p>
              <h3 className="text-xl font-bold text-gray-900">{agentPerf?.policies ?? 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Premium (YTD)</p>
              <h3 className="text-xl font-bold text-gray-900">{agentPerf?.premium ?? 'ETB 0'}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Commission Rate</p>
              <h3 className="text-xl font-bold text-gray-900">{agentPerf?.commissionRate ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Target Achieved</p>
              <h3 className="text-xl font-bold text-gray-900">{agentPerf?.performance ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-50">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">AGENT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.email}</p>
                  <p className="text-xs text-gray-500">Corporate Email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.phone}</p>
                  <p className="text-xs text-gray-500">Mobile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.branch}</p>
                  <p className="text-xs text-gray-500">Assigned Branch</p>
                </div>
              </div>
              <div className="my-4 border-t border-gray-100"></div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.hiredDate}</p>
                  <p className="text-xs text-gray-500">Hired Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <div className="border-b border-gray-100 px-2 flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <CardContent className="p-0">
              {activeTab === 'Overview' && (
                <div className="p-6 space-y-6">
                  
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-4">Recent Policies Sold</h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow className="hover:bg-transparent border-b-gray-100">
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">POLICY NO</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">CUSTOMER</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">PREMIUM</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">DATE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {policiesData.map(row => (
                            <TableRow key={row.id} className="border-b-gray-50">
                              <TableCell className="py-3 font-medium text-blue-600"><Link to={`/policies/${row.id}`} className="hover:underline">{row.id}</Link></TableCell>
                              <TableCell className="py-3 text-sm text-gray-900">{row.customer}</TableCell>
                              <TableCell className="py-3 text-sm font-semibold text-gray-900">{row.premium}</TableCell>
                              <TableCell className="py-3 text-sm text-gray-500">{row.date}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900">Recent Commissions</h3>
                        <Button variant="link" className="text-blue-600 h-auto p-0">View All</Button>
                    </div>
                    <div className="space-y-3">
                         {commissionsData.map(comm => (
                             <div key={comm.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${comm.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                         <DollarSign className="w-5 h-5" />
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-gray-900">{comm.amount}</p>
                                         <p className="text-xs font-medium text-gray-500 mt-0.5">Policy: {comm.policyId} • {comm.id}</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     {comm.status === 'Paid' ? (
                                         <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Paid</Badge>
                                     ) : (
                                        <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>
                                     )}
                                     <p className="text-xs text-gray-400 mt-1">{comm.date}</p>
                                 </div>
                             </div>
                         ))}
                    </div>
                  </div>

                </div>
              )}
              
              {activeTab !== 'Overview' && (
                <div className="p-10 text-center text-gray-500 text-sm">
                  {activeTab} content will go here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Edit Agent Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Edit Agent Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                <Input 
                  required 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">License Number</label>
                  <Input 
                    required 
                    value={editForm.licence} 
                    onChange={(e) => setEditForm({ ...editForm, licence: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Agent Rank/Tier</label>
                  <select 
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none hover:border-gray-300"
                  >
                    <option value="Bronze Tier">Bronze Tier</option>
                    <option value="Silver Tier">Silver Tier</option>
                    <option value="Gold Tier">Gold Tier</option>
                    <option value="Platinum Tier">Platinum Tier</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Corporate Email Address</label>
                <Input 
                  required 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mobile number</label>
                  <Input 
                    required 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Branch</label>
                  <Input 
                    required 
                    value={editForm.branch} 
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Hired Date</label>
                  <Input 
                    required 
                    value={editForm.hiredDate} 
                    onChange={(e) => setEditForm({ ...editForm, hiredDate: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Agent Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none hover:border-gray-300"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
