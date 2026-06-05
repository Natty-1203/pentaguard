import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit2, MoreVertical, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';

export default function PoliciesPage() {
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [newPolicy, setNewPolicy] = useState({
    customerName: '',
    type: 'Auto Insurance',
    premium: '15000',
    status: 'Active'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());

  const statusOptions = ['Active', 'Pending', 'Under Review', 'Expired'];
  const typeOptions = ['Motor Comprehensive', 'Home & Real Estate', 'Specialized Life Spec', 'Group Health Plan'];

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/policies');
      if (!res.ok) throw new Error('Failed to fetch');
      const rawData = await res.json();
      
      const mapped = rawData.map((dbRow: any, idx: number) => ({
        id: dbRow.Policy_No || `POL-${(dbRow.Policy_Id || idx + 1).toString().padStart(4, '0')}`,
        dbId: dbRow.Policy_Id,
        customerName: dbRow.Customer_Name || `Customer #${dbRow.Customer_Id || idx + 1}`,
        customerId: `ID: CUS-${(dbRow.Customer_Id || idx + 1).toString().padStart(3, '0')}`,
        type: dbRow.Type_Name || 'General Insurance',
        startDate: dbRow.Start_Date || '-',
        premium: `ETB ${Number(dbRow.Total_Premium || dbRow.Premium_Amount || 0).toLocaleString()}`,
        status: dbRow.Status,
        selected: false,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dbRow.Customer_Name || 'C')}&background=random`
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const [customers, setCustomers] = useState<any[]>([]);
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchCustomers();
  }, []);

  const toggleSelect = (index: number) => {
    const newData = [...data];
    newData[index].selected = !newData[index].selected;
    setData(newData);
  };

  const toggleAll = () => {
    const allSelected = data.every(row => row.selected);
    setData(data.map(row => ({ ...row, selected: !allSelected })));
  };

  const handleDelete = async (id: string, dbId: number) => {
    try {
      const res = await fetch(`/api/policies/${dbId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPolicies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.customerName) return;
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Customer_Id: newPolicy.customerName || (customers[0]?.Customer_Id || 1),
          Insurance_Type_Id: { 'Auto Insurance': 1, 'Home Insurance': 2, 'Life Insurance': 3, 'Health Insurance': 4 }[newPolicy.type] || 1,
          Total_Premium: newPolicy.premium,
          Status: newPolicy.status
        })
      });
      if (res.ok) {
        await fetchPolicies();
      }
    } catch (err) {
      console.error(err);
    }
    setShowAddModal(false);
    setNewPolicy({ customerName: '', type: 'Auto Insurance', premium: '15000', status: 'Active' });
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    let numericPremium = editingPolicy.premium;
    if (typeof numericPremium === 'string') {
      numericPremium = Number(numericPremium.replace(/[^0-9.-]+/g,""));
    }
    try {
      const res = await fetch(`/api/policies/${editingPolicy.dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Total_Premium: numericPremium,
          Status: editingPolicy.status
        })
      });
      if (res.ok) {
        await fetchPolicies();
      }
    } catch (err) {
      console.error(err);
    }
    setEditingPolicy(null);
  };

  const availableStatuses = [...new Set(data.map(d => d.status))].sort();
  const availableTypes = [...new Set(data.map(d => d.type))].sort();

  const filteredData = data.filter(row => {
    const matchesSearch = row.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilters.size === 0 || statusFilters.has(row.status);
    const matchesType = typeFilters.size === 0 || typeFilters.has(row.type);

    return matchesSearch && matchesStatus && matchesType;
  });

  const activeFilterCount = (statusFilters.size > 0 ? 1 : 0) + (typeFilters.size > 0 ? 1 : 0);

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
    setCurrentPage(1);
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilters(new Set());
    setTypeFilters(new Set());
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Policies</h1>
        <p className="text-sm text-gray-500 mt-1">Manage issued policies, coverage, and payment schedules.</p>
      </div>

      {/* DataTable Block */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search records..." 
              className="pl-9 bg-gray-50/50 border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setFilterOpen(!filterOpen)}
                className="gap-2 h-9 text-gray-700 bg-white shadow-sm border-gray-200"
              >
                <Filter className="w-4 h-4 text-gray-500" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white leading-none">{activeFilterCount}</span>
                )}
              </Button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filters</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">Clear all</button>
                      )}
                    </div>
                    {availableStatuses.length > 0 && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">By Status</span>
                        <div className="space-y-1">
                          {availableStatuses.map(status => (
                            <label key={status} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-xs">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  statusFilters.has(status)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300'
                                }`}
                                onClick={() => toggleStatusFilter(status)}
                              >
                                {statusFilters.has(status) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-gray-700 font-medium">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {availableTypes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">By Type</span>
                        <div className="space-y-1">
                          {availableTypes.map(type => (
                            <label key={type} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-xs">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  typeFilters.has(type)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300'
                                }`}
                                onClick={() => toggleTypeFilter(type)}
                              >
                                {typeFilters.has(type) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-gray-700 font-medium">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <Button onClick={() => setShowAddModal(true)} className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 pl-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    checked={data.length > 0 && data.every(row => row.selected)}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>POLICY NO</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>START DATE</TableHead>
                <TableHead>PREMIUM</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right pr-4">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row) => {
                const originalIndex = data.findIndex(d => d.id === row.id);
                return (
                  <TableRow key={row.id} data-state={row.selected ? "selected" : undefined}>
                    <TableCell className="pl-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        checked={row.selected}
                        onChange={() => toggleSelect(originalIndex)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={row.avatar} className="w-8 h-8 rounded-full border border-gray-100 object-cover" alt="" />
                        <div>
                          <div className="font-medium text-gray-900">{row.customerName}</div>
                          <div className="text-xs text-gray-500">{row.customerId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/policies/${row.id}`} className="font-medium text-blue-600 hover:underline">{row.id}</Link>
                    </TableCell>
                    <TableCell className="text-gray-500">{row.type}</TableCell>
                    <TableCell className="text-gray-500">{row.startDate}</TableCell>
                    <TableCell className="font-medium text-gray-900">{row.premium}</TableCell>
                    <TableCell>
                      {row.status === 'Active' && <Badge variant="success" className="font-medium bg-green-50 text-green-700 border-green-200/50">{row.status}</Badge>}
                      {row.status === 'Pending' && <Badge variant="warning" className="font-medium bg-orange-50 text-orange-600 border-orange-200/50">{row.status}</Badge>}
                      {row.status === 'Under Review' && <Badge variant="info" className="font-medium bg-blue-50 text-blue-600 border-blue-200/50">{row.status}</Badge>}
                      {row.status === 'Expired' && <Badge variant="danger" className="font-medium bg-red-50 text-red-600 border-red-200/50">{row.status}</Badge>}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/policies/${row.id}`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors" title="See Policy Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setEditingPolicy(row)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="Edit Policy Details">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id, row.dbId)} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">
              {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span> of <span className="font-medium text-gray-900">{filteredData.length}</span> records
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-gray-500 bg-white border-gray-200 pr-3 gap-1"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
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
              className="h-8 text-gray-500 bg-white border-gray-200 pl-3 gap-1"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-150 transform animate-in zoom-in duration-150">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Create New Insurance Policy</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer Full Name (or Sponsor Company)</label>
                <Input 
                  required 
                  value={newPolicy.customerName} 
                  onChange={(e) => setNewPolicy({ ...newPolicy, customerName: e.target.value })} 
                  placeholder="e.g. Mulugeta Yohannes" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Insurance Product Type</label>
                  <select 
                    value={newPolicy.type}
                    onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Auto Insurance">Auto Insurance</option>
                    <option value="Home Insurance">Home Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Health Insurance">Health Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Policy Status</label>
                  <select 
                    value={newPolicy.status}
                    onChange={(e) => setNewPolicy({ ...newPolicy, status: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yearly Cover Premium (ETB)</label>
                <Input 
                  type="number"
                  required
                  value={newPolicy.premium} 
                  onChange={(e) => setNewPolicy({ ...newPolicy, premium: e.target.value })} 
                  placeholder="e.g. 15000" 
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Issue Policy Cover</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-150 transform animate-in zoom-in duration-150">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Edit Insurance Policy ({editingPolicy.id})</h2>
              <button onClick={() => setEditingPolicy(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdatePolicy} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer Full Name (or Sponsor Company)</label>
                <Input 
                  required 
                  value={editingPolicy.customerName} 
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, customerName: e.target.value })} 
                  placeholder="e.g. Mulugeta Yohannes" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Insurance Product Type</label>
                  <select 
                    value={editingPolicy.type}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, type: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Auto Insurance">Auto Insurance</option>
                    <option value="Home Insurance">Home Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Health Insurance">Health Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Policy Status</label>
                  <select 
                    value={editingPolicy.status}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, status: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yearly Cover Premium (ETB)</label>
                <Input 
                  required
                  value={editingPolicy.premium !== undefined && editingPolicy.premium !== null ? editingPolicy.premium.toString().replace(/[^0-9.-]+/g,"") : ''} 
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, premium: e.target.value })} 
                  placeholder="e.g. 15000" 
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingPolicy(null)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Save Policy Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
