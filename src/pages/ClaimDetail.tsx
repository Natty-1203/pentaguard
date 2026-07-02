import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { 
  ShieldAlert, UserPlus, CheckCircle2, XCircle, X, Car, Phone, Mail,
  Upload, Download, Eye, Send, FileText, MessageSquare, Bell, FilePlus, Play, Check, Circle, GitMerge
} from 'lucide-react';

export default function ClaimDetailPage() {
  const { id } = useParams();
  const claimId = id || "CLM-0001";

  const [claim, setClaim] = React.useState<any>(null);
  const [policy, setPolicy] = React.useState<any>(null);
  const [customer, setCustomer] = React.useState<any>(null);
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [claimStaff, setClaimStaff] = React.useState<any[]>([]);
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { selectedCompanyId } = useTenant();

  const fetchClaimData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/claims?companyId=${selectedCompanyId ?? 1}`);
      if (res.ok) {
        const rawClaims = await res.json();
        const parsedId = Number(claimId.replace('CLM-', ''));
        const found = rawClaims.find((c: any) => {
          const cId = c.Claim_Id || c.claim_id || 0;
          return cId === parsedId || `CLM-${cId.toString().padStart(4, '0')}` === claimId;
        });

        if (found) {
          setClaim(found);
          const polRes = await fetch(`/api/policies?companyId=${selectedCompanyId ?? 1}`);
          if (polRes.ok) {
            const policiesList = await polRes.json();
            const foundPol = policiesList.find((p: any) => p.Policy_Id === found.Policy_Id);
            if (foundPol) {
              setPolicy(foundPol);
              const custRes = await fetch(`/api/customers?companyId=${selectedCompanyId ?? 1}`);
              if (custRes.ok) {
                const customersList = await custRes.json();
                const foundCust = customersList.find((cu: any) => cu.Customer_Id === foundPol.Customer_Id);
                if (foundCust) {
                  setCustomer(foundCust);
                }
              }
            }
          }
          const wfRes = await fetch(`/api/claims/${found.Claim_Id}/workflow?companyId=${selectedCompanyId ?? 1}`);
          if (wfRes.ok) {
            const wfData = await wfRes.json();
            setWorkflows(wfData);
          }
          const csRes = await fetch(`/api/claim-staff?companyId=${selectedCompanyId ?? 1}`);
          if (csRes.ok) setClaimStaff(await csRes.json());
          const docRes = await fetch(`/api/documents?companyId=${selectedCompanyId ?? 1}`);
          if (docRes.ok) {
            const allDocs = await docRes.json();
            setDocuments(allDocs.filter((d: any) => d.Claim_Id === found.Claim_Id));
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
    fetchClaimData();
  }, [claimId]);

  const updateClaimStatus = async (newStatus: string) => {
    if (!claim) return;
    try {
      const fetchId = claim.Claim_Id || claim.claim_id;
      const res = await fetch(`/api/claims/${fetchId}?companyId=${selectedCompanyId ?? 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus })
      });
      if (res.ok) {
        await fetchClaimData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-gray-500">
        Loading claim details...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 text-center text-sm font-medium text-red-500">
        Claim not found
      </div>
    );
  }

  const claimStatusDisplay = (claim.Status || '').replace('_', ' ');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{claimId}</h1>
              <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/50 uppercase">● {claimStatusDisplay}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">Filed:</span> {claim.Incident_Date || 'N/A'}
              </div>
              <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">Type:</span> {policy?.Type_Name || claim.Type_Name || '—'}
              </div>
              <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">Amount:</span> ETB {Number(policy?.Total_Premium || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => updateClaimStatus('Under_Review')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Play className="w-4 h-4" />
            Under Review
          </Button>
          <Button onClick={() => updateClaimStatus('Approved')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </Button>
          <Button onClick={() => updateClaimStatus('Rejected')} className="gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold">
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button onClick={() => updateClaimStatus('Closed')} variant="outline" className="gap-2 text-gray-700 bg-white border-gray-200 font-semibold">
            <X className="w-4 h-4 text-gray-500" />
            Close Claim
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Claim Information */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base font-semibold text-gray-800">Claim Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mb-6">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">POLICY NUMBER</div>
                  <Link to={`/policies/POL-${policy?.Policy_Id?.toString().padStart(4, '0')}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    POL-{policy?.Policy_Id?.toString().padStart(4, '0')}
                  </Link>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CUSTOMER</div>
                  <div className="flex items-center gap-2">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer ? `${customer.First_Name} ${customer.Last_Name}` : 'Customer')}&background=random`} alt="Customer" className="w-6 h-6 rounded-full border border-gray-100" />
                    <span className="text-sm font-semibold text-gray-900">{customer ? `${customer.First_Name} ${customer.Last_Name}` : `Customer #${policy?.Customer_Id}`}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">INSURANCE TYPE</div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    <Car className="w-4 h-4" />
                    {policy?.Type_Name || claim.Type_Name || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">INCIDENT DATE</div>
                  <div className="text-sm font-medium text-gray-900">{claim.Incident_Date || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CLAIM AMOUNT</div>
                  <div className="text-sm font-bold text-gray-900">ETB {Number(policy?.Total_Premium || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">REGISTRATION CODE</div>
                  <div className="text-sm font-medium text-gray-900">{claimId}</div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">INCIDENT DESCRIPTION</div>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100 font-medium">
                  {claim.Description || 'No description provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                  <Play className="w-3 h-3 text-blue-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-800">Claim Workflow Overview</CardTitle>
              </div>
              <Link to={`/claims/${claim.Claim_Id || claim.claim_id}/workflow`}>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-blue-600 border-blue-200">
                  <GitMerge className="w-3.5 h-3.5" />
                  View Full Workflow
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="flex items-center justify-between text-sm mb-2 text-gray-600">
                <span>Overall Progress</span>
                <span className="font-bold text-blue-600">{workflows.length > 0 ? `${Math.round((workflows.filter((w: any) => /complete|approve|paid|closed|reject/i.test(`${w.Step_Name} ${w.Action_Taken || ''}`)).length / Math.max(workflows.length, 1)) * 100)}%` : '0%'}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-8">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${workflows.length > 0 ? Math.round((workflows.filter((w: any) => /complete|approve|paid|closed|reject/i.test(`${w.Step_Name} ${w.Action_Taken || ''}`)).length / Math.max(workflows.length, 1)) * 100) : 0}%` }}></div>
              </div>

              <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4">
                {workflows.length === 0 ? (
                  <div className="pl-8 text-sm text-gray-500">No workflow steps recorded yet.</div>
                ) : (
                  workflows
                    .slice()
                    .sort((a: any, b: any) => (a.Step_Number || 0) - (b.Step_Number || 0))
                    .map((step: any, idx: number) => {
                      const isCompleted = /complete|approve|paid|closed|reject/i.test(`${step.Step_Name} ${step.Action_Taken || ''}`);
                      const isCurrent = !isCompleted && idx === workflows.findIndex((w: any) => !/complete|approve|paid|closed|reject/i.test(`${w.Step_Name} ${w.Action_Taken || ''}`));
                      const stepDate = step.Step_Date ? new Date(step.Step_Date) : null;
                      const assignedStaff = claimStaff.find((cs: any) => cs.Claim_Staff_Id === step.Assigned_To);
                      return (
                        <div key={step.Step_Id || idx} className="relative pl-8">
                          <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            {isCompleted ? <Check className="w-3 h-3 text-white" /> : isCurrent ? <div className="w-2 h-2 rounded-full bg-white"></div> : null}
                          </div>
                          <div className={`flex items-start justify-between rounded-lg p-3 border relative overflow-hidden ${isCurrent ? 'bg-white border-2 border-blue-100 shadow-sm' : isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'border-gray-200 border-dashed'}`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${isCurrent ? 'text-blue-600 bg-blue-50' : isCompleted ? 'text-emerald-600 bg-emerald-100' : 'text-gray-500'}`}>STEP {step.Step_Number || idx + 1}{isCurrent ? ' · CURRENT' : ''}</span>
                                <h4 className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>{step.Step_Name || 'Step'}</h4>
                              </div>
                              <p className={`text-xs ${isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-400'}`}>
                                {step.Notes || step.Action_Taken || 'No notes recorded.'}
                                {assignedStaff && <span> — Assigned to <span className="font-semibold text-gray-700">{assignedStaff.First_Name} {assignedStaff.Last_Name}</span></span>}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-semibold ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}</div>
                              {stepDate && <div className="text-[11px] text-gray-500">{stepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attached Documents */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-semibold text-gray-800">Attached Documents</CardTitle>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {documents.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500">No documents attached to this claim.</div>
                ) : (
                  documents.map((doc: any) => {
                    const uploader = doc.Uploaded_By
                      ? claimStaff.find((cs: any) => String(cs.Claim_Staff_Id) === String(doc.Uploaded_By))
                      : null;
                    const uploaderName = uploader ? `${uploader.First_Name} ${uploader.Last_Name}` : (doc.Uploaded_By ? `User #${doc.Uploaded_By}` : 'System');
                    const docDate = doc.Uploaded_Date ? new Date(doc.Uploaded_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    return (
                      <div key={doc.Document_Id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{doc.File_Name || `Document #${doc.Document_Id}`}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Uploaded by <span className="font-medium text-gray-600">{uploaderName}</span> · {docDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-gray-700">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-gray-700">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Sidebar Content) */}
        <div className="space-y-6">
          
          {/* Assigned Staff */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-semibold text-gray-800">Assigned Staff</CardTitle>
              </div>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">Change</a>
            </CardHeader>
            <CardContent className="pt-5">
              {(() => {
                const assignedId = workflows.find((w: any) => w.Assigned_To)?.Assigned_To;
                const staff = claimStaff.find((cs: any) => cs.Claim_Staff_Id === assignedId);
                if (!staff) return <div className="text-xs text-gray-500">No staff assigned yet.</div>;
                return (
                  <div className="flex items-start gap-4">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${staff.First_Name} ${staff.Last_Name}`)}&background=random`} alt="Staff" className="w-12 h-12 rounded-full border border-gray-200" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{staff.First_Name} {staff.Last_Name}</h4>
                      <div className="text-xs font-medium text-blue-600 mt-0.5 mb-2">{staff.Role || 'Claims Assessor'}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {staff.Email || '—'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {staff.Phone || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
            <CardFooter className="py-3 px-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
               <div className="flex items-center gap-1.5 text-gray-600">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
               </div>
               <div className="text-gray-400">Assigned {workflows.find((w: any) => w.Assigned_To)?.Step_Date ? new Date(workflows.find((w: any) => w.Assigned_To)!.Step_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
            </CardFooter>
          </Card>

          {/* Activity & Notes */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-semibold text-gray-800">Activity & Notes</CardTitle>
              </div>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">+ Add Note</a>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {workflows.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500">No activity recorded yet.</div>
                ) : (
                  workflows
                    .slice()
                    .sort((a: any, b: any) => new Date(b.Step_Date || 0).getTime() - new Date(a.Step_Date || 0).getTime())
                    .map((step: any) => {
                      const staff = claimStaff.find((cs: any) => cs.Claim_Staff_Id === step.Assigned_To);
                      const name = staff ? `${staff.First_Name} ${staff.Last_Name}` : 'System';
                      return (
                        <div key={step.Step_Id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {staff ? (
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} alt="User" className="w-6 h-6 rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                  <FilePlus className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm font-semibold text-gray-900">{name}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-gray-600 border-gray-200 bg-gray-50">{step.Step_Name || 'Step'}</Badge>
                            </div>
                            <span className="text-[10px] text-gray-400">{step.Step_Date ? new Date(step.Step_Date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed pl-8">
                            {step.Notes || step.Action_Taken || 'No description.'}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <Button variant="outline" className="w-full justify-start gap-3 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white">
                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Update Status
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white">
                <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Add Note
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white">
                <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Request Documents
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white">
                <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                Send Notification
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}


