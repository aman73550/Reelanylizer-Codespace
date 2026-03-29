import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IndianRupee, Save, RotateCcw, Zap } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const PLANS: Plan[] = [
  { id: "free", name: "Free Plan", icon: "🏛️", color: "slate" },
  { id: "starter", name: "Starter Plan", icon: "🏛️", color: "amber" },
  { id: "pro", name: "Pro Plan", icon: "🏆", color: "violet" },
  { id: "power", name: "Power Plan", icon: "⚡", color: "orange" },
];

const AdminPricingManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState<Record<string, { price: number; credits: number }>>({
    free: { price: 0, credits: 5 },
    starter: { price: 49, credits: 15 },
    pro: { price: 199, credits: 120 },
    power: { price: 399, credits: 300 },
  });

  const [originalPricing, setOriginalPricing] = useState<Record<string, { price: number; credits: number }>>({
    free: { price: 0, credits: 5 },
    starter: { price: 49, credits: 15 },
    pro: { price: 199, credits: 120 },
    power: { price: 399, credits: 300 },
  });

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("site_config")
        .select("config_key, config_value");

      if (data) {
        const configMap: Record<string, string> = {};
        data.forEach((row) => {
          configMap[row.config_key] = row.config_value;
        });

        const newPricing: Record<string, { price: number; credits: number }> = {};
        PLANS.forEach((plan) => {
          const priceKey = `pack_${plan.id}_price`;
          const creditsKey = `pack_${plan.id}_credits`;
          newPricing[plan.id] = {
            price: configMap[priceKey] ? parseInt(configMap[priceKey]) : pricing[plan.id]?.price || 0,
            credits: configMap[creditsKey] ? parseInt(configMap[creditsKey]) : pricing[plan.id]?.credits || 0,
          };
        });

        setPricing(newPricing);
        setOriginalPricing(JSON.parse(JSON.stringify(newPricing)));
      }
    } catch (err: any) {
      toast.error("Failed to load pricing: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = (planId: string, field: "price" | "credits", value: number) => {
    setPricing((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      for (const plan of PLANS) {
        const priceKey = `pack_${plan.id}_price`;
        const creditsKey = `pack_${plan.id}_credits`;
        const priceValue = pricing[plan.id].price.toString();
        const creditsValue = pricing[plan.id].credits.toString();

        // Update or insert price config
        const { data: existingPrice } = await supabase
          .from("site_config")
          .select("id")
          .eq("config_key", priceKey)
          .single();

        if (existingPrice) {
          await supabase
            .from("site_config")
            .update({ config_value: priceValue, updated_at: new Date().toISOString() })
            .eq("config_key", priceKey);
        } else {
          await supabase
            .from("site_config")
            .insert({ config_key: priceKey, config_value: priceValue });
        }

        // Update or insert credits config
        const { data: existingCredits } = await supabase
          .from("site_config")
          .select("id")
          .eq("config_key", creditsKey)
          .single();

        if (existingCredits) {
          await supabase
            .from("site_config")
            .update({ config_value: creditsValue, updated_at: new Date().toISOString() })
            .eq("config_key", creditsKey);
        } else {
          await supabase
            .from("site_config")
            .insert({ config_key: creditsKey, config_value: creditsValue });
        }
      }

      setOriginalPricing(JSON.parse(JSON.stringify(pricing)));
      toast.success("Pricing updated successfully!");
    } catch (err: any) {
      toast.error("Failed to save pricing: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const resetPricing = () => {
    setPricing(JSON.parse(JSON.stringify(originalPricing)));
  };

  const isModified = JSON.stringify(pricing) !== JSON.stringify(originalPricing);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading pricing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">💰 Plan Pricing & Credits</h2>
        <p className="text-sm text-muted-foreground">Manage subscription plan prices and credit limits. Changes will be live immediately.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="border border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plan.icon}</span>
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">Plan ID: {plan.id}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor={`price-${plan.id}`} className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    Price (₹)
                  </div>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    id={`price-${plan.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={pricing[plan.id].price}
                    onChange={(e) => updatePricing(plan.id, "price", parseInt(e.target.value) || 0)}
                    className="pl-7 border-border"
                  />
                </div>
                {plan.id !== "free" && (
                  <p className="text-xs text-muted-foreground">
                    Per credit: ₹{(pricing[plan.id].price / pricing[plan.id].credits).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Credits Input */}
              <div className="space-y-2">
                <Label htmlFor={`credits-${plan.id}`} className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Monthly Credits
                  </div>
                </Label>
                <Input
                  id={`credits-${plan.id}`}
                  type="number"
                  min="1"
                  step="1"
                  value={pricing[plan.id].credits}
                  onChange={(e) => updatePricing(plan.id, "credits", parseInt(e.target.value) || 1)}
                  className="border-border"
                />
              </div>

              {/* Display Current Values */}
              <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Current Configuration:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-semibold">₹{pricing[plan.id].price}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credits: </span>
                    <span className="font-semibold">{pricing[plan.id].credits}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={savePricing}
          disabled={!isModified || saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Pricing"}
        </Button>

        <Button
          onClick={resetPricing}
          disabled={!isModified}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Changes
        </Button>
      </div>

      {/* Status Info */}
      {isModified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Unsaved changes detected.</strong> Click "Save Pricing" to apply these changes. All connected pages will update live.
          </p>
        </div>
      )}

      {/* Success Info */}
      {!isModified && JSON.stringify(pricing) !== JSON.stringify({
        free: { price: 0, credits: 5 },
        starter: { price: 49, credits: 15 },
        pro: { price: 199, credits: 120 },
        power: { price: 399, credits: 300 },
      }) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Pricing is synced.</strong> All changes are saved and live on the website.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPricingManager;
