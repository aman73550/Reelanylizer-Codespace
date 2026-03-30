import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, Lock, Copy, Check, Upload, Link as LinkIcon, X } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  email: string;
  platform: string;
  followers: string;
  is_top_partner: boolean;
  profile_image?: string;
  tags?: string[];
  monthly_views?: number;
  instagram_url?: string;
  youtube_url?: string;
  promo_video_url?: string;
  created_at: string;
}

interface Campaign {
  id: string;
  campaign_name: string;
  creator_id: string;
  start_date: string;
  end_date: string;
  revenue_share_percent: number;
  status: string;
  creator?: Creator;
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

interface ActivityLog {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

type TabType = "creators" | "campaigns" | "payouts" | "activity";

export default function AdminManageCreators() {
  const [tab, setTab] = useState<TabType>("creators");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [generatingPayouts, setGeneratingPayouts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageMode, setProfileImageMode] = useState<"upload" | "link">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    platform: "instagram",
    username: "",
    followers: "",
    monthly_views: "",
    instagram_url: "",
    youtube_url: "",
    profile_image: "",
    promo_video_url: "",
    tags: "",
    is_top_partner: false,
  });

  const [campaignData, setCampaignData] = useState({
    campaign_name: "",
    creator_id: "",
    start_date: "",
    end_date: "",
    revenue_share_percent: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  // Compress image using Canvas API (client-side, no external dependencies)
  const compressImage = (file: File, quality = 0.7, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Max 5MB.");
      return;
    }

    try {
      toast.loading("Compressing image...");
      const compressedImage = await compressImage(file, 0.75, 400, 400);
      setProfileImagePreview(compressedImage);
      setFormData({ ...formData, profile_image: compressedImage });
      toast.dismiss();
      toast.success("Image compressed & ready!");
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    }
  };

  // Handle URL input for profile image
  const handleProfileImageUrl = (url: string) => {
    if (url.trim().startsWith("http")) {
      setProfileImagePreview(url);
      setFormData({ ...formData, profile_image: url });
    } else {
      toast.error("Please enter a valid URL");
    }
  };

  // Clear profile image
  const clearProfileImage = () => {
    setProfileImagePreview(null);
    setFormData({ ...formData, profile_image: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadAllData = async () => {
    await Promise.all([loadCreators(), loadCampaigns(), loadPayouts(), loadActivityLogs()]);
  };

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

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, creators(id, name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_payouts")
        .select("*, creators(id, name, email, followers)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error("Error loading payouts:", error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error("Error loading activity logs:", error);
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
          tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
          monthly_views: formData.monthly_views ? parseInt(formData.monthly_views) : null,
        },
      });

      if (error) throw error;

      toast.success("Creator created successfully");
      setFormData({
        name: "", email: "", password: "", platform: "instagram", username: "", followers: "",
        monthly_views: "", instagram_url: "", youtube_url: "", profile_image: "",
        promo_video_url: "", tags: "", is_top_partner: false,
      });
      setShowCreateForm(false);
      await loadCreators();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create creator");
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!campaignData.campaign_name || !campaignData.creator_id || !campaignData.start_date || !campaignData.end_date) {
      toast.error("All campaign fields required");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("campaigns").insert({
        campaign_name: campaignData.campaign_name,
        creator_id: campaignData.creator_id,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        revenue_share_percent: parseInt(campaignData.revenue_share_percent) || 10,
        status: "active",
      });

      if (error) throw error;

      toast.success("Campaign created successfully");
      setCampaignData({ campaign_name: "", creator_id: "", start_date: "", end_date: "", revenue_share_percent: "" });
      setShowCreateCampaign(false);
      await loadCampaigns();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  const generatePayouts = async () => {
    try {
      setGeneratingPayouts(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("Not authenticated. Please log in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-creators", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
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

  const STATS = [
    { label: "Revenue", value: "₹0", color: "text-green-600" },
    { label: "Active Campaigns", value: campaigns.filter(c => c.status === "active").length },
    { label: "Creators", value: creators.length },
    { label: "Total Paid", value: "₹0", color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="pt-6">
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-lg sm:text-2xl font-bold ${stat.color || ""}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4 px-4 overflow-x-auto">
          {(["creators", "campaigns", "payouts", "activity"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-2 font-medium text-sm capitalize border-b-2 transition ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Tab */}
      {tab === "creators" && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Creators {creators.length > 0 && `(${creators.length})`}</CardTitle>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm" className="gradient-primary-bg">
                <Plus className="w-4 h-4 mr-1" /> Add Creator
              </Button>
            </CardHeader>

            {showCreateForm && (
              <CardContent className="border-b border-border space-y-4 pb-4">
                {/* Profile Picture Section */}
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Label className="text-base font-semibold mb-3 block">📸 Profile Picture</Label>
                  
                  {/* Image Preview */}
                  {profileImagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img 
                        src={profileImagePreview} 
                        alt="Preview" 
                        className="w-24 h-24 rounded-lg object-cover border-2 border-purple-400"
                      />
                      <button
                        onClick={clearProfileImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload/Link Tabs */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setProfileImageMode("upload")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                        profileImageMode === "upload"
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      }`}
                    >
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                    <button
                      onClick={() => setProfileImageMode("link")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                        profileImageMode === "link"
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" /> Paste Link
                    </button>
                  </div>

                  {/* Upload Option */}
                  {profileImageMode === "upload" && (
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        <Upload className="w-4 h-4" /> Choose Image
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Auto-compressed to 400x400px, JPEG quality 75%
                      </p>
                    </div>
                  )}

                  {/* Link Option */}
                  {profileImageMode === "link" && (
                    <Input
                      type="url"
                      placeholder="https://example.com/profile.jpg"
                      onChange={(e) => {
                        handleProfileImageUrl(e.target.value);
                      }}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Creator Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Name", key: "name", type: "text" },
                    { label: "Email", key: "email", type: "email" },
                    { label: "Password", key: "password", type: "password" },
                    { label: "Username / Handle", key: "username", placeholder: "@username" },
                    { label: "Followers", key: "followers", placeholder: "e.g. 100000" },
                    { label: "Monthly Views", key: "monthly_views", placeholder: "e.g. 50000" },
                    { label: "Instagram URL", key: "instagram_url", placeholder: "https://instagram.com/username" },
                    { label: "YouTube URL", key: "youtube_url", placeholder: "https://youtube.com/@channel" },
                    { label: "Promo Video URL", key: "promo_video_url", placeholder: "https://youtube.com/watch?v=..." },
                    { label: "Tags (comma separated)", key: "tags", placeholder: "Lifestyle, Growth, Content" },
                  ].map(({ label, key, type = "text", placeholder }) => (
                    <div key={key}>
                      <Label className="text-sm">{label}</Label>
                      <Input
                        type={type}
                        value={formData[key as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_top_partner}
                      onChange={(e) => setFormData({ ...formData, is_top_partner: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label>Mark as Top Partner 🔥</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button onClick={createCreator} className="gradient-primary-bg">{loading ? "Creating..." : "Save Creator"}</Button>
                </div>
              </CardContent>
            )}

            <CardContent className="pt-6">
              {creators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No creators yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Platform</th>
                      <th className="text-right py-2">Followers</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((creator) => (
                      <tr key={creator.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{creator.name}</td>
                        <td className="py-2 text-muted-foreground">{creator.email}</td>
                        <td className="py-2 capitalize">{creator.platform}</td>
                        <td className="text-right py-2">{Number(creator.followers).toLocaleString()}</td>
                        <td className="text-center py-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${creator.is_top_partner ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {creator.is_top_partner ? "Top Partner 🔥" : "Regular"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Campaigns</CardTitle>
              <Button onClick={() => setShowCreateCampaign(!showCreateCampaign)} size="sm" className="gradient-primary-bg">
                <Plus className="w-4 h-4 mr-1" /> Create Campaign
              </Button>
            </CardHeader>

            {showCreateCampaign && (
              <CardContent className="border-b border-border space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      value={campaignData.campaign_name}
                      onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
                      placeholder="e.g. Summer Promo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Creator</Label>
                    <select
                      value={campaignData.creator_id}
                      onChange={(e) => setCampaignData({ ...campaignData, creator_id: e.target.value })}
                      className="w-full h-10 px-2 rounded-md bg-background border text-foreground"
                    >
                      <option value="">Select creator...</option>
                      {creators.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={campaignData.start_date}
                      onChange={(e) => setCampaignData({ ...campaignData, start_date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={campaignData.end_date}
                      onChange={(e) => setCampaignData({ ...campaignData, end_date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Revenue Share %</Label>
                    <Input
                      type="number"
                      value={campaignData.revenue_share_percent}
                      onChange={(e) => setCampaignData({ ...campaignData, revenue_share_percent: e.target.value })}
                      placeholder="10"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>Cancel</Button>
                  <Button onClick={createCampaign} className="gradient-primary-bg">{loading ? "Creating..." : "Create 1 Campaign"}</Button>
                </div>
              </CardContent>
            )}

            <CardContent className="pt-6">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Campaign Name</th>
                      <th className="text-left py-2">Creator</th>
                      <th className="text-left py-2">Dates</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{campaign.campaign_name}</td>
                        <td className="py-2">{campaign.creator?.name || "-"}</td>
                        <td className="py-2 text-sm text-muted-foreground">{campaign.start_date} — {campaign.end_date}</td>
                        <td className="text-center py-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${campaign.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {campaign.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payouts Tab */}
      {tab === "payouts" && (
        <Card className="border-border bg-card">
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Creator Payouts
            </CardTitle>
            <Button onClick={generatePayouts} disabled={generatingPayouts} className="bg-green-600 hover:bg-green-700">
              {generatingPayouts ? "Generating..." : "Generate Payouts"}
            </Button>
          </CardHeader>

          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts generated yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Creator</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-right py-2">Bonus</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-muted/50">
                      <td className="py-2">{payout.creator?.name || "Unknown"}</td>
                      <td className="text-right py-2 font-medium">₹{payout.amount.toLocaleString()}</td>
                      <td className="text-right py-2">{payout.bonus ? `₹${payout.bonus}` : "-"}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${payout.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Logs Tab */}
      {tab === "activity" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>

          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-primary pl-4 py-2">
                    <p className="text-sm font-medium">{log.actor_type} — {log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.target_type}: {log.target_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
