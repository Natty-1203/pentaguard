import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, MoreVertical, 
  Download, AlertCircle, CheckCircle, Clock, Calendar,
  ChevronLeft, ChevronRight, Trash2, X, GitMerge
} from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/status-badge';

export default function ClaimsPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [kpis, setKpis] = useState<{ open: number; settled: number; avgResolutionDays: number }>({ open: 0, settled: 0, avgResolutionDays: 0 });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({ policyId: '', description: '' });

  const filters = ['All', 'Filed', 'Assigned', 'Under Review', 'Approved', 'Paid', 'Closed', 'Rejected'];

  const fetchClaims = async () => {
    try {
      const res = await fetch('/api/claims');
      if (!res.ok) throw new Error('Failed to fetch');
      const rawData = await res.json();

      const mapped = rawData.map((dbRow: any, idx: number) => ({
        id: `CLM-${(dbRow.Claim_Id !== undefined && dbRow.Claim_Id !== null ? dbRow.Claim_Id : idx + 1).toString().padStart(4, '0')}`,
        dbId: dbRow.Claim_Id,
        policyId: dbRow.Policy_No || `POL-${(dbRow.Policy_Id !== undefined && dbRow.Policy_Id !== null ? dbRow.Policy_Id : 0).toString().padStart(4, '0')}`,
        customer: dbRow.Customer_Name || `Customer #${dbRow.Policy_Id}`,
        type: dbRow.Policy_No ? 'Policy Claim' : 'General',
        incidentDate: dbRow.Incident_Date || '-',
        status: (dbRow.Status || '').replace('_', ' '),
        statusVariant: dbRow.Status === 'Paid' ? 'success' : dbRow.Status === 'Under_Review' ? 'active' : dbRow.Status === 'Closed' ? 'offline' : dbRow.Status === 'Rejected' ? 'rejected' : 'pending',
        amount: 'ETB 0'
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKpis = async () => {
    try {
      const res = await fetch('/api/claims/kpis');
      if (res.ok) setKpis(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchClaims();
    fetchKpis();
  }, []);

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedId = parseInt(newClaim.policyId.replace(/\D/g, ''), 10);
      if (isNaN(parsedId) || parsedId <= 0) {
         window.alert('Please enter a valid numeric Policy ID (e.g., POL-123).');
         return;
      }

      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Policy_Id: parsedId,
          Description: newClaim.description,
          Status: 'Filed',
        })
      });
      if (res.ok) {
        await fetchClaims();
        setIsAddOpen(false);
        setNewClaim({ policyId: '', description: '' });
      } else {
        const errData = await res.json();
        window.alert(`Error creating claim: ${errData.error || 'Database constraint violation'}`);
      }
    } catch (err) {
      console.error(err);
      window.alert('Unexpected error occurred while filing the claim.');
    }
  };

  const handleDeleteClaim = async (dbId: number) => {
    try {
      const res = await fetch(`/api/claims/${dbId}`, { method: 'DELETE' });
      if (res.ok) await fetchClaims();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredData = data.filter(item => {
    if (activeFilter !== 'All' && item.status !== activeFilter) return false;
    if (searchQuery && 
        !item.customer.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.policyId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Claims Management</h1>
          <p className="text-sm text-gray-500 mt-1">Process and track customer claims across all policy types</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            File New Claim
          </Button>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">File New Claim</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClaim} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Policy ID</label>
                <Input required value={newClaim.policyId} onChange={e => setNewClaim(prev => ({...prev, policyId: e.target.value}))} placeholder="POL-XXX" />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Description / Incident Notes</label>
                <Input required value={newClaim.description} onChange={e => setNewClaim(prev => ({...prev, description: e.target.value}))} placeholder="Brief details about the loss..." />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" className="mr-2" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards & Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Open Claims</p>
               <h3 className="text-2xl font-bold text-gray-900">{kpis.open.toLocaleString()}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Settled</p>
               <h3 className="text-2xl font-bold text-gray-900">{kpis.settled.toLocaleString()}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avg Resolution</p>
               <h3 className="text-2xl font-bold text-gray-900">{kpis.avgResolutionDays} Days</h3>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })} · YTD
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search claims, policies, customers..." 
                className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm" 
              />
            </div>
            
            <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap overflow-x-auto">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === filter ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[180px]">CLAIM ID</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">POLICY & TYPE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">CUSTOMER</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">INCIDENT DATE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">CLAIM AMOUNT</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 pl-8">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id} className="border-b-gray-50">
                    <TableCell className="py-3 pl-6">
                      <Link to={`/claims/${row.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">{row.id}</Link>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <Link to={`/policies/${row.policyId}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline">{row.policyId}</Link>
                        <p className="text-xs text-gray-500 mt-0.5">{row.type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-700 font-medium">
                      <Link to="#" className="text-gray-900 hover:text-blue-600 hover:underline">{row.customer}</Link>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.incidentDate}</TableCell>
                    <TableCell className="py-3 text-sm font-bold text-gray-900 text-right">{row.amount}</TableCell>
                    <TableCell className="py-3 pl-8">
                       <StatusBadge status={row.statusVariant as any} label={row.status} />
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/claims/${row.id}`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/claims/${row.dbId}/workflow`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-blue-400 hover:text-blue-800 hover:bg-blue-50 transition-colors" title="View Workflow">
                          <GitMerge className="w-4 h-4" />
                        </Link>
                        <Button onClick={() => handleDeleteClaim(row.dbId)} variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-900">
              {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> claims
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
      </Card>

    </div>
  );
}
