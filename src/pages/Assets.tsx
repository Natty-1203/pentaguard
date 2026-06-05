import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { 
  Car, Home, Heart, Activity, Search, Filter, Eye, MoreVertical, 
  ChevronLeft, ChevronRight, Download, Box, X
} from 'lucide-react';

export default function AssetsPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewingAsset, setViewingAsset] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 2;

  const fetchAssets = async () => {
    try {
      const [autoRes, homeRes] = await Promise.all([
        fetch('/api/auto-assets'),
        fetch('/api/home-assets')
      ]);
      const autoData = autoRes.ok ? await autoRes.json() : [];
      const homeData = homeRes.ok ? await homeRes.json() : [];
      
      const mappedAuto = autoData.map((a: any, idx: number) => ({
        id: `AST-AUTO-${(a.Asset_Id !== undefined && a.Asset_Id !== null ? a.Asset_Id : idx + 1).toString().padStart(3, '0')}`,
        type: 'Auto',
        description: `${a.Make || ''} ${a.Model || ''} ${a.Year || ''} (${a.VIN || ''})`,
        value: `ETB ${Number(a.Estimated_Value || 0).toLocaleString()}`,
        policyId: `POL-${(a.Policy_Id !== undefined && a.Policy_Id !== null ? a.Policy_Id : 0).toString().padStart(4, '0')}`,
        owner: `Customer #${a.Policy_Id || 0}`,
        status: 'Covered'
      }));

      const mappedHome = homeData.map((h: any, idx: number) => ({
        id: `AST-HOME-${(h.Asset_Id !== undefined && h.Asset_Id !== null ? h.Asset_Id : idx + 1).toString().padStart(3, '0')}`,
        type: 'Home',
        description: `${h.Property_Type || ''}, Built ${h.Year_Built || ''} (${h.Address || ''})`,
        value: `ETB ${Number(h.Estimated_Value || 0).toLocaleString()}`,
        policyId: `POL-${(h.Policy_Id !== undefined && h.Policy_Id !== null ? h.Policy_Id : 0).toString().padStart(4, '0')}`,
        owner: `Customer #${h.Policy_Id || 0}`,
        status: 'Covered'
      }));

      setData([...mappedAuto, ...mappedHome]);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filters = ['All', 'Auto', 'Home', 'Life', 'Health'];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Auto': return <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Car className="w-5 h-5" /></div>;
      case 'Home': return <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Home className="w-5 h-5" /></div>;
      case 'Life': return <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Heart className="w-5 h-5" /></div>;
      case 'Health': return <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Activity className="w-5 h-5" /></div>;
      default: return <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0"><Box className="w-5 h-5" /></div>;
    }
  };

  const filteredData = data.filter(item => {
    if (activeFilter !== 'All' && item.type !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q)
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Insured Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vehicles, properties, and specific covers tied to policies</p>
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
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search assets, plates, owners..." 
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
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[320px]">ASSET DETAILS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">TYPE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">ESTIMATED VALUE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">POLICY</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">OWNER</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500">STATUS</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id} className="border-b-gray-50">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        {getAssetIcon(row.type)}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{row.description}</p>
                          <p className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">{row.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-600 font-medium">{row.type}</TableCell>
                    <TableCell className="py-3 text-sm font-bold text-gray-900">{row.value}</TableCell>
                    <TableCell className="py-3">
                      <Link to={`/policies/${row.policyId}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                        {row.policyId}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-700">{row.owner}</TableCell>
                    <TableCell className="py-3">
                      {row.status === 'Covered' ? (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium">Covered</Badge>
                      ) : (
                        <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-200/60 font-medium">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingAsset(row)} className="h-8 w-8 text-gray-400 hover:text-gray-800" title="View Asset Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-800">
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
            </span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> assets
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

      {/* Asset Specifications Details Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 capitalize">
                Insured {viewingAsset.type} Specification
              </span>
              <button onClick={() => setViewingAsset(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-center py-2">
                {getAssetIcon(viewingAsset.type)}
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Asset Type</span>
                <span className="text-gray-950 font-bold text-sm">{viewingAsset.type}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Security Reference Code</span>
                <span className="font-mono text-gray-900 font-bold">{viewingAsset.id}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Estimated Coverage Value</span>
                <span className="text-blue-600 font-extrabold text-[13px]">{viewingAsset.value}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Registered Legal Owner</span>
                <span className="text-gray-800 font-semibold">{viewingAsset.owner}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Connected Policy ID</span>
                <Link to={`/policies/${viewingAsset.policyId}`} className="text-xs font-bold text-blue-600 hover:underline">{viewingAsset.policyId}</Link>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Description Details</span>
                <span className="text-gray-800 font-semibold">{viewingAsset.description}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-bold">Current Verification Status</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${viewingAsset.status === 'Covered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  {viewingAsset.status}
                </span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs" onClick={() => setViewingAsset(null)}>Dismiss Details</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
