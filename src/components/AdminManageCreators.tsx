import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, Lock, Copy, Check, Upload, Link as LinkIcon, X, Edit3, Eye, BarChart3, PieChart } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  email: string;
  platform: string;
  followers: string;
  is_top_partner: boolean;
  status?: string;
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

type TabType = "creators" | "campaigns" | "payouts" | "activity" | "analytics";

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
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

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

  // ===== CREATOR ACTIONS =====

  const updateCreator = async (creator: Creator) => {
    try {
      setLoading(true);
      
      // Get old creator data for comparison
      const { data: oldCreator } = await supabase
        .from("creators")
        .select("*")
        .eq("id", creator.id)
        .single();

      const { error } = await supabase
        .from("creators")
        .update({
          name: creator.name,
          email: creator.email,
          platform: creator.platform,
          username: creator.username,
          followers: creator.followers,
          monthly_views: creator.monthly_views,
          instagram_url: creator.instagram_url,
          youtube_url: creator.youtube_url,
          profile_image: creator.profile_image,
          promo_video_url: creator.promo_video_url,
          tags: creator.tags,
          is_top_partner: creator.is_top_partner,
        })
        .eq("id", creator.id);

      if (error) throw error;

      // Log activity with change details
      const { data: { session } } = await supabase.auth.getSession();
      const changes: Record<string, any> = {};
      if (oldCreator?.name !== creator.name) changes.name = { old: oldCreator?.name, new: creator.name };
      if (oldCreator?.email !== creator.email) changes.email = { old: oldCreator?.email, new: creator.email };
      if (oldCreator?.followers !== creator.followers) changes.followers = { old: oldCreator?.followers, new: creator.followers };
      if (oldCreator?.is_top_partner !== creator.is_top_partner) changes.is_top_partner = { old: oldCreator?.is_top_partner, new: creator.is_top_partner };

      if (Object.keys(changes).length > 0) {
        await supabase.from("activity_logs").insert({
          actor_type: "admin",
          actor_id: session?.user.id,
          action: "edit",
          target_type: "creator",
          target_id: creator.id,
          details: {
            old_values: {
              name: oldCreator?.name,
              email: oldCreator?.email,
              platform: oldCreator?.platform,
              followers: oldCreator?.followers,
              is_top_partner: oldCreator?.is_top_partner,
            },
            new_values: {
              name: creator.name,
              email: creator.email,
              platform: creator.platform,
              followers: creator.followers,
              is_top_partner: creator.is_top_partner,
            },
            changes: Object.keys(changes),
          },
        });
      }

      toast.success("Creator updated!");
      setEditingCreator(null);
      await loadCreators();
      await loadActivityLogs();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update creator");
    } finally {
      setLoading(false);
    }
  };

  const deleteCreator = async (creatorId: string) => {
    if (!window.confirm("Delete this creator? This action cannot be undone.")) return;

    try {
      setLoading(true);

      // Get creator info before deleting
      const { data: creatorData } = await supabase
        .from("creators")
        .select("*")
        .eq("id", creatorId)
        .single();

      const { error } = await supabase.from("creators").delete().eq("id", creatorId);
      if (error) throw error;

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("activity_logs").insert({
        actor_type: "admin",
        actor_id: session?.user.id,
        action: "delete",
        target_type: "creator",
        target_id: creatorId,
        details: {
          deleted_name: creatorData?.name,
          deleted_email: creatorData?.email,
        },
      });

      toast.success("Creator deleted!");
      await loadCreators();
      await loadActivityLogs();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete creator");
    } finally {
      setLoading(false);
    }
  };

  const toggleCreatorStatus = async (creator: Creator) => {
    try {
      const newStatus = creator.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("creators")
        .update({ status: newStatus })
        .eq("id", creator.id);

      if (error) throw error;

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("activity_logs").insert({
        actor_type: "admin",
        actor_id: session?.user.id,
        action: "edit",
        target_type: "creator",
        target_id: creator.id,
        details: {
          old_values: { status: creator.status },
          new_values: { status: newStatus },
          changes: ["status"],
        },
      });

      toast.success(`Creator ${newStatus}!`);
      await loadCreators();
      await loadActivityLogs();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // ===== CAMPAIGN ACTIONS =====

  const updateCampaign = async (campaign: Campaign) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("campaigns")
        .update({
          campaign_name: campaign.campaign_name,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          revenue_share_percent: campaign.revenue_share_percent,
          status: campaign.status,
        })
        .eq("id", campaign.id);

      if (error) throw error;
      toast.success("Campaign updated!");
      setEditingCampaign(null);
      await loadCampaigns();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!window.confirm("Delete this campaign? This action cannot be undone.")) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
      if (error) throw error;
      toast.success("Campaign deleted!");
      await loadCampaigns();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (campaign: Campaign, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus })
        .eq("id", campaign.id);

      if (error) throw error;
      toast.success(`Campaign marked as ${newStatus}!`);
      await loadCampaigns();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update campaign status");
    }
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

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_type: "admin",
        actor_id: session.user.id,
        action: "create",
        target_type: "creator",
        target_id: data.creator_id || "unknown",
        details: {
          name: formData.name,
          email: formData.email,
          platform: formData.platform,
          followers: formData.followers,
          is_top_partner: formData.is_top_partner,
        },
      });

      toast.success("Creator created successfully");
      setFormData({
        name: "", email: "", password: "", platform: "instagram", username: "", followers: "",
        monthly_views: "", instagram_url: "", youtube_url: "", profile_image: "",
        promo_video_url: "", tags: "", is_top_partner: false,
      });
      setShowCreateForm(false);
      await loadCreators();
      await loadActivityLogs();
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
          {(["creators", "campaigns", "payouts", "activity", "analytics"] as TabType[]).map((t) => (
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Platform</th>
                        <th className="text-right py-2">Followers</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creators.map((creator) => (
                        <tr key={creator.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 font-medium">{creator.name}</td>
                          <td className="py-2 text-muted-foreground text-xs">{creator.email}</td>
                          <td className="py-2 capitalize">{creator.platform}</td>
                          <td className="text-right py-2">{Number(creator.followers).toLocaleString()}</td>
                          <td className="text-center py-2">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${creator.is_top_partner ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                {creator.is_top_partner ? "Top Partner 🔥" : "Regular"}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${creator.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {creator.status === "active" ? "Active ✓" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-2">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setEditingCreator(creator)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => toggleCreatorStatus(creator)}
                              >
                                {creator.status === "active" ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => deleteCreator(creator.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>

            {/* Edit Creator Modal */}
            {editingCreator && (
              <CardContent className="border-t border-border bg-muted/20 space-y-4 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Edit Creator - {editingCreator.name}</h3>
                  <button onClick={() => setEditingCreator(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={editingCreator.name}
                      onChange={(e) => setEditingCreator({ ...editingCreator, name: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={editingCreator.email}
                      onChange={(e) => setEditingCreator({ ...editingCreator, email: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Platform</Label>
                    <select
                      value={editingCreator.platform}
                      onChange={(e) => setEditingCreator({ ...editingCreator, platform: e.target.value })}
                      className="w-full h-8 px-2 rounded-md bg-background border text-foreground text-xs"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Followers</Label>
                    <Input
                      value={editingCreator.followers}
                      onChange={(e) => setEditingCreator({ ...editingCreator, followers: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={editingCreator.is_top_partner}
                    onChange={(e) => setEditingCreator({ ...editingCreator, is_top_partner: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <Label className="text-xs">Top Partner 🔥</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingCreator(null)}>Cancel</Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateCreator(editingCreator)}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            )}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Campaign Name</th>
                        <th className="text-left py-2">Creator</th>
                        <th className="text-left py-2">Dates</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 font-medium">{campaign.campaign_name}</td>
                          <td className="py-2">{campaign.creator?.name || "-"}</td>
                          <td className="py-2 text-xs text-muted-foreground">{campaign.start_date} — {campaign.end_date}</td>
                          <td className="text-center py-2">
                            <select
                              value={campaign.status}
                              onChange={(e) => updateCampaignStatus(campaign, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium ${
                                campaign.status === "active" ? "bg-green-100 text-green-800" :
                                campaign.status === "completed" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="paused">Paused</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="text-center py-2">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setEditingCampaign(campaign)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => deleteCampaign(campaign.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>

            {/* Edit Campaign Modal */}
            {editingCampaign && (
              <CardContent className="border-t border-border bg-muted/20 space-y-4 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Edit Campaign - {editingCampaign.campaign_name}</h3>
                  <button onClick={() => setEditingCampaign(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Campaign Name</Label>
                    <Input
                      value={editingCampaign.campaign_name}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, campaign_name: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Revenue Share %</Label>
                    <Input
                      type="number"
                      value={editingCampaign.revenue_share_percent}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, revenue_share_percent: Number(e.target.value) })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={editingCampaign.start_date}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, start_date: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={editingCampaign.end_date}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, end_date: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingCampaign(null)}>Cancel</Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateCampaign(editingCampaign)}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            )}
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
            <CardTitle>Creator Activity Logs</CardTitle>
          </CardHeader>

          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {activityLogs.filter(log => log.target_type === "creator").map((log) => {
                  const icons: Record<string, React.ReactNode> = {
                    'add': <Plus className="w-4 h-4 text-green-500" />,
                    'create': <Plus className="w-4 h-4 text-green-500" />,
                    'edit': <Edit3 className="w-4 h-4 text-blue-500" />,
                    'update': <Edit3 className="w-4 h-4 text-blue-500" />,
                    'delete': <Trash2 className="w-4 h-4 text-red-500" />,
                    'disable': <Lock className="w-4 h-4 text-yellow-500" />,
                  };
                  
                  const actionIcon = icons[log.action.toLowerCase()] || <eye className="w-4 h-4" />;

                  return (
                    <div key={log.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="mt-1">{actionIcon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold capitalize">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            By: {log.actor_type} • Target: {log.target_type}
                          </p>
                        </div>
                      </div>

                      {/* Show details of what was changed */}
                      {log.details && (
                        <div className="bg-muted/50 rounded p-2 mt-2 text-xs space-y-1">
                          {log.action.toLowerCase() === 'create' || log.action.toLowerCase() === 'add' ? (
                            <div>
                              <p className="font-medium text-foreground">Created:</p>
                              <ul className="ml-3 space-y-0.5">
                                {log.details.name && <li>• Name: {log.details.name}</li>}
                                {log.details.email && <li>• Email: {log.details.email}</li>}
                                {log.details.platform && <li>• Platform: {log.details.platform}</li>}
                                {log.details.followers && <li>• Followers: {log.details.followers}</li>}
                                {log.details.is_top_partner && <li>• Top Partner: Yes 🔥</li>}
                              </ul>
                            </div>
                          ) : log.action.toLowerCase() === 'edit' || log.action.toLowerCase() === 'update' ? (
                            <div>
                              <p className="font-medium text-foreground">Updated:</p>
                              <ul className="ml-3 space-y-0.5">
                                {log.details.old_values && log.details.new_values ? (
                                  Object.keys(log.details.new_values).map((key) => {
                                    const oldVal = log.details.old_values[key];
                                    const newVal = log.details.new_values[key];
                                    if (oldVal !== newVal) {
                                      return (
                                        <li key={key}>
                                          • {key}: <span className="line-through text-red-500">{oldVal}</span> → <span className="text-green-500">{newVal}</span>
                                        </li>
                                      );
                                    }
                                  })
                                ) : (
                                  Object.entries(log.details).map(([key, value]: [string, any]) => (
                                    <li key={key}>• {key}: {String(value)}</li>
                                  ))
                                )}
                              </ul>
                            </div>
                          ) : log.action.toLowerCase() === 'delete' ? (
                            <div>
                              <p className="font-medium text-red-600">Deleted Creator</p>
                              <p className="ml-3 text-xs">ID: {log.target_id}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-foreground">Details:</p>
                              <p className="ml-3 text-xs">{JSON.stringify(log.details)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Creator Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No creators yet</p>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border bg-muted">
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Total Creators</p>
                        <p className="text-2xl font-bold mt-1">{creators.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border bg-muted">
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Active Creators</p>
                        <p className="text-2xl font-bold mt-1">{creators.filter(c => c.status !== "inactive").length}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border bg-muted">
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Top Partners</p>
                        <p className="text-2xl font-bold mt-1">{creators.filter(c => c.is_top_partner).length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total Followers Distribution */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">Total Followers Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const totalFollowers = creators.reduce((sum, c) => sum + Number(c.followers), 0);
                          return creators
                            .sort((a, b) => Number(b.followers) - Number(a.followers))
                            .map((creator) => {
                              const percentage = totalFollowers > 0 
                                ? Math.round((Number(creator.followers) / totalFollowers) * 100)
                                : 0;
                              return (
                                <div key={creator.id} className="space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium">{creator.name}</span>
                                    <span className="text-muted-foreground">
                                      {Number(creator.followers).toLocaleString()} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Views Distribution */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">Monthly Views Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const totalViews = creators.reduce((sum, c) => sum + (c.monthly_views || 0), 0);
                          return creators
                            .filter(c => c.monthly_views && c.monthly_views > 0)
                            .sort((a, b) => (b.monthly_views || 0) - (a.monthly_views || 0))
                            .map((creator) => {
                              const percentage = totalViews > 0 
                                ? Math.round(((creator.monthly_views || 0) / totalViews) * 100)
                                : 0;
                              return (
                                <div key={creator.id} className="space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium">{creator.name}</span>
                                    <span className="text-muted-foreground">
                                      {(creator.monthly_views || 0).toLocaleString()} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                            .concat(
                              creators.filter(c => !c.monthly_views || c.monthly_views === 0).length > 0 ? [
                                <div key="no-data" className="text-xs text-muted-foreground italic">
                                  {creators.filter(c => !c.monthly_views || c.monthly_views === 0).length} creators with no monthly views data
                                </div>
                              ] : []
                            );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payouts Distribution */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">Total Payouts Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const payoutsByCreator: Record<string, number> = {};
                          creators.forEach(c => payoutsByCreator[c.id] = 0);
                          payouts.forEach(p => {
                            if (payoutsByCreator.hasOwnProperty(p.creator_id)) {
                              payoutsByCreator[p.creator_id] += p.amount;
                            }
                          });

                          const totalPayout = Object.values(payoutsByCreator).reduce((a, b) => a + b, 0);
                          return creators
                            .sort((a, b) => (payoutsByCreator[b.id] || 0) - (payoutsByCreator[a.id] || 0))
                            .map((creator) => {
                              const creatorPayout = payoutsByCreator[creator.id] || 0;
                              const percentage = totalPayout > 0 
                                ? Math.round((creatorPayout / totalPayout) * 100)
                                : 0;
                              return (
                                <div key={creator.id} className="space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium">{creator.name}</span>
                                    <span className="text-green-600 font-semibold">
                                      ₹{creatorPayout.toLocaleString()} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                      {payouts.length === 0 && (
                        <p className="text-xs text-muted-foreground font-italic">No payouts generated yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Creator Rankings */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">Creator Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Rank</th>
                            <th className="text-left py-2">Creator</th>
                            <th className="text-right py-2">Followers</th>
                            <th className="text-right py-2">Monthly Views</th>
                            <th className="text-center py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creators
                            .sort((a, b) => Number(b.followers) - Number(a.followers))
                            .map((creator, idx) => (
                              <tr key={creator.id} className="border-b hover:bg-muted/50">
                                <td className="py-2 font-bold text-primary">#{idx + 1}</td>
                                <td className="py-2">
                                  <div>
                                    <p className="font-medium">{creator.name}</p>
                                    <p className="text-muted-foreground">{creator.platform}</p>
                                  </div>
                                </td>
                                <td className="text-right py-2">{Number(creator.followers).toLocaleString()}</td>
                                <td className="text-right py-2">{(creator.monthly_views || 0).toLocaleString()}</td>
                                <td className="text-center py-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${creator.is_top_partner ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                    {creator.is_top_partner ? "Top 🔥" : "Regular"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
