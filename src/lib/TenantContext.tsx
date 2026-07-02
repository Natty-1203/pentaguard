import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface TenantContextType {
  companies: any[];
  selectedCompanyId: number | null;
  selectedBranchId: number | null;
  selectCompany: (id: number) => void;
  selectBranch: (id: number | null) => void;
  selectedCompany: any;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  companies: [],
  selectedCompanyId: null,
  selectedBranchId: null,
  selectCompany: () => {},
  selectBranch: () => {},
  selectedCompany: null,
  loading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    const stored = localStorage.getItem('selectedCompanyId');
    return stored ? parseInt(stored) : null;
  });
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    const stored = localStorage.getItem('selectedBranchId');
    return stored ? parseInt(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
          if (!selectedCompanyId && data.length > 0) {
            setSelectedCompanyId(data[0].Company_Id);
          }
        }
      } catch (e) {
        console.error('Failed to load companies:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const selectCompany = useCallback((id: number) => {
    setSelectedCompanyId(id);
    setSelectedBranchId(null);
    localStorage.setItem('selectedCompanyId', String(id));
    localStorage.removeItem('selectedBranchId');
  }, []);

  const selectBranch = useCallback((id: number | null) => {
    setSelectedBranchId(id);
    if (id) {
      localStorage.setItem('selectedBranchId', String(id));
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  }, []);

  const selectedCompany = companies.find(c => c.Company_Id === selectedCompanyId) || null;

  return (
    <TenantContext.Provider value={{
      companies,
      selectedCompanyId,
      selectedBranchId,
      selectCompany,
      selectBranch,
      selectedCompany,
      loading,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
