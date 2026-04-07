import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from './AuthContext';

interface Organization {
    id: string;
    name: string;
    logo_url: string | null;
}

interface Branch {
    id: string;
    organization_id: string;
    name: string;
    address: string | null;
}

interface OrgContextType {
    organization: Organization | null;
    branches: Branch[];
    selectedBranch: Branch | null; // null = "Бүгд" (all)
    setSelectedBranch: (branch: Branch | null) => void;
    loading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
    // const { user } = useAuth();
    const { user } = { user: null };
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            // setOrganization(null);
            // setBranches([]);
            // setSelectedBranch(null);
            // setLoading(false);
            return;
        }

        async function fetchOrgData() {
            // Get user's org from profile
            // const { data: profile } = await supabase
            //     .from('profiles')
            //     .select('organization_id')
            //     .eq('user_id', user!.id)
            //     .single();

            // if (!profile?.organization_id) {
            //     setLoading(false);
            //     return;
            // }

            // const [{ data: org }, { data: branchList }] = await Promise.all([
            //     supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
            //     supabase.from('branches').select('*').eq('organization_id', profile.organization_id).order('name'),
            // ]);

            // if (org) setOrganization(org as Organization);
            // if (branchList) setBranches(branchList as Branch[]);
            // setLoading(false);
        }

        fetchOrgData();
    }, [user]);

    return (
        <OrgContext.Provider value={{ organization, branches, selectedBranch, setSelectedBranch, loading }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const ctx = useContext(OrgContext);
    if (!ctx) throw new Error('useOrg must be used within OrgProvider');
    return ctx;
}
