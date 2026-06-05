import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import {
  ShieldCheck,
  Server,
  Globe,
  Key,
  BellRing,
  Database,
  Terminal,
  Play,
  RefreshCw,
  BookOpen,
  Table,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export default function SystemSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'domain' | 'api' | 'database' | 'webhook'>('global');

  // Global system parameters
  const [appName, setAppName] = useState('Penta Guard Core Platform');
  const [supportEmail, setSupportEmail] = useState('support@pentaguard.co');
  const [allowSelfReg, setAllowSelfReg] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enforce2FA, setEnforce2FA] = useState(true);

  // Database Sandbox state variables
  const [dbStatus, setDbStatus] = useState<any>({
    connected: false,
    engine: 'Checking Database Pool Status...',
    database: 'pentaguard',
    host: 'localhost',
    port: '5432',
    user: 'postgres'
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM COMPANY;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Pre-configured query templates matching the assignment sections
  const sqlTemplates = [
    { label: 'View Master Tenant Company', sql: 'SELECT * FROM COMPANY WHERE Company_Id = 1;' },
    { label: 'List Active Branches', sql: 'SELECT Branch_Id, Branch_Name, Region, City, Status FROM BRANCH;' },
    { label: 'Review High Commission Agents', sql: 'SELECT Agent_Id, First_Name, Last_Name, Commission_Rate, Email FROM AGENT WHERE Commission_Rate >= 12.00;' },
    { label: 'Check Customers Registry', sql: 'SELECT Customer_Id, First_Name, Last_Name, Email, Fayda_No FROM CUSTOMER;' },
    { label: 'Monitor Claims Under Review', sql: 'SELECT Claim_Id, Policy_Id, Claim_Staff_Id, Incident_Date, Status FROM CLAIMS WHERE Status = \'Under_Review\';' },
    { label: 'Analyze Plans & Licensing Fee', sql: 'SELECT Plan_Id, Plan_Name, Monthly_Fee, Max_Branches, Max_Policies FROM SUBSCRIPTION_PLANS;' }
  ];

  // Fetch PostgreSQL connection status from Express API
  const fetchDbStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to query database server module:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  // Execute custom Postgres/SQL query against backend sandbox
  const handleExecuteSql = async (queryText: string) => {
    setIsExecuting(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const response = await fetch('/api/db-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText || sqlQuery }),
      });
      const data = await response.json();
      if (data.success) {
        setQueryResult({
          rows: data.rows,
          rowCount: data.rowCount
        });
      } else {
        setQueryError(data.error || 'Syntax error inside query block');
      }
    } catch (err: any) {
      setQueryError('Server transmission failed or timeout occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Penta Guard System Control</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global SaaS parameters, check database sanity, and manage integrations</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 text-xs border-none select-none">
            ASTU DB Systems Assgn V3.0
          </Badge>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Col - SubTab Selection Router */}
        <div className="col-span-1 border border-gray-200 bg-white rounded-xl shadow-sm p-3 h-fit flex flex-col gap-1.5 select-none">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 leading-none">Settings Panel</div>

          <button
            onClick={() => setActiveSubTab('global')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'global' ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Server className="w-4 h-4" /> Global Parameters
          </button>

          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'database' ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <span className="flex items-center gap-3">
              <Database className="w-4 h-4" /> Postgres SQL Sandbox
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          <button
            onClick={() => setActiveSubTab('domain')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'domain' ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Globe className="w-4 h-4" /> Domain & SSO
          </button>

          <button
            onClick={() => setActiveSubTab('api')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'api' ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Key className="w-4 h-4" /> API & Keys
          </button>

          <button
            onClick={() => setActiveSubTab('webhook')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'webhook' ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <BellRing className="w-4 h-4" /> Webhook Actions
          </button>
        </div>

        {/* Right Col - Settings Screens */}
        <div className="col-span-1 lg:col-span-3 space-y-6">

          {/* SubTab 1: Global Settings */}
          {activeSubTab === 'global' && (
            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900">Application Parameters</CardTitle>
                  <CardDescription className="text-xs">Adjust the main identity and communications profile of the core container.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Platform Public Name</label>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className="h-10 text-xs border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Penta Support Email</label>
                      <Input
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="h-10 text-xs border-gray-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900">Platform Master Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-gray-900">Allow Independent Client Register</label>
                      <p className="text-[11px] text-gray-500">Enable new insurance companies to self-onboard and register subscription accounts.</p>
                    </div>
                    <div
                      onClick={() => setAllowSelfReg(!allowSelfReg)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${allowSelfReg ? 'bg-blue-600' : 'bg-gray-250'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${allowSelfReg ? 'left-[22px]' : 'left-0.5'}`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-gray-900">System Maintenance Mode</label>
                      <p className="text-[11px] text-gray-500">Block sub-tenant companies and direct agents from logging in temporarily.</p>
                    </div>
                    <div
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${maintenanceMode ? 'bg-blue-600' : 'bg-gray-250'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${maintenanceMode ? 'left-[22px]' : 'left-0.5'}`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-gray-900">Enforce Multi-Factor auth globally</label>
                      <p className="text-[11px] text-gray-500">MFA is systematically enforced for Nile Insurance branch administrators.</p>
                    </div>
                    <div
                      onClick={() => setEnforce2FA(!enforce2FA)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${enforce2FA ? 'bg-blue-600' : 'bg-gray-250'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${enforce2FA ? 'left-[22px]' : 'left-0.5'}`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900">Platform Deployment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 text-xs rounded-xl p-4 font-mono text-gray-650 space-y-2.5 border">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">PLATFORM_RUNTIME</span>
                      <span className="text-gray-900 font-bold bg-gray-200/60 px-2 py-0.5 rounded text-[10px]">Node.js v22 (TSX)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">GATEWAY_METRIC</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 3000 Ingress Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">ACTIVE_DATABASE</span>
                      <span className="font-bold text-blue-600">{dbStatus.engine}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SubTab 2: Postgres SQL Sandbox (THE MAIN INTEGRATION POINT!) */}
          {activeSubTab === 'database' && (
            <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-sm border-gray-200">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Database engine</div>
                  <div className="text-sm font-extrabold text-blue-600 mt-2 shrink-0 truncate flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> {dbStatus.connected ? 'PostgreSQL 16' : 'Local SandboxEngine'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Multi-Tenant Isolation: Enabled</div>
                </Card>

                <Card className="p-4 shadow-sm border-gray-200">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Current Active Database</div>
                  <div className="text-sm font-bold text-gray-800 mt-2">
                    {dbStatus.database}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">User: {dbStatus.user}</div>
                </Card>

                <Card className="p-4 shadow-sm border-gray-200 relative">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Postgres Port & Host</div>
                  <div className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {dbStatus.host}:{dbStatus.port}
                  </div>
                  <button
                    onClick={fetchDbStatus}
                    disabled={isLoadingStatus}
                    className="absolute right-3 top-3 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                    title="Refresh connection state"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1">Status: Active Listening</p>
                </Card>
              </div>

              {/* DDL Guide & SQL Sandbox Section */}
              <Card className="shadow-sm border-gray-250/90 overflow-hidden">
                <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-950">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <div>
                      <h3 className="text-xs font-bold tracking-tight">Postgre SQL Interactive Sandbox</h3>
                      <p className="text-[10px] text-slate-400">Run actual SQL matching the 40 normalized SaaS tables and view result metrics</p>
                    </div>
                  </div>
                  <div className="bg-slate-800 text-[9px] text-slate-350 font-mono px-2 py-0.5 rounded">
                    SYS-CON
                  </div>
                </div>

                <CardContent className="p-4 space-y-4 bg-slate-950/95">

                  {/* Templates Grid select buttons */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 select-none">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Choose SQL Template
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sqlTemplates.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSqlQuery(tmpl.sql);
                            handleExecuteSql(tmpl.sql);
                          }}
                          className="p-2 text-[11px] font-semibold text-slate-300 bg-slate-900 border border-slate-800 cursor-pointer rounded-lg text-left transition-colors hover:bg-slate-800 hover:text-white truncate"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Free form interactive query area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Interactive Query Editor</label>
                      <span className="text-[9px] font-mono text-blue-400">PentaGuard v3.0 syntax</span>
                    </div>

                    <div className="relative">
                      <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full h-24 p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Write standard SQL here (e.g. SELECT * FROM CUSTOMER;)"
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                    <p className="text-[10px] text-slate-400 italic">
                      💡 Query engine is synchronized to provide matching database results directly.
                    </p>
                    <Button
                      onClick={() => handleExecuteSql(sqlQuery)}
                      disabled={isExecuting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 h-9 flex items-center gap-2 rounded-lg"
                    >
                      {isExecuting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      {isExecuting ? 'Executing...' : 'Run Query'}
                    </Button>
                  </div>

                  {/* SQL Execution Output console */}
                  {queryError && (
                    <div className="p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 font-mono text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <div className="font-bold">SQL Execution Failed</div>
                        <p className="mt-1 text-[11px]">{queryError}</p>
                      </div>
                    </div>
                  )}

                  {queryResult && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 select-none">
                        <span>📊 Output rows returned: {queryResult.rowCount}</span>
                        <span className="text-emerald-400">✓ Query compiled successfully</span>
                      </div>

                      {queryResult.rows && queryResult.rows.length > 0 ? (
                        <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-60 scrollbar-thin">
                          <table className="w-full text-left border-collapse font-mono text-[11px] text-slate-300">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-450 font-bold">
                                {Object.keys(queryResult.rows[0]).map((colName) => (
                                  <th key={colName} className="p-2.5 truncate font-bold text-slate-300">
                                    {colName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                              {queryResult.rows.map((rowJson: any, rowIdx: number) => (
                                <tr key={rowIdx} className="hover:bg-slate-900/60 transition-colors">
                                  {Object.values(rowJson).map((val: any, cellIdx: number) => (
                                    <td key={cellIdx} className="p-2.5 max-w-xs truncate">
                                      {val === null ? (
                                        <span className="text-slate-600">NULL</span>
                                      ) : typeof val === 'object' ? (
                                        JSON.stringify(val)
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-slate-400 font-mono text-center text-xs">
                          Query returned 0 records. (Transaction committed successfully)
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>

              {/* PDF Document Structure View */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Database Assignment Table Categories (40 Tables)
                  </CardTitle>
                  <CardDescription className="text-xs">Browse the functional module segments from Penta Guard Normalized Version 3.0 Document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="p-3 border rounded-xl space-y-1 bg-gray-50/50">
                      <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>Section A-B: Platform Referencing & SaaS</span>
                        <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100 text-[9px] font-bold">11 Tables</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Defines system configurations, multi-tenant <strong>COMPANY</strong> master registries, multi-valued contact phone numbers, subscription billing structures, tier definitions, and lookup categories: PAYMENT_METHODS, ADDRESS_TYPE, RELATIONSHIP_TYPE.
                      </p>
                    </div>

                    <div className="p-3 border rounded-xl space-y-1 bg-gray-50/50">
                      <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>Section C-D: Tenant Branch & Customer Hub</span>
                        <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100 text-[9px] font-bold">10 Tables</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Integrates geographical branch structures with <strong>CUSTOMER</strong> portfolios. Implements normalized multi-valued phone tables, physical residential Addresses, and junction tables (COMPANY_INSURANCE_TYPE) mapping lines of business.
                      </p>
                    </div>

                    <div className="p-3 border rounded-xl space-y-1 bg-gray-50/50">
                      <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>Section E-G: Agent Management & Portals</span>
                        <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100 text-[9px] font-bold">7 Tables</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Tracks sales pipeline, underwritten <strong>QUOTES</strong>, calculated risk levels, decision matrices (UNDERWRITING), active <strong>POLICIES</strong>, policy level coverages (POLICY_COVERAGE), and automatic agent payout calculations.
                      </p>
                    </div>

                    <div className="p-3 border rounded-xl space-y-1 bg-gray-50/50">
                      <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>Section H-K: Assets, Claims & Invoicing</span>
                        <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100 text-[9px] font-bold">12 Tables</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Insures items: AUTO_ASSET, HOME_ASSET, LIFE_SPEC, HEALTH_PLAN, and maps designated beneficiaries. Covers the <strong>CLAIMS</strong> lodgment engine, step-by-step CLAIM_WORKFLOW trails, documents, payments, and payment schedules.
                      </p>
                    </div>

                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* SubTab 3: Domain & SSO */}
          {activeSubTab === 'domain' && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-gray-900">Domain Mapping & Single Sign-On</CardTitle>
                <CardDescription className="text-xs">Bind subdomains for client tenants to permit custom login portal URLs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Enterprise Root Mapping Domain</label>
                  <Input defaultValue="pentaguard.cloud" className="h-10 text-xs border-gray-200" disabled />
                </div>
                <div className="p-4 bg-gray-50 border rounded-xl text-xs text-gray-500">
                  Domain masking and enterprise SAML / Microsoft Office 365 OAuth credentials are customized exclusively under individual client Subscription profiles.
                </div>
              </CardContent>
            </Card>
          )}

          {/* SubTab 4: API & Keys */}
          {activeSubTab === 'api' && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-gray-900">Super Admin Token Vault</CardTitle>
                <CardDescription className="text-xs">Generate platform communication access keys for external underwriting tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-gray-800">TELEBIRR_GATEWAY_APPKEY</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px]">Active</Badge>
                  </div>
                  <Input value="•••••••••••••••••••••••••••••••••••••••" className="h-10 text-xs font-mono bg-white" disabled />
                </div>

                <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-gray-800">CBE_BIRR_CORE_TOKEN</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px]">Active</Badge>
                  </div>
                  <Input value="•••••••••••••••••••••••••••••••••••••••" className="h-10 text-xs font-mono bg-white" disabled />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SubTab 5: Webhooks */}
          {activeSubTab === 'webhook' && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-gray-900">Outgoing Webhooks</CardTitle>
                <CardDescription className="text-xs">Deliver JSON messages regarding claims and policy status modifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-xl flex items-center justify-between bg-gray-50">
                  <div>
                    <div className="text-xs font-bold text-gray-800">Incident Notification Webhook</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">https://api.pentaguard.co/hooks/inquests</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-400 border-none text-[10px]">Disabled</Badge>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
