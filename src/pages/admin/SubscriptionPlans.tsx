import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { CreditCard, Check, Plus, Star, Zap, Building2, ShieldCheck, X, Trash2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscription-plans');
      if (res.ok) {
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any) => ({
          id: `plan_${dbRow.Plan_Id}`,
          name: dbRow.Plan_Name,
          price: `ETB ${Number(dbRow.Monthly_Fee || 0).toLocaleString()}`,
          interval: 'per month',
          description: dbRow.Plan_Name === 'Enterprise' ? 'Full-featured platform for large insurance groups with white-labeling and custom API access' : dbRow.Plan_Name === 'Professional' ? 'Advanced features for growing agencies with claims management and custom reports' : 'Essential tools for small agencies to manage clients and policies',
          features: dbRow.Features ? (typeof dbRow.Features === 'string' ? dbRow.Features.split(',').map((f:string) => f.trim()) : Object.keys(dbRow.Features).filter((k: string) => dbRow.Features[k]).map((k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()))) : ['Basic Reporting', 'Standard Support'],
          limitations: dbRow.Plan_Name === 'Enterprise' ? ['Requires annual contract'] : dbRow.Plan_Name === 'Professional' ? ['No white-labeling', 'No custom API'] : ['Max 3 branches', 'No claims management', 'No custom reports'],
          iconName: dbRow.Plan_Name === 'Enterprise' ? 'ShieldCheck' : (dbRow.Plan_Name === 'Professional' ? 'Star' : 'Building2'),
          popular: dbRow.Plan_Name === 'Professional',
          color: dbRow.Plan_Name === 'Enterprise' ? 'purple' : (dbRow.Plan_Name === 'Professional' ? 'emerald' : 'blue')
        }));
        setPlans(mapped);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchPlans();
  }, []);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setIntervalVal] = useState('per month');
  const [description, setDescription] = useState('');
  const [popular, setPopular] = useState(false);
  const [color, setColor] = useState('blue');
  const [features, setFeatures] = useState('');
  const [limitations, setLimitations] = useState('');
  const [iconName, setIconName] = useState('Star');

  const openAddModal = () => {
    setSelectedPlan(null);
    setName('');
    setPrice('ETB 8,000');
    setIntervalVal('per month');
    setDescription('A new plan tier for your customers.');
    setPopular(false);
    setColor('emerald');
    setFeatures('Up to 15 Agents, 2 Branch Locations, Priority Email Support');
    setLimitations('No Dedicated Account Manager');
    setIconName('Star');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setSelectedPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setIntervalVal(plan.interval);
    setDescription(plan.description);
    setPopular(plan.popular);
    setColor(plan.color || 'blue');
    setFeatures(plan.features.join(', '));
    setLimitations((plan.limitations || []).join(', '));
    setIconName(plan.iconName || 'Star');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFeatures = features.split(',').map(f => f.trim()).filter(Boolean);
    const cleanLimitations = limitations.split(',').map(l => l.trim()).filter(Boolean);
    const numericFee = price.replace(/[^0-9.-]+/g,"");

    try {
      if (selectedPlan) {
        const res = await fetch(`/api/subscription-plans/${parseInt(selectedPlan.id.replace('plan_',''), 10)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Plan_Name: name,
            Monthly_Fee: parseFloat(numericFee) || 0,
            Features: cleanFeatures.join(', ')
          })
        });
        if (res.ok) await fetchPlans();
      } else {
        const res = await fetch('/api/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Plan_Name: name,
            Monthly_Fee: parseFloat(numericFee) || 0,
            Features: cleanFeatures.join(', ')
          })
        });
        if (res.ok) await fetchPlans();
      }
    } catch (err) { console.error(err); }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subscription plan tier?")) {
      try {
        const res = await fetch(`/api/subscription-plans/${parseInt(id.replace('plan_',''), 10)}`, { method: 'DELETE' });
        if (res.ok) await fetchPlans();
      } catch (err) { console.error(err); }
    }
  };

  const getIconComponent = (name: string) => {
    switch(name) {
      case 'Building2': return Building2;
      case 'ShieldCheck': return ShieldCheck;
      default: return Star;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SaaS Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage pricing tiers and feature limits for tenant companies</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Create New Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => {
          const Icon = getIconComponent(plan.iconName);
          return (
            <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-emerald-500 shadow-md ring-1 ring-emerald-505 bg-slate-50/10' : 'border-gray-200 shadow-sm bg-white'}`}>
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                  <span className="bg-emerald-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              <CardContent className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{plan.name}</h3>
                      <p className="text-[10px] uppercase font-mono font-bold text-gray-400">{plan.id}</p>
                    </div>
                  </div>
                  <Button onClick={() => handleDelete(plan.id)} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-xs text-gray-550">/{plan.interval.split(' ')[1] || 'mo'}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-[10px] font-bold text-gray-950 uppercase tracking-widest">Included Features</p>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-4.5 h-4.5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                        </div>
                        <span className="text-xs text-gray-750 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations && plan.limitations.length > 0 && (
                    <>
                      <div className="pt-4 pb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Limitations</p>
                      </div>
                      <ul className="space-y-2.5">
                        {plan.limitations.map((limite, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-4.5 h-4.5 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border">
                              <span className="text-gray-400 font-bold text-xs leading-none">-</span>
                            </div>
                            <span className="text-xs text-gray-450 italic">{limite}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="pt-8 mt-auto">
                  <Button onClick={() => openEditModal(plan)} variant={plan.popular ? "default" : "outline"} className={`w-full font-bold text-xs ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}>
                    Edit Plan Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 label-primary">
                <CreditCard className="w-4 h-4 text-blue-600" /> {selectedPlan ? 'modify pricing configuration' : 'define new system tier'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">SaaS Name *</label>
                  <Input type="text" required placeholder="Plan name" value={name} onChange={e => setName(e.target.value)} className="h-10 text-xs font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">System Icon Style</label>
                  <select value={iconName} onChange={e => setIconName(e.target.value)} className="w-full bg-gray-50 hover:border-gray-300 border border-gray-205 h-10 px-3 rounded-lg text-xs font-bold text-gray-800">
                    <option value="Star">Professional Star</option>
                    <option value="Building2">Corporate Headquarters</option>
                    <option value="ShieldCheck">Enterprise Shield</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Rate Custom Charge *</label>
                  <Input type="text" required placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="h-10 text-xs font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Interval Cycle</label>
                  <Input type="text" placeholder="Billing period" value={interval} onChange={e => setIntervalVal(e.target.value)} className="h-10 text-xs font-semibold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">Subscription Tier Brief</label>
                <textarea rows={2} required placeholder="Target audience summary" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-55/40 text-gray-800 focus:bg-white text-xs border border-gray-200 p-2.5 rounded-lg font-medium" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Capabilities (Comma-separated list)</label>
                <textarea rows={2} required placeholder="List features" value={features} onChange={e => setFeatures(e.target.value)} className="w-full bg-gray-55/40 text-gray-800 focus:bg-white text-xs border border-gray-200 p-2.5 rounded-lg font-medium" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Limitations (Comma-separated list, optional)</label>
                <textarea rows={2} placeholder="List limitations" value={limitations} onChange={e => setLimitations(e.target.value)} className="w-full bg-gray-55/40 text-gray-800 focus:bg-white text-xs border border-gray-200 p-2.5 rounded-lg font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border">
                  <input type="checkbox" id="chkPopular" checked={popular} onChange={e => setPopular(e.target.checked)} className="h-4 w-4 text-emerald-600 rounded" />
                  <label htmlFor="chkPopular" className="text-gray-700 font-semibold cursor-pointer">Highlight as Popular</label>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-400 font-bold uppercase tracking-wider text-[8px]">Card Highlight Tint</label>
                  <select value={color} onChange={e => setColor(e.target.value)} className="w-full bg-slate-50 border border-gray-200 h-9 px-2.5 rounded-lg text-xs font-bold text-gray-700">
                    <option value="blue">Slate Blue</option>
                    <option value="emerald">Emerald Pro</option>
                    <option value="purple">Royal Purple</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs">
                <Button type="button" size="sm" variant="outline" className="text-gray-750" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-5 flex items-center gap-1.5 shadow">
                  <Check className="w-4 h-4" /> Save Pricing Tier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
