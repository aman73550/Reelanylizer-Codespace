import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users, Shield, Ban, Trash2, Plus, Minus, Loader2, Search, Mail, Calendar, Zap, RefreshCw,
  ChevronLeft, ChevronRight
} from "lucide-react";

interface ManagedUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  provider: string;
  created_at: string;
  last_sign_in_at: string;
  is_blocked: boolean;
  extra_credits: number;
  analyses_count: number;
}

const PAGE_SIZE = 10;

const AdminUserManagement = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditInput, setCreditInput] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list" },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: string, block: boolean) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: block ? "block" : "unblock", user_id: userId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success(block ? "User blocked" : "User unblocked");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: block } : u));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCredits = async (userId: string) => {
    const credits = parseInt(creditInput[userId] || "0", 10);
    if (isNaN(credits) || credits < 0) { toast.error("Invalid credit value"); return; }
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_credits", user_id: userId, extra_credits: credits },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success(`Credits updated to +${credits}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, extra_credits: credits } : u));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed");
      toast.success("User deleted");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedUsers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on search change
  useEffect(() => { setPage(0); }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">Total Users</span>
            </div>
            <p className="text-xl font-bold text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Ban className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[10px] text-muted-foreground">Blocked</span>
            </div>
            <p className="text-xl font-bold text-foreground">{users.filter(u => u.is_blocked).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] text-muted-foreground">Total Analyses</span>
            </div>
            <p className="text-xl font-bold text-foreground">{users.reduce((s, u) => s + u.analyses_count, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50"
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} className="h-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {paginatedUsers.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">No users found</p>
        ) : (
          paginatedUsers.map((user) => (
            <Card key={user.id} className={`border-border ${user.is_blocked ? "bg-destructive/5 border-destructive/20" : "bg-card"}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.display_name || "No Name"}
                        </p>
                        {user.is_blocked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">BLOCKED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> {user.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" /> {user.analyses_count} analyses
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={String(user.extra_credits)}
                        value={creditInput[user.id] ?? String(user.extra_credits)}
                        onChange={(e) => setCreditInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                        className="w-16 h-8 text-xs text-center bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-[10px]"
                        disabled={actionLoading === user.id}
                        onClick={() => handleUpdateCredits(user.id)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      variant={user.is_blocked ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-2 text-[10px]"
                      disabled={actionLoading === user.id}
                      onClick={() => handleBlock(user.id, !user.is_blocked)}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Ban className="w-3 h-3" />
                      )}
                      <span className="ml-1">{user.is_blocked ? "Unblock" : "Block"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                      disabled={actionLoading === user.id}
                      onClick={() => handleDelete(user.id, user.email)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-[10px]"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
