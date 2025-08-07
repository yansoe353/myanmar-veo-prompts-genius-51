import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, LogOut, Crown, Zap } from "lucide-react";

interface UserMenuProps {
  onOpenProfile: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenProfile }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getMembershipBadge = () => {
    switch (user.membershipTier) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'pro':
        return <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"><Zap className="w-3 h-3 mr-1" />Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-r from-neon-green to-neon-cyan text-black font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              {getMembershipBadge()}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Prompts used: {user.promptsUsed}/{user.promptsLimit}</span>
              <div className="w-20 bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-green to-neon-cyan h-2 rounded-full transition-all"
                  style={{ width: `${(user.promptsUsed / user.promptsLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenProfile}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile & Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};