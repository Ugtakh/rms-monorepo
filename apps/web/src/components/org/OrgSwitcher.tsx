import { Building2, ChevronDown, MapPin } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrgBranchSwitcher() {
    const { organization, branches, selectedBranch, setSelectedBranch } = useOrg();

    if (!organization) return null;

    return (
        <div className="px-4 py-3 space-y-2">
            {/* Organization display */}
            <div className="flex items-center gap-2 px-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-sidebar-accent-foreground truncate">
                    {organization.name}
                </span>
            </div>

            {/* Branch selector */}
            {branches.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent text-sm transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-sidebar-accent-foreground truncate flex-1 text-left">
                                {selectedBranch ? selectedBranch.name : 'Бүх салбар'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuLabel className="text-xs">Салбар сонгох</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setSelectedBranch(null)}
                            className={!selectedBranch ? 'bg-primary/10 text-primary' : ''}
                        >
                            <MapPin className="w-3.5 h-3.5 mr-2" />
                            Бүх салбар
                        </DropdownMenuItem>
                        {branches.map((branch) => (
                            <DropdownMenuItem
                                key={branch.id}
                                onClick={() => setSelectedBranch(branch)}
                                className={selectedBranch?.id === branch.id ? 'bg-primary/10 text-primary' : ''}
                            >
                                <MapPin className="w-3.5 h-3.5 mr-2" />
                                {branch.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
