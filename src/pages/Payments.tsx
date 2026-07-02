import React, { useState, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import {
  Plus, Search, CalendarDays, ChevronDown, Filter, Download as DownloadIcon, Eye, Check, AlertCircle,
  CreditCard, Clock, Calendar, ArrowDown, FileText, Smartphone, Landmark, Banknote, Receipt,
  ChevronLeft, ChevronRight, Upload, X, Trash2
} from 'lucide-react';

function MethodBadge({ method }: { method: string }) {
  if (method === 'Bank Transfer') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-semibold">
        <Landmark className="w-3.5 h-3.5" />
        Bank Transfer
      </div>
    );
  }
  if (method === 'Cash') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">
        <ArrowDown className="w-3.5 h-3.5" />
        Cash
      </div>
    );
  }
  if (method === 'Cheque') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 text-purple-600 text-xs font-semibold">
        <Receipt className="w-3.5 h-3.5" />
        Cheque
      </div>
    );
  }
  if (method === 'Mobile') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-teal-50 text-teal-600 text-xs font-semibold">
        <Smartphone className="w-3.5 h-3.5" />
        Mobile
      </div>
    );
  }
  return null;
}

export default function PaymentsPage() {
  const { selectedCompanyId } = useTenant();
  const [payments, setPayments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeMethod, setActiveMethod] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [viewingPayment, setViewingPayment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ policyId: '', amount: '', method: 'Cash', status: 'Completed' });

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments?companyId=${selectedCompanyId ?? 1}`);
      if (res.ok) {
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any, idx: number) => ({
          dbId: dbRow.Payment_Id,
          id: `PAY-${(dbRow.Payment_Id !== undefined && dbRow.Payment_Id !== null ? dbRow.Payment_Id : idx + 1).toString().padStart(4, '0')}`,
          policy: `POL-${(dbRow.Policy_Id || 0).toString().padStart(4, '0')}`,
          customer: `Customer #${dbRow.Policy_Id || 0}`,
          method: dbRow.Payment_Method || 'Cash',
          amount: `ETB ${Number(dbRow.Amount || 0).toLocaleString()}`,
          rawAmount: Number(dbRow.Amount || 0),
          date: dbRow.Payment_Date || '-',
          status: dbRow.Status,
          avatar: `https://ui-avatars.com/api/?name=CUS${dbRow.Policy_Id || idx}&background=random`
        }));
        setPayments(mapped);
      }
    } catch (e) { console.error(e); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/payment-schedules?companyId=${selectedCompanyId ?? 1}`);
      if (res.ok) {
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any, idx: number) => ({
          id: `SCH-${(dbRow.Schedule_Id !== undefined && dbRow.Schedule_Id !== null ? dbRow.Schedule_Id : idx + 1).toString().padStart(4, '0')}`,
          policy: `POL-${(dbRow.Policy_Id || 0).toString().padStart(4, '0')}`,
          customer: `Customer #${dbRow.Policy_Id || 0}`,
          amount: `ETB ${Number(dbRow.Amount_Due || dbRow.Amount || 0).toLocaleString()}`,
          rawAmount: Number(dbRow.Amount_Due || dbRow.Amount || 0),
          date: dbRow.Due_Date || '-',
          status: dbRow.Status,
          dueContext: '',
          installment: dbRow.Installment_Number ? `${dbRow.Installment_Number} of 12` : '1 of 12'
        }));
        setSchedules(mapped);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchPayments();
    fetchSchedules();
  }, []);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/payments?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Policy_Id: newPayment.policyId ? parseInt(newPayment.policyId.replace('POL-', ''), 10) : 1,
          Amount: parseFloat(newPayment.amount) || 0,
          Payment_Method: newPayment.method,
          Status: newPayment.status
        })
      });
      if (res.ok) {
        await fetchPayments();
        setIsRecordModalOpen(false);
        setNewPayment({ policyId: '', amount: '', method: 'Cash', status: 'Completed' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePaymentStatus = async (dbId: number, status: string) => {
    try {
      const res = await fetch(`/api/payments/${dbId}?companyId=${selectedCompanyId ?? 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: status })
      });
      if (res.ok) {
        await fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async (dbId: number) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      try {
        const res = await fetch(`/api/payments/${dbId}?companyId=${selectedCompanyId ?? 1}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchPayments();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const methods = ['All', 'Cash', 'Bank Transfer', 'Cheque', 'Mobile'];
  const statuses = ['All', 'Completed', 'Pending', 'Failed'];

  const filteredData = payments.filter(payment => {
    if (activeMethod !== 'All' && payment.method !== activeMethod) return false;
    const queryStatus = activeStatus === 'Failed' ? 'Overdue' : activeStatus;
    if (activeStatus !== 'All' && payment.status !== queryStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        payment.id.toLowerCase().includes(q) ||
        payment.policy.toLowerCase().includes(q) ||
        payment.customer.toLowerCase().includes(q) ||
        payment.method.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track received payments, pending balances, and installment schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsRecordModalOpen(true)} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {(() => {
        const totalReceived = payments
          .filter(p => p.status === 'Completed' || p.status === 'Paid')
          .reduce((sum, p) => sum + Number(p.rawAmount || 0), 0);
        const pendingBalance = schedules
          .filter(s => s.status === 'Upcoming' || s.status === 'Pending')
          .reduce((sum, s) => sum + Number(s.rawAmount || 0), 0);
        const overdueAmount = schedules
          .filter(s => s.status === 'Overdue')
          .reduce((sum, s) => sum + Number(s.rawAmount || 0), 0);
        const thisMonth = payments
          .filter(p => {
            if (!p.date || p.date === '-') return false;
            const d = new Date(p.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((sum, p) => sum + Number(p.rawAmount || 0), 0);
        const pendingCount = schedules.filter(s => s.status === 'Upcoming' || s.status === 'Pending').length;
        const overdueCount = schedules.filter(s => s.status === 'Overdue').length;

        return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">ETB {totalReceived >= 1000000 ? `${(totalReceived / 1000000).toFixed(1)}M` : totalReceived >= 1000 ? `${(totalReceived / 1000).toFixed(0)}K` : totalReceived.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Total Received</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-amber-600">{pendingCount} items</div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">ETB {pendingBalance >= 1000000 ? `${(pendingBalance / 1000000).toFixed(1)}M` : pendingBalance >= 1000 ? `${(pendingBalance / 1000).toFixed(0)}K` : pendingBalance.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Pending Balance</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{overdueCount} items</div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">ETB {overdueAmount >= 1000000 ? `${(overdueAmount / 1000000).toFixed(1)}M` : overdueAmount >= 1000 ? `${(overdueAmount / 1000).toFixed(0)}K` : overdueAmount.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Overdue Amount</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-emerald-600">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">ETB {thisMonth >= 1000000 ? `${(thisMonth / 1000000).toFixed(1)}M` : thisMonth >= 1000 ? `${(thisMonth / 1000).toFixed(0)}K` : thisMonth.toLocaleString()}</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">This Month</p>
          </div>
        </div>
      </div>
        );
      })()}

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search payments, policies, customers..."
                  className="pl-9 h-10 bg-gray-50 border-gray-200"
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto h-10 gap-2 text-gray-600 bg-white border-gray-200 flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {new Date().toLocaleDateString('en-US', { month: 'short' })} 1 – {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 sm:pb-0">
              {/* Method Tabs */}
              <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap min-w-max">
                {methods.map(method => (
                  <button
                    key={method}
                    onClick={() => { setActiveMethod(method); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeMethod === method ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Status Tabs */}
              <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap min-w-max">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => { setActiveStatus(status); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeStatus === status ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <Button variant="outline" className="h-10 gap-2 text-gray-600 bg-white border-gray-200 flex-shrink-0">
                <Filter className="w-4 h-4 text-gray-400" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-3 font-semibold text-gray-500 pl-6">PAYMENT ID</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">POLICY NO</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500 w-64">CUSTOMER</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">METHOD</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">AMOUNT</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">DATE</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">STATUS</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((payment) => (
                  <TableRow key={payment.id} className={`hover:bg-gray-50/50 border-b-gray-100 relative ${payment.status === 'Overdue' ? 'bg-red-50/10 hover:bg-red-50/30' : ''}`}>
                    {payment.status === 'Overdue' && (
                      <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 p-0 border-0"></td>
                    )}
                    <TableCell className="py-3 pl-6">
                      <a href="#" className="font-semibold text-sm text-blue-600 hover:underline">{payment.id}</a>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{payment.policy}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={payment.avatar} className="w-7 h-7 rounded-full border border-gray-100" alt={payment.customer} />
                        <span className="font-medium text-gray-900 text-sm">{payment.customer}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <MethodBadge method={payment.method} />
                    </TableCell>
                    <TableCell className="py-3 text-sm font-bold text-gray-900">{payment.amount}</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{payment.date}</TableCell>
                    <TableCell className="py-3">
                      {payment.status === 'Completed' && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Completed</Badge>}
                      {payment.status === 'Pending' && <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>}
                      {payment.status === 'Overdue' && <Badge variant="danger" className="bg-red-50 text-red-600 border-red-200/60 font-medium">Overdue</Badge>}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingPayment(payment)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="View Payment Receipt">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === 'Completed' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-800">
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                        ) : payment.status === 'Pending' ? (
                          <Button variant="ghost" size="icon" onClick={() => handleUpdatePaymentStatus(payment.dbId, 'Completed')} className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600" title="Complete Payment">
                            <Check className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleUpdatePaymentStatus(payment.dbId, 'Completed')} className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" title="Settle Overdue">
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment.dbId)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete record">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">
                {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> payments
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

      {/* Upcoming Schedules Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">Upcoming Installment Schedules</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Next 30 days · <span className="text-red-500 font-medium">{schedules.filter(s => s.status === 'Overdue').length} overdue</span></p>
          </div>
          <Link to="/payment-schedules">
            <Button variant="link" className="text-blue-600 text-sm font-semibold h-auto p-0">
              View All Schedules
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-3 font-semibold text-gray-500 pl-6">SCHEDULE ID</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">POLICY NO</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">CUSTOMER</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">AMOUNT DUE</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">DUE DATE</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">INSTALLMENT</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500 pr-6">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id} className={`hover:bg-gray-50/50 border-b-gray-100 relative ${schedule.status === 'Overdue' ? 'bg-red-50/10 hover:bg-red-50/30' : ''}`}>
                    {schedule.status === 'Overdue' && (
                      <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 p-0 border-0"></td>
                    )}
                    <TableCell className="py-3 pl-6">
                      <span className="font-semibold text-sm text-gray-900">{schedule.id}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <a href="#" className="text-sm font-medium text-blue-600 hover:underline">{schedule.policy}</a>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-600">{schedule.customer}</TableCell>
                    <TableCell className={`py-3 text-sm font-bold ${schedule.status === 'Overdue' ? 'text-red-600' : 'text-gray-900'}`}>{schedule.amount}</TableCell>
                    <TableCell className="py-3">
                      {schedule.dueContext ? (
                        <div className={`text-xs font-semibold ${schedule.status === 'Overdue' ? 'text-red-500' : 'text-amber-500'}`}>
                          {schedule.date} · {schedule.dueContext}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">{schedule.date}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{schedule.installment}</TableCell>
                    <TableCell className="py-3 pr-6">
                      {schedule.status === 'Overdue' && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200/60 font-medium">Overdue</Badge>}
                      {schedule.status === 'Due Soon' && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Due Soon</Badge>}
                      {schedule.status === 'Upcoming' && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200/60 font-medium">Upcoming</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Payment Receipt Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Transaction Receipt Details
              </span>
              <button onClick={() => setViewingPayment(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center pb-2 border-b">
                <p className="text-2xl font-black text-gray-950 tracking-tight">{viewingPayment.amount}</p>
                <p className="text-xs text-gray-500 mt-1">Transaction Ref: <span className="font-mono text-gray-700">{viewingPayment.id}</span></p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Policy Number</span>
                  <Link to={`/policies/${viewingPayment.policy}`} className="font-bold text-blue-600 hover:underline">{viewingPayment.policy}</Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Customer Name</span>
                  <span className="text-gray-900 font-bold">{viewingPayment.customer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Payment Channel</span>
                  <span className="text-gray-800 font-semibold">{viewingPayment.method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Transaction Date</span>
                  <span className="text-gray-800 font-medium">{viewingPayment.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Settlement Status</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${viewingPayment.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {viewingPayment.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                <Button size="sm" variant="outline" className="text-gray-700" onClick={() => setViewingPayment(null)}>Dismiss Receipt</Button>
                {viewingPayment.status === 'Completed' && (
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex items-center gap-1.5">
                    <DownloadIcon className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 font-sans">
                <CreditCard className="w-4 h-4 text-blue-600" /> Record Client Payment
              </span>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 font-sans">Policy ID</label>
                <Input
                  required
                  value={newPayment.policyId}
                  onChange={e => setNewPayment(prev => ({ ...prev, policyId: e.target.value }))}
                  placeholder="Policy number"
                  className="h-10 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 font-sans">Amount (ETB)</label>
                <Input
                  required
                  type="number"
                  step="any"
                  value={newPayment.amount}
                  onChange={e => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  className="h-10 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 font-sans">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={e => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full rounded-md border border-gray-200 bg-white h-10 px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Mobile">Mobile Payment (CBE Birr / Telebirr)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 font-sans">Initial Status</label>
                <select
                  value={newPayment.status}
                  onChange={e => setNewPayment(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-md border border-gray-200 bg-white h-10 px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Completed">Completed (Settled)</option>
                  <option value="Pending">Pending (Awaiting Verification)</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                <Button type="button" size="sm" variant="outline" className="text-gray-750 font-semibold" onClick={() => setIsRecordModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 shadow">Submit Receipt</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
