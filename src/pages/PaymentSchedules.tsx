import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Calendar, Download, DollarSign, AlertCircle, CheckCircle, Clock, Eye, MoreVertical, CreditCard,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/status-badge';

export default function PaymentSchedulesPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSchedules = async () => {
    try {
      const [schRes, polRes, cusRes] = await Promise.all([
        fetch('/api/payment-schedules'),
        fetch('/api/policies'),
        fetch('/api/customers')
      ]);
      if (schRes.ok && polRes.ok && cusRes.ok) {
        const rawData = await schRes.json();
        const policies = await polRes.json();
        const customers = await cusRes.json();
        const policyMap = Object.fromEntries(policies.map((p: any) => [p.Policy_Id, p]));
        const customerMap = Object.fromEntries(customers.map((c: any) => [c.Customer_Id, c]));
        const mapped = rawData.map((dbRow: any) => {
          const pol = policyMap[dbRow.Policy_Id];
          const cus = pol ? customerMap[pol.Customer_Id] : null;
          return {
            id: (dbRow.Policy_Id || 0) + '-' + (dbRow.Installment_Number || 1),
            policyId: `POL-${(dbRow.Policy_Id || 0).toString().padStart(4, '0')}`,
            installment: dbRow.Installment_Number || 1,
            dueDate: dbRow.Due_Date || '-',
            amount: `ETB ${Number(dbRow.Amount || 0).toLocaleString()}`,
            rawAmount: Number(dbRow.Amount || 0),
            status: dbRow.Status,
            customer: cus ? `${cus.First_Name} ${cus.Last_Name}` : `Customer #${dbRow.Policy_Id || 0}`
          };
        });
        setData(mapped);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filters = ['All', 'Pending', 'Paid', 'Overdue', 'Waived'];

  const filteredData = data.filter(item => {
    if (activeFilter !== 'All' && item.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.policyId.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.installment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Manage planned installment schedules and due dates</p>
        </div>
      </div>

      {/* KPI Cards & Meta */}
      {(() => {
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcoming = data.filter(s => {
          if (!s.dueDate || s.dueDate === '-') return false;
          const d = new Date(s.dueDate);
          return d >= now && d <= in30Days && s.status !== 'Paid';
        }).length;
        const overdue = data.filter(s => s.status === 'Overdue').length;
        const collected = data
          .filter(s => s.status === 'Paid')
          .reduce((sum, s) => sum + (s.rawAmount || 0), 0);
        const collectedDisplay = collected >= 1000000
          ? `${(collected / 1000000).toFixed(1)}M`
          : collected >= 1000
            ? `${(collected / 1000).toFixed(0)}K`
            : collected.toLocaleString();

        return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
               <Clock className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Upcoming (30 Days)</p>
               <h3 className="text-2xl font-bold text-gray-900">{upcoming}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
               <AlertCircle className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Overdue Installments</p>
               <h3 className="text-2xl font-bold text-gray-900">{overdue}</h3>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 min-w-[220px]">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <DollarSign className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Collected (YTD)</p>
               <h3 className="text-2xl font-bold text-gray-900">{collectedDisplay}</h3>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          YTD: Jan – {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </div>
        );
      })()}

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search policies, customers..." 
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
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[200px]">POLICY</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">CUSTOMER</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">INSTALLMENT</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">DUE DATE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">AMOUNT</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 pl-8">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id} className="border-b-gray-50">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                        </div>
                        <Link to={`/policies/${row.policyId}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm">{row.policyId}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-700 font-medium">
                      <Link to="#" className="text-gray-900 hover:text-blue-600 hover:underline">{row.customer}</Link>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-600 font-medium">{row.installment}</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.dueDate}</TableCell>
                    <TableCell className="py-3 text-sm font-bold text-gray-900 text-right">{row.amount}</TableCell>
                    <TableCell className="py-3 pl-8">
                       <StatusBadge status={(row.status === 'Paid' ? 'success' : row.status === 'Overdue' ? 'rejected' : 'pending') as any} label={row.status} />
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/policies/${row.policyId}`} className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="See Associated Policy">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-800 transition-colors">
                          <MoreVertical className="w-4 h-4" />
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
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> schedules
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
