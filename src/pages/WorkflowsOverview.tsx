import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  GitMerge, Search, Filter, Eye, ArrowRight,
  AlertCircle, CheckCircle, Clock, ShieldAlert
} from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/status-badge';

export default function WorkflowsOverviewPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await fetch('/api/claims');
        if (res.ok) {
          const data = await res.json();
          // Filter for active claims that need workflow management
          const activeClaims = data.filter((c: any) => c.Status !== 'Closed' && c.Status !== 'Rejected');
          setClaims(activeClaims);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-blue-600" />
            Claim Workflows
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track the progression of active insurance claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-100 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</p>
                <h3 className="text-2xl font-bold text-blue-900">{claims.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Awaiting Review</p>
                <h3 className="text-2xl font-bold text-amber-900">{claims.filter(c => c.Status === 'Under_Review').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Ready for Payout</p>
                <h3 className="text-2xl font-bold text-emerald-900">{claims.filter(c => c.Status === 'Approved').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-sm font-bold text-gray-700">Active Workflow Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-500 pl-6">CLAIM ID</TableHead>
                  <TableHead className="font-semibold text-gray-500">POLICY</TableHead>
                  <TableHead className="font-semibold text-gray-500">INCIDENT DATE</TableHead>
                  <TableHead className="font-semibold text-gray-500">CURRENT STATUS</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-gray-500">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                      Loading active workflows...
                    </TableCell>
                  </TableRow>
                ) : claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                      No active workflows found.
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((claim) => (
                    <TableRow key={claim.Claim_Id || claim.claim_id} className="group hover:bg-gray-50/80 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <span className="font-bold text-gray-900">CLM-{(claim.Claim_Id || claim.claim_id || 0).toString().padStart(4, '0')}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-gray-600">POL-{(claim.Policy_Id || claim.policy_id || 0).toString().padStart(4, '0')}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-gray-600">{claim.Incident_Date || '-'}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                          {(claim.Status || 'Unknown').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Link 
                          to={`/claims/${claim.Claim_Id || claim.claim_id}/workflow`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all hover:translate-x-1 gap-2"
                        >
                          Go to Timeline
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
