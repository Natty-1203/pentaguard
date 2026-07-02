import React, { useState, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Calendar, Mail, Smartphone, MessageSquare, Plus, BellRing, X, Check, Users, Radio, Info, Eye
} from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/status-badge';

export default function NotificationsPage() {
  const { selectedCompanyId } = useTenant();
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?companyId=${selectedCompanyId ?? 1}`);
      if (res.ok) {
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any, idx: number) => {
          const nId = dbRow.notification_id ?? dbRow.Notification_Id ?? (idx + 1);
          const cId = dbRow.customer_id ?? dbRow.Customer_Id ?? (idx + 1);
          const channel = dbRow.channel ?? dbRow.Channel;
          const msgType = dbRow.message_type ?? dbRow.Message_Type;
          const msgBody = dbRow.message_body ?? dbRow.Message_Body;
          const sent = dbRow.sent_at ?? dbRow.Sent_At ?? '-';
          const stat = dbRow.status ?? dbRow.Status;

          return {
            id: `NOTIF-${nId.toString().padStart(4, '0')}`,
            customer: `Customer #${cId}`,
            channel: channel,
            messageType: msgType,
            messageBody: msgBody,
            sentAt: new Date(sent).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) !== 'Invalid Date' ? new Date(sent).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : sent,
            status: stat,
            statusVariant: stat === 'Delivered' || stat === 'Read' ? 'success' : 'rejected'
          };
        });
        setData(mapped);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [targetAudience, setTargetAudience] = useState('All Stakeholders');
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [channel, setChannel] = useState('Email');
  const [messageType, setMessageType] = useState('System_Update');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [customTag, setCustomTag] = useState('BROADCAST');

  const filters = ['All', 'Email', 'SMS', 'Push', 'In-App'];

  const filteredData = data.filter(item => {
    const matchesChannel = activeFilter === 'All' || item.channel === activeFilter;
    const matchesSearch = !searchQuery || 
      item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.messageBody.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.messageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return <Mail className="w-4 h-4 text-blue-550" />;
      case 'SMS': return <MessageSquare className="w-4 h-4 text-emerald-555" />;
      case 'Push': return <Smartphone className="w-4 h-4 text-purple-550" />;
      case 'In-App': return <BellRing className="w-4 h-4 text-amber-550" />;
      default: return <Mail className="w-4 h-4 text-gray-550" />;
    }
  };

  const handleSendBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;

    try {
      const res = await fetch(`/api/notifications?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Customer_Id: targetAudience === 'Individual Customer' ? (parseInt(customerIdInput, 10) || 1) : 1,
          Channel: channel,
          Message_Type: messageType,
          Message_Body: `[Broadcast, Target: ${targetAudience}] - ` + broadcastBody,
          Status: 'Delivered'
        })
      });
      if (res.ok) await fetchNotifications();
    } catch (err) { console.error(err); }

    setIsBroadcastOpen(false);
    setBroadcastBody('');
  };

  const triggerMockFailed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setData(data.map(item => item.id === id ? {
      ...item,
      status: 'Failed',
      statusVariant: 'rejected'
    } : item));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications Log</h1>
          <p className="text-sm text-gray-500 mt-1">Audit trail of all communication messages sent to customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsBroadcastOpen(true)}
            className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold text-xs px-5"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            Send System Broadcast
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages, customers..." 
                className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm" 
              />
            </div>
            
            <div className="flex items-center p-1 bg-gray-55/60 border border-gray-200 rounded-lg whitespace-nowrap overflow-x-auto">
              {filters.map(filter => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === filter ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
              className="gap-2 h-10 text-gray-700 bg-white shadow-sm border-gray-200 w-full sm:w-auto text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="py-4 font-semibold text-gray-500 pl-6 w-[200px]">RECIPIENT / TARGET</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 w-[120px]">CHANNEL</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 w-[150px]">MESSAGE TYPE</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 max-w-[300px]">COMMUNICATION BODY</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 text-right">DISPATCHED TIME</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-500 pl-8 w-[155px]">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className="border-b-gray-50 hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => setSelectedNotif(row)}
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm tracking-tight">{row.customer}</span>
                        <span className="text-[10px] uppercase font-mono font-bold text-blue-550 mt-0.5">{row.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(row.channel)}
                        <span className="text-sm font-semibold text-gray-700">{row.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200/60 font-bold tracking-wide uppercase text-[9px] py-1 px-2">
                        {row.messageType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 max-w-[300px]">
                      <p className="text-xs text-gray-600 font-medium truncate" title={row.messageBody}>{row.messageBody}</p>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-gray-500 text-right font-medium whitespace-nowrap">{row.sentAt}</TableCell>
                    <TableCell className="py-3 pl-8" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                         <StatusBadge status={row.statusVariant as any} label={row.status} />
                         {row.status === 'Delivered' && (
                           <button 
                             onClick={(e) => triggerMockFailed(row.id, e)} 
                             className="text-[9px] font-bold text-red-500 hover:underline border hover:bg-red-50 px-1.5 py-0.5 rounded border-red-200"
                             title="Trigger mock failure for testing"
                           >
                             Fail
                           </button>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Showing <span className="font-semibold text-gray-900">1-{filteredData.length}</span> of <span className="font-semibold text-gray-900">{data.length}</span> records</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-gray-500 bg-white border-gray-200">Previous</Button>
            <Button variant="outline" size="sm" className="h-8 w-8 bg-blue-600 text-white border-blue-600 p-0">1</Button>
            <Button variant="outline" size="sm" className="h-8 text-gray-500 bg-white border-gray-200">Next</Button>
          </div>
        </div>
      </Card>

      {/* Broadcast Message Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border flex flex-col">
            <div className="p-4 border-b border-gray-101 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-600 animate-pulse" /> DISPATCH BROADSIDE NOTIFICATION
              </span>
              <button onClick={() => setIsBroadcastOpen(false)} className="text-gray-450 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSendBroadcastSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Target Audience *</label>
                  <select 
                    value={targetAudience} 
                    onChange={e => setTargetAudience(e.target.value)}
                    className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800"
                  >
                    <option value="All Stakeholders">All Corporate Accounts & Tenants</option>
                    <option value="Enterprise Partners">Enterprise Tier Companies</option>
                    <option value="Starter Tier Subscribers">Starter Tier Subscribers</option>
                    <option value="Pending Invoice Tenants">Overdue SaaS Tenants</option>
                    <option value="System Engineers">Corporate Underwriters</option>
                    <option value="Individual Customer">Individual Customer</option>
                  </select>
                </div>
                
                {targetAudience === 'Individual Customer' ? (
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Customer ID</label>
                    <Input 
                      type="number"
                      placeholder="ID" 
                      value={customerIdInput} 
                      onChange={e => setCustomerIdInput(e.target.value)}
                      className="h-10 text-xs font-semibold"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Communication Segment tag</label>
                    <Input 
                      type="text" 
                      placeholder="Notification type" 
                      value={customTag} 
                      onChange={e => setCustomTag(e.target.value)}
                      className="h-10 text-xs font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Preferred Delivery Channel *</label>
                  <select 
                    value={channel} 
                    onChange={e => setChannel(e.target.value)}
                    className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800"
                  >
                    <option value="Email">Secure Enterprise Email</option>
                    <option value="SMS">Short Message Service (SMS)</option>
                    <option value="Push">Mobile App Push Alert</option>
                    <option value="In-App">Penta Guard In-App Portal Toast</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Notification category *</label>
                  <select 
                    value={messageType} 
                    onChange={e => setMessageType(e.target.value)}
                    className="w-full bg-gray-50 hover:border-gray-300 border border-gray-200 h-10 px-3 rounded-lg text-xs font-bold text-gray-800"
                  >
                    <option value="System_Update">System Overhaul Version Patch</option>
                    <option value="Renewal">Scheduled Database Maintenance</option>
                    <option value="Policy_Expiry">Security & Regulatory Compliance Notice</option>
                    <option value="Welcome">Corporate Marketing Newsletter</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">Notification content Body *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Draft system communication body here..." 
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-gray-850 text-xs border border-gray-200 p-2.5 rounded-lg font-medium leading-relaxed"
                />
              </div>

              {/* LIVE SIMULATED DEVICE PREVIEW */}
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3.5 space-y-1.5 border border-slate-950 shadow-inner">
                <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold tracking-widest uppercase">
                  <span>LIVE DEVICE BROADCAST PREVIEW</span>
                  <span className="text-blue-400 font-black flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" /> {channel} FEED
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-300">
                    <Badge className="bg-slate-800 text-slate-300 font-extrabold uppercase text-[7px] p-0.5 tracking-wider px-1">
                      {customTag || 'BROADCAST'}
                    </Badge>
                    <span>To: {targetAudience}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">
                    {broadcastBody || "Waiting for draft inputs..."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 flex items-center gap-1.5 shadow">
                  <Check className="w-3.5 h-3.5" /> Broadcast Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200 border text-xs flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900 text-xs tracking-wider uppercase font-mono flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-550" /> Audited Dispatch: {selectedNotif.id}
              </span>
              <button onClick={() => setSelectedNotif(null)} className="text-gray-450 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Designated Recipient</span>
                <p className="font-black text-gray-901 text-sm">{selectedNotif.customer}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border">
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider text-left">Transmission Channel</span>
                  <span className="block font-semibold mt-1 text-gray-800 text-xs">{selectedNotif.channel}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider text-left">Classification Type</span>
                  <span className="block font-semibold mt-1 text-xs text-gray-800 uppercase">{selectedNotif.messageType.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Payload Message Log</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-150 text-gray-800 text-xs leading-relaxed font-semibold">
                  {selectedNotif.messageBody}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider text-left">Dispatched Clock-Time</span>
                  <span className="block text-gray-600 font-bold mt-0.5">{selectedNotif.sentAt}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider text-left">Transmission Verdict</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedNotif.statusVariant as any} label={selectedNotif.status} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <Button 
                  type="button" 
                  className="bg-blue-600 text-white font-bold" 
                  size="sm" 
                  onClick={() => {
                    console.info(`Syncing diagnostic telemetry with SMTP/Carrier protocol logs for ID: ${selectedNotif.id}... Successful!`);
                  }}
                >
                  Inspect Mailer Logs
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-gray-7ain hover:bg-slate-50" onClick={() => setSelectedNotif(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

