import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Check, Clock, Calendar, ArrowRight, UserCircle, Car, Settings, XCircle, AlertCircle } from 'lucide-react';

export default function ClaimWorkflowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCompanyId } = useTenant();

  const fetchWorkflow = async () => {
    try {
      const [wfRes, claimRes] = await Promise.all([
        fetch(`/api/claims/${id}/workflow?companyId=${selectedCompanyId ?? 1}`),
        fetch(`/api/claims?companyId=${selectedCompanyId ?? 1}`)
      ]);
      
      const wfData = await wfRes.json();
      const claimsData = await claimRes.json();
      const currentClaim = claimsData.find((c: any) => c.Claim_Id === parseInt(id || '0'));
      
      setWorkflowSteps(wfData);
      setClaim(currentClaim);
    } catch (err) {
      console.error('Failed to fetch workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorkflow();
  }, [id]);

  const handleApproveStep = async () => {
    if (!claim) return;
    const stepMap: Record<number, string> = {
      1: 'Document_Check',
      2: 'Field_Inspection',
      3: 'Under_Review',
      4: 'Supervisor_Approval',
      5: 'Approved',
      6: 'Paid'
    };
    
    const nextStepName = stepMap[workflowSteps.length + 1] || 'Under_Review';
    
    try {
      const res = await fetch(`/api/claims/${id}/workflow?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Step_Name: nextStepName,
          Action_Taken: `Approved by claims officer. Moving to ${nextStepName.replace('_', ' ')}.`,
          Notes: 'Workflow progression'
        })
      });
      
      if (res.ok) fetchWorkflow();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectClaim = async () => {
    if (!window.confirm('Are you sure you want to reject this claim?')) return;
    
    try {
      const res = await fetch(`/api/claims/${id}/reject?companyId=${selectedCompanyId ?? 1}`, { method: 'POST' });
      if (res.ok) fetchWorkflow();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading workflow...</div>;
  if (!claim) return <div className="p-10 text-center text-red-500">Claim not found.</div>;

  const currentStatus = workflowSteps.length > 0 ? workflowSteps[workflowSteps.length - 1].Step_Name : 'Filed';
  const isFinalized = ['Approved', 'Rejected', 'Paid'].includes(currentStatus);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Claim Workflow Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Track the end-to-end progress of Claim <span className="font-semibold text-gray-900">CLM-{id?.padStart(4, '0')}</span></p>
        </div>
        {!isFinalized && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRejectClaim} className="gap-2 h-10 text-gray-700 bg-white shadow-sm border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200">
              <XCircle className="w-4 h-4 text-gray-400" />
              Reject Claim
            </Button>
            <Button onClick={handleApproveStep} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              Approve Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        {isFinalized && (
          <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${currentStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {currentStatus === 'Rejected' ? <XCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            Claim {currentStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Timeline Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-50">
               <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">LIFECYCLE TIMELINE</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="relative pl-8 space-y-8">
                 {/* Vertical line connecting steps */}
                 <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-gray-200"></div>

                 {workflowSteps.map((step, index) => {
                   const isLatest = index === workflowSteps.length - 1;
                   const isCompleted = !isLatest || isFinalized;
                   
                   return (
                     <div key={step.Step_Id} className="relative">
                       {/* Step Icon Indicator */}
                       <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white
                          ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}
                       `}>
                         {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                       </div>

                       {/* Step Content */}
                       <div className={`p-5 rounded-xl border ${!isCompleted ? 'border-blue-200 bg-blue-50/10 shadow-sm' : 'border-gray-100 bg-white shadow-sm'}`}>
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                           <h3 className="text-base font-bold text-gray-900">{step.Step_Name.replace('_', ' ')}</h3>
                           <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                             <Calendar className="w-3.5 h-3.5" />
                             {new Date(step.Step_Date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                           </div>
                         </div>
                         
                         <p className="text-sm text-gray-600 mb-4">{step.Action_Taken}</p>
                         
                         <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-gray-50 self-start inline-flex px-2.5 py-1.5 rounded-md border border-gray-100">
                           <UserCircle className="w-4 h-4 text-gray-400" />
                           Action by: <span className="text-gray-900">{step.Staff_Name || 'System'}</span>
                         </div>
                         {step.Notes && (
                           <div className="mt-3 text-[11px] text-gray-400 italic">
                             Note: {step.Notes}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
           <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-50">
               <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">CLAIM CONTEXT</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Claim Ratio</span>
                 <span className="font-bold text-emerald-600">Low Risk</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Policy Validity</span>
                 <span className="font-bold text-gray-900">Valid</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b border-gray-50">
               <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">INVOLVED VEHICLE</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                  <Car className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Toyota Corolla 2021</h4>
                  <div className="text-xs text-gray-500 mt-1">A12345 (Addis Ababa)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardContent className="p-6">
              <Settings className="w-8 h-8 text-slate-400 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Workflow Automation</h3>
              <p className="text-slate-400 text-sm mb-4">This claim is currently following the "Standard Auto" rule set. SLA timer is active.</p>
              <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-transparent text-white justify-between">
                View SLA Rules <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
