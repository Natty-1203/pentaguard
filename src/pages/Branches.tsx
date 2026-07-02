import React, { useState, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit2, MoreVertical, 
  Download, Building2, MapPin, Users, Target, X, Trash2
} from 'lucide-react';

export default function BranchesPage() {
  const { selectedCompanyId } = useTenant();
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [viewingBranch, setViewingBranch] = useState<any>(null);
  const [newBranch, setNewBranch] = useState({ name: '', region: '', city: '', phone: '' });

  const filters = ['All', 'Active', 'Inactive'];

  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/branches-with-stats?companyId=${selectedCompanyId ?? 1}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const rawData = await res.json();

      const mapped = rawData.map((dbRow: any, idx: number) => ({
        id: `BRN-${(dbRow.Branch_Id !== undefined && dbRow.Branch_Id !== null ? dbRow.Branch_Id : idx + 1).toString().padStart(2, '0')}`,
        dbId: dbRow.Branch_Id,
        name: dbRow.Branch_Name,
        region: dbRow.Region,
        city: dbRow.City,
        status: dbRow.Status,
        agents: dbRow.agent_count ?? 0,
        policies: dbRow.policy_count ?? 0,
        phone: dbRow.Phone || 'N/A'
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredData = data.filter(item => {
    if (activeFilter !== 'All' && item.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return;
    try {
      const res = await fetch(`/api/branches?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Branch_Name: newBranch.name,
          Region: newBranch.region || 'Unknown',
          City: newBranch.city || 'Unknown'
        })
      });
      if (res.ok) {
        await fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
    setShowAddModal(false);
    setNewBranch({ name: '', region: '', city: '', phone: '' });
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      const res = await fetch(`/api/branches/${editingBranch.dbId}?companyId=${selectedCompanyId ?? 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Branch_Name: editingBranch.name,
          Region: editingBranch.region,
          City: editingBranch.city,
          Status: editingBranch.status
        })
      });
      if (res.ok) {
        await fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
    setEditingBranch(null);
  };

  const handleDelete = async (id: string, dbId: number) => {
    try {
      const res = await fetch(`/api/branches/${dbId}?companyId=${selectedCompanyId ?? 1}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Branch Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage regional branches and organizational structure</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAddModal(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Add New Branch</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBranch} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Branch Name</label>
                <Input required value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} placeholder="Branch name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Region</label>
                  <Input value={newBranch.region} onChange={e => setNewBranch({...newBranch, region: e.target.value})} placeholder="City" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">City</label>
                  <Input value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} placeholder="City" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number</label>
                <Input value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} placeholder="Phone number" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Branch</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards & Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
               <Building2 className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Branches</p>
               <h3 className="text-2xl font-bold text-gray-900">{data.length}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <Target className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active</p>
               <h3 className="text-2xl font-bold text-gray-900">{data.filter(d => d.status === 'Active').length}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
             <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
               <Users className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Agents</p>
               <h3 className="text-2xl font-bold text-gray-900">{data.reduce((acc, curr) => acc + curr.agents, 0)}</h3>
             </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search branches, regions..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm" 
              />
            </div>
            
            <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap">
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
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[280px]">BRANCH</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">REGION & CITY</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">PHONE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">AGENTS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id} className="border-b-gray-50">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <Link to="#" className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm block">{row.name}</Link>
                          <div className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">{row.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">{row.city}, {row.region}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.phone}</TableCell>
                    <TableCell className="py-3 text-sm font-semibold text-gray-900">{row.agents}</TableCell>
                    <TableCell className="py-3">
                      {row.status === 'Active' && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Active</Badge>}
                      {row.status === 'Inactive' && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200/60 font-medium">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingBranch(row)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="View Branch Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingBranch(row)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="Edit Branch Details">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id, row.dbId)} className="h-8 w-8 text-red-400 hover:text-red-650 hover:bg-red-50">
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
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> branches
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

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Edit Branch ({editingBranch.id})</h2>
              <button onClick={() => setEditingBranch(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateBranch} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Branch Name</label>
                <Input 
                  required 
                  value={editingBranch.name} 
                  onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} 
                  placeholder="Branch name" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Region</label>
                  <Input 
                    value={editingBranch.region} 
                    onChange={e => setEditingBranch({...editingBranch, region: e.target.value})} 
                    placeholder="City" 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">City</label>
                  <Input 
                    value={editingBranch.city} 
                    onChange={e => setEditingBranch({...editingBranch, city: e.target.value})} 
                    placeholder="City" 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number</label>
                <Input 
                  value={editingBranch.phone} 
                  onChange={e => setEditingBranch({...editingBranch, phone: e.target.value})} 
                  placeholder="e.g. +251 11 123 4567" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Status</label>
                <select 
                  value={editingBranch.status}
                  onChange={e => setEditingBranch({...editingBranch, status: e.target.value})}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditingBranch(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">Save Branch Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Branch Details Modal */}
      {viewingBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-105 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Branch Specifications ({viewingBranch.id})</h2>
              <button onClick={() => setViewingBranch(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Branch Name</span>
                <span className="font-bold text-gray-900">{viewingBranch.name}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Region / State</span>
                <span className="font-semibold text-gray-800">{viewingBranch.region}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">City Hub</span>
                <span className="font-semibold text-gray-800">{viewingBranch.city}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Official Phone Contact</span>
                <span className="font-mono text-gray-800">{viewingBranch.phone}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Assigned Agents</span>
                <span className="font-bold text-blue-600 text-[13px]">{viewingBranch.agents} agents</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Current Status</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${viewingBranch.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {viewingBranch.status}
                </span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs" onClick={() => setViewingBranch(null)}>Dismiss Details</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
