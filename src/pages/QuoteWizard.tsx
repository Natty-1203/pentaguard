import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { 
  Check, ChevronRight, ChevronLeft, Info, Car, X, ChevronDown, 
  Search, Plus, Home, Heart, Activity, CheckCircle, 
  Trash2, FileText, Printer, Sparkles, User, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Customer {
  id: string;
  dbId: number;
  name: string;
  email: string;
  phone: string;
  branch: string;
  avatar: string;
}

// Customers now loaded from database via API – see useEffect below

export default function QuoteWizardPage() {
  // Wizard State Controls
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [quoteId] = useState<string>(() => `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
  
  // Simulated database of customers in state – loaded from API
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showAddNewCustomer, setShowAddNewCustomer] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', branch: 'Addis Ababa' });
  const [customerSuccessMessage, setCustomerSuccessMessage] = useState<string>('');

  // Fetch customers from backend on mount
  const fetchCustomersList = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const rawData = await res.json();
      const mapped: Customer[] = rawData.map((dbRow: any, idx: number) => {
        const dbId = dbRow.Customer_Id ?? idx + 1;
        const name = `${dbRow.First_Name || 'Customer'} ${dbRow.Last_Name || ''}`;
        return {
          id: dbRow.Fayda_No || `CUS-${dbId.toString().padStart(4, '0')}`,
          dbId: dbId,
          name: name.trim(),
          email: dbRow.Email || 'N/A',
          phone: dbRow.Phone || 'N/A',
          branch: dbRow.Branch || 'Addis Ababa',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`,
        };
      });
      setCustomers(mapped);
      if (mapped.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to load customers for QuoteWizard:', err);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, []);

  // Step 2: Policy Type State
  const [insuranceType, setInsuranceType] = useState<string>('auto'); // auto, home, life, medical

  // Step 3: Combined Form States for different types
  const [autoForm, setAutoForm] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    value: '',
    color: '',
    engine: ''
  });

  const [homeForm, setHomeForm] = useState({
    buildYear: '',
    floors: '',
    address: '',
    structureType: 'Concrete & Masonry',
    structureValue: '',
    securitySystem: 'Yes',
    fireAlarm: 'Yes'
  });

  const [lifeForm, setLifeForm] = useState({
    dob: '',
    smoking: 'No',
    occupation: '',
    annualIncome: '',
    beneficiaryName: '',
    beneficiaryRelation: 'Spouse'
  });

  const [medicalForm, setMedicalForm] = useState({
    insuredAge: '',
    familySize: '',
    preExistingConditions: 'None',
    preferredTier: 'Tier A (Private Premium)',
    policyTerm: '1 Year'
  });

  // Step 4: Coverage Premium Selections
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Step 5: Remarks etc.
  const [agentRemarks, setAgentRemarks] = useState<string>('');
  const [certificationChecked, setCertificationChecked] = useState<boolean>(false);

  // Success screen trigger after creation
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [successQuoteData, setSuccessQuoteData] = useState<any>(null);

  // Dynamic message/toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger brief auto-clearing toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Resolve currently active customer object
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0] || {
      id: '...', dbId: 0, name: 'Loading...', email: '...', phone: '...', branch: '...', avatar: 'https://ui-avatars.com/api/?name=Loading&background=gray'
    };
  }, [selectedCustomerId, customers]);

  // Handle addition of customer – POST to backend
  const handleAddNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      setErrorMessage('Please provide a Customer Name and Phone Number.');
      return;
    }

    const parts = newCustomer.name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: firstName,
          Last_Name: lastName,
          Email: newCustomer.email || undefined,
        })
      });
      if (res.ok) {
        // Re-fetch the full list so we get the generated ID from the DB
        await fetchCustomersList();
        setShowAddNewCustomer(false);
        setNewCustomer({ name: '', email: '', phone: '', branch: 'Addis Ababa' });
        setCustomerSuccessMessage(`Successfully registered & selected Customer: ${newCustomer.name}`);
        setTimeout(() => setCustomerSuccessMessage(''), 5000);
        showToast('Customer added successfully!');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to register customer. Please try again.');
    }
  };

  // Filter customers by search term
  const filteredCustomersList = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.id.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Premium computation logic dynamically reacting to state!
  const premiumsCalculated = useMemo(() => {
    let base = 0;
    let categoryLabel = '';

    if (insuranceType === 'auto') {
      const val = parseFloat(autoForm.value) || 0;
      base = val * 0.008; // 0.8% of vehicle value
      categoryLabel = 'Auto Insurance';
    } else if (insuranceType === 'home') {
      const val = parseFloat(homeForm.structureValue) || 0;
      base = val * 0.0012; // 0.12% of property structure value
      categoryLabel = 'Home Insurance';
    } else if (insuranceType === 'life') {
      const inc = parseFloat(lifeForm.annualIncome) || 0;
      base = 4500 + (inc * 0.015); // basic charge + 1.5% of income cover multiplier
      categoryLabel = 'Life Insurance';
    } else if (insuranceType === 'medical') {
      const size = parseInt(medicalForm.familySize) || 1;
      const age = parseInt(medicalForm.insuredAge) || 30;
      base = 5000 + (size * 1800) + (age > 50 ? 2500 : 0);
      categoryLabel = 'Medical Insurance';
    }

    // Adjust price according to plan (basic, standard, premium)
    let planRate = base;
    let planName = 'Comprehensive';
    if (selectedPlan === 'basic') {
      planRate = base * 0.82;
      planName = 'Basic Liability';
    } else if (selectedPlan === 'premium') {
      planRate = base * 1.35;
      planName = 'Elite Comprehensive';
    }

    // Dynamic Addons
    let addonsTotal = 0;
    const computedAddonsList: { id: string; name: string; cost: number }[] = [];

    if (insuranceType === 'auto') {
      if (selectedAddons.includes('addon_roadside')) {
        computedAddonsList.push({ id: 'addon_roadside', name: 'Emergency Roadside Assistance', cost: 1500 });
      }
      if (selectedAddons.includes('addon_windshield')) {
        computedAddonsList.push({ id: 'addon_windshield', name: 'Zero-Deductible Windshield Cover', cost: 850 });
      }
      if (selectedAddons.includes('addon_theft')) {
        computedAddonsList.push({ id: 'addon_theft', name: 'Premium Theft Protection upgrade', cost: 1200 });
      }
    } else if (insuranceType === 'home') {
      if (selectedAddons.includes('addon_burglary')) {
        computedAddonsList.push({ id: 'addon_burglary', name: 'Burglary & Vandalism Extension', cost: 2200 });
      }
      if (selectedAddons.includes('addon_disaster')) {
        computedAddonsList.push({ id: 'addon_disaster', name: 'Natural Disaster Hazard Buffer', cost: 3500 });
      }
    } else if (insuranceType === 'life') {
      if (selectedAddons.includes('addon_accident')) {
        computedAddonsList.push({ id: 'addon_accident', name: 'Accidental Death Double Indemnity', cost: 2800 });
      }
      if (selectedAddons.includes('addon_disability')) {
        computedAddonsList.push({ id: 'addon_disability', name: 'Total & Permanent Disability Waiver', cost: 1900 });
      }
    } else if (insuranceType === 'medical') {
      if (selectedAddons.includes('addon_dental')) {
        computedAddonsList.push({ id: 'addon_dental', name: 'Dental Care & Orthodontic Care Add-on', cost: 2400 });
      }
      if (selectedAddons.includes('addon_vision')) {
        computedAddonsList.push({ id: 'addon_vision', name: 'Ophthalmology & Vision Hardware Support', cost: 950 });
      }
    }

    addonsTotal = computedAddonsList.reduce((acc, curr) => acc + curr.cost, 0);
    const subtotal = planRate + addonsTotal;
    const taxValue = subtotal * 0.15; // 15% VAT
    const finalTotal = subtotal + taxValue;

    return {
      baseAnnual: Math.round(base),
      planCalculated: Math.round(planRate),
      addonsTotal: Math.round(addonsTotal),
      addonsList: computedAddonsList,
      vat: Math.round(taxValue),
      grandTotal: Math.round(finalTotal),
      planName,
      categoryLabel
    };
  }, [insuranceType, autoForm, homeForm, lifeForm, medicalForm, selectedPlan, selectedAddons]);

  // Validation before going to next step
  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!selectedCustomerId) {
        setErrorMessage('Please select an active customer to proceed.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!insuranceType) {
        setErrorMessage('Please pick an insurance category.');
        return;
      }
    }

    if (currentStep === 3) {
      // Validate asset fields
      if (insuranceType === 'auto') {
        if (!autoForm.make || !autoForm.model || !autoForm.year || !autoForm.licensePlate || !autoForm.value) {
          setErrorMessage('Please fill in all required fields marked with *');
          return;
        }
        if (isNaN(Number(autoForm.value)) || Number(autoForm.value) <= 0) {
          setErrorMessage('Vehicle Value must be a valid positive number.');
          return;
        }
      } else if (insuranceType === 'home') {
        if (!homeForm.buildYear || !homeForm.floors || !homeForm.address || !homeForm.structureValue) {
          setErrorMessage('Please fill in all required fields marked with *');
          return;
        }
        if (isNaN(Number(homeForm.structureValue)) || Number(homeForm.structureValue) <= 0) {
          setErrorMessage('Structure Value must be a valid positive number.');
          return;
        }
      } else if (insuranceType === 'life') {
        if (!lifeForm.dob || !lifeForm.occupation || !lifeForm.annualIncome || !lifeForm.beneficiaryName) {
          setErrorMessage('Please fill in all required fields marked with *');
          return;
        }
        if (isNaN(Number(lifeForm.annualIncome)) || Number(lifeForm.annualIncome) <= 0) {
          setErrorMessage('Annual Income must be a valid positive number.');
          return;
        }
      } else if (insuranceType === 'medical') {
        if (!medicalForm.insuredAge || !medicalForm.familySize) {
          setErrorMessage('Please fill in all required fields marked with *');
          return;
        }
        if (isNaN(Number(medicalForm.insuredAge)) || Number(medicalForm.insuredAge) <= 0) {
          setErrorMessage('Insured Age must be a positive number.');
          return;
        }
      }
    }

    if (currentStep === 4) {
      if (!selectedPlan) {
        setErrorMessage('Please select a coverage tier package.');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSaveDraft = () => {
    const draftName = `DRAFT-${quoteId}`;
    showToast(`Draft "${draftName}" saved securely in local state. Progress recorded!`);
  };

  const handleCreatePolicySubmission = async () => {
    if (!certificationChecked) {
      setErrorMessage('Please affirm the accuracy declarations by checking the required checkbox.');
      return;
    }

    try {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Customer_Id: activeCustomer.dbId,
          Insurance_Type_Id: { 'auto': 1, 'home': 2, 'life': 3, 'medical': 4 }[insuranceType] || 1,
          Premium_Amount: premiumsCalculated.planCalculated,
          Status: 'Active'
        })
      });
    } catch (err) { console.error(err); }

    const compiledData = {
      id: quoteId,
      customer: activeCustomer,
      type: insuranceType,
      typeLabel: premiumsCalculated.categoryLabel,
      formData: insuranceType === 'auto' ? autoForm :
                insuranceType === 'home' ? homeForm :
                insuranceType === 'life' ? lifeForm : medicalForm,
      pricing: premiumsCalculated,
      plan: selectedPlan,
      remarks: agentRemarks,
      generatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    setSuccessQuoteData(compiledData);
    setIsSubmitted(true);
    showToast('Quote generation finalized and registered!');
  };

  const handleResetWizard = () => {
    setCurrentStep(1);
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
    setInsuranceType('auto');
    setSelectedPlan('standard');
    setSelectedAddons([]);
    setAgentRemarks('');
    setCertificationChecked(false);
    setIsSubmitted(false);
    setSuccessQuoteData(null);
    setErrorMessage(null);
  };

  // Compute overall percentage of wizard complete
  const progressPercent = useMemo(() => {
    return (currentStep / 5) * 100;
  }, [currentStep]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 relative">
      
      {/* Toast Notification Popup container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Stepper Wizard Head */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ padding: '0 3%' }}>
              
              {/* Step 1: Customer */}
              <button 
                onClick={() => currentStep > 1 && setCurrentStep(1)} 
                disabled={currentStep === 1 || isSubmitted}
                className="flex flex-col items-center gap-2 relative transition-all duration-300 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 font-bold transition-colors ${
                  currentStep > 1 ? 'bg-emerald-600 text-white' : 
                  currentStep === 1 ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <span className={`text-[11px] font-bold ${currentStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>Customer</span>
              </button>

              {/* Connector line 1 */}
              <div className="hidden sm:block flex-1 h-0.5 max-w-[120px] bg-gray-200 relative">
                <div className={`absolute inset-0 bg-blue-600 transition-all duration-300`} style={{ width: currentStep > 1 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 2: Policy Type */}
              <button 
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                disabled={currentStep <= 2 || isSubmitted}
                className="flex flex-col items-center gap-2 relative transition-all duration-300 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 font-bold transition-colors ${
                  currentStep > 2 ? 'bg-emerald-600 text-white' : 
                  currentStep === 2 ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
                </div>
                <span className={`text-[11px] font-bold ${currentStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>Ins. Type</span>
              </button>

              {/* Connector line 2 */}
              <div className="hidden sm:block flex-1 h-0.5 max-w-[120px] bg-gray-200 relative">
                <div className={`absolute inset-0 bg-blue-600 transition-all duration-300`} style={{ width: currentStep > 2 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 3: Asset Details */}
              <button 
                onClick={() => currentStep > 3 && setCurrentStep(3)}
                disabled={currentStep <= 3 || isSubmitted}
                className="flex flex-col items-center gap-2 relative transition-all duration-300 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 font-bold transition-colors ${
                  currentStep > 3 ? 'bg-emerald-600 text-white' : 
                  currentStep === 3 ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  {currentStep > 3 ? <Check className="w-5 h-5" /> : '3'}
                </div>
                <span className={`text-[11px] font-bold ${currentStep === 3 ? 'text-blue-600' : 'text-gray-500'}`}>Asset Details</span>
              </button>

              {/* Connector line 3 */}
              <div className="hidden sm:block flex-1 h-0.5 max-w-[120px] bg-gray-200 relative">
                <div className={`absolute inset-0 bg-blue-600 transition-all duration-300`} style={{ width: currentStep > 3 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 4: Premium Calculations */}
              <button 
                onClick={() => currentStep > 4 && setCurrentStep(4)}
                disabled={currentStep <= 4 || isSubmitted}
                className="flex flex-col items-center gap-2 relative transition-all duration-300 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 font-bold transition-colors ${
                  currentStep > 4 ? 'bg-emerald-600 text-white' : 
                  currentStep === 4 ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  {currentStep > 4 ? <Check className="w-5 h-5" /> : '4'}
                </div>
                <span className={`text-[11px] font-bold ${currentStep === 4 ? 'text-blue-600' : 'text-gray-500'}`}>Premium</span>
              </button>

              {/* Connector line 4 */}
              <div className="hidden sm:block flex-1 h-0.5 max-w-[120px] bg-gray-200 relative">
                <div className={`absolute inset-0 bg-blue-600 transition-all duration-300`} style={{ width: currentStep > 4 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 5: Review */}
              <div className="flex flex-col items-center gap-2 transition-all duration-300">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 font-bold transition-colors ${
                  currentStep === 5 ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  '5'
                </div>
                <span className={`text-[11px] font-bold ${currentStep === 5 ? 'text-blue-600' : 'text-gray-500'}`}>Review</span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Dynamic Display Error Warning Banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-sm text-red-800 animate-pulse">
            <Info className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="font-bold">Execution Blocked: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Dynamic Step Content Cases */}
        {!isSubmitted ? (
          <Card className="shadow-sm border-gray-200">
            
            {/* Step 1 Content: Customer Selection */}
            {currentStep === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">Select Customer Identity</CardTitle>
                  <CardDescription>Assign this insurance quote request to a Customer Profile, or register a fresh account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {customerSuccessMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {customerSuccessMessage}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-80 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input 
                        value={customerSearch} 
                        onChange={e => setCustomerSearch(e.target.value)} 
                        placeholder="Search standard files..."
                        className="pl-9 h-10 text-xs bg-gray-50/50"
                      />
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={() => setShowAddNewCustomer(prev => !prev)}
                      variant={showAddNewCustomer ? "outline" : "default"}
                      className="gap-2 h-10 text-xs text-white"
                      style={{ backgroundColor: showAddNewCustomer ? 'transparent' : '#1d4ed8' }}
                    >
                      {showAddNewCustomer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {showAddNewCustomer ? 'Close Form' : 'Register New Customer'}
                    </Button>
                  </div>

                  {/* Collapse Container for Adding New Customer */}
                  {showAddNewCustomer && (
                    <form onSubmit={handleAddNewCustomerSubmit} className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-3">
                      <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Fast Customer Intake Form</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">Full Name</label>
                          <Input 
                            required
                            placeholder="e.g., Almaz Teshome" 
                            value={newCustomer.name} 
                            onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">Phone Number</label>
                          <Input 
                            required
                            placeholder="e.g., +251 91 122 3344" 
                            value={newCustomer.phone} 
                            onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">Email Address</label>
                          <Input 
                            type="email"
                            placeholder="e.g., almaz@gmail.com" 
                            value={newCustomer.email} 
                            onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">Primary Branch</label>
                          <select 
                            value={newCustomer.branch} 
                            onChange={e => setNewCustomer({...newCustomer, branch: e.target.value})}
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="Addis Ababa">Addis Ababa Branch</option>
                            <option value="Dire Dawa">Dire Dawa Branch</option>
                            <option value="Hawassa">Hawassa Branch</option>
                            <option value="Bahir Dar">Bahir Dar Branch</option>
                            <option value="Mekele">Mekele Branch</option>
                            <option value="Adama">Adama Branch</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit" className="bg-blue-600 text-white font-semibold text-[11px] px-4 py-2 hover:bg-blue-700">
                          Create & Auto-Select
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* List of matching customer profiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto pr-1">
                    {filteredCustomersList.length > 0 ? (
                      filteredCustomersList.map((customer) => {
                        const isMatch = selectedCustomerId === customer.id;
                        return (
                          <div 
                            key={customer.id}
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-400 hover:shadow-sm ${
                              isMatch ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full border border-gray-300 object-cover shrink-0" />
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-sm text-gray-900">{customer.name}</h4>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                  <span>ID: {customer.id}</span>
                                  <span>•</span>
                                  <span>{customer.branch}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono tracking-tight">{customer.email}</div>
                              </div>
                            </div>
                            {isMatch ? (
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-gray-300 bg-white"></div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="md:col-span-2 text-center py-8 text-gray-400 text-xs">
                        No customer registrations found matching your query details. Try typing "Mulualem" or add a new customer!
                      </div>
                    )}
                  </div>

                </CardContent>
              </>
            )}

            {/* Step 2 Content: Insurance Category Selection */}
            {currentStep === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">Choose Insurance Category</CardTitle>
                  <CardDescription>Selecting a category dynamically shapes the risk evaluation requirements in subsequent steps.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Category Card 1: Auto */}
                  <div 
                    onClick={() => setInsuranceType('auto')}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-sm flex gap-4 ${
                      insuranceType === 'auto' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        Auto Private & Fleet Cover
                        {insuranceType === 'auto' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </h4>
                      <p className="text-xs text-gray-500 leading-normal">Cover private cars, commercial vans, or enterprise transport lines against structural collision, thefts, and third-party liabilities.</p>
                      <span className="text-[10px] bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-full font-bold">Rate Multiplier: 0.80% / yr</span>
                    </div>
                  </div>

                  {/* Category Card 2: Home */}
                  <div 
                    onClick={() => setInsuranceType('home')}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-sm flex gap-4 ${
                      insuranceType === 'home' ? 'border-orange-600 bg-orange-50/30 ring-2 ring-orange-100' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <Home className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        Home & Real Estate Cover
                        {insuranceType === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />}
                      </h4>
                      <p className="text-xs text-gray-500 leading-normal">Defend private estates, multi-floor concrete structures, or high-value locations against fire outbreaks, break-ins, and severe weather.</p>
                      <span className="text-[10px] bg-orange-100/60 text-orange-700 px-2 py-0.5 rounded-full font-bold">Rate Multiplier: 0.12% / yr</span>
                    </div>
                  </div>

                  {/* Category Card 3: Life */}
                  <div 
                    onClick={() => setInsuranceType('life')}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-sm flex gap-4 ${
                      insuranceType === 'life' ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-100' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        Family Term-Life Protection
                        {insuranceType === 'life' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </h4>
                      <p className="text-xs text-gray-500 leading-normal">Provide financial security, retirement lump-sums, or structured dependents help for spouse and beneficiaries.</p>
                      <span className="text-[10px] bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Term-Benefit Structured</span>
                    </div>
                  </div>

                  {/* Category Card 4: Medical */}
                  <div 
                    onClick={() => setInsuranceType('medical')}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-sm flex gap-4 ${
                      insuranceType === 'medical' ? 'border-purple-600 bg-purple-50/30 ring-2 ring-purple-100' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        Private Health & Medical Care
                        {insuranceType === 'medical' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                      </h4>
                      <p className="text-xs text-gray-500 leading-normal">Cover private hospital stays, extensive family wellness care networks, medication lines, and clinical admissions.</p>
                      <span className="text-[10px] bg-purple-100/60 text-purple-700 px-2 py-0.5 rounded-full font-bold">Group & Individual Flexible</span>
                    </div>
                  </div>

                </CardContent>
              </>
            )}

            {/* Step 3 Content: Category Dynamic Asset Fields */}
            {currentStep === 3 && (
              <>
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 py-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">Asset Specifications</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Provide specific dimensions required for premium evaluations</p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 bg-blue-100/50 rounded-full border border-blue-100">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider">{premiumsCalculated.categoryLabel}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">

                  {/* SUB-CASE 1: AUTO */}
                  {insuranceType === 'auto' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Vehicle Make <span className="text-red-500">*</span></label>
                        <select 
                          value={autoForm.make} 
                          onChange={e => setAutoForm({...autoForm, make: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Toyota">Toyota</option>
                          <option value="Ford">Ford</option>
                          <option value="Hyundai">Hyundai</option>
                          <option value="Mercedes-Benz">Mercedes-Benz</option>
                          <option value="Lifan">Lifan</option>
                          <option value="Suzuki">Suzuki</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Vehicle Model <span className="text-red-500">*</span></label>
                        <Input 
                          required
                          value={autoForm.model} 
                          onChange={e => setAutoForm({...autoForm, model: e.target.value})}
                          placeholder="e.g. Land Cruiser, RAV4" 
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Build Year <span className="text-red-500">*</span></label>
                        <select 
                          value={autoForm.year} 
                          onChange={e => setAutoForm({...autoForm, year: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2015', '2010'].map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Plate Number <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder="e.g. AA 3-A2819" 
                          value={autoForm.licensePlate} 
                          onChange={e => setAutoForm({...autoForm, licensePlate: e.target.value})}
                          className="text-xs h-10 font-bold border-blue-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">VIN Number (Chassis)</label>
                        <Input 
                          placeholder="e.g., JT3HN86R1X02..." 
                          value={autoForm.vin} 
                          onChange={e => setAutoForm({...autoForm, vin: e.target.value})}
                          className="text-xs h-10 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Estimated Vehicle Value (ETB) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">ETB</span>
                          <Input 
                            type="number"
                            value={autoForm.value} 
                            onChange={e => setAutoForm({...autoForm, value: e.target.value})}
                            className="pl-11 text-xs h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Vehicle Paint Color</label>
                        <Input 
                          placeholder="Pearl White, Metallic Black" 
                          value={autoForm.color} 
                          onChange={e => setAutoForm({...autoForm, color: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Engine Displacement (CC)</label>
                        <div className="relative">
                          <Input 
                            placeholder="e.g. 4000, 1600" 
                            value={autoForm.engine} 
                            onChange={e => setAutoForm({...autoForm, engine: e.target.value})}
                            className="pr-10 text-xs h-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">cc</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-CASE 2: HOME */}
                  {insuranceType === 'home' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Construction Year <span className="text-red-500">*</span></label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 2018" 
                          value={homeForm.buildYear} 
                          onChange={e => setHomeForm({...homeForm, buildYear: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Number of Floors <span className="text-red-500">*</span></label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 2" 
                          value={homeForm.floors} 
                          onChange={e => setHomeForm({...homeForm, floors: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Property Address / Geolocation Info <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-450 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <Input 
                            placeholder="e.g. Bole Subcity, Woreda 03, House #1029, Addis Ababa" 
                            value={homeForm.address} 
                            onChange={e => setHomeForm({...homeForm, address: e.target.value})}
                            className="text-xs h-10 pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Major Structure Material</label>
                        <select 
                          value={homeForm.structureType} 
                          onChange={e => setHomeForm({...homeForm, structureType: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Concrete & Masonry">Concrete & Masonry</option>
                          <option value="Stone & Ashlar">Stone & Ashlar</option>
                          <option value="Steel Reinforced">Steel Reinforced</option>
                          <option value="Timber Frame">Timber Frame</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Reconstruction Structure Value (ETB) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">ETB</span>
                          <Input 
                            type="number" 
                            value={homeForm.structureValue} 
                            onChange={e => setHomeForm({...homeForm, structureValue: e.target.value})}
                            className="pl-11 text-xs h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">CCTV & Intruder Alarm Connected?</label>
                        <select 
                          value={homeForm.securitySystem} 
                          onChange={e => setHomeForm({...homeForm, securitySystem: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Yes">Yes (Central Access Point)</option>
                          <option value="No">No (None Installed)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Central Fire Sprinkler / Alarms?</label>
                        <select 
                          value={homeForm.fireAlarm} 
                          onChange={e => setHomeForm({...homeForm, fireAlarm: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Yes">Yes (Responsive Sensors)</option>
                          <option value="No">No (None Installed)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* SUB-CASE 3: LIFE */}
                  {insuranceType === 'life' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Date of Birth <span className="text-red-500">*</span></label>
                        <Input 
                          type="date" 
                          value={lifeForm.dob} 
                          onChange={e => setLifeForm({...lifeForm, dob: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Tobacco/Smoker Status <span className="text-red-500">*</span></label>
                        <select 
                          value={lifeForm.smoking} 
                          onChange={e => setLifeForm({...lifeForm, smoking: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="No">No - Non-Tobacco User</option>
                          <option value="Yes">Yes - Active Tobacco User</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Current Occupation / Field <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder="e.g. Civil Engineer, Retail Agent" 
                          value={lifeForm.occupation} 
                          onChange={e => setLifeForm({...lifeForm, occupation: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Estimated Annual Gross Salary (ETB) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">ETB</span>
                          <Input 
                            type="number" 
                            value={lifeForm.annualIncome} 
                            onChange={e => setLifeForm({...lifeForm, annualIncome: e.target.value})}
                            className="pl-11 text-xs h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Primary Beneficiary Name <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder="e.g. Wubit Hailu" 
                          value={lifeForm.beneficiaryName} 
                          onChange={e => setLifeForm({...lifeForm, beneficiaryName: e.target.value})}
                          className="text-xs h-10 animate-in"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Beneficiary Relationship <span className="text-red-500">*</span></label>
                        <select 
                          value={lifeForm.beneficiaryRelation} 
                          onChange={e => setLifeForm({...lifeForm, beneficiaryRelation: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child (Dependent Under 21)</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Business partner">Business Partner / Executive Shareholder</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* SUB-CASE 4: MEDICAL */}
                  {insuranceType === 'medical' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Main Insured Age <span className="text-red-500">*</span></label>
                        <Input 
                          type="number" 
                          value={medicalForm.insuredAge} 
                          onChange={e => setMedicalForm({...medicalForm, insuredAge: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Family Covered count (Including self) <span className="text-red-500">*</span></label>
                        <select 
                          value={medicalForm.familySize} 
                          onChange={e => setMedicalForm({...medicalForm, familySize: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="1">1 (Individual Self Only)</option>
                          <option value="2">2 Individuals</option>
                          <option value="3">3 Individuals / Nuclear family</option>
                          <option value="4">4 Individuals / Standard household</option>
                          <option value="5">5 or more Individuals</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Declared Pre-existing Medical Conditions</label>
                        <Input 
                          placeholder="e.g. Hypertension, Managed Diabetes, Asthma (Separate by commas, or specify None)" 
                          value={medicalForm.preExistingConditions} 
                          onChange={e => setMedicalForm({...medicalForm, preExistingConditions: e.target.value})}
                          className="text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Preferred Hospital Network Tier <span className="text-red-500">*</span></label>
                        <select 
                          value={medicalForm.preferredTier} 
                          onChange={e => setMedicalForm({...medicalForm, preferredTier: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Tier A (Private Premium)">Tier A - Private Specialist networks & Overseas</option>
                          <option value="Tier B (Combined Quality)">Tier B - Private Standard clinical systems & Public</option>
                          <option value="Tier C (Standard Core)">Tier C - Public General services and local systems</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Renewal / Coverage Term</label>
                        <select 
                          value={medicalForm.policyTerm} 
                          onChange={e => setMedicalForm({...medicalForm, policyTerm: e.target.value})}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="1 Year">1 Year Term (Standard renewable)</option>
                          <option value="2 Years">2 Years Lock (Stabilized rates)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-150 rounded-lg p-4 flex gap-3 text-xs text-blue-700 mt-4 leading-relaxed">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-semibold mb-0.5">Underwriting Note:</p>
                      {insuranceType === 'auto' && 'Vehicle specifications determine collision risks. Provide exact legal registration numbers to speed up underwriter verification.'}
                      {insuranceType === 'home' && 'Structure values determine replacement thresholds. Security systems unlock up to 10% premium reductions automatically.'}
                      {insuranceType === 'life' && 'Tobacco declarations are legally checked. Incorrect declarations could default and cancel benefit rights for recipients.'}
                      {insuranceType === 'medical' && 'Family member tiers balance network choices. Preferred Private Hospitals (Tier A) add premium support charges.'}
                    </div>
                  </div>

                </CardContent>
              </>
            )}

            {/* Step 4 Content: Pricing Plans Selector */}
            {currentStep === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">Select Coverage Plan Tier</CardTitle>
                  <CardDescription>Review the pricing matrix compiled from asset risk dimensions and toggled endorsements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* side-by-side bento card layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Basic Tier */}
                    <div 
                      onClick={() => setSelectedPlan('basic')}
                      className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                        selectedPlan === 'basic' ? 'border-gray-900 bg-gray-50/50 ring-2 ring-gray-100 shadow-sm' : 'border-gray-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <div className="space-y-3">
                        <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 font-bold uppercase tracking-wider">Eco Essential</span>
                        <div className="space-y-1">
                          <h4 className="font-black text-base text-gray-900">Basic Tier</h4>
                          <p className="text-xs text-gray-400 font-medium">Fundamental legal coverages</p>
                        </div>
                        <div className="py-2 border-y border-dashed border-gray-100 flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-gray-900">ETB {Math.round(premiumsCalculated.baseAnnual * 0.82).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400">/ yr</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-500 font-medium pt-1">
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Guaranteed Third-party liability</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Basic administrative processing</li>
                          <li className="opacity-40 line-through flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-400 shrink-0" /> Structural Damage indemnity</li>
                          <li className="opacity-40 line-through flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-400 shrink-0" /> Fire or Severe Nature Buffer</li>
                        </ul>
                      </div>
                      <div className="mt-5">
                        <Button 
                          type="button"
                          variant="outline" 
                          className={`w-full text-xs font-bold ${selectedPlan === 'basic' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white'}`}
                        >
                          Select Basic
                        </Button>
                      </div>
                    </div>

                    {/* Standard Tier (RECOMMENDED) */}
                    <div 
                      onClick={() => setSelectedPlan('standard')}
                      className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                        selectedPlan === 'standard' ? 'border-blue-600 bg-blue-50/20 ring-4 ring-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <div className="absolute top-0 right-5 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                        Popular Choice
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Standard Protection</span>
                        <div className="space-y-1">
                          <h4 className="font-black text-base text-gray-950">Standard Core</h4>
                          <p className="text-xs text-blue-500 font-bold">Comprehensive standard coverage</p>
                        </div>
                        <div className="py-2 border-y border-dashed border-gray-100 flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-blue-700">ETB {premiumsCalculated.baseAnnual.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-500">/ yr</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-700 font-medium pt-1">
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Guaranteed Third-party liability</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Core Asset Damage indemnity</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Loss & Theft protection coverage</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Local branch quick dispatch</li>
                        </ul>
                      </div>
                      <div className="mt-5">
                        <Button 
                          type="button"
                          className="w-full text-xs font-bold text-white" 
                          style={{ backgroundColor: selectedPlan === 'standard' ? '#2563eb' : '#374151' }}
                        >
                          Select Standard
                        </Button>
                      </div>
                    </div>

                    {/* Premium Tier */}
                    <div 
                      onClick={() => setSelectedPlan('premium')}
                      className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                        selectedPlan === 'premium' ? 'border-purple-600 bg-purple-50/20 ring-2 ring-purple-100 shadow-sm' : 'border-gray-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <div className="space-y-3">
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Premium Care</span>
                        <div className="space-y-1">
                          <h4 className="font-black text-base text-gray-900">Elite Supreme</h4>
                          <p className="text-xs text-purple-500 font-bold">Zero deductible absolute protection</p>
                        </div>
                        <div className="py-2 border-y border-dashed border-gray-100 flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-purple-700">ETB {Math.round(premiumsCalculated.baseAnnual * 1.35).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400">/ yr</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-500 font-medium pt-1">
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Everything in Standard Tier</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Zero Depreciation deductions</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Full Natural Disasters coverage</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Premium VIP Concierge underwriter</li>
                        </ul>
                      </div>
                      <div className="mt-5">
                        <Button 
                          type="button"
                          variant="outline" 
                          className={`w-full text-xs font-bold ${selectedPlan === 'premium' ? 'bg-purple-900 text-white border-purple-900 hover:bg-purple-800' : 'bg-white'}`}
                        >
                          Select Premium
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Addons Section */}
                  <div className="border-t border-gray-100 pt-6 space-y-3">
                    <h4 className="font-bold text-xs text-gray-800 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Add-on Endorsement Extensions (Optional)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Auto Options */}
                      {insuranceType === 'auto' && (
                        <>
                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_roadside') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_roadside')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_roadside']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_roadside'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Emergency Roadside Assist (+1,500 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Provides round-the-clock nationwide structural towing and battery jumps.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_windshield') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_windshield')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_windshield']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_windshield'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Zero-Deductible Windshield Cover (+850 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Glass replacement without paying any standard claim deductible processing fees.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_theft') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_theft')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_theft']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_theft'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Premium Theft Upgrade (+1,200 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Coverage for personal possessions left stolen inside the locked vehicle cabins.</p>
                            </div>
                          </label>
                        </>
                      )}

                      {/* Home Options */}
                      {insuranceType === 'home' && (
                        <>
                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_burglary') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_burglary')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_burglary']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_burglary'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Vandalism Extension (+2,200 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Repairs malicious exterior structural damage or wall defacements.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_disaster') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_disaster')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_disaster']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_disaster'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Earthquake & Flooding Hazard (+3,500 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Unlocks structural buffer for environmental disasters & high severity flash floods.</p>
                            </div>
                          </label>
                        </>
                      )}

                      {/* Life Options */}
                      {insuranceType === 'life' && (
                        <>
                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_accident') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_accident')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_accident']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_accident'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Double Indemnity Accident (+2,800 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Doubles term benefit pay if passing results from catastrophic traffic/workplace accidents.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_disability') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_disability')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_disability']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_disability'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Permanent Disability Premium Waiver (+1,900 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Locks active cover without monthly pay obligations if diagnosed with permanent disability.</p>
                            </div>
                          </label>
                        </>
                      )}

                      {/* Medical Options */}
                      {insuranceType === 'medical' && (
                        <>
                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_dental') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_dental')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_dental']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_dental'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Comprehensive Dental Support (+2,400 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Covers wisdom extraction, annual cleaning routines, fillings and orthodontic work.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedAddons.includes('addon_vision') ? 'bg-blue-50/20 border-blue-400' : 'border-gray-200'
                          }`}>
                            <input 
                              type="checkbox"
                              checked={selectedAddons.includes('addon_vision')}
                              onChange={e => {
                                if (e.target.checked) setSelectedAddons([...selectedAddons, 'addon_vision']);
                                else setSelectedAddons(selectedAddons.filter(id => id !== 'addon_vision'));
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Ophthalmology & Prescription Lenses (+950 ETB / yr)</div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Refunds visual examinations, frame hardware buys, and corrective contact lenses.</p>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                </CardContent>
              </>
            )}

            {/* Step 5 Content: Review & Sub underwriting */}
            {currentStep === 5 && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-905">Review & Confirm Proposal</CardTitle>
                  <CardDescription>Conduct an audit of the registered variables before signing off the draft proposal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Left Panel: Proposal configurations */}
                    <div className="space-y-4">
                      
                      {/* Customer Summary review */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                        <span className="text-[10px] bg-gray-200 text-gray-700 font-extrabold uppercase px-2.5 py-0.5 rounded-md">1. Selected Proposer</span>
                        <div className="flex items-center gap-3">
                          <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                          <div>
                            <div className="text-xs font-bold text-gray-900">{activeCustomer.name}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span>ID: {activeCustomer.id}</span>
                              <span>•</span>
                              <span>Tel: {activeCustomer.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coverage type & details */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                        <span className="text-[10px] bg-blue-100 text-blue-750 font-extrabold uppercase px-2.5 py-0.5 rounded-md">2. Cover Scope & Params</span>
                        
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                            {insuranceType === 'auto' && <Car className="w-4 h-4" />}
                            {insuranceType === 'home' && <Home className="w-4 h-4" />}
                            {insuranceType === 'life' && <Heart className="w-4 h-4" />}
                            {insuranceType === 'medical' && <Activity className="w-4 h-4" />}
                            {premiumsCalculated.categoryLabel} ({selectedPlan.toUpperCase()} TIER)
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            {insuranceType === 'auto' && (
                              <>
                                <div><span className="text-gray-400">Make/Model:</span> <span className="font-bold text-gray-700">{autoForm.make} {autoForm.model}</span></div>
                                <div><span className="text-gray-400">Plate:</span> <span className="font-mono font-bold text-gray-750">{autoForm.licensePlate}</span></div>
                                <div><span className="text-gray-400">Year:</span> <span className="font-bold text-gray-700">{autoForm.year}</span></div>
                                <div><span className="text-gray-400">Risk Value:</span> <span className="font-bold text-emerald-600">ETB {parseFloat(autoForm.value).toLocaleString()}</span></div>
                              </>
                            )}
                            {insuranceType === 'home' && (
                              <>
                                <div className="col-span-2"><span className="text-gray-400">Location:</span> <span className="font-bold text-gray-700">{homeForm.address}</span></div>
                                <div><span className="text-gray-400">Build Year:</span> <span className="font-bold text-gray-700">{homeForm.buildYear}</span></div>
                                <div><span className="text-gray-400">Security System:</span> <span className="font-bold text-gray-700">{homeForm.securitySystem}</span></div>
                                <div><span className="text-gray-400">Risk Value:</span> <span className="font-bold text-emerald-600">ETB {parseFloat(homeForm.structureValue).toLocaleString()}</span></div>
                              </>
                            )}
                            {insuranceType === 'life' && (
                              <>
                                <div><span className="text-gray-400">Beneficiary:</span> <span className="font-bold text-gray-700">{lifeForm.beneficiaryName} ({lifeForm.beneficiaryRelation})</span></div>
                                <div><span className="text-gray-400">DOB:</span> <span className="font-bold text-gray-700">{lifeForm.dob}</span></div>
                                <div><span className="text-gray-400">Occupation:</span> <span className="font-bold text-gray-700">{lifeForm.occupation}</span></div>
                                <div><span className="text-gray-400">Annual Wage:</span> <span className="font-semibold text-gray-700">ETB {parseFloat(lifeForm.annualIncome).toLocaleString()}</span></div>
                              </>
                            )}
                            {insuranceType === 'medical' && (
                              <>
                                <div><span className="text-gray-400">Primary Insured Age:</span> <span className="font-bold text-gray-700">{medicalForm.insuredAge} Years</span></div>
                                <div><span className="text-gray-400">Family Count:</span> <span className="font-bold text-gray-700">{medicalForm.familySize} Covered</span></div>
                                <div><span className="text-gray-400">Tier:</span> <span className="font-bold text-gray-700">{medicalForm.preferredTier}</span></div>
                                <div className="col-span-2"><span className="text-gray-400">Pre-existing conditions:</span> <span className="font-bold text-amber-700">{medicalForm.preExistingConditions}</span></div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Agent remarks input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">3. Agent / Underwriter Review Notes (Optional)</label>
                        <textarea 
                          rows={2}
                          value={agentRemarks}
                          onChange={e => setAgentRemarks(e.target.value)}
                          placeholder="Please document any key observations or special authorization clearances here..."
                          className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                    </div>

                    {/* Right Panel: Cost audit breakdown */}
                    <div className="bg-blue-900 text-white rounded-2xl p-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[9px] bg-blue-800 text-blue-200 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">Cost Valuation Breakdown</span>
                        
                        <div className="space-y-2.5 pt-2 text-xs text-blue-100">
                          <div className="flex justify-between">
                            <span>Plan Annual Base Premium</span>
                            <span className="font-semibold text-white">ETB {premiumsCalculated.planCalculated.toLocaleString()}</span>
                          </div>
                          
                          {premiumsCalculated.addonsList.length > 0 && (
                            <div className="space-y-1.5 border-t border-blue-800 pt-2">
                              <span className="text-[10px] uppercase font-bold text-blue-300">Added Endorsements:</span>
                              {premiumsCalculated.addonsList.map(addon => (
                                <div key={addon.id} className="flex justify-between text-[11px] pl-2 text-blue-200">
                                  <span>+ {addon.name}</span>
                                  <span>ETB {addon.cost.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between border-t border-blue-800 pt-2.5">
                            <span>Vat Surcharge (15.0%)</span>
                            <span className="font-bold text-blue-200">ETB {premiumsCalculated.vat.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Huge grand total and checkbox */}
                      <div className="pt-5 border-t border-blue-800 mt-5 space-y-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-blue-300">ESTIMATED ANNUAL PREMIUM</span>
                          <span className="text-2xl font-black text-amber-300">ETB {premiumsCalculated.grandTotal.toLocaleString()}</span>
                        </div>
                        
                        <label className="flex items-start gap-2.5 bg-blue-950/40 p-3 rounded-lg border border-blue-800 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={certificationChecked}
                            onChange={e => setCertificationChecked(e.target.checked)}
                            className="rounded border-blue-600 bg-blue-900 text-blue-600 focus:ring-blue-600 mt-0.5"
                          />
                          <span className="text-[10px] text-blue-200 leading-normal">
                            I verify that correct underwriting assessments were conducted and customer details were audited.
                          </span>
                        </label>
                      </div>

                    </div>

                  </div>

                </CardContent>
              </>
            )}

            {/* General Wizard Action Buttons Footer */}
            <CardFooter className="py-4 border-t border-gray-100 flex items-center justify-between">
              
              <Button 
                type="button" 
                variant="outline"
                disabled={currentStep === 1}
                onClick={handlePrevStep}
                className="gap-1.5 text-xs text-gray-700 bg-white border-gray-200/60 hover:bg-gray-50 flex items-center"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  className="text-xs text-gray-700 bg-white border-gray-250 hover:bg-gray-55"
                >
                  Save Draft Proposal
                </Button>
                
                {currentStep < 5 ? (
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center h-10 px-4"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleCreatePolicySubmission}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center h-10 px-5"
                  >
                    Confirm & Generate Policy
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>

            </CardFooter>
          </Card>
        ) : (
          
          /* SUCCESS STATE: PROPOSAL CONFIRMED SCREEN */
          <Card className="shadow-lg border-emerald-200 overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-emerald-600 text-white p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/20 border border-white/45 text-white flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8 font-black" />
              </div>
              <h1 className="text-xl font-black">Insurance Policy Quote Approved!</h1>
              <p className="text-xs text-emerald-100 max-w-md">The risk assessment was processed successfully. Quote registry ID <b>{successQuoteData?.id}</b> is approved for policy drafting.</p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-dashed border-gray-100 p-4 rounded-xl">
                <div className="space-y-0.5 text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0 md:pr-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Policy Owner</span>
                  <div className="text-xs font-bold text-gray-900 mt-1">{successQuoteData?.customer?.name}</div>
                  <div className="text-[10px] text-gray-400">ID: {successQuoteData?.customer?.id}</div>
                </div>
                <div className="space-y-0.5 text-center border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0 px-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Coverage Category</span>
                  <div className="text-xs font-bold text-blue-600 mt-1 uppercase flex items-center justify-center gap-1">
                    {successQuoteData?.type === 'auto' && <Car className="w-3.5 h-3.5" />}
                    {successQuoteData?.type === 'home' && <Home className="w-3.5 h-3.5" />}
                    {successQuoteData?.type === 'life' && <Heart className="w-3.5 h-3.5" />}
                    {successQuoteData?.type === 'medical' && <Activity className="w-3.5 h-3.5" />}
                    {successQuoteData?.typeLabel}
                  </div>
                  <div className="text-[10px] text-gray-500">Plan Option: {successQuoteData?.plan?.toUpperCase()}</div>
                </div>
                <div className="space-y-0.5 text-center md:text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Scheduled Rate</span>
                  <div className="text-base font-black text-emerald-700 mt-0.5">ETB {successQuoteData?.pricing?.grandTotal?.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">VAT (15%) Included / annual</div>
                </div>
              </div>

              {/* Action options */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                
                <Button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>OFFICIAL INSURANCE POLICY PROPOSAL - ${successQuoteData?.id}</title>
                            <style>
                              body { font-family: sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
                              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
                              .title { font-size: 24px; font-weight: bold; }
                              .id { color: #4b5563; font-weight: bold; }
                              .section { margin-bottom: 25px; }
                              .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
                              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
                              .premium { font-size: 18px; font-weight: bold; color: #059669; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div class="title">INSURANCE POLICY QUOTE SUMMARY</div>
                              <div class="id">Quote Reference: ${successQuoteData?.id}</div>
                              <div>Date: ${successQuoteData?.generatedDate}</div>
                            </div>
                            <div class="section">
                              <div class="section-title">1. Proposer Client Information</div>
                              <div class="grid">
                                <div><strong>Name:</strong> ${successQuoteData?.customer?.name}</div>
                                <div><strong>Client Account ID:</strong> ${successQuoteData?.customer?.id}</div>
                                <div><strong>Contact Phone:</strong> ${successQuoteData?.customer?.phone}</div>
                                <div><strong>Primary Branch:</strong> ${successQuoteData?.customer?.branch}</div>
                              </div>
                            </div>
                            <div class="section">
                              <div class="section-title">2. Policy Risk Parameter Declarations</div>
                              <div class="grid">
                                <div><strong>Category Type:</strong> ${successQuoteData?.typeLabel}</div>
                                <div><strong>Plan coverage scope:</strong> ${successQuoteData?.plan?.toUpperCase()} Protect</div>
                                <div><strong>Agent Remarks:</strong> ${successQuoteData?.remarks || 'N/A'}</div>
                              </div>
                            </div>
                            <div class="section">
                              <div class="section-title">3. Pricing Schedule Breakdown</div>
                              <div class="grid">
                                <div>Plan Base Premium: ETB ${successQuoteData?.pricing?.planCalculated?.toLocaleString()}</div>
                                <div>Addons & Extensions Total: ETB ${successQuoteData?.pricing?.addonsTotal?.toLocaleString()}</div>
                                <div>Surcharge VAT (15%): ETB ${successQuoteData?.pricing?.vat?.toLocaleString()}</div>
                                <div class="premium">VALUED ANNUAL RATE: ETB ${successQuoteData?.pricing?.grandTotal?.toLocaleString()}</div>
                              </div>
                            </div>
                            <div style="margin-top: 50px; font-size: 11px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                              This summary was authorized in our digital underwriting system. Official premium contract draft pending certificate signature.
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    } else {
                      showToast("Simulated Print View opened! Allow popups to print.");
                    }
                  }}
                  variant="outline" 
                  className="gap-2 text-xs bg-white text-gray-700 w-full sm:w-auto h-11"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF Documentation
                </Button>
                
                <Link to="/policies" className="w-full sm:w-auto">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold w-full h-11">
                    <FileText className="w-4 h-4" />
                    Go to Policies Register
                  </Button>
                </Link>

                <Button 
                  onClick={handleResetWizard}
                  variant="ghost" 
                  className="text-xs text-gray-500 hover:text-gray-900 w-full sm:w-auto"
                >
                  Prepare Alternate Quote
                </Button>

              </div>

            </CardContent>
          </Card>
        )}

      </div>

      {/* Right Sidebar - Dynamic Quote Summary */}
      <div className="xl:w-[320px] shrink-0">
        <Card className="shadow-sm border-gray-200 sticky top-24">
          <CardHeader className="py-4 border-b border-gray-100">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Proposal Summary</CardTitle>
            <p className="text-xs text-gray-900 font-extrabold">{quoteId}</p>
          </CardHeader>
          <CardContent className="p-0">
            
            {/* Customer Section */}
            <div className="p-4 border-b border-gray-50">
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">PROPOSER</div>
              <div className="flex items-center gap-2">
                <img src={activeCustomer.avatar} alt="Customer" className="w-8 h-8 rounded-full border border-gray-100 object-cover shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 truncate">{activeCustomer.name}</div>
                  <div className="text-[9px] text-gray-400">ID: {activeCustomer.id}</div>
                </div>
              </div>
            </div>

            {/* Insurance Category Section */}
            <div className="p-4 border-b border-gray-50">
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">POLICY CATEGORY</div>
              <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-105 rounded-md p-2 text-xs font-bold text-blue-700">
                {insuranceType === 'auto' && <Car className="w-4 h-4 text-blue-600" />}
                {insuranceType === 'home' && <Home className="w-4 h-4 text-orange-600" />}
                {insuranceType === 'life' && <Heart className="w-4 h-4 text-emerald-600" />}
                {insuranceType === 'medical' && <Activity className="w-4 h-4 text-purple-600" />}
                {premiumsCalculated.categoryLabel}
              </div>
            </div>

            {/* Selected Plan Spec Section */}
            <div className="p-4 border-b border-gray-50 space-y-2">
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">SELECTED LEVEL COVER</div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 uppercase">{selectedPlan} Tier</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Base: ETB {premiumsCalculated.planCalculated.toLocaleString()}</span>
              </div>
            </div>

            {/* Risk Spec Details */}
            <div className="p-4 border-b border-gray-50">
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">DECLARED PARAMETERS</div>
              <div className="space-y-1.5 text-[10px] text-gray-600 font-medium">
                {insuranceType === 'auto' && (
                  <>
                    <div className="flex justify-between"><span>Make / Model</span><span className="font-bold text-gray-800">{autoForm.make} {autoForm.model}</span></div>
                    <div className="flex justify-between"><span>Risk value</span><span className="font-bold text-emerald-600">ETB {parseFloat(autoForm.value).toLocaleString()}</span></div>
                  </>
                )}
                {insuranceType === 'home' && (
                  <>
                    <div className="flex justify-between"><span>Structure Value</span><span className="font-bold text-emerald-600">ETB {parseFloat(homeForm.structureValue).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Has Fire Alarms</span><span className="font-bold text-gray-800">{homeForm.fireAlarm}</span></div>
                  </>
                )}
                {insuranceType === 'life' && (
                  <>
                    <div className="flex justify-between"><span>Declared DOB</span><span className="font-bold text-gray-800">{lifeForm.dob}</span></div>
                    <div className="flex justify-between"><span>Annual Income</span><span className="font-bold text-gray-850">ETB {parseFloat(lifeForm.annualIncome).toLocaleString()}</span></div>
                  </>
                )}
                {insuranceType === 'medical' && (
                  <>
                    <div className="flex justify-between"><span>Total Covered Count</span><span className="font-bold text-gray-800">{medicalForm.familySize} Members</span></div>
                    <div className="flex justify-between"><span>Condition status</span><span className="font-bold text-amber-700 truncate max-w-[140px]">{medicalForm.preExistingConditions}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Estimated Annual Premium range section */}
            <div className="p-4 bg-gray-50/55">
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">ESTIMATED VALUATION</div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-emerald-600 font-bold mb-0.5">EST. GRAND TOTAL Premium:</div>
                <div className="text-lg font-black text-emerald-800">ETB {premiumsCalculated.grandTotal.toLocaleString()}</div>
                <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">VAT inclusive / yr</div>
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-col gap-2">
            <div className="w-full flex justify-between items-center text-[10px] font-bold text-gray-800">
              <span>Wizard Progress</span>
              <span className="text-blue-600">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="text-[9px] text-gray-450 text-center font-medium">
              Step {currentStep} of 5 — {
                currentStep === 1 ? 'Customer' :
                currentStep === 2 ? 'Insurance Type' :
                currentStep === 3 ? 'Asset Details' :
                currentStep === 4 ? 'Premium Plan' : 'Review Proposal'
              }
            </div>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
}

