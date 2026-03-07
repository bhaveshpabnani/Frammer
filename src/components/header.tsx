import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Settings, LogOut, User, CalendarRange, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DATE_RANGES = [
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
];

const CLIENTS = [
  { value: 'all', label: 'All clients' },
  { value: 'techcorp', label: 'TechCorp' },
  { value: 'mediahub', label: 'MediaHub' },
  { value: 'startupxyz', label: 'StartupXYZ' },
  { value: 'globalco', label: 'GlobalCo' },
];

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { filters, updateFilters } = useFilters();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const userEmail = user?.email ?? '';
  const displayName = user?.user_metadata?.full_name ?? userEmail.split('@')[0] ?? 'User';
  const avatarUrl = user?.user_metadata?.avatar_url ?? '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[#1C1C1C] bg-[#0A0A0A]/90 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-6 gap-4">
        {/* Left: Page title */}
        <div className="flex-1 min-w-0">
          {title && (
            <div>
              <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
              {subtitle && <p className="text-xs text-[#71717A] truncate">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Center: Global filters */}
        <div className="flex items-center gap-2">
          {/* Client filter */}
          <Select value={filters.client} onValueChange={(v) => updateFilters({ client: v })}>
            <SelectTrigger
              className={cn(
                'h-8 text-xs bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-white',
                'w-36 rounded-lg focus:ring-frammer-red/30'
              )}
            >
              <User className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#27272A]">
              {CLIENTS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs text-[#A1A1AA] focus:text-white focus:bg-white/8">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Select value={filters.dateRange} onValueChange={(v) => updateFilters({ dateRange: v })}>
            <SelectTrigger
              className={cn(
                'h-8 text-xs bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-white',
                'w-40 rounded-lg focus:ring-frammer-red/30'
              )}
            >
              <CalendarRange className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#27272A]">
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs text-[#A1A1AA] focus:text-white focus:bg-white/8">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Actions + Avatar */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#71717A] hover:text-white hover:bg-white/5 rounded-lg relative"
          >
            <Bell className="w-4 h-4" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-frammer-red" />
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors">
                <Avatar className="h-7 w-7 ring-1 ring-[#27272A]">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-frammer-red text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium text-white leading-none">{displayName}</span>
                  <span className="text-[10px] text-[#71717A] leading-none mt-0.5 max-w-[120px] truncate">{userEmail}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#71717A] ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#161616] border-[#27272A]">
              <DropdownMenuLabel className="text-xs text-[#71717A]">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#27272A]" />
              <DropdownMenuItem className="text-sm text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/8 cursor-pointer">
                <User className="w-3.5 h-3.5 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm text-[#A1A1AA] hover:text-white focus:text-white focus:bg-white/8 cursor-pointer">
                <Settings className="w-3.5 h-3.5 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#27272A]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-sm text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
