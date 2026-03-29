import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Activity, AlertTriangle, Share2, TrendingUp, Bot, Users } from "lucide-react";

interface TrafficStats {
  todayRealUsers: number;
  todayBots: number;
  weekRealUsers: number;
  weekBots: number;
  sourceBreakdown: Record<string, { total: number; real: number; bot: number }>;
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  avgSessionDuration: number;
  avgScrollDepth: number;
  avgClicks: number;
  viralSpikes: Array<{ hour: number; count: number; multiplier: number }>;
  sharePlatforms: Record<string, number>;
  shareAttributedSessions: number;
}

export default function AdminTrafficAnalytics() {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("traffic-analytics", {
        body: { action: "stats" },
      });

      if (error) throw error;

      setStats(data);
      setRefreshedAt(new Date());
      toast.success("Traffic data refreshed");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to load traffic analytics");
    } finally {
      setLoading(false);
    }
  };

  if (!stats)
    return (
      <Card className="border-border bg-card">
        <CardContent className="pt-6 text-center">
          <Button onClick={loadStats} disabled={loading}>
            {loading ? "Loading..." : "Load Traffic Analytics"}
          </Button>
        </CardContent>
      </Card>
    );

  const botPercentageToday = stats.todayRealUsers + stats.todayBots > 0
    ? Math.round((stats.todayBots / (stats.todayRealUsers + stats.todayBots)) * 100)
    : 0;

  const topSources = Object.entries(stats.sourceBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const topCountries = Object.entries(stats.countryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topDevices = Object.entries(stats.deviceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold">Traffic Intelligence</h2>
        <div className="flex items-center gap-2">
          {refreshedAt && (
            <span className="text-xs text-muted-foreground">
              Updated: {refreshedAt.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={loadStats}
            disabled={loading}
            size="sm"
            className="gradient-primary-bg text-primary-foreground text-xs sm:text-sm h-8 sm:h-10"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Real vs Bot Detection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Real Users (Today)</p>
                <p className="text-2xl font-bold text-green-500">{stats.todayRealUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Week: {stats.weekRealUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Bot Traffic (Today)</p>
                <p className="text-2xl font-bold text-red-500">{stats.todayBots.toLocaleString()}</p>
                <p className="text-xs text-red-600">{botPercentageToday}% of traffic</p>
              </div>
              <Bot className="w-8 h-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Session Duration</p>
                <p className="text-2xl font-bold text-primary">{stats.avgSessionDuration}s</p>
                <p className="text-xs text-muted-foreground">
                  Scroll: {stats.avgScrollDepth}% | Clicks: {stats.avgClicks}
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Viral Spikes */}
      {stats.viralSpikes.length > 0 && (
        <Card className="border-border bg-card border-yellow-600/30">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              Viral Traffic Spikes Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {stats.viralSpikes.map((spike) => (
                <div key={spike.hour} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-xs sm:text-sm font-medium">
                    {spike.hour}:00 - {spike.hour + 1}:00
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-yellow-700">
                    {spike.count} sessions ({spike.multiplier}x normal)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Sources */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Traffic Sources (Today)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3">
            {topSources.map(([source, data]) => (
              <div key={source} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium capitalize">{source}</span>
                  <span className="text-muted-foreground">
                    {data.total} ({data.real} real, {data.bot} bots)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                    style={{ width: `${(data.total / (topSources[0]?.[1]?.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-lg">Device Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {topDevices.map(([device, count]) => (
                <div key={device} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="capitalize">{device}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Share Platforms */}
        <Card className="border-border bg-card">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Share Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {Object.entries(stats.sharePlatforms)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="capitalize">{platform}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              <p className="text-xs text-muted-foreground mt-3">
                Share-attributed sessions: {stats.shareAttributedSessions}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Countries */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-lg">Geographic Distribution (Month)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topCountries.map(([country, count]) => (
              <div key={country} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs sm:text-sm">{country}</span>
                  <span className="font-bold text-primary">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
