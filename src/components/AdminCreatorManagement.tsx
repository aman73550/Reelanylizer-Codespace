import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Loader2, Calendar, IndianRupee, Gift, History, Pencil, Trash2, X, Image, Instagram, Youtube, Upload } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  email: string;
  platform: string;
  username: string | null;
  followers: string | null;
  status: string;
  is_top_partner: boolean | null;
  profile_image: string | null;
  tags: string[] | null;
  promo_video_url: string | null;
  social_url: string | null;
  monthly_views: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

interface Campaign {
  id: string;
  creator_id: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  revenue_share_percent: number;
  status: string;
}

interface Payout {
  id: string;
  campaign_id: string;
  creator_id: string;
  amount: number;
  bonus: number;
  status: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  actor_type: string;
  action: string;
  target_type: string | null;
  details: any;
  created_at: string;
}
interface CampaignEntry {
  id: string;
  campName: string;
  campCreatorId: string;
  campStart: string;
  campEnd: string;
  campPercent: string;
}

const makeCampaignEntry = (): CampaignEntry => ({
  id: crypto.randomUUID(),
  campName: "",
  campCreatorId: "",
  campStart: "",
  campEnd: "",
  campPercent: "10",
});

const AdminCreatorManagement = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [tab, setTab] = useState<"creators" | "campaigns" | "payouts" | "logs">("creators");
  const [bonusPayoutId, setBonusPayoutId] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [generatingPayouts, setGeneratingPayouts] = useState(false);

  // Creator form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cPlatform, setCPlatform] = useState("instagram");
  const [cUsername, setCUsername] = useState("");
  const [cFollowers, setCFollowers] = useState("");
  const [cTopPartner, setCTopPartner] = useState(false);
  const [cProfileImage, setCProfileImage] = useState("");
  const [cTags, setCTags] = useState("");
  const [cPromoVideo, setCPromoVideo] = useState("");
  const [cSocialUrl, setCSocialUrl] = useState("");
  const [cMonthlyViews, setCMonthlyViews] = useState("");
  const [cInstagramUrl, setCInstagramUrl] = useState("");
  const [cYoutubeUrl, setCYoutubeUrl] = useState("");

  // Campaign form - multiple entries
  const [campaignEntries, setCampaignEntries] = useState<CampaignEntry[]>([makeCampaignEntry()]);
  const [bulkCreating, setBulkCreating] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, ca, p, l] = await Promise.all([
      supabase.from("creators").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("creator_payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (c.data) setCreators(c.data as Creator[]);
    if (ca.data) setCampaigns(ca.data as Campaign[]);
    if (p.data) setPayouts(p.data as Payout[]);
    if (l.data) setLogs(l.data as ActivityLog[]);
    setLoading(false);

    await supabase.functions.invoke("manage-creators", {
      body: { action: "auto_lock_campaigns" },
    });
  };

  const resetForm = () => {
    setCName(""); setCEmail(""); setCPassword(""); setCUsername(""); setCFollowers("");
    setCTopPartner(false); setCProfileImage(""); setCTags(""); setCPromoVideo("");
    setCSocialUrl(""); setCMonthlyViews(""); setCPlatform("instagram");
    setCInstagramUrl(""); setCYoutubeUrl("");
    setEditingCreator(null);
  };

  const openEditForm = (c: Creator) => {
    setEditingCreator(c);
    setCName(c.name);
    setCEmail(c.email);
    setCPassword("");
    setCPlatform(c.platform);
    setCUsername(c.username || "");
    setCFollowers(c.followers || "");
    setCTopPartner(c.is_top_partner || false);
    setCProfileImage(c.profile_image || "");
    setCTags((c.tags || []).join(", "));
    setCPromoVideo(c.promo_video_url || "");
    setCSocialUrl(c.social_url || "");
    setCMonthlyViews(c.monthly_views || "");
    setCInstagramUrl(c.instagram_url || "");
    setCYoutubeUrl(c.youtube_url || "");
    setShowCreatorForm(true);
  };

  const handleCreateCreator = async () => {
    if (!cName || !cEmail || (!cPassword && !editingCreator)) { toast.error("Fill all required fields"); return; }

    const tagsArray = cTags ? cTags.split(",").map(t => t.trim()).filter(Boolean) : [];

    if (editingCreator) {
      // Update existing creator
      const updateData: any = {
        name: cName, email: cEmail, platform: cPlatform,
        username: cUsername || null, followers: cFollowers || "0",
        is_top_partner: cTopPartner, profile_image: cProfileImage || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        promo_video_url: cPromoVideo || null,
        social_url: cSocialUrl || null,
        monthly_views: cMonthlyViews || null,
        instagram_url: cInstagramUrl || null,
        youtube_url: cYoutubeUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("creators").update(updateData).eq("id", editingCreator.id);
      if (error) { toast.error(error.message); return; }

      // If password changed, update via edge function
      if (cPassword) {
        await supabase.functions.invoke("manage-creators", {
          body: { action: "update_password", creator_id: editingCreator.id, password: cPassword },
        });
      }

      await supabase.from("activity_logs").insert({
        actor_type: "admin", action: "update_creator",
        target_type: "creator", target_id: editingCreator.id,
        details: { name: cName },
      });
      toast.success("Creator updated!");
    } else {
      // Create new creator
      const { data, error } = await supabase.functions.invoke("manage-creators", {
        body: {
          action: "create_creator",
          name: cName, email: cEmail, password: cPassword,
          platform: cPlatform, username: cUsername || null,
          followers: cFollowers || "0", is_top_partner: cTopPartner,
          profile_image: cProfileImage || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          promo_video_url: cPromoVideo || null,
          social_url: cSocialUrl || null,
          monthly_views: cMonthlyViews || null,
          instagram_url: cInstagramUrl || null,
          youtube_url: cYoutubeUrl || null,
        },
      });
      if (error || !data?.success) {
        toast.error(data?.message || error?.message || "Failed to create creator");
        return;
      }
      toast.success("Creator added!");
    }

    setShowCreatorForm(false);
    resetForm();
    loadAll();
  };

  const deleteCreator = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    
    const { error } = await supabase.from("creators").update({ status: "deleted" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    await supabase.from("activity_logs").insert({
      actor_type: "admin", action: "delete_creator",
      target_type: "creator", target_id: id, details: { name },
    });
    toast.success("Creator deleted");
    loadAll();
  };

  const toggleCreatorStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("creators").update({ status: newStatus }).eq("id", id);
    await supabase.from("activity_logs").insert({
      actor_type: "admin", action: newStatus === "active" ? "activate_creator" : "deactivate_creator",
      target_type: "creator", target_id: id,
    });
    toast.success(`Creator ${newStatus === "active" ? "activated" : "deactivated"}`);
    loadAll();
  };

  const updateCampaignEntry = (id: string, field: keyof CampaignEntry, value: string) => {
    setCampaignEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addCampaignEntry = () => {
    setCampaignEntries(prev => [...prev, makeCampaignEntry()]);
  };

  const removeCampaignEntry = (id: string) => {
    setCampaignEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  };

  const handleCreateCampaigns = async () => {
    const valid = campaignEntries.filter(e => e.campName && e.campCreatorId && e.campStart && e.campEnd);
    if (valid.length === 0) { toast.error("Fill all fields in at least one campaign"); return; }

    // Check for duplicate creators in same batch
    const creatorIds = valid.map(e => e.campCreatorId);
    const uniqueCreatorIds = new Set(creatorIds);
    if (uniqueCreatorIds.size !== creatorIds.length) {
      toast.error("Same creator selected in multiple campaigns. Use different creators.");
      return;
    }

    setBulkCreating(true);
    try {
      const inserts = valid.map(e => ({
        campaign_name: e.campName,
        creator_id: e.campCreatorId,
        start_date: e.campStart,
        end_date: e.campEnd,
        revenue_share_percent: parseFloat(e.campPercent),
      }));

      const { error } = await supabase.from("campaigns").insert(inserts);
      if (error) { toast.error(error.message); return; }

      // Log each campaign
      for (const e of valid) {
        await supabase.from("activity_logs").insert({
          actor_type: "admin", action: "create_campaign",
          target_type: "campaign", details: { name: e.campName, creator_id: e.campCreatorId },
        });
      }

      toast.success(`${valid.length} campaign${valid.length > 1 ? "s" : ""} created! 🎉`);
      setShowCampaignForm(false);
      setCampaignEntries([makeCampaignEntry()]);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaigns");
    } finally {
      setBulkCreating(false);
    }
  };

  const toggleCampaignStatus = async (id: string, current: string) => {
    const next = current === "active" ? "completed" : "active";
    await supabase.from("campaigns").update({ status: next }).eq("id", id);
    await supabase.from("activity_logs").insert({
      actor_type: "admin", action: next === "active" ? "reactivate_campaign" : "complete_campaign",
      target_type: "campaign", target_id: id,
    });
    toast.success(`Campaign ${next}`);
    loadAll();
  };

  const markPayoutPaid = async (id: string) => {
    await supabase.from("creator_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("activity_logs").insert({
      actor_type: "admin", action: "mark_payout_paid", target_type: "payout", target_id: id,
    });
    toast.success("Payout marked as paid");
    loadAll();
  };

  const handleAddBonus = async () => {
    if (!bonusPayoutId || !bonusAmount) return;
    const { data, error } = await supabase.functions.invoke("manage-creators", {
      body: { action: "add_bonus", payout_id: bonusPayoutId, bonus_amount: parseFloat(bonusAmount) },
    });
    if (error || !data?.success) { toast.error("Failed to add bonus"); return; }
    toast.success("Bonus added!");
    setBonusPayoutId(null); setBonusAmount("");
    loadAll();
  };

  const handleGeneratePayouts = async () => {
    setGeneratingPayouts(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-creators", {
        body: { action: "generate_payouts" },
      });
      if (error || !data?.success) {
        toast.error("Failed to generate payouts: " + (data?.message || error?.message));
        return;
      }
      toast.success(`${data.generated} new payouts generated from ${data.processed} campaigns`);
      loadAll();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setGeneratingPayouts(false);
    }
  };

  const totalRevenue = payouts.reduce((s, p) => s + p.amount + p.bonus, 0);
  const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center"><p className="text-[10px] text-muted-foreground uppercase">Revenue</p><p className="text-lg font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p></Card>
        <Card className="p-4 text-center"><p className="text-[10px] text-muted-foreground uppercase">Active Campaigns</p><p className="text-lg font-bold text-foreground">{activeCampaigns}</p></Card>
        <Card className="p-4 text-center"><p className="text-[10px] text-muted-foreground uppercase">Creators</p><p className="text-lg font-bold text-foreground">{creators.filter(c => c.status !== "deleted").length}</p></Card>
        <Card className="p-4 text-center"><p className="text-[10px] text-muted-foreground uppercase">Total Paid</p><p className="text-lg font-bold text-green-600">₹{totalPaid.toLocaleString()}</p></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {(["creators", "campaigns", "payouts", "logs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            {t === "logs" ? "Activity Logs" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* CREATORS TAB */}
      {tab === "creators" && (
        <div className="space-y-4">
          <Button onClick={() => { resetForm(); setShowCreatorForm(!showCreatorForm); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Creator
          </Button>

          {showCreatorForm && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{editingCreator ? "Edit Creator" : "Add New Creator"}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCreatorForm(false); resetForm(); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    {cProfileImage && (
                      <img src={cProfileImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 bg-muted" />
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                        <Upload className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                            toast.loading("Compressing & uploading...", { id: "img-upload" });
                            try {
                              // Compress image using canvas
                              const compressed = await new Promise<Blob>((resolve, reject) => {
                                const img = new window.Image();
                                img.onload = () => {
                                  const canvas = document.createElement("canvas");
                                  const MAX = 400; // max dimension for profile pics
                                  let w = img.width, h = img.height;
                                  if (w > h) { if (w > MAX) { h = (h * MAX) / w; w = MAX; } }
                                  else { if (h > MAX) { w = (w * MAX) / h; h = MAX; } }
                                  canvas.width = w;
                                  canvas.height = h;
                                  const ctx = canvas.getContext("2d")!;
                                  ctx.drawImage(img, 0, 0, w, h);
                                  canvas.toBlob((blob) => blob ? resolve(blob) : reject("Compression failed"), "image/webp", 0.8);
                                };
                                img.onerror = () => reject("Image load failed");
                                img.src = URL.createObjectURL(file);
                              });
                              const fileName = `creator-${Date.now()}.webp`;
                              const { error: upErr } = await supabase.storage.from("creator-profiles").upload(fileName, compressed, {
                                cacheControl: "31536000",
                                contentType: "image/webp",
                                upsert: true,
                              });
                              if (upErr) { toast.error("Upload failed: " + upErr.message, { id: "img-upload" }); return; }
                              const { data: urlData } = supabase.storage.from("creator-profiles").getPublicUrl(fileName);
                              setCProfileImage(urlData.publicUrl);
                              toast.success("Image compressed & uploaded!", { id: "img-upload" });
                            } catch (err: any) {
                              toast.error("Failed: " + (err?.message || err), { id: "img-upload" });
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-muted-foreground">Max 2MB · JPG, PNG, WebP</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">or URL:</span>
                        <Input
                          value={cProfileImage}
                          onChange={e => setCProfileImage(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Creator name" /></div>
                  <div><Label>Email *</Label><Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="email@example.com" /></div>
                  <div><Label>{editingCreator ? "New Password (leave blank to keep)" : "Password *"}</Label>
                    <Input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder={editingCreator ? "Leave blank to keep current" : "Secure password"} />
                  </div>
                  <div><Label>Primary Platform</Label>
                    <select value={cPlatform} onChange={e => setCPlatform(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="both">Both (Instagram + YouTube)</option>
                    </select>
                  </div>
                  <div><Label>Username / Handle</Label><Input value={cUsername} onChange={e => setCUsername(e.target.value)} placeholder="@handle" /></div>
                  <div><Label>Followers</Label><Input value={cFollowers} onChange={e => setCFollowers(e.target.value)} placeholder="e.g. 120K" /></div>
                  <div><Label>Monthly Views</Label><Input value={cMonthlyViews} onChange={e => setCMonthlyViews(e.target.value)} placeholder="e.g. 4.2M+" /></div>
                </div>

                {/* Social Media URLs */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    Social Media Links
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Label className="flex items-center gap-1 text-xs"><Instagram className="w-3 h-3" /> Instagram URL</Label>
                      <Input value={cInstagramUrl} onChange={e => setCInstagramUrl(e.target.value)} placeholder="https://instagram.com/username" />
                    </div>
                    <div className="relative">
                      <Label className="flex items-center gap-1 text-xs"><Youtube className="w-3 h-3" /> YouTube URL</Label>
                      <Input value={cYoutubeUrl} onChange={e => setCYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@channel" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Primary Social URL (shown on CTA button)</Label>
                    <Input value={cSocialUrl} onChange={e => setCSocialUrl(e.target.value)} placeholder="https://instagram.com/username or https://youtube.com/@channel" />
                  </div>
                </div>

                <div><Label>Tags (comma separated)</Label>
                  <Input value={cTags} onChange={e => setCTags(e.target.value)} placeholder="🌿 Lifestyle, 📈 Growth, 🎬 Content" />
                </div>
                <div><Label>Promo Video URL</Label>
                  <Input value={cPromoVideo} onChange={e => setCPromoVideo(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={cTopPartner} onChange={e => setCTopPartner(e.target.checked)} /> 
                  Mark as Top Partner 🔥
                </label>

                <div className="flex gap-2">
                  <Button onClick={handleCreateCreator} size="sm">
                    {editingCreator ? "Update Creator" : "Save Creator"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowCreatorForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {creators.filter(c => c.status !== "deleted").map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {c.profile_image ? (
                      <img src={c.profile_image} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                    ) : (
                      <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.name} {c.is_top_partner && "🔥"}</p>
                      <p className="text-xs text-muted-foreground">{c.email} · {c.platform === "both" ? "IG + YT" : c.platform} · {c.followers}</p>
                      {(c.instagram_url || c.youtube_url) && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.instagram_url && (
                            <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-500 hover:underline flex items-center gap-0.5">
                              <Instagram className="w-3 h-3" /> IG
                            </a>
                          )}
                          {c.youtube_url && (
                            <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5">
                              <Youtube className="w-3 h-3" /> YT
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditForm(c)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleCreatorStatus(c.id, c.status)}>
                      {c.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCreator(c.id, c.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {creators.filter(c => c.status !== "deleted").length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No creators added yet</p>
            )}
          </div>
        </div>
      )}

      {/* CAMPAIGNS TAB */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <Button onClick={() => { setShowCampaignForm(!showCampaignForm); if (!showCampaignForm) setCampaignEntries([makeCampaignEntry()]); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Create Campaign{campaignEntries.length > 1 ? "s" : ""}
          </Button>

          {showCampaignForm && (
            <Card><CardContent className="pt-4 space-y-4">
              {campaignEntries.map((entry, idx) => (
                <div key={entry.id} className="relative p-3 rounded-lg border border-border bg-muted/10 space-y-3">
                  {campaignEntries.length > 1 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-muted-foreground">Campaign {idx + 1}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCampaignEntry(entry.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Campaign Name</Label><Input value={entry.campName} onChange={e => updateCampaignEntry(entry.id, "campName", e.target.value)} placeholder="e.g. Summer Promo" /></div>
                    <div><Label className="text-xs">Creator</Label>
                      <select value={entry.campCreatorId} onChange={e => updateCampaignEntry(entry.id, "campCreatorId", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select creator...</option>
                        {creators.filter(c => c.status === "active").map(c => (
                          <option key={c.id} value={c.id} disabled={campaignEntries.some(e2 => e2.id !== entry.id && e2.campCreatorId === c.id)}>
                            {c.name} {campaignEntries.some(e2 => e2.id !== entry.id && e2.campCreatorId === c.id) ? "(already selected)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div><Label className="text-xs">Start Date</Label><Input type="date" value={entry.campStart} onChange={e => updateCampaignEntry(entry.id, "campStart", e.target.value)} /></div>
                    <div><Label className="text-xs">End Date</Label><Input type="date" value={entry.campEnd} onChange={e => updateCampaignEntry(entry.id, "campEnd", e.target.value)} /></div>
                    <div><Label className="text-xs">Revenue Share %</Label><Input type="number" value={entry.campPercent} onChange={e => updateCampaignEntry(entry.id, "campPercent", e.target.value)} min="1" max="100" /></div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addCampaignEntry} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Another Campaign
                </Button>
                <Button onClick={handleCreateCampaigns} size="sm" disabled={bulkCreating}>
                  {bulkCreating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Creating...</> : `Create ${campaignEntries.length} Campaign${campaignEntries.length > 1 ? "s" : ""}`}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">💡 Add multiple campaigns for different creators at once</p>
            </CardContent></Card>
          )}

          <div className="space-y-2">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.campaign_name}</p>
                    <p className="text-xs text-muted-foreground">{c.start_date} → {c.end_date} · {c.revenue_share_percent}%</p>
                    <p className="text-xs text-muted-foreground">Creator: {creators.find(cr => cr.id === c.creator_id)?.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleCampaignStatus(c.id, c.status)}>
                    {c.status === "active" ? "Complete" : "Reactivate"}
                  </Button>
                </div>
              </Card>
            ))}
            {campaigns.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No campaigns yet</p>}
          </div>
        </div>
      )}

      {/* PAYOUTS TAB */}
      {tab === "payouts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Payouts are calculated from successful payments during campaign periods</p>
            <Button onClick={handleGeneratePayouts} disabled={generatingPayouts} size="sm">
              {generatingPayouts ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <IndianRupee className="w-4 h-4 mr-1" />}
              {generatingPayouts ? "Generating..." : "Generate Payouts"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-orange-600">₹{payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-green-600">₹{payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
            </Card>
          </div>
          <div className="space-y-2">
            {payouts.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <IndianRupee className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">₹{p.amount} {p.bonus > 0 && <span className="text-green-600">+ ₹{p.bonus} bonus</span>}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {creators.find(c => c.id === p.creator_id)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => markPayoutPaid(p.id)}>Mark Paid</Button>
                        <Button size="sm" variant="outline" onClick={() => setBonusPayoutId(p.id)}>
                          <Gift className="w-3.5 h-3.5 mr-1" /> Bonus
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {bonusPayoutId === p.id && (
                  <div className="mt-3 flex items-center gap-2">
                    <Input type="number" placeholder="Bonus ₹" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} className="w-32 h-8 text-sm" />
                    <Button size="sm" onClick={handleAddBonus}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBonusPayoutId(null)}>Cancel</Button>
                  </div>
                )}
              </Card>
            ))}
            {payouts.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No payouts recorded</p>}
          </div>
        </div>
      )}

      {/* ACTIVITY LOGS TAB */}
      {tab === "logs" && (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="p-3 flex items-center gap-3">
              <History className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{log.actor_type}</span> → {log.action}
                  {log.target_type && <span className="text-muted-foreground"> on {log.target_type}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No activity logs yet</p>}
        </div>
      )}
    </div>
  );
};

export default AdminCreatorManagement;
