import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, Lock, Copy, Check } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  email: string;
  platform: string;
  followers: string;
  is_top_partner: boolean;
  created_at: string;
}

interface CreatorPayout {
  id: string;
  creator_id: string;
  amount: number;
  bonus?: number;
  status: string;
  created_at: string;
  creator?: Creator;
}

export default function AdminManageCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generatingPayouts, setGeneratingPayouts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    platform: "instagram",
    username: "",
    followers: "",
    instagram_url: "",
    youtube_url: "",
  });

  useEffect(() => {
    loadCreators();
    loadPayouts();
  }, []);

  const loadCreators = async () => {
    try {
      const { data, error } = await supabase.from("creators").select("*").order("created_at", { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error("Error loading creators:", error);
      toast.error("Failed to load creators");
    }
  };

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_payouts")
        .select("*, creators(id, name, email, followers)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error("Error loading payouts:", error);
    }
  };

  const createCreator = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Name, email, and password required");
      return;
    }

    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("Not authenticated. Please log in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-creators", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: {
          action: "create_creator",
          ...formData,
        },
      });

      if (error) throw error;

      toast.success("Creator created successfully");
      setFormData({ name: "", email: "", password: "", platform: "instagram", username: "", followers: "", instagram_url: "", youtube_url: "" });
      setShowCreateForm(false);
      await loadCreators();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create creator");
    } finally {
      setLoading(false);
    }
  };

  const generatePayouts = async () => {
    try {
      setGeneratingPayouts(true);
      const { data, error } = await supabase.functions.invoke("manage-creators", {
        body: { action: "generate_payouts" },
      });

      if (error) throw error;

      toast.success(`Generated ${data.generated} payouts`);
      await loadPayouts();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to generate payouts");
    } finally {
      setGeneratingPayouts(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Payouts Section */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-row">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Creator Payouts
          </CardTitle>
          <Button
            onClick={generatePayouts}
            disabled={generatingPayouts}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-8 sm:h-10"
          >
            {generatingPayouts ? "Generating..." : "Generate Payouts"}
          </Button>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {payouts.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No payouts generated yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Creator</th>
                    <th className="text-right py-2 px-2">Amount</th>
                    <th className="text-right py-2 px-2">Bonus</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 px-2">{payout.creator?.name || "Unknown"}</td>
                      <td className="text-right py-2 px-2">₹{payout.amount.toLocaleString()}</td>
                      <td className="text-right py-2 px-2">{payout.bonus ? `₹${payout.bonus}` : "-"}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${payout.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creators Section */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-row">
          <CardTitle className="text-sm sm:text-lg">Creators {creators.length > 0 && `(${creators.length})`}</CardTitle>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="gradient-primary-bg text-primary-foreground text-xs sm:text-sm h-8 sm:h-10"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            New Creator
          </Button>
        </CardHeader>

        {showCreateForm && (
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 border-b border-border space-y-3 sm:space-y-4 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs sm:text-sm">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Creator name"
                  className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Platform</Label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full h-8 sm:h-10 px-2 rounded-md bg-background border border-border text-foreground text-xs sm:text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="@username"
                  className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Followers</Label>
                <Input
                  value={formData.followers}
                  onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                  placeholder="100000"
                  className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={createCreator}
                disabled={loading}
                size="sm"
                className="gradient-primary-bg text-primary-foreground text-xs sm:text-sm h-8 sm:h-10"
              >
                {loading ? "Creating..." : "Create Creator"}
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {creators.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No creators yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Platform</th>
                    <th className="text-right py-2 px-2">Followers</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => (
                    <tr key={creator.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{creator.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{creator.email}</td>
                      <td className="py-2 px-2 capitalize">{creator.platform}</td>
                      <td className="text-right py-2 px-2">{Number(creator.followers).toLocaleString()}</td>
                      <td className="text-center py-2 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${creator.is_top_partner ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                          {creator.is_top_partner ? "Top Partner" : "Regular"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
