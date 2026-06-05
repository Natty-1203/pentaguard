import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Download, FileText, CheckCircle, Clock, AlertCircle, X, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function SaaSInvoicesPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const fetchAllData = async () => {
    try {
      const [invRes, creRes, plaRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/companies'),
        fetch('/api/subscription-plans')
      ]);
      const companyMap: Record<number, string> = {};
      const planMap: Record<number, string> = {};
      if (creRes.ok) {
        const c = await creRes.json();
        setCompanies(c);
        c.forEach((co: any) => { companyMap[co.Company_Id] = co.Company_Name; });
      }
      if (plaRes.ok) {
        const p = await plaRes.json();
        setPlans(p);
        p.forEach((pl: any) => { planMap[pl.Plan_Id] = pl.Plan_Name; });
      }
      if (invRes.ok) {
        const rawData = await invRes.json();
        const mapped = rawData.map((dbRow: any) => {
          const invId = dbRow.Invoice_Id ?? 0;
          const compId = dbRow.Company_Id ?? 0;
          const planId = dbRow.Plan_Id ?? 0;
          const amt = dbRow.Amount ?? 0;
          const iss = dbRow.Invoice_Date ?? '-';
          const due = dbRow.Due_Date ?? '-';
          const stat = dbRow.Status ?? 'Pending';

          return {
            id: `INV-${invId.toString().padStart(4, '0')}`,
            dbId: invId,
            company: companyMap[compId] || `Company #${compId}`,
            plan: planMap[planId] || 'Professional',
            amount: `ETB ${Number(amt).toLocaleString()}`,
            issuedDate: new Date(iss).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) !== 'Invalid Date' ? new Date(iss).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : iss,
            dueDate: new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) !== 'Invalid Date' ? new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : due,
            status: stat,
            statusVariant: stat === 'Paid' ? 'success' : stat === 'Overdue' ? 'rejected' : 'pending'
          };
        });
        setData(mapped);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  // New Invoice Form state
  const [formCompany, setFormCompany] = useState('');
  const [formPlan, setFormPlan] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formIssued, setFormIssued] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formStatus, setFormStatus] = useState('Pending');

  const filters = ['All', 'Paid', 'Pending', 'Overdue', 'Unpaid', 'Draft'];

  // Helper to parse numeric values from "ETB 150,000" or similar
  const parseAmount = (amtStr: string) => {
    const cleanNum = amtStr.replace(/[^0-9]/g, '');
    return parseInt(cleanNum) || 0;
  };

  // Dynamic KPI calculations
  const totalInvoiced = data.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const totalPaid = data.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const totalOverdue = data.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + parseAmount(curr.amount), 0);

  // Filter application
  const filteredData = data.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.status === activeFilter;
    const matchesSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.plan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(formAmount.replace(/,/g, '')) || 0;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Company_Id: parseInt(formCompany) || (companies[0]?.Company_Id || 1),
          Plan_Id: parseInt(formPlan) || (plans[0]?.Plan_Id || 1),
          Issued_Date: formIssued,
          Due_Date: formDue,
          Total_Amount: cleanAmt,
          Status: formStatus
        })
      });
      if (res.ok) await fetchInvoices();
    } catch (err) { console.error(err); }

    setIsCreateOpen(false);
  };

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to void and delete invoice ${id}?`)) {
      try {
        const res = await fetch(`/api/invoices/${parseInt(id.replace('INV-',''), 10)}`, { method: 'DELETE' });
        if (res.ok) await fetchInvoices();
      } catch (err) { console.error(err); }
      if (viewingInvoice?.id === id) {
        setViewingInvoice(null);
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${parseInt(id.replace('INV-',''), 10)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus })
      });
      if (res.ok) await fetchInvoices();
      if (viewingInvoice && viewingInvoice.id === id) {
        setViewingInvoice({ ...viewingInvoice, status: newStatus });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tenant billing, view invoices, and track payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards & Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Invoiced (Dynamic)</p>
            <h3 className="text-xl font-black text-gray-905">ETB {totalInvoiced.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Paid (Dynamic)</p>
            <h3 className="text-xl font-black text-emerald-650">ETB {totalPaid.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overdue (Dynamic)</p>
            <h3 className="text-xl font-black text-red-650">ETB {totalOverdue.toLocaleString()}</h3>
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
                placeholder="Search company, invoice..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-gray-5/50 border-gray-200 h-10 text-sm" 
              />
            </div>
            
            <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap overflow-x-auto">
              {filters.map(filter => (
                <button
                  type="button"
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
                <TableRow className="hover:bg-transparent border-b-gray-101">
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[180px]">INVOICE ID</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 w-[220px]">COMPANY</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">PLAN</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">AMOUNT</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">DATE ISSUED</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">DUE DATE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id} className="border-b-gray-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setViewingInvoice(row)}>
                    <TableCell className="py-3 pl-6">
                      <span className="font-bold text-blue-600 hover:underline">{row.id}</span>
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-gray-900 text-sm">{row.company}</TableCell>
                    <TableCell className="py-3 text-sm text-gray-600">{row.plan}</TableCell>
                    <TableCell className="py-3 font-bold text-gray-900 text-right text-sm">{row.amount}</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.issuedDate}</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.dueDate}</TableCell>
                    <TableCell className="py-3">
                      {row.status === 'Paid' && <Badge variant="success" className="bg-emerald-55 text-emerald-700 border-emerald-200/60 font-medium">Paid</Badge>}
                      {row.status === 'Pending' && <Badge variant="warning" className="bg-amber-55 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>}
                      {row.status === 'Overdue' && <Badge variant="destructive" className="bg-red-55 text-red-700 border-red-200/60 font-medium">Overdue</Badge>}
                      {row.status === 'Draft' && <Badge variant="outline" className="bg-gray-55/70 text-gray-600 border-gray-200/60 font-medium">Draft</Badge>}
                      {row.status === 'Unpaid' && <Badge variant="warning" className="bg-orange-50 text-orange-600 border-orange-200/60 font-medium">Unpaid</Badge>}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => alert(`Simulating invoice PDF generation for ${row.id}... Success!`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={(e) => handleDeleteInvoice(row.id, e)}
                        >
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
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> invoices
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

      {/* Create Invoice Dialog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in scale-in duration-200">
            <div className="p-4 border-b bg-slate-50 border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-blue-600" /> Create Corporate Invoice
              </span>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Select Affiliate Company *</label>
                <select 
                  value={formCompany} 
                  onChange={e => setFormCompany(e.target.value)}
                  className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800"
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.Company_Id} value={c.Company_Id}>{c.Company_Name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">SaaS Plan Tier</label>
                  <select 
                    value={formPlan} 
                    onChange={e => setFormPlan(e.target.value)}
                    className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800"
                  >
                    <option value="">Select Plan</option>
                    {plans.map(p => (
                      <option key={p.Plan_Id} value={p.Plan_Id}>{p.Plan_Name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Amount Due (ETB) *</label>
                  <Input type="text" required placeholder="e.g. 15,000" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="h-10 text-xs font-bold text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Issued Date *</label>
                  <Input type="text" required placeholder="e.g. May 15, 2024" value={formIssued} onChange={e => setFormIssued(e.target.value)} className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Due Date *</label>
                  <Input type="text" required placeholder="e.g. May 29, 2024" value={formDue} onChange={e => setFormDue(e.target.value)} className="h-10 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Initial Payment Status</label>
                <select 
                  value={formStatus} 
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold"
                >
                  <option value="Pending">Pending (unpaid)</option>
                  <option value="Paid">Paid System Invoice</option>
                  <option value="Overdue">Overdue Outstanding</option>
                  <option value="Draft">Draft Only</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 flex items-center gap-1 shadow">
                  <CheckCircle className="w-4 h-4" /> Issue Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Viewer Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200 border text-xs">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-600 text-xs tracking-wider">{viewingInvoice.id}</span>
                <span className="text-gray-300 font-light">|</span>
                <span className="font-bold text-gray-700 text-xs tracking-tight">SECURE SYSTEM BILLING OVERVIEW</span>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-gray-901 leading-tight">{viewingInvoice.company}</h3>
                  <p className="text-gray-500 font-medium mt-1">Pricing Plan Variant: <Badge variant="outline" className="ml-1 bg-blue-50/50 font-bold">{viewingInvoice.plan}</Badge></p>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Amount Invoiced</span>
                  <p className="text-xl font-black text-blue-600 mt-1">{viewingInvoice.amount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Date Issued</span>
                  <p className="font-bold text-gray-701 mt-1">{viewingInvoice.issuedDate}</p>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Payment Due Date</span>
                  <p className="font-bold text-red-500 mt-1">{viewingInvoice.dueDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Change Invoiced Status</span>
                <div className="flex gap-2">
                  {['Paid', 'Pending', 'Overdue', 'Draft'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(viewingInvoice.id, st)}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all border ${
                        viewingInvoice.status === st 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-650 hover:bg-slate-50 border-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-dashed border-blue-150 rounded-lg text-blue-800 leading-relaxed italic text-[11px]">
                Notice: System invoice issued securely via administrative control plane. Payment status changes will recursively sync with automatic subscription renewal algorithms.
              </div>

              <div className="pt-4 border-t flex justify-between items-center gap-3">
                <button 
                  type="button" 
                  onClick={(e) => {
                    handleDeleteInvoice(viewingInvoice.id, e);
                  }}
                  className="text-red-650 hover:bg-red-50 hover:text-red-700 font-bold text-xs flex items-center gap-1 p-2 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Void Invoice
                </button>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setViewingInvoice(null)}>Close</Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5"
                    onClick={() => alert(`Document download initialized for ${viewingInvoice.id}! Check your local system directories.`)}
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
