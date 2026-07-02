import React, { useState, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Eye, Edit2, MoreVertical, Trash2, X,
  ChevronLeft, ChevronRight, Download, Users, UserCheck, UserPlus, Calendar, Loader2
} from 'lucide-react';

export default function CustomersPage() {
  const { selectedCompanyId } = useTenant();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', branch: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filters = ['All', 'Active', 'Inactive'];

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?companyId=${selectedCompanyId ?? 1}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const rawData = await res.json();

      const mapped = rawData.map((dbRow: any, idx: number) => {
        const first = dbRow.First_Name || 'Generic';
        const last = dbRow.Last_Name || 'Customer';
        const dbId = dbRow.Customer_Id !== undefined && dbRow.Customer_Id !== null ? dbRow.Customer_Id : (idx + 1);
        return {
          id: dbRow.Fayda_No || `CUS-${dbId.toString().padStart(4, '0')}`,
          dbId: dbId,
          name: `${first} ${last}`,
          email: dbRow.Email || 'No Email',
          phone: dbRow.Phone || 'N/A',
          branch: dbRow.Branch || 'HQ',
          status: dbRow.Fayda_No ? 'Active' : 'Pending',
          policies: dbRow.Policies_Count || 0,
          registrationDate: dbRow.Registration_Date,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(first + ' ' + last)}&background=random`,
          selected: false
        };
      });
      setData(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleSelect = (index: number) => {
    const newData = [...data];
    newData[index].selected = !newData[index].selected;
    setData(newData);
  };

  const toggleAll = () => {
    const allSelected = data.length > 0 && data.every(row => row.selected);
    setData(data.map(row => ({ ...row, selected: !allSelected })));
  };

  const handleDelete = async (id: string, dbId: number) => {
    try {
      const res = await fetch(`/api/customers/${dbId}?companyId=${selectedCompanyId ?? 1}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const parts = newCustomer.name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ') || '';

    try {
      const res = await fetch(`/api/customers?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: first,
          Last_Name: last,
          Email: newCustomer.email,
        })
      });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setNewCustomer({ name: '', email: '', phone: '', branch: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const parts = editingCustomer.name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ') || '';

    try {
      const res = await fetch(`/api/customers/${editingCustomer.dbId}?companyId=${selectedCompanyId ?? 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: first,
          Last_Name: last,
          Email: editingCustomer.email,
        })
      });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
    setEditingCustomer(null);
  };

  const filteredData = data.filter(c => {
    if (activeFilter !== 'All' && c.status !== activeFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your insured clients and their contact details</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAddModal(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name</label>
                <Input required value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Customer name" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Email Address</label>
                <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Email address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number</label>
                  <Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+251 91 234 5678" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Branch</label>
                  <Input value={newCustomer.branch} onChange={e => setNewCustomer({ ...newCustomer, branch: e.target.value })} placeholder="Addis Ababa" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Customer</Button>
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.length.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.filter(d => d.status === 'Active').length.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">New This Month</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.filter(c => {
                const regDate = new Date(c.registrationDate || Date.now());
                const now = new Date();
                return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
              }).length.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search by name, email, phone..." className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm" />
            </div>

            <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 h-10 text-gray-700 bg-white shadow-sm border-gray-200 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Button>
            <Button variant="outline" className="gap-2 h-10 text-gray-700 bg-white shadow-sm border-gray-200 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              Filter
            </Button>
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
                      checked={data.every(row => row.selected)}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 w-[240px]">CUSTOMER</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">EMAIL</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">PHONE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">BRANCH</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-center">POLICIES</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => {
                  const originalIdx = data.findIndex(d => d.id === row.id);
                  return (
                    <TableRow key={row.id} data-state={row.selected ? "selected" : undefined} className="border-b-gray-50">
                      <TableCell className="pl-6">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer"
                          checked={row.selected}
                          onChange={() => toggleSelect(originalIdx)}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={row.avatar} className="w-9 h-9 rounded-full border border-gray-100 object-cover" alt="" />
                          <div>
                            <Link to={`/customers/${row.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm block">{row.name}</Link>
                            <div className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">{row.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-500">{row.email}</TableCell>
                      <TableCell className="py-3 text-sm text-gray-500">{row.phone}</TableCell>
                      <TableCell className="py-3 text-sm text-gray-500">{row.branch}</TableCell>
                      <TableCell className="py-3">
                        {row.status === 'Active' && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Active</Badge>}
                        {row.status === 'Pending' && <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>}
                        {row.status === 'Inactive' && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200/60 font-medium">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${row.policies > 0 ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100/50' : 'bg-gray-50 text-gray-400'}`}>
                          {row.policies}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/customers/${row.id}`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(row)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="Edit Customer Details">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(row.id, row.dbId)} variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">
                {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> customers
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 bg-white border-gray-200"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 p-0 ${currentPage === page
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
                className="h-8 w-8 p-0 text-gray-500 bg-white border-gray-200"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-105 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-gray-900 text-sm">Edit Customer ({editingCustomer.id})</h2>
              <button onClick={() => setEditingCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name</label>
                <Input
                  required
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={editingCustomer.email}
                  onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number</label>
                  <Input
                    value={editingCustomer.phone}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="+251 91 234 5678"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Branch</label>
                  <Input
                    value={editingCustomer.branch}
                    onChange={e => setEditingCustomer({ ...editingCustomer, branch: e.target.value })}
                    placeholder="Addis Ababa"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Status</label>
                <select
                  value={editingCustomer.status}
                  onChange={e => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">Save Customer Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
