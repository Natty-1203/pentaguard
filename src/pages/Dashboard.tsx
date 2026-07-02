import React, { useState, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { useAuth } from '@/src/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { 
  Users, ShieldCheck, AlertCircle, CheckCircle2, CreditCard, Lock, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Plus, 
  FileText, UserPlus, FilePlus, Download, Upload, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function DashboardPage() {
  const { selectedCompanyId } = useTenant();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isAgent = role === 'agent';
  const isClaimStaff = role === 'claim_staff';
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [policiesByType, setPoliciesByType] = useState<any[]>([]);
  const [claimsByStatus, setClaimsByStatus] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [recentPolicies, setRecentPolicies] = useState<any[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [sparkline, setSparkline] = useState<{ customers: number[]; policies: number[]; claims: number[]; approved: number[]; revenue: number[]; pendingPayments: number[] }>({
    customers: [], policies: [], claims: [], approved: [], revenue: [], pendingPayments: []
  });
  const [trends, setTrends] = useState<{ customers: string; policies: string; claims: string; approved: string; revenue: string; payments: string; customersUp: boolean; policiesUp: boolean; claimsUp: boolean; approvedUp: boolean; revenueUp: boolean; paymentsUp: boolean }>({
    customers: '', policies: '', claims: '', approved: '', revenue: '', payments: '',
    customersUp: true, policiesUp: true, claimsUp: true, approvedUp: true, revenueUp: true, paymentsUp: true
  });
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const CLAIM_COLORS: Record<string, string> = {
    'Filed': '#3b82f6',
    'Under_Review': '#f59e0b',
    'Under Review': '#f59e0b',
    'Approved': '#10b981',
    'Paid': '#8b5cf6',
    'Rejected': '#ef4444',
    'Closed': '#6b7280',
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, sparkRes, tasksRes] = await Promise.all([
          fetch(`/api/dashboard/stats?companyId=${selectedCompanyId ?? 1}`),
          fetch(`/api/dashboard/sparkline?companyId=${selectedCompanyId ?? 1}`),
          fetch(`/api/tasks/upcoming?companyId=${selectedCompanyId ?? 1}`)
        ]);
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
        const json = await statsRes.json();
        const d = json.data;

        setKpis(d.kpis);
        setRevenueTrend(d.trendData || []);

        const totalPolicies = d.policiesByType.reduce((s: number, r: any) => s + r.value, 0) || 1;
        setPoliciesByType(d.policiesByType.map((r: any, i: number) => ({
          ...r,
          color: PIE_COLORS[i % PIE_COLORS.length],
          percent: ((r.value / totalPolicies) * 100).toFixed(1),
        })));

        const totalClaims = d.claimsByStatus.reduce((s: number, r: any) => s + r.value, 0) || 1;
        setClaimsByStatus(d.claimsByStatus.map((r: any) => ({
          ...r,
          name: r.name.replace('_', ' '),
          color: CLAIM_COLORS[r.name] || '#6b7280',
          percent: ((r.value / totalClaims) * 100).toFixed(1),
        })));

        setRecentPolicies(d.recentPolicies);
        setRecentClaims(d.recentClaims);

        if (sparkRes.ok) {
          const sparkJson = await sparkRes.json();
          if (sparkJson.success) setSparkline(sparkJson.data);
        }
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          setUpcomingTasks(tasks);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!kpis) return;
    const compute = (arr: number[]) => {
      if (!arr || arr.length < 2) return { text: 'No prior data', up: true };
      const last = arr[arr.length - 1] || 0;
      const prev = arr[arr.length - 2] || 0;
      if (prev === 0 && last === 0) return { text: 'No change vs last month', up: true };
      if (prev === 0) return { text: `+${last} new this month`, up: true };
      const delta = ((last - prev) / prev) * 100;
      const sign = delta >= 0 ? '+' : '';
      return { text: `${sign}${delta.toFixed(1)}% from last month`, up: delta >= 0 };
    };
    setTrends({
      customers: compute(sparkline.customers).text,
      policies: compute(sparkline.policies).text,
      claims: compute(sparkline.claims).text,
      approved: compute(sparkline.approved).text,
      revenue: compute(sparkline.revenue).text,
      payments: compute(sparkline.pendingPayments).text,
      customersUp: compute(sparkline.customers).up,
      policiesUp: compute(sparkline.policies).up,
      claimsUp: compute(sparkline.claims).up,
      approvedUp: compute(sparkline.approved).up,
      revenueUp: compute(sparkline.revenue).up,
      paymentsUp: compute(sparkline.pendingPayments).up
    });
  }, [sparkline, kpis]);

  if (loading || !kpis) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-500">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {(isAdmin || isAgent) && (
          <KpiCard
            title="Total Customers"
            value={kpis.totalCustomers.toLocaleString()}
            trend={trends.customers}
            trendUp={trends.customersUp}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
            chartColor="#9333ea"
            sparkData={sparkline.customers}
          />
        )}
        {(isAdmin || isAgent) && (
          <KpiCard
            title="Active Policies"
            value={kpis.activePolicies.toLocaleString()}
            trend={trends.policies}
            trendUp={trends.policiesUp}
            icon={ShieldCheck}
            iconColor="text-green-600"
            iconBg="bg-green-100"
            chartColor="#16a34a"
            sparkData={sparkline.policies}
          />
        )}
        {(isAdmin || isClaimStaff) && (
          <KpiCard
            title="Pending Claims"
            value={kpis.pendingClaims.toLocaleString()}
            trend={trends.claims}
            trendUp={trends.claimsUp}
            icon={AlertCircle}
            iconColor="text-orange-500"
            iconBg="bg-orange-100"
            chartColor="#f97316"
            sparkData={sparkline.claims}
          />
        )}
        {(isAdmin || isClaimStaff) && (
          <KpiCard
            title="Claims Approved"
            value={kpis.approvedClaims.toLocaleString()}
            trend={trends.approved}
            trendUp={trends.approvedUp}
            icon={CheckCircle2}
            iconColor="text-blue-500"
            iconBg="bg-blue-100"
            chartColor="#3b82f6"
            sparkData={sparkline.approved}
          />
        )}
        {isAdmin && (
          <KpiCard
            title="Monthly Revenue"
            value={`ETB ${(kpis.totalRevenue / 1000000).toFixed(1)}M`}
            trend={trends.revenue}
            trendUp={trends.revenueUp}
            icon={CreditCard}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
            chartColor="#4f46e5"
            sparkData={sparkline.revenue}
          />
        )}
        {isAdmin && (
          <KpiCard
            title="Pending Payments"
            value={kpis.pendingPayments.toLocaleString()}
            trend={trends.payments}
            trendUp={trends.paymentsUp}
            icon={Lock}
            iconColor="text-amber-500"
            iconBg="bg-amber-100"
            chartColor="#f59e0b"
            sparkData={sparkline.pendingPayments}
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="flex flex-wrap gap-4">
        {/* Policies by Insurance Type - admin & agent */}
        {(isAdmin || isAgent) && (
          <Card className="flex-1 min-w-[min(100%,360px)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Policies by Insurance Type</CardTitle>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-pointer">This Year</div>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] sm:h-[200px] flex flex-col sm:flex-row items-center">
                <div className="w-full sm:w-[40%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={policiesByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {policiesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-[60%] space-y-1.5 sm:pl-3 mt-2 sm:mt-0">
                  {policiesByType.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 truncate">{item.name}</span>
                      </div>
                      <span className="font-medium shrink-0 ml-2">{item.value.toLocaleString()} <span className="text-gray-400 font-normal">({item.percent}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Claims Status Overview - admin & claim_staff */}
        {(isAdmin || isClaimStaff) && (
          <Card className="flex-1 min-w-[min(100%,360px)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Claims Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] sm:h-[200px] flex flex-col sm:flex-row items-center">
                <div className="w-full sm:w-[40%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={claimsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {claimsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-[60%] space-y-1.5 sm:pl-3 mt-2 sm:mt-0">
                  {claimsByStatus.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 truncate">{item.name}</span>
                      </div>
                      <span className="font-medium shrink-0 ml-2">{item.value} <span className="text-gray-400 font-normal">({item.percent}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Overview – admin only */}
        {isAdmin && (
          <Card className="flex-1 min-w-[min(100%,360px)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Revenue (K) vs Claims Trend</CardTitle>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-pointer">Live Trend</div>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${val}K`} dx={-10} />
                    <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="claims" name="Losses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tables Row */}
      <div className="flex flex-wrap gap-4">
        {/* Recent Policies - admin & agent */}
        {(isAdmin || isAgent) && (
          <Card className="flex-1 min-w-[min(100%,400px)]">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-800">Recent Policies</CardTitle>
              <Link to="/policies" className="text-blue-600 text-xs font-semibold h-auto p-0 hover:underline">View All</Link>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold">POLICY NO</th>
                      <th className="px-4 py-3 font-semibold">CUSTOMER</th>
                      <th className="px-4 py-3 font-semibold">TYPE</th>
                      <th className="px-4 py-3 font-semibold">START DATE</th>
                      <th className="px-4 py-3 font-semibold">PREMIUM</th>
                      <th className="px-4 py-3 font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPolicies.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-blue-600">
                          <Link className="hover:underline" to={`/policies/${row.id || `POL-${row.dbId}`}`}>{row.id || `POL-${row.dbId}`}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.customer)}&background=random`} className="w-6 h-6 rounded-full" alt="" />
                            <span className="text-gray-900 text-xs font-medium">{row.customer}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.type}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 text-gray-900 text-xs font-medium whitespace-nowrap">{row.premium}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {recentPolicies.map((row, i) => (
                  <Link key={i} to={`/policies/${row.id || `POL-${row.dbId}`}`} className="block p-4 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-600 text-sm">{row.id || `POL-${row.dbId}`}</span>
                      <Badge variant={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.customer)}&background=random`} className="w-5 h-5 rounded-full" alt="" />
                      <span className="text-gray-900 text-xs font-medium">{row.customer}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{row.type}</span>
                      <span>{row.date}</span>
                    </div>
                    <div className="text-xs font-medium text-gray-900 mt-1">{row.premium}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Claims - admin & claim_staff */}
        {(isAdmin || isClaimStaff) && (
          <Card className="flex-1 min-w-[min(100%,400px)]">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-800">Recent Claims</CardTitle>
              <Link to="/claims" className="text-blue-600 text-xs font-semibold h-auto p-0 hover:underline">View All</Link>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold">CLAIM NO</th>
                      <th className="px-4 py-3 font-semibold">POLICY NO</th>
                      <th className="px-4 py-3 font-semibold">CUSTOMER</th>
                      <th className="px-4 py-3 font-semibold">STATUS</th>
                      <th className="px-4 py-3 font-semibold">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentClaims.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-blue-600">
                          <Link className="hover:underline" to={`/claims/${row.id || `CLM-${row.dbId}`}`}>{row.id || `CLM-${row.dbId}`}</Link>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.policyId}</td>
                        <td className="px-4 py-3 text-gray-900 text-xs font-medium">{row.customer}</td>
                        <td className="px-4 py-3">
                           <Badge variant={row.status === 'Under Review' || row.status === 'Under_Review' ? 'warning' : row.status === 'Approved' ? 'success' : 'info'}>{row.status?.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {recentClaims.map((row, i) => (
                  <Link key={i} to={`/claims/${row.id || `CLM-${row.dbId}`}`} className="block p-4 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-600 text-sm">{row.id || `CLM-${row.dbId}`}</span>
                      <Badge variant={row.status === 'Under Review' || row.status === 'Under_Review' ? 'warning' : row.status === 'Approved' ? 'success' : 'info'}>{row.status?.replace('_', ' ')}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">Policy:</span> {row.policyId}
                    </div>
                    <div className="text-xs text-gray-900 font-medium">{row.customer}</div>
                    <div className="text-xs text-gray-500 mt-1">{row.date}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Actions Row */}
      <div className="flex flex-wrap gap-4">
        {/* Quick Actions */}
        <Card className="flex-1 min-w-[min(100%,360px)]">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-3">
              {(isAdmin || isAgent) && (
                <QuickAction icon={FilePlus} title="New Quote" color="text-purple-600" bg="bg-purple-50" to="/quotes/new" />
              )}
              {(isAdmin || isAgent) && (
                <QuickAction icon={UserPlus} title="Add Customer" color="text-green-600" bg="bg-green-50" to="/customers" />
              )}
              {(isAdmin || isAgent) && (
                <QuickAction icon={ShieldCheck} title="New Policy" color="text-blue-600" bg="bg-blue-50" to="/policies" />
              )}
              {(isAdmin || isClaimStaff) && (
                <QuickAction icon={FileText} title="File Claim" color="text-orange-500" bg="bg-orange-50" to="/claims" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="flex-1 min-w-[min(100%,360px)]">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-800">Upcoming Tasks</CardTitle>
            <Link to="/payment-schedules" className="text-blue-600 text-xs font-semibold h-auto p-0 hover:underline">View Calendar</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {upcomingTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  All clear! No upcoming payment due dates or open claims to follow up on.
                </div>
              ) : (
                upcomingTasks.slice(0, 5).map((t, i) => (
                  <TaskItem
                    key={`${t.kind}-${i}`}
                    day={t.day}
                    month={t.month}
                    title={t.title}
                    desc={t.desc}
                    time={t.time}
                    descHighlight={t.highlight}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function KpiCard({ title, value, trend, trendUp, icon: Icon, iconColor, iconBg, chartColor, sparkData }: any) {
  const data = (sparkData && sparkData.length > 0
    ? sparkData
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ).map((v: number, i: number) => ({ name: i, value: Number(v) || 0 }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col justify-between min-h-[110px] sm:h-[130px] relative overflow-hidden">
      <div className="flex justify-between items-start z-10 relative">
        <div className="space-y-1">
          <div className="text-xl font-bold text-gray-900">{value}</div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <div className="flex items-center gap-1 mt-1">
            {trendUp ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
            <span className={trendUp ? "text-green-600 text-[10px] font-medium" : "text-red-500 text-[10px] font-medium"}>{trend}</span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="absolute -bottom-2 -left-1 right-0 h-16 opacity-30">
        <ResponsiveContainer width="105%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, color, bg, to }: any) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all gap-2 bg-white">
      <div className={`p-2.5 rounded-full ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-gray-700">{title}</span>
    </Link>
  );
}

function TaskItem({ day, month, title, desc, time, descHighlight }: any) {
  return (
    <div className="flex items-start p-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[3rem] mr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{month}</span>
        <span className="text-lg font-bold text-gray-800">{day}</span>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className={`text-xs ${descHighlight ? 'text-amber-500 font-medium' : 'text-gray-500'}`}>{desc}</p>
      </div>
      <div className="text-[11px] text-gray-500 flex items-center font-medium">
        {time}
      </div>
    </div>
  );
}
