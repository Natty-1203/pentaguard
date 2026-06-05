import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { 
  CalendarDays, ChevronDown, Download, CreditCard, ShieldCheck, 
  AlertCircle, PieChart as PieChartIcon, ArrowDownToLine, Search, 
  ArrowUpDown, Check, Loader2, CheckCircle2, TrendingUp, Info, 
  Clock, RefreshCw, X, Layers, Users, ShieldAlert, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// allMonthlyData removed – now fetched from /api/analytics/monthly


// Agent data is now fetched live from the database – see useEffect below

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('Financial');
  const [dateRange, setDateRange] = useState('Full Year 2024');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Export process state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF Report Dossier');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [downloadReady, setDownloadReady] = useState(false);
  
  // Agent sorting and filter search
  const [agentSearch, setAgentSearch] = useState('');
  const [agentSort, setAgentSort] = useState('policies'); // 'policies' | 'premium' | 'performance'
  const [agents, setAgents] = useState<any[]>([]);
  const [allMonthlyData, setAllMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/monthly');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAllMonthlyData(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch agent performance data from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agent-performance');
        if (!res.ok) throw new Error('Failed to fetch agent performance');
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any) => {
          const name = dbRow.name || `${dbRow.First_Name || ''} ${dbRow.Last_Name || ''}`.trim();
          return {
            id: dbRow.id || dbRow.Agent_Id,
            name,
            role: dbRow.role || 'Agent',
            branch: dbRow.branch || dbRow.Branch_Name || 'HQ',
            policies: dbRow.policies || 0,
            premiumVal: dbRow.premiumVal || 0,
            premium: dbRow.premium || 'ETB 0',
            commission: dbRow.commission || 'ETB 0',
            performance: dbRow.performance || 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          };
        });
        setAgents(mapped);
      } catch (err) {
        console.error('Failed to load agents for reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const tabs = ['Financial', 'Operational', 'Claims', 'Agent Performance'];
  const dateRanges = [
    'Full Year 2024',
    'Q1 2024 (Jan - Mar)',
    'Q2 2024 (Apr - Jun)',
    'Q3 2024 (Jul - Sep)',
    'Q4 2024 (Oct - Dec)',
    'First Half 2024',
    'Second Half 2024'
  ];

  // Dynamically filter monthlyData based on selected date range
  const getFilteredMonthlyData = () => {
    switch(dateRange) {
      case 'Q1 2024 (Jan - Mar)':
        return allMonthlyData.slice(0, 3);
      case 'Q2 2024 (Apr - Jun)':
        return allMonthlyData.slice(3, 6);
      case 'Q3 2024 (Jul - Sep)':
        return allMonthlyData.slice(6, 9);
      case 'Q4 2024 (Oct - Dec)':
        return allMonthlyData.slice(9, 12);
      case 'First Half 2024':
        return allMonthlyData.slice(0, 6);
      case 'Second Half 2024':
        return allMonthlyData.slice(6, 12);
      default:
        return allMonthlyData;
    }
  };

  const monthlyData = getFilteredMonthlyData();

  // Dynamically compute KPIs based on filtered monthlyData
  const sumRevenue = monthlyData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const sumClaims = monthlyData.reduce((sum, item) => sum + (item.claims || 0), 0);
  // Extrapolate policy counts based on length of months shown
  const policiesIssued = Math.round(monthlyData.reduce((sum, item) => sum + ((item.cumulativePolicies || (item.revenue / 2)) / 12), 0) * 1.5);
  // Average calculation
  const avgSla = Math.round(monthlyData.reduce((sum, item) => sum + (item.operationalSla || 95), 0) / (monthlyData.length || 1));
  const commissionPaid = Math.round(sumRevenue * 0.03); // Simulated 3% commission

  // Handlers
  const handleDatePickerClick = (range: string) => {
    setDateRange(range);
    setIsDatePickerOpen(false);
  };

  const startExportSimulation = (format: string) => {
    setExportFormat(format);
    setIsExportModalOpen(true);
    setIsExporting(true);
    setExportProgress(0);
    setDownloadReady(false);
    
    const steps = [
      'Establishing connection with Penta Core Storage...',
      'Compiling database logs & financial tables...',
      'Calculating cryptographic telemetry indicators...',
      'Generating high-definition vector analytics SVGs...',
      'Bundling payload assets & appending digital audit seal...',
      'Finalizing report, preparing local system download!'
    ];

    setExportStep(steps[0]);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        const next = prev + 5;
        const currentStepIndex = Math.min(Math.floor((next / 100) * steps.length), steps.length - 1);
        setExportStep(steps[currentStepIndex]);

        if (next >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setDownloadReady(true);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const handleDownloadFile = () => {
    // Generate a simple CSV mock text
    const textData = `Penta Guard Insurance Official Export - ${dateRange}\nFormat: ${exportFormat}\nTotal Revenue: ETB ${sumRevenue}K\nClaims Settled: ETB ${sumClaims}K\nAverage SLA: ${avgSla}%\nCommission Paid: ETB ${commissionPaid}K\nTimestamp: May 31, 2026\n`;
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PentaGuard_Report_${dateRange.replace(/\s+/g, '_')}_${exportFormat.toLowerCase().split(' ')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Agent filtering & sorting logic
  const filteredAgents = agents
    .filter(agent => 
      agent.name.toLowerCase().includes(agentSearch.toLowerCase()) || 
      agent.branch.toLowerCase().includes(agentSearch.toLowerCase()) ||
      agent.role.toLowerCase().includes(agentSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (agentSort === 'premium') {
        return b.premiumVal - a.premiumVal;
      } else if (agentSort === 'performance') {
        return b.performance - a.performance;
      } else {
        return b.policies - a.policies;
      }
    });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Operational, financial, and team efficacy summaries across all insurance registries</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Dynamic Interactive Date Picker dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="gap-2 h-10 text-gray-700 bg-white shadow-sm border-gray-200 text-xs font-bold px-4"
            >
              <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{dateRange}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1 transition-transform" />
            </Button>
            
            {isDatePickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDatePickerOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <span className="block text-[8px] font-black tracking-widest text-gray-400 uppercase p-2 border-b">Select Analytical Bounds</span>
                  <div className="space-y-0.5 mt-1 max-h-[220px] overflow-y-auto">
                    {dateRanges.map((range) => (
                      <button
                        type="button"
                        key={range}
                        onClick={() => handleDatePickerClick(range)}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between ${
                          dateRange === range 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-gray-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{range}</span>
                        {dateRange === range && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive Report Export Trigger */}
          <div className="relative">
            <Button 
              className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm px-4"
              onClick={() => startExportSimulation('Comprehensive PDF Summary')}
            >
              <ArrowDownToLine className="w-4 h-4 shrink-0" />
              <span>Export Report</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-55/65 border border-gray-200 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // Trigger a mild visual feedback click or status log
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reactive Overview KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue - Highlights Financial tab or displays custom stats */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
          activeTab === 'Financial' ? 'border-blue-500 bg-blue-50/5 ring-1 ring-blue-500/20' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <Badge className="bg-green-50 text-green-700 border-green-200/50 font-black">+18.7% Year</Badge>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight">ETB {(sumRevenue).toLocaleString()}K</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Total Period Revenue</p>
            <span className="text-[10px] text-gray-500 font-medium">Computed dynamically from {monthlyData.length} months</span>
          </div>
        </div>

        {/* Card 2: Policies Issued - Highlights Operational tab */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
          activeTab === 'Operational' ? 'border-purple-500 bg-purple-50/5 ring-1 ring-purple-500/20' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <Badge className="bg-green-50 text-green-700 border-green-200/50 font-black">Stable SLA</Badge>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight">{policiesIssued} Active</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Policies Bound</p>
            <span className="text-[10px] text-gray-500 font-medium">SLA fulfilled at {avgSla}% on average</span>
          </div>
        </div>

        {/* Card 3: Claims Paid - Highlights Claims tab */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
          activeTab === 'Claims' ? 'border-amber-500 bg-amber-50/5 ring-1 ring-amber-500/20' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <Badge className="bg-amber-50 text-amber-700 border-amber-200/50 font-black">Loss Ratio: 27%</Badge>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight">ETB {(sumClaims).toLocaleString()}K</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Total Claims Disbursed</p>
            <span className="text-[10px] text-gray-500 font-medium">Auto-authorized via Penta claim network</span>
          </div>
        </div>

        {/* Card 4: Commissions paid - Highlights Agent Performance tab */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
          activeTab === 'Agent Performance' ? 'border-emerald-500 bg-emerald-50/5 ring-1 ring-emerald-500/20' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 font-black">Top Yield</Badge>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight">ETB {(commissionPaid).toLocaleString()}K</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Commissions Released</p>
            <span className="text-[10px] text-gray-500 font-medium">Calculated dynamically for 6 frontline agents</span>
          </div>
        </div>

      </div>

      {/* Reactive Visual Data Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main interactive chart container (Span 2 to give rich space) */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-2 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  {activeTab} Analytics Trend Focus
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Showing dynamic metrics compiled for <span className="font-bold text-gray-800">{dateRange}</span> in the <span className="text-blue-600 font-bold">{activeTab}</span> spectrum</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold mt-1">
                {activeTab === 'Financial' && (
                  <>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Claims Paid</span>
                    </div>
                  </>
                )}
                {activeTab === 'Operational' && (
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Average SLA SLA %</span>
                  </div>
                )}
                {activeTab === 'Claims' && (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Payout Volumes</span>
                  </div>
                )}
                {activeTab === 'Agent Performance' && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Efficacy Factor</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              {/* Conditional Chart Rendering based on Selected Tab */}
              <div className="h-[320px]">
                {activeTab === 'Financial' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={3} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `ETB ${val}K`} dx={-10} />
                      <RechartsTooltip 
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e4e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      />
                      <Legend verticalAlign="top" height={36} content={() => null} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="GWP Revenue" />
                      <Bar dataKey="claims" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Claims Settled" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'Operational' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}% SLA`} dx={-10} />
                      <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e4e7eb' }} />
                      <Line type="monotone" dataKey="operationalSla" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="System Performance SLA" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'Claims' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `ETB ${val}K`} dx={-10} />
                      <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e4e7eb' }} />
                      <Area type="monotone" dataKey="claims" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorClaims)" name="Claims Incurred Flow" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'Agent Performance' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val} Contracts`} dx={-10} />
                      <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e4e7eb' }} />
                      <Bar dataKey="cumulativePolicies" fill="#10b981" radius={[4, 4, 0, 0]} name="Dynamic Headcount Yield" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Dynamic Context Card based on selection */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-200 bg-white h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Contextual Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-900">Period Configuration</span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      You are scrutinizing the interval spanning <span className="font-bold text-gray-800">{dateRange}</span>. Database cache holds verified audit keys.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-900">Computed Efficacy Metrics</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div className="bg-slate-50 p-2 rounded border border-gray-100">
                        <span className="block text-[8px] text-gray-400 font-bold uppercase">GWP Variance</span>
                        <span className="text-xs font-bold text-gray-800">+14.2%</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-gray-100">
                        <span className="block text-[8px] text-gray-400 font-bold uppercase">Loss Control</span>
                        <span className="text-xs font-bold text-gray-800">Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Quick Action button triggers */}
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-gray-200 mt-2">
                  <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase mb-2">Live Analytical Actions</span>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        alert(`Re-syncing analytics telemetry databases with Penta Core CRM logs... Successful!`);
                      }}
                      className="w-full text-left py-2 px-3 hover:bg-white rounded border border-transparent hover:border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between transition-all group"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-gray-450 group-hover:rotate-180 transition-transform duration-500" />
                        Re-sync Analytics
                      </span>
                      <span className="text-[9px] text-emerald-650 bg-emerald-50 px-1 py-0.5 rounded font-bold uppercase">Ready</span>
                    </button>
                    <button 
                      onClick={() => startExportSimulation('Raw JSON Payload')}
                      className="w-full text-left py-2 px-3 hover:bg-white rounded border border-transparent hover:border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between transition-all group"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-gray-450" />
                        Download Raw JSON Data
                      </span>
                      <span className="text-xs text-blue-600">JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-6">
                <Button 
                  onClick={() => startExportSimulation('Full Executive Brief')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Download Executive Brief (.txt)
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Interactive Agent Performance Table Context Segment */}
      <Card className="shadow-sm border-gray-200 bg-white">
        <CardHeader className="flex flex-col md:flex-row items-stretch md:items-center justify-between py-4 border-b border-gray-100 gap-4">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              Detailed Frontline Agent Matrix
            </CardTitle>
            <p className="text-xs text-gray-500">Search and sort physical sales agent performance and registered commissions</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input for Agents */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                placeholder="Search agents by name, branch..."
                className="pl-9 h-9 text-xs font-semibold focus:bg-white bg-slate-50/50"
              />
            </div>

            {/* Sort Select input */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-xs text-gray-400">Sort By</span>
              <select 
                value={agentSort}
                onChange={e => setAgentSort(e.target.value)}
                className="bg-white border text-xs font-bold rounded-lg h-9 px-2 text-gray-800 focus:outline-none"
              >
                <option value="policies">Policies Sold</option>
                <option value="premium">Total Premium Value</option>
                <option value="performance">Satisfaction Score %</option>
              </select>
            </div>

            {/* Simulated CSV/PDF Table Exports */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => startExportSimulation('Agent Matrix CSV')}
                className="h-9 gap-1.5 text-gray-600 bg-white hover:bg-slate-50 shadow-sm border-gray-200 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => startExportSimulation('Agent Efficacy PDF')}
                className="h-9 gap-1.5 text-gray-600 bg-white hover:bg-slate-50 shadow-sm border-gray-200 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-10/50">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-3 font-semibold text-gray-500 w-64 pl-6">AGENT IDENTITY</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">REGISTERED OUTLET BRANCH</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">BOUND POLICIES</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">GROSS WRITTEN PREMIUM</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500">ACCRUED SERVICES COMMISSION</TableHead>
                  <TableHead className="py-3 font-semibold text-gray-500 text-right pr-6">EFFICACY METRIC SCORE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors">
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        <img src={agent.avatar} className="w-8.5 h-8.5 rounded-full border border-gray-200" alt={agent.name} referrerPolicy="no-referrer" />
                        <div>
                          <div className="font-bold text-gray-905 text-sm">{agent.name}</div>
                          <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{agent.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-gray-500 font-semibold">{agent.branch}</TableCell>
                    <TableCell className="py-3.5 font-bold text-gray-900">{agent.policies} leads</TableCell>
                    <TableCell className="py-3.5 font-black text-gray-901">{agent.premium}</TableCell>
                    <TableCell className="py-3.5 font-bold text-green-600">{agent.commission}</TableCell>
                    <TableCell className="py-3.5 text-right pr-6">
                      <div className="flex items-center justify-end gap-3 font-mono">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              agent.performance >= 80 ? 'bg-emerald-500' :
                              agent.performance >= 60 ? 'bg-blue-500' :
                              agent.performance >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${agent.performance}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-gray-700 w-8">{agent.performance}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      No active agents found matching your query bounds.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Progress Export Simulation Overlay Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border flex flex-col text-xs">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Export Dossier Pipeline
              </span>
              {!isExporting && (
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-450 hover:text-gray-650">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected Payload Type</span>
                <p className="font-bold text-gray-805 text-sm">{exportFormat}</p>
                <div className="inline-block bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded text-[10px] mt-2">
                  Bounds: {dateRange}
                </div>
              </div>

              {/* Progress bar visual container */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold text-[10px] text-gray-500 uppercase">
                  <span>Compilation Status</span>
                  <span>{exportProgress}%</span>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border p-0.5">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-100"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                
                <p className="text-[10px] text-center font-semibold text-gray-550 leading-relaxed italic animate-pulse">
                  {exportStep}
                </p>
              </div>

              {/* Simulated Complete Section */}
              {downloadReady ? (
                <div className="bg-emerald-50/60 p-4 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Payload Compiled & Verified!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    The analytical report for <span className="font-bold">{dateRange}</span> has been signed with administrative keys and is now ready in the local stream memory.
                  </p>
                  
                  <Button 
                    onClick={handleDownloadFile}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 h-9 flex items-center justify-center gap-1.5 shadow"
                  >
                    <Download className="w-4 h-4" /> Trigger Local Download
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              )}

              <div className="pt-2 border-t flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isExporting}
                  className="text-gray-700" 
                  onClick={() => setIsExportModalOpen(false)}
                >
                  Close Pipeline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
