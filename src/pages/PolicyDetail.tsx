import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { 
  Download, XCircle, RefreshCw, ChevronRight, UploadCloud, FileText, 
  Image as ImageIcon, Plus, Check, Clock, AlertCircle, FilePlus, Eye, 
  Trash2, Calendar, File, X, Car, Home, Heart, Activity, ShieldCheck, Sparkles, Receipt
} from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/status-badge';

export default function PolicyDetailPage() {
  const { id } = useParams();
  const policyId = id || "POL-0001";
  const [activeTab, setActiveTab] = useState('Payment Schedule');

  // Interactive lists states
  const [policy, setPolicy] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [paymentScheduleState, setPaymentScheduleState] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({ nextDue: '—', dueAmount: 'ETB 0', paidToDate: 'ETB 0', outstanding: 'ETB 0', method: '—', progress: 0 });

  // Modals state
  const [isClaimsModalOpen, setIsClaimsModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  // Form states
  const [newClaim, setNewClaim] = useState({ incidentDate: '', amount: '', description: '' });
  const [newDoc, setNewDoc] = useState({ name: '', category: 'Policy' });

  const tabs = ['Asset Details', 'Payment Schedule', 'Documents', 'Claims'];

  const fetchPolicyData = async () => {
    try {
      setLoading(true);
      const parsedId = Number(policyId.replace('POL-', ''));
      
      const polRes = await fetch('/api/policies');
      if (polRes.ok) {
        const policies = await polRes.json();
        const foundPol = policies.find((p: any) => p.Policy_Id === parsedId || `POL-${p.Policy_Id.toString().padStart(4, '0')}` === policyId);
        if (foundPol) {
          setPolicy(foundPol);
          
          // Load customer
          const custRes = await fetch('/api/customers');
          if (custRes.ok) {
            const cus = await custRes.json();
            const foundCust = cus.find((c: any) => c.Customer_Id === foundPol.Customer_Id);
            if (foundCust) setCustomer(foundCust);
          }
          
          // Load agent
          const agentRes = await fetch('/api/agents');
          if (agentRes.ok) {
            const ags = await agentRes.json();
            const foundAg = ags.find((a: any) => a.Agent_Id === foundPol.Agent_Id);
            if (foundAg) setAgent(foundAg);
          }

          // Load branch
          if (foundPol.Branch_Id) {
            const branchRes = await fetch('/api/branches');
            if (branchRes.ok) {
              const bchs = await branchRes.json();
              const foundBch = bchs.find((b: any) => b.Branch_Id === foundPol.Branch_Id);
              if (foundBch) setBranch(foundBch);
            }
          }
          
          // Load payment schedule for this policy
          const schedRes = await fetch('/api/payment-schedules');
          let paidToDate = 0;
          let nextDueDate = '—';
          let nextDueAmt = 0;
          if (schedRes.ok) {
            const scheds = await schedRes.json();
            const matchScheds = scheds.filter((s: any) => s.Policy_Id === foundPol.Policy_Id);
            if (matchScheds.length > 0) {
              const mappedScheds = matchScheds.map((dbRow: any, sIdx: number) => ({
                n: (sIdx + 1).toString().padStart(2, '0'),
                due: dbRow.Due_Date || '-',
                amt: `ETB ${Number(dbRow.Amount_Due || 0).toLocaleString()}`,
                rawAmt: Number(dbRow.Amount_Due || 0),
                status: dbRow.Status || 'Upcoming',
                statusVariant: dbRow.Status === 'Paid' ? 'success' : dbRow.Status === 'Overdue' ? 'rejected' : 'filed',
                paid: dbRow.Paid_Date || '—',
                rec: dbRow.Status === 'Paid'
              }));
              setPaymentScheduleState(mappedScheds);
              paidToDate = mappedScheds.filter((s: any) => s.rec).reduce((sum: number, s: any) => sum + s.rawAmt, 0);
              const next = mappedScheds.find((s: any) => !s.rec);
              if (next) {
                nextDueDate = next.due;
                nextDueAmt = next.rawAmt;
              }
            }
          }

          // Load payments for method
          let paymentMethod = '—';
          const payRes = await fetch('/api/payments');
          if (payRes.ok) {
            const pays = await payRes.json();
            const matchPays = pays.filter((p: any) => p.Policy_Id === foundPol.Policy_Id);
            if (matchPays.length > 0) {
              paymentMethod = matchPays[0].Payment_Method || '—';
            }
          }

          const totalPrem = Number(foundPol.Total_Premium || 0);
          const outstanding = Math.max(0, totalPrem - paidToDate);
          const progress = totalPrem > 0 ? Math.round((paidToDate / totalPrem) * 1000) / 10 : 0;
          setPaymentSummary({
            nextDue: nextDueDate,
            dueAmount: `ETB ${nextDueAmt.toLocaleString()}`,
            paidToDate: `ETB ${paidToDate.toLocaleString()}`,
            outstanding: `ETB ${outstanding.toLocaleString()}`,
            method: paymentMethod,
            progress
          });

          // Load documents
          const docRes = await fetch('/api/documents');
          if (docRes.ok) {
            const docList = await docRes.json();
            const matchDocs = docList.filter((d: any) => d.Policy_Id === foundPol.Policy_Id);
            if (matchDocs.length > 0) {
              const mappedDocs = matchDocs.map((dbRow: any, dIdx: number) => ({
                id: `DOC-${(dbRow.Document_Id || dIdx + 1).toString().padStart(3, '0')}`,
                name: dbRow.File_Name,
                type: dbRow.Document_Type === 'ClaimEvidence' ? 'PDF' : 'Image',
                size: '1.5 MB',
                date: dbRow.Uploaded_Date || '-',
                uploadedBy: dbRow.Uploaded_By ? `User #${dbRow.Uploaded_By}` : 'System',
                category: dbRow.Document_Type
              }));
              setDocs(mappedDocs);
            }
          }

          // Load claims
          const claimRes = await fetch('/api/claims');
          if (claimRes.ok) {
            const claimsList = await claimRes.json();
            const matchClaims = claimsList.filter((c: any) => c.Policy_Id === foundPol.Policy_Id);
            if (matchClaims.length > 0) {
              const mappedClaims = matchClaims.map((dbRow: any, cIdx: number) => ({
                id: `CLM-${(dbRow.Claim_Id || cIdx + 1).toString().padStart(4, '0')}`,
                incidentDate: dbRow.Incident_Date || '-',
                status: (dbRow.Status || '').replace('_', ' '),
                statusVariant: dbRow.Status === 'Paid' ? 'success' : dbRow.Status === 'Under_Review' ? 'active' : dbRow.Status === 'Closed' ? 'offline' : 'pending',
                amount: 'ETB 45,000',
                description: dbRow.Description || 'N/A'
              }));
              setClaims(mappedClaims);
            } else {
              setClaims([]);
            }
          }

          // Load assets
          const autoRes = await fetch('/api/auto-assets');
          const homeRes = await fetch('/api/home-assets');
          let foundAssets: any[] = [];
          if (autoRes.ok) {
            const autos = await autoRes.json();
            const filteredAutos = autos.filter((a: any) => a.Policy_Id === foundPol.Policy_Id);
            filteredAutos.forEach((a: any, aIdx: number) => {
              foundAssets.push({
                id: `AST-AUTO-${(a.Asset_Id || aIdx + 1).toString().padStart(3, '0')}`,
                type: 'Auto',
                description: `${a.Make || ''} ${a.Model || ''} ${a.Year || ''} (VIN: ${a.VIN || ''})`,
                value: `ETB ${Number(a.Estimated_Value || 1500000).toLocaleString()}`,
                owner: `${customer?.First_Name || ''} ${customer?.Last_Name || ''}`,
                status: 'Covered',
                color: 'Midnight Silver',
                mileage: '28,450 km'
              });
            });
          }
          if (homeRes.ok) {
            const homes = await homeRes.json();
            const filteredHomes = homes.filter((h: any) => h.Policy_Id === foundPol.Policy_Id);
            filteredHomes.forEach((h: any, hIdx: number) => {
              foundAssets.push({
                id: `AST-HOME-${(h.Asset_Id || hIdx + 1).toString().padStart(3, '0')}`,
                type: 'Property',
                description: `${h.Property_Type || 'Home'} Built in ${h.Year_Built || ''} - ${h.Address || ''}`,
                value: `ETB ${Number(h.Estimated_Value || 3500000).toLocaleString()}`,
                owner: `${customer?.First_Name || ''} ${customer?.Last_Name || ''}`,
                status: 'Covered',
                color: 'N/A',
                mileage: 'N/A'
              });
            });
          }
          if (foundAssets.length > 0) {
            setAssets(foundAssets);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPolicyData();
  }, [policyId]);

  const handleCancelPolicy = async () => {
    if (!policy) return;
    try {
      const res = await fetch(`/api/policies/${policy.Policy_Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: 'Cancelled' })
      });
      if (res.ok) {
        await fetchPolicyData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenewPolicy = async () => {
    if (!policy) return;
    try {
      const res = await fetch(`/api/policies/${policy.Policy_Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: 'Active' })
      });
      if (res.ok) {
        await fetchPolicyData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers
  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaim.incidentDate || !newClaim.amount || !policy) return;
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Policy_Id: policy.Policy_Id,
          Incident_Date: newClaim.incidentDate,
          Description: newClaim.description || 'Filing new claim from policy screen',
          Status: 'Filed'
        })
      });
      if (res.ok) {
        await fetchPolicyData();
        setIsClaimsModalOpen(false);
        setNewClaim({ incidentDate: '', amount: '', description: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !policy) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          File_Name: newDoc.name,
          Document_Type: newDoc.category,
          Uploaded_Date: new Date().toISOString().split('T')[0],
          Policy_Id: policy.Policy_Id,
          Uploaded_By: 1
        })
      });
      if (res.ok) {
        await fetchPolicyData();
        setIsUploadDocModalOpen(false);
        setNewDoc({ name: '', category: 'Policy' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDocIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />;
      case 'Image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'Spreadsheet': return <File className="w-5 h-5 text-emerald-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-gray-500">
        Loading policy details from database...
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-8 text-center text-sm font-medium text-red-500">
        Policy details not found in database.
      </div>
    );
  }

  const policyStatusDisplay = (policy.Status || 'Active').toLowerCase();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Policy {policyId}</h1>
          <StatusBadge status={policyStatusDisplay === 'active' ? 'active' : 'offline'} label={policy.Status || 'Active'} pill />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-10 text-gray-700 bg-white border-gray-200">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button onClick={handleCancelPolicy} variant="outline" className="gap-2 h-10 text-gray-700 bg-white border-gray-200">
            <XCircle className="w-4 h-4 text-red-500" />
            Cancel Policy
          </Button>
          <Button onClick={handleRenewPolicy} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
            <RefreshCw className="w-4 h-4" />
            Renew Policy
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Policy Information */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 border-b border-gray-50">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">POLICY INFORMATION</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Customer</span>
              <div className="flex items-center gap-2">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Customer')}&background=random`} alt="Customer" className="w-5 h-5 rounded-full" />
                <span className="font-bold text-gray-900">{customer ? `${customer.First_Name} ${customer.Last_Name}` : `Customer #${policy.Customer_Id}`}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Agent</span>
              <span className="font-semibold text-gray-900">{agent ? `${agent.First_Name} ${agent.Last_Name}` : "General Representative"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Branch</span>
              <span className="font-medium text-gray-900">{branch ? branch.Branch_Name : "Corporate Main Branch"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Type</span>
              <span className="font-medium text-gray-900 uppercase text-xs">{policy.Type_Name || "General"}</span>
            </div>
            <div className="my-3 border-t border-gray-100"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Start Date</span>
              <span className="font-semibold text-gray-700">{policy.Start_Date || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">End Date</span>
              <span className="font-semibold text-gray-750">{policy.End_Date || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Premium</span>
              <span className="font-bold text-blue-600">ETB {Number(policy.Total_Premium || 0).toLocaleString()}/yr</span>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Details */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 border-b border-gray-50">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">COVERAGE DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Coverage Type</span>
              <span className="font-semibold text-gray-900">Comprehensive</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Coverage Amount</span>
              <span className="font-bold text-gray-900">ETB 500,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Deductible</span>
              <span className="font-medium text-gray-900">ETB 5,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">3rd Party Liability</span>
              <span className="font-bold text-gray-900">ETB 200,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Medical Coverage</span>
              <span className="font-medium text-gray-900">ETB 50,000</span>
            </div>
            <div className="my-4 border-t border-gray-100"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Excess</span>
              <span className="font-medium text-gray-900">ETB 2,500</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">No Claim Bonus</span>
              <span className="font-bold text-emerald-600">10% (Year 1)</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 border-b border-gray-50">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">PAYMENT SUMMARY</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex flex-col h-[calc(100%-49px)]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Next Due</span>
              <span className="font-bold text-amber-500">{paymentSummary.nextDue}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Due Amount</span>
              <span className="font-bold text-gray-900">{paymentSummary.dueAmount}</span>
            </div>
            <div className="my-1 border-t border-gray-100"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Premium</span>
              <span className="font-medium text-gray-900">ETB {Number(policy?.Total_Premium || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Paid To Date</span>
              <span className="font-bold text-emerald-600">{paymentSummary.paidToDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Outstanding</span>
              <span className="font-bold text-red-500">{paymentSummary.outstanding}</span>
            </div>
            <div className="my-1 border-t border-gray-100"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{paymentSummary.method}</span>
            </div>

            <div className="mt-auto pt-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase mb-2">
                <span>Progress</span>
                <span className="text-blue-600">{paymentSummary.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${paymentSummary.progress}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Tabs & Tab Content */}
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

        <div className="p-0">
          {activeTab === 'Payment Schedule' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-b-gray-100">
                    <TableHead className="py-3 font-semibold text-gray-500 pl-6 w-16">#</TableHead>
                    <TableHead className="py-3 font-semibold text-gray-500">DUE DATE</TableHead>
                    <TableHead className="py-3 font-semibold text-gray-500">AMOUNT</TableHead>
                    <TableHead className="py-3 font-semibold text-gray-500">STATUS</TableHead>
                    <TableHead className="py-3 font-semibold text-gray-500">PAID DATE</TableHead>
                    <TableHead className="py-3 font-semibold text-gray-500">RECEIPT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentScheduleState.map((row) => (
                    <TableRow key={row.n} className={`border-b-gray-50 relative ${row.isOverdue ? 'bg-red-50/10' : ''}`}>
                      {row.isOverdue && (
                        <td className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 p-0 border-0"></td>
                      )}
                      
                      <TableCell className="py-4 pl-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                        {row.n}
                      </TableCell>
                      
                      <TableCell className="py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                        {row.due}
                      </TableCell>
                      
                      <TableCell className="py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {row.amt}
                      </TableCell>
                      
                      <TableCell className="py-4 whitespace-nowrap">
                        <StatusBadge status={row.statusVariant as any} label={row.status} />
                      </TableCell>
                      
                      <TableCell className="py-4 text-sm text-gray-500 whitespace-nowrap">
                        {row.paid}
                      </TableCell>
                      
                      <TableCell className="py-4 text-sm whitespace-nowrap">
                        {row.rec ? (
                          <button 
                            onClick={(e) => { e.preventDefault(); setViewingReceipt(row); }} 
                            className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Receipt
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'Asset Details' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-semibold">Insured Asset Specifications</h3>
                  <p className="text-xs text-gray-500 mt-1">Specific physical item or risk unit connected to this active policy.</p>
                </div>
              </div>

              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        {asset.type === 'Auto' ? <Car className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">{asset.description}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${asset.status === 'Covered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{asset.status}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-500">
                          <div><span className="font-medium text-gray-400">ID:</span> <span className="font-mono text-gray-700 font-semibold">{asset.id}</span></div>
                          <div><span className="font-medium text-gray-400">Color:</span> <span className="text-gray-700 font-semibold">{asset.color}</span></div>
                          {asset.mileage && <div><span className="font-medium text-gray-400">Mileage:</span> <span className="text-gray-700 font-semibold">{asset.mileage}</span></div>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto justify-between border-t md:border-0 pt-3 md:pt-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Estimated Asset Value</span>
                        <span className="text-blue-600 font-black text-base">{asset.value}</span>
                      </div>
                      <Link to="/assets" className="text-xs font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 mt-1 justify-end hover:underline">
                        Manage Asset <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-semibold">Registered Documents Vault</h3>
                  <p className="text-xs text-gray-500 mt-1">Official forms, identifications, and policy templates connected to {policyId}.</p>
                </div>
                <Button 
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="bg-blue-650 hover:bg-blue-700 text-white font-semibold text-xs h-9 flex items-center gap-2 px-4 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" /> Upload Document
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 hover:shadow-sm transition-all group flex flex-col justify-between h-40">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 border rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                          {getDocIcon(doc.type)}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-gray-900 text-xs truncate max-w-[150px]" title={doc.name}>{doc.name}</h4>
                          <span className="text-[10px] text-gray-500 italic block mt-0.5">{doc.size} • {doc.category}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 font-mono tracking-wider">{doc.id}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Uploaded {doc.date}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setViewingDoc(doc)}
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded flex items-center justify-center transition-colors"
                          title="Preview document specifications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => { alert(`Downloading file "${doc.name}" directly to downloads folder...`); }}
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded flex items-center justify-center transition-colors"
                          title="Download document payload"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDocs(docs.filter(d => d.id !== doc.id))}
                          className="h-7 w-7 text-gray-450 hover:text-red-600 hover:bg-red-50/50 rounded flex items-center justify-center transition-colors"
                          title="Delete from system record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Claims' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-semibold">Incident Claims Portfolio</h3>
                  <p className="text-xs text-gray-500 mt-1">Historically submitted and ongoing accident claims tied to this policy.</p>
                </div>
                <Button 
                  onClick={() => setIsClaimsModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> File New Claim
                </Button>
              </div>

              {claims.length === 0 ? (
                <div className="p-10 border border-dashed rounded-xl bg-slate-50/50 text-center text-gray-400 text-xs">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="font-bold">No registered claims registered under Policy {policyId}.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Click "File New Claim" on the top right to start a compensation claim process.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-gray-50/60">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-3 font-semibold text-gray-500 pl-6 w-32">Claim ID</TableHead>
                        <TableHead className="py-3 font-semibold text-gray-500">Incident Date</TableHead>
                        <TableHead className="py-3 font-semibold text-gray-500">Estimate Claimed</TableHead>
                        <TableHead className="py-3 font-semibold text-gray-500/90">Description Context</TableHead>
                        <TableHead className="py-3 font-semibold text-gray-500">Status</TableHead>
                        <TableHead className="py-3 font-semibold text-gray-500 text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/40 border-b-gray-100">
                          <TableCell className="py-4 pl-6 text-xs text-gray-900 font-bold font-mono">
                            {row.id}
                          </TableCell>
                          <TableCell className="py-4 text-xs text-gray-800 font-semibold">
                            {row.incidentDate}
                          </TableCell>
                          <TableCell className="py-4 text-xs font-extrabold text-blue-600">
                            {row.amount}
                          </TableCell>
                          <TableCell className="py-4 text-[11px] text-gray-600 max-w-xs truncate" title={row.description}>
                            {row.description}
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={row.statusVariant as any} label={row.status} />
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6">
                            <Link to={`/claims`} className="text-xs font-bold text-blue-600 hover:underline">
                              Full Details
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* File Claims Modal */}
      {isClaimsModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <FilePlus className="w-4 h-4 text-rose-600" /> File New Incident Claim
              </span>
              <button onClick={() => setIsClaimsModalOpen(false)} className="text-gray-450 hover:text-gray-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleAddClaim}>
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5 focus-within:text-blue-600">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Accident/Incident Date *</label>
                  <input 
                    type="date" 
                    required
                    value={newClaim.incidentDate} 
                    onChange={(e) => setNewClaim({...newClaim, incidentDate: e.target.value})} 
                    className="w-full bg-gray-50 ring-0 hover:border-gray-300 focus:border-blue-500 focus:bg-white border border-gray-200 h-10 px-3 rounded-lg text-xs font-medium text-gray-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-blue-600">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Estimated Damage (ETB) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 55000"
                    value={newClaim.amount} 
                    onChange={(e) => setNewClaim({...newClaim, amount: e.target.value})} 
                    className="w-full bg-gray-50 ring-0 hover:border-gray-300 focus:border-blue-500 focus:bg-white border border-gray-200 h-10 px-3 rounded-lg text-xs font-medium text-gray-900 transition-colors placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-blue-600">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Incident Description & Details</label>
                  <textarea 
                    placeholder="Provide description of accident circumstances..."
                    value={newClaim.description} 
                    onChange={(e) => setNewClaim({...newClaim, description: e.target.value})} 
                    rows={3}
                    className="w-full bg-gray-50 focus:bg-white ring-0 hover:border-gray-300 focus:border-blue-500 border border-gray-200 p-3 rounded-lg text-xs font-medium text-gray-950 transition-colors placeholder:text-gray-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs">
                  <Button type="button" size="sm" variant="outline" className="text-gray-700 h-10" onClick={() => setIsClaimsModalOpen(false)}>Cancel submission</Button>
                  <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center h-10 px-5 gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Submit Claim
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <UploadCloud className="w-4 h-4 text-blue-600" /> Upload Document File
              </span>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="text-gray-450 hover:text-gray-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleUploadDoc}>
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5 focus-within:text-blue-600">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Document Display Title *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Vehicle_Inspection_May2024"
                    value={newDoc.name} 
                    onChange={(e) => setNewDoc({...newDoc, name: e.target.value})} 
                    className="w-full bg-gray-50 ring-0 hover:border-gray-300 focus:border-blue-500 focus:bg-white border border-gray-200 h-10 px-3 rounded-lg text-xs font-semibold text-gray-900 transition-colors placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-blue-600">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Document Classification</label>
                  <select 
                    value={newDoc.category} 
                    onChange={(e) => setNewDoc({...newDoc, category: e.target.value})} 
                    className="w-full bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800 transition-colors"
                  >
                    <option value="Policy">Policy Contract</option>
                    <option value="Identity">Customer Identification</option>
                    <option value="Claim">Claims Support Proof</option>
                    <option value="Estimate">Garage Estimate sheet</option>
                    <option value="Vehicle">Vehicle Ownership paper</option>
                    <option value="Other">Other specifications</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs">
                  <Button type="button" size="sm" variant="outline" className="text-gray-700 h-10" onClick={() => setIsUploadDocModalOpen(false)}>Cancel upload</Button>
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center h-10 px-5 gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Save Document
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                {getDocIcon(viewingDoc.type)}
                {viewingDoc.name}
              </span>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="border border-dashed border-gray-200 rounded-lg p-10 bg-slate-50 flex flex-col justify-center items-center text-center">
                {getDocIcon(viewingDoc.type)}
                <p className="text-xs font-bold text-gray-700 mt-2">Active Sandbox Preview Layer</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs">{viewingDoc.name} ({viewingDoc.size}) is a security cleared file uploaded by {viewingDoc.uploadedBy}.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border">
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[9px]">Document ID</span>
                  <span className="font-mono font-bold text-gray-900">{viewingDoc.id}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[9px]">Classification</span>
                  <span className="font-semibold text-gray-800">{viewingDoc.category}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[9px]">Registered Storage Date</span>
                  <span className="font-medium text-gray-800">{viewingDoc.date}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[9px]">Owner/Uploader</span>
                  <span className="font-semibold text-gray-800">{viewingDoc.uploadedBy}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <Button size="sm" variant="outline" className="text-gray-705" onClick={() => setViewingDoc(null)}>Close Preview</Button>
                <Button size="sm" className="bg-blue-650 text-white hover:bg-blue-700 font-semibold flex items-center gap-1.5" onClick={() => { alert(`Downloading file "${viewingDoc.name}" directly to downloads folder...`); }}>
                  <Download className="w-3.5 h-3.5" /> Download file ({viewingDoc.size})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Transaction Receipt Details
              </span>
              <button onClick={() => setViewingReceipt(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="text-center pb-2 border-b">
                <p className="text-2xl font-black text-gray-950 tracking-tight">{viewingReceipt.amt}</p>
                <p className="text-[10px] text-gray-500 mt-1">Due Date: <span className="font-semibold text-gray-750">{viewingReceipt.due}</span> • Settled: <span className="font-semibold text-emerald-650">{viewingReceipt.paid}</span></p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Policy Number</span>
                  <span className="font-bold text-gray-900 font-mono">{policyId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Policy Holder</span>
                  <span className="text-gray-900 font-bold">{customer ? `${customer.First_Name} ${customer.Last_Name}` : "General Holder"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Installment Ref</span>
                  <span className="font-mono text-gray-800 font-bold">INST-PS-{viewingReceipt.n}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Payment Channel</span>
                  <span className="text-gray-800 font-semibold">Bank Transfer (CBE)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Settlement Status</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold">
                    {viewingReceipt.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button size="sm" variant="outline" className="text-gray-700 font-semibold" onClick={() => setViewingReceipt(null)}>Dismiss Receipt</Button>
                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold flex items-center gap-1.5" onClick={() => { alert(`Downloading Transaction receipt "INST-PS-${viewingReceipt.n}_receipt.pdf" directly...`); }}>
                  <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
