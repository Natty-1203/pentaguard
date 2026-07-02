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
  RefreshCw
} from 'lucide-react';

export default function SystemSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'domain' | 'api' | 'webhook'>('global');
  const [appName, setAppName] = useState('Penta Guard Core Platform');
  const [supportEmail, setSupportEmail] = useState('support@pentaguard.co');
  const [allowSelfReg, setAllowSelfReg] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [dbStatus, setDbStatus] = useState<any>({
    connected: false,
    engine: 'Checking Database Pool Status...',
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure platform parameters, security, and integrations</p>
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
                  <CardDescription className="text-xs">Configure platform name and support contact details</CardDescription>
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
                      <p className="text-[11px] text-gray-500">Allow new insurance companies to self-register</p>
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
                      <p className="text-[11px] text-gray-500">Temporarily block all tenant and agent access</p>
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
                      <label className="text-xs font-bold text-gray-900">Enforce Multi-Factor Auth Globally</label>
                      <p className="text-[11px] text-gray-500">Require MFA for all administrator accounts</p>
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

          {/* SubTab 2: Domain & SSO */}
          {activeSubTab === 'domain' && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-gray-900">Domain Mapping & Single Sign-On</CardTitle>
                <CardDescription className="text-xs">Configure tenant subdomain binding and SSO settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Enterprise Root Mapping Domain</label>
                  <Input defaultValue="pentaguard.cloud" className="h-10 text-xs border-gray-200" disabled />
                </div>
                <div className="p-4 bg-gray-50 border rounded-xl text-xs text-gray-500">
                  Domain and SSO settings are configured per subscription profile
                </div>
              </CardContent>
            </Card>
          )}

          {/* SubTab 4: API & Keys */}
          {activeSubTab === 'api' && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-bold text-gray-900">Super Admin Token Vault</CardTitle>
                <CardDescription className="text-xs">Manage API keys and integration tokens</CardDescription>
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
                <CardDescription className="text-xs">Manage webhook endpoints for event notifications</CardDescription>
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
