import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Zap, Check, Star } from "lucide-react";
import { toast } from "sonner";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user, updateUser } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

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

  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    setIsUpgrading(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const limits = {
      pro: 100,
      premium: 1000
    };
    
    updateUser({
      membershipTier: tier,
      promptsLimit: limits[tier],
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    setIsUpgrading(false);
    toast.success(`Successfully upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`);
  };

  const membershipPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      prompts: 5,
      features: ['5 prompts per month', 'Basic support', 'Standard quality'],
      current: user.membershipTier === 'free',
      buttonText: 'Current Plan',
      disabled: true
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'month',
      prompts: 100,
      features: ['100 prompts per month', 'Priority support', 'High quality', 'Advanced features'],
      current: user.membershipTier === 'pro',
      buttonText: user.membershipTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: user.membershipTier === 'pro' || user.membershipTier === 'premium',
      tier: 'pro' as const
    },
    {
      name: 'Premium',
      price: '$19.99',
      period: 'month',
      prompts: 1000,
      features: ['1000 prompts per month', '24/7 support', 'Ultra quality', 'All features', 'API access'],
      current: user.membershipTier === 'premium',
      buttonText: user.membershipTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      disabled: user.membershipTier === 'premium',
      tier: 'premium' as const,
      popular: true
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Profile & Membership
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Account Information
                {getMembershipBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Prompt Usage</p>
                  <p className="text-sm text-muted-foreground">{user.promptsUsed}/{user.promptsLimit}</p>
                </div>
                <Progress value={(user.promptsUsed / user.promptsLimit) * 100} className="h-2" />
              </div>
              
              {user.membershipExpiry && (
                <div>
                  <p className="text-sm font-medium">Membership Expires</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.membershipExpiry).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Membership Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {membershipPlans.map((plan) => (
                <Card key={plan.name} className={`relative ${plan.popular ? 'border-neon-green shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-neon-green to-neon-cyan text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm">/{plan.period}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{plan.prompts} prompts</p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                    
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-neon-green" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      className={`w-full ${plan.current ? 'bg-muted' : 'bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple hover:from-neon-green/80 hover:via-neon-cyan/80 hover:to-neon-purple/80 text-black font-bold'}`}
                      disabled={plan.disabled || isUpgrading}
                      onClick={() => plan.tier && handleUpgrade(plan.tier)}
                    >
                      {isUpgrading ? 'Processing...' : plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};