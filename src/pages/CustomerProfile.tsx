import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Mail, Phone, MapPin, Building, Edit2, ShieldCheck, AlertCircle, FileText, Download, X, CreditCard, Clock, Eye, MessageSquare, Calendar } from 'lucide-react';

export default function CustomerProfilePage() {
  const { id } = useParams();
  const customerId = id || '';
  const rawId = id ? parseInt(id, 10) : NaN;
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    branch: '',
    status: 'active'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });
  const [registrationDate, setRegistrationDate] = useState<string>('');
  const [customerPolicies, setCustomerPolicies] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [totalPremiumPaid, setTotalPremiumPaid] = useState<number>(0);
  const [customerClaims, setCustomerClaims] = useState<any[]>([]);
  const [customerDocs, setCustomerDocs] = useState<any[]>([]);
  const [communicationLog, setCommunicationLog] = useState<any[]>([]);

  const fetchCustomerInfo = async () => {
    if (!rawId || Number.isNaN(rawId)) { setLoading(false); return; }
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        const current = data.find((c: any) => c.Customer_Id === rawId);
        if (current) {
          const upd = {
            name: `${current.First_Name} ${current.Last_Name}`,
            email: current.Email || '',
            phone: current.Phone || '',
            address: current.Address || '',
            city: current.City || '',
            branch: current.Branch_Name || '',
            status: current.Status === 'Inactive' ? 'inactive' : current.Status === 'Pending' ? 'pending' : 'active'
          };
          setProfile(upd);
          setEditForm(upd);
          if (current.Registration_Date) {
            setRegistrationDate(new Date(current.Registration_Date).toLocaleString('en-US', { month: 'long', year: 'numeric' }));
          }

          // Fetch customer policies
          let myPolicies: any[] = [];
          const polRes = await fetch('/api/policies');
          if (polRes.ok) {
            const policies = await polRes.json();
            myPolicies = policies.filter((p: any) => p.Customer_Id === rawId);
            setCustomerPolicies(myPolicies);
          }

          // Fetch payments to compute total premium paid
          const payRes = await fetch('/api/payments');
          if (payRes.ok) {
            const payments = await payRes.json();
            const myPolicyIds = myPolicies.map((p: any) => p.Policy_Id);
            const myPayments = payments.filter((p: any) => myPolicyIds.includes(p.Policy_Id));
            const totalPaid = myPayments
              .filter((p: any) => p.Status === 'Completed' || p.Status === 'Paid')
              .reduce((sum: number, p: any) => sum + Number(p.Amount || 0), 0);
            setTotalPremiumPaid(totalPaid);
          }

          // Fetch recent activity (claims)
          const actRes = await fetch('/api/claims');
          if (actRes.ok) {
            const claims = await actRes.json();
            const myPolicyIds = myPolicies.map((p: any) => p.Policy_Id);
            const myClaims = claims.filter((c: any) => myPolicyIds.includes(c.Policy_Id));
            setCustomerClaims(myClaims);
            const claimActivity = myClaims.slice(0, 3).map((c: any) => ({
              icon: 'claim',
              title: 'Claim Filed',
              time: c.Incident_Date ? `${Math.floor((Date.now() - new Date(c.Incident_Date).getTime()) / (1000 * 60 * 60 * 24))} days ago` : 'Recently',
              description: `${c.Claim_Id ? `CLM-${String(c.Claim_Id).padStart(4, '0')}` : 'Claim'} submitted.`,
            }));
            setRecentActivity(claimActivity);
          }

          // Fetch documents
          const docRes = await fetch('/api/documents');
          if (docRes.ok) {
            const docs = await docRes.json();
            const myPolicyIds = myPolicies.map((p: any) => p.Policy_Id);
            setCustomerDocs(docs.filter((d: any) => myPolicyIds.includes(d.Policy_Id)));
          }

          // Fetch communication log (notifications)
          const notifRes = await fetch('/api/notifications');
          if (notifRes.ok) {
            const notifs = await notifRes.json();
            setCommunicationLog(notifs.filter((n: any) => n.Customer_Id === rawId));
          }
        }
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomerInfo();
  }, [rawId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = editForm.name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ') || '';

    try {
      const res = await fetch(`/api/customers/${rawId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: first,
          Last_Name: last,
          Email: editForm.email,
          Phone: editForm.phone,
          Address: editForm.address,
          City: editForm.city,
          Status: editForm.status === 'active' ? 'Active' : editForm.status === 'pending' ? 'Pending' : 'Inactive'
        })
      });
      if (res.ok) {
        setProfile({ ...editForm });
      }
    } catch (err) { console.error(err); }
    setIsEditing(false);
  };


  const tabs = ['Overview', 'Policies', 'Claims', 'Documents', 'Communication Log'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={`https://i.pravatar.cc/150?u=${customerId}`} alt="Customer" className="w-16 h-16 rounded-full border border-gray-200" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{loading ? 'Loading…' : profile.name || 'Unknown customer'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customer since {registrationDate || '—'} <span className="mx-2">•</span> <span className="font-semibold">{customerId ? `CUS-${String(rawId).padStart(4, '0')}` : 'No ID'}</span></p>
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
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Stats */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-50">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">CONTACT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.email}</p>
                  <p className="text-xs text-gray-500">Primary Email</p>
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
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.address}</p>
                  <p className="text-xs text-gray-500">{profile.city}{profile.city ? ', Ethiopia' : ''}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.branch}</p>
                  <p className="text-xs text-gray-500">Assigned Branch</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-blue-50/50 border-blue-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Total Premium Paid</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">ETB {totalPremiumPaid.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
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
                    <h3 className="text-base font-bold text-gray-900 mb-4">Active Policies ({customerPolicies.filter((p: any) => p.Status === 'Active').length})</h3>
                    <div className="space-y-3">
                      {customerPolicies.filter((p: any) => p.Status === 'Active').length === 0 ? (
                        <p className="text-sm text-gray-500">No active policies found.</p>
                      ) : (
                        customerPolicies.filter((p: any) => p.Status === 'Active').map((policy: any) => (
                          <div key={policy.Policy_Id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                 <ShieldCheck className="w-5 h-5" />
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-gray-900">{policy.Type_Name || 'Insurance'}</p>
                                 <p className="text-xs text-gray-500 font-medium">{policy.Policy_No || `POL-${String(policy.Policy_Id).padStart(4, '0')}`}{policy.End_Date ? ` • Expires ${new Date(policy.End_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
                               </div>
                            </div>
                            <StatusBadge status="active" label="Active" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                      {recentActivity.length === 0 ? (
                        <p className="text-sm text-gray-500 ml-4">No recent activity found.</p>
                      ) : (
                        recentActivity.map((act: any, i: number) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-lg border border-gray-100 shadow-sm ml-4 md:ml-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-900">{act.title}</p>
                                <span className="text-[10px] font-medium text-gray-500">{act.time}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{act.description}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}
              
              {activeTab === 'Policies' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">All Policies ({customerPolicies.length})</h3>
                  {customerPolicies.length === 0 ? (
                    <p className="text-sm text-gray-500">No policies found for this customer.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow className="hover:bg-transparent border-b-gray-100">
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">POLICY NO</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">TYPE</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">PREMIUM</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">START DATE</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">END DATE</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">STATUS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerPolicies.map((p: any) => (
                            <TableRow key={p.Policy_Id} className="border-b-gray-50">
                              <TableCell className="py-3 font-medium text-blue-600">
                                <Link to={`/policies/${p.Policy_No || p.Policy_Id}`} className="hover:underline">{p.Policy_No || `POL-${String(p.Policy_Id).padStart(4, '0')}`}</Link>
                              </TableCell>
                              <TableCell className="py-3 text-sm text-gray-900">{p.Type_Name || 'Insurance'}</TableCell>
                              <TableCell className="py-3 text-sm font-semibold text-gray-900">ETB {Number(p.Total_Premium || 0).toLocaleString()}</TableCell>
                              <TableCell className="py-3 text-sm text-gray-500">{p.Start_Date ? new Date(p.Start_Date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell className="py-3 text-sm text-gray-500">{p.End_Date ? new Date(p.End_Date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell className="py-3"><StatusBadge status={(p.Status || 'active').toLowerCase() as any} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Claims' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Claims History ({customerClaims.length})</h3>
                  {customerClaims.length === 0 ? (
                    <p className="text-sm text-gray-500">No claims found for this customer.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow className="hover:bg-transparent border-b-gray-100">
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">CLAIM ID</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">POLICY</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">INCIDENT DATE</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">DESCRIPTION</TableHead>
                            <TableHead className="py-3 font-semibold text-gray-500 text-xs">STATUS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerClaims.map((c: any) => (
                            <TableRow key={c.Claim_Id} className="border-b-gray-50">
                              <TableCell className="py-3 font-medium text-blue-600">
                                <Link to={`/claims/${c.Claim_Id}`} className="hover:underline">CLM-{String(c.Claim_Id).padStart(4, '0')}</Link>
                              </TableCell>
                              <TableCell className="py-3 text-sm text-gray-500">{c.Policy_No || `POL-${String(c.Policy_Id).padStart(4, '0')}`}</TableCell>
                              <TableCell className="py-3 text-sm text-gray-500">{c.Incident_Date ? new Date(c.Incident_Date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell className="py-3 text-sm text-gray-900 max-w-[200px] truncate">{c.Description || '-'}</TableCell>
                              <TableCell className="py-3"><StatusBadge status={(c.Status || 'filed').toLowerCase() as any} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Documents' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Documents ({customerDocs.length})</h3>
                  {customerDocs.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents found for this customer.</p>
                  ) : (
                    <div className="space-y-3">
                      {customerDocs.map((d: any) => (
                        <div key={d.Document_Id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{d.File_Name || 'Untitled'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{d.Document_Type || 'General'} • {d.Uploaded_Date ? new Date(d.Uploaded_Date).toLocaleDateString() : '-'}</p>
                              {d.Description && <p className="text-xs text-gray-400 mt-0.5">{d.Description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{d.Status || 'Active'}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" title="View Document">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Communication Log' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Communication History ({communicationLog.length})</h3>
                  {communicationLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No communications found for this customer.</p>
                  ) : (
                    <div className="space-y-3">
                      {communicationLog.map((n: any) => (
                        <div key={n.Notification_Id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-gray-900">{n.Message_Type || 'Message'}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-[10px]">{n.Channel || 'SMS'}</Badge>
                                <span className="text-[10px] font-medium text-gray-400">{n.Sent_At ? new Date(n.Sent_At).toLocaleDateString() : '-'}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{n.Message_Body || ''}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${n.Status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                                {n.Status || 'Sent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Edit Customer Profile</h2>
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
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
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
                  <label className="text-xs font-bold text-gray-700 block mb-1">Branch</label>
                  <Input 
                    required 
                    value={editForm.branch} 
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Address/Woreda</label>
                  <Input 
                    required 
                    value={editForm.address} 
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City</label>
                  <Input 
                    required 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer Status</label>
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
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Save Profile</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
