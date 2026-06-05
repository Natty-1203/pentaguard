import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, MoreVertical, 
  Download, Award, TrendingUp, DollarSign, Calendar, Trash2, X
} from 'lucide-react';

export default function AgentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ firstName: '', lastName: '', licenseNo: '' });

  const filters = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agent-performance');
      if (!res.ok) throw new Error('Failed to fetch');
      const rawData = await res.json();

      const mapped = rawData.map((dbRow: any, idx: number) => ({
        dbId: dbRow.id,
        id: `AGT-${String(dbRow.id).padStart(3, '0')}`,
        name: dbRow.name,
        licenseNo: dbRow.id, // No license column returned; fall back to internal ID
        commissionRate: Number(dbRow.commissionRate) || 0,
        tier: dbRow.commissionRate >= 15 ? 'Platinum' : dbRow.commissionRate >= 12 ? 'Gold' : dbRow.commissionRate >= 10 ? 'Silver' : 'Bronze',
        policies: dbRow.policies,
        premium: dbRow.premium,
          status: dbRow.status || 'Active',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dbRow.name)}&background=random`,
        selected: false
      }));

      if (mapped.length === 0) {
        // Fall back to /api/agents for license numbers if performance endpoint is empty
        const fbRes = await fetch('/api/agents');
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const fbMapped = fbData.map((dbRow: any, idx: number) => ({
            dbId: dbRow.Agent_Id,
            id: `AGT-${(dbRow.Agent_Id !== undefined && dbRow.Agent_Id !== null ? dbRow.Agent_Id : idx + 1).toString().padStart(3, '0')}`,
            name: `${dbRow.First_Name} ${dbRow.Last_Name}`,
            licenseNo: dbRow.License_No,
            tier: dbRow.Commission_Rate >= 15 ? 'Platinum' : dbRow.Commission_Rate >= 12 ? 'Gold' : dbRow.Commission_Rate >= 10 ? 'Silver' : 'Bronze',
            policies: 0,
            premium: 'ETB 0',
            status: dbRow.Status,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dbRow.First_Name + ' ' + dbRow.Last_Name)}&background=random`,
            selected: false
          }));
          setData(fbMapped);
          return;
        }
      }

      setData(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: newAgent.firstName,
          Last_Name: newAgent.lastName,
          License_No: newAgent.licenseNo,
          Commission_Rate: 10.0,
          Status: 'Pending'
        })
      });
      if (res.ok) {
        await fetchAgents();
        setIsAddOpen(false);
        setNewAgent({ firstName: '', lastName: '', licenseNo: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgent = async (dbId: number) => {
    try {
      const res = await fetch(`/api/agents/${dbId}`, { method: 'DELETE' });
      if (res.ok) await fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredData = data.filter(item => {
    if (activeFilter !== 'All' && item.tier !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.licenseNo.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelect = (index: number) => {
    const globalIdx = data.findIndex(x => x.id === paginatedData[index].id);
    if (globalIdx === -1) return;
    const newData = [...data];
    newData[globalIdx].selected = !newData[globalIdx].selected;
    setData(newData);
  };

  const toggleAll = () => {
    const allSelected = paginatedData.every(row => row.selected);
    const paginatedIds = paginatedData.map(p => p.id);
    setData(data.map(row => {
      if (paginatedIds.includes(row.id)) {
        return { ...row, selected: !allSelected };
      }
      return row;
    }));
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'Platinum': return 'bg-slate-800 text-slate-100 border-slate-700';
      case 'Gold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Silver': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Bronze': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agent Network</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor agent performance, licensing, and commission tiers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Onboard Agent
          </Button>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Onboard New Agent</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAgent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">First Name</label>
                <Input required value={newAgent.firstName} onChange={e => setNewAgent(prev => ({...prev, firstName: e.target.value}))} />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Last Name</label>
                <Input required value={newAgent.lastName} onChange={e => setNewAgent(prev => ({...prev, lastName: e.target.value}))} />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">License Number</label>
                <Input required value={newAgent.licenseNo} onChange={e => setNewAgent(prev => ({...prev, licenseNo: e.target.value}))} placeholder="LIC-XXX-XXX" />
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
               <Award className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Top Tier Agents</p>
               <h3 className="text-2xl font-bold text-gray-900">{data.filter(a => a.tier === 'Platinum' || a.tier === 'Gold').length} <span className="text-sm font-medium text-gray-500">of {data.length}</span></h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <TrendingUp className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Premium (YTD)</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const total = data.reduce((acc, a) => {
                      const raw = String(a.premium || '0').replace(/[^0-9.-]/g, '');
                      return acc + (parseInt(raw) || 0);
                    }, 0);
                    if (total >= 1_000_000) return `ETB ${(total / 1_000_000).toFixed(2)}M`;
                    if (total >= 1_000) return `ETB ${(total / 1_000).toFixed(0)}K`;
                    return `ETB ${total}`;
                  })()}
                </h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
               <DollarSign className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avg Commission</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {data.length ? (data.reduce((acc, curr) => acc + (parseFloat(String(curr.commissionRate ?? (curr.tier === 'Platinum' ? 15 : curr.tier === 'Gold' ? 12 : curr.tier === 'Silver' ? 10 : 7))) || 0), 0) / data.length).toFixed(1) : 0}%
                </h3>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          YTD: Jan - {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search by name, license..." 
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
                  <TableHead className="w-12 pl-6">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      checked={paginatedData.length > 0 && paginatedData.every(row => row.selected)}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 w-[260px]">AGENT DETAILS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">LICENSE NO.</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">TIER</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">POLICIES SOLD</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">PREMIUM (YTD)</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 pl-8">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, idx) => (
                  <TableRow key={row.id} data-state={row.selected ? "selected" : undefined} className="border-b-gray-50">
                    <TableCell className="pl-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        checked={row.selected}
                        onChange={() => toggleSelect(idx)}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={row.avatar} className="w-9 h-9 rounded-full border border-gray-100 object-cover" alt="" referrerPolicy="no-referrer" />
                        <div>
                          <Link to={`/agents/${row.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm block">{row.name}</Link>
                          <div className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">{row.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-600 font-mono text-xs">{row.licenseNo}</TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getTierColor(row.tier)}`}>
                        {row.tier}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-gray-700">{row.policies}</TableCell>
                    <TableCell className="py-3 text-right font-bold text-gray-900">{row.premium}</TableCell>
                    <TableCell className="py-3 pl-8">
                      {row.status === 'Active' && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Active</Badge>}
                      {row.status === 'Pending' && <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>}
                      {row.status === 'Inactive' && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200/60 font-medium">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/agents/${row.id}`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Button onClick={() => handleDeleteAgent(row.dbId)} variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
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
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> agents
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

