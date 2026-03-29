import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, Bot, Database, RefreshCw, TrendingUp, UserCheck } from "lucide-react";

type UsageLogRow = {
	id: string;
	reel_url: string;
	created_at: string;
	ip_hash: string | null;
	user_agent: string | null;
};

type ApiUsageRow = {
	id: string;
	function_name: string;
	created_at: string;
	is_ai_call: boolean;
	ai_provider: string | null;
	ai_model: string | null;
	tokens_used: number | null;
	estimated_cost: number;
	status_code: number | null;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function AdminUsageAnalyzer() {
	const [loading, setLoading] = useState(false);
	const [usageLogs, setUsageLogs] = useState<UsageLogRow[]>([]);
	const [apiLogs, setApiLogs] = useState<ApiUsageRow[]>([]);
	const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

	useEffect(() => {
		void loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);

			const [{ data: usageData, error: usageError }, { data: apiData, error: apiError }] = await Promise.all([
				supabase.from("usage_logs").select("id, reel_url, created_at, ip_hash, user_agent").order("created_at", { ascending: false }).limit(300),
				supabase
					.from("api_usage_logs" as any)
					.select("id, function_name, created_at, is_ai_call, ai_provider, ai_model, tokens_used, estimated_cost, status_code")
					.order("created_at", { ascending: false })
					.limit(300),
			]);

			if (usageError) throw usageError;
			if (apiError) throw apiError;

			setUsageLogs((usageData || []) as UsageLogRow[]);
			setApiLogs((apiData || []) as ApiUsageRow[]);
			setRefreshedAt(new Date());
		} catch (error) {
			console.error("Failed to load usage analytics", error);
			toast.error("Failed to load usage analytics");
		} finally {
			setLoading(false);
		}
	};

	const analytics = useMemo(() => {
		const now = new Date();
		const todayStart = startOfDay(now);
		const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const usageToday = usageLogs.filter((r) => new Date(r.created_at) >= todayStart);
		const usageWeek = usageLogs.filter((r) => new Date(r.created_at) >= weekStart);
		const uniqueIpsToday = new Set(usageToday.map((r) => r.ip_hash).filter(Boolean));

		const apiToday = apiLogs.filter((r) => new Date(r.created_at) >= todayStart);
		const aiCallsToday = apiToday.filter((r) => r.is_ai_call);
		const aiTokensToday = aiCallsToday.reduce((sum, row) => sum + (row.tokens_used || 0), 0);
		const aiCostToday = aiCallsToday.reduce((sum, row) => sum + (Number(row.estimated_cost) || 0), 0);
		const apiFailuresToday = apiToday.filter((row) => (row.status_code || 0) >= 400).length;

		const functionCounts = apiLogs.reduce<Record<string, number>>((acc, row) => {
			acc[row.function_name] = (acc[row.function_name] || 0) + 1;
			return acc;
		}, {});

		const topFunctions = Object.entries(functionCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6);

		const recentUrls = usageLogs
			.slice(0, 8)
			.map((row) => row.reel_url)
			.filter((value, idx, arr) => arr.indexOf(value) === idx);

		return {
			totalAnalyses: usageLogs.length,
			analysesToday: usageToday.length,
			analysesWeek: usageWeek.length,
			uniqueVisitorsToday: uniqueIpsToday.size,
			apiCallsToday: apiToday.length,
			aiCallsToday: aiCallsToday.length,
			aiTokensToday,
			aiCostToday,
			apiFailuresToday,
			topFunctions,
			recentUrls,
		};
	}, [usageLogs, apiLogs]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h2 className="text-base sm:text-xl font-bold">Usage Analytics</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">Runtime usage, API load, and AI consumption overview.</p>
				</div>
				<div className="flex items-center gap-2">
					{refreshedAt && <span className="text-xs text-muted-foreground hidden sm:inline">Updated {refreshedAt.toLocaleTimeString()}</span>}
					<Button onClick={loadData} disabled={loading} size="sm" className="h-8 sm:h-10 text-xs sm:text-sm gradient-primary-bg text-primary-foreground">
						<RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
						{loading ? "Refreshing" : "Refresh"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<p className="text-xs text-muted-foreground">Analyses Today</p>
						<p className="text-2xl font-bold text-primary">{analytics.analysesToday}</p>
						<p className="text-[11px] text-muted-foreground">Week: {analytics.analysesWeek}</p>
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<p className="text-xs text-muted-foreground">Unique Visitors</p>
						<p className="text-2xl font-bold text-green-500">{analytics.uniqueVisitorsToday}</p>
						<p className="text-[11px] text-muted-foreground">from IP hashes today</p>
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<p className="text-xs text-muted-foreground">API Calls Today</p>
						<p className="text-2xl font-bold text-accent">{analytics.apiCallsToday}</p>
						<p className="text-[11px] text-muted-foreground">AI calls: {analytics.aiCallsToday}</p>
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<p className="text-xs text-muted-foreground">AI Cost Today</p>
						<p className="text-2xl font-bold text-[hsl(var(--viral-high))]">${analytics.aiCostToday.toFixed(4)}</p>
						<p className="text-[11px] text-muted-foreground">Tokens: {analytics.aiTokensToday.toLocaleString()}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="border-border bg-card">
					<CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
						<CardTitle className="text-sm sm:text-base flex items-center gap-2">
							<Database className="w-4 h-4 text-primary" />
							Top Function Usage
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
						{analytics.topFunctions.length === 0 ? (
							<p className="text-xs text-muted-foreground">No API usage logs found.</p>
						) : (
							<div className="space-y-3">
								{analytics.topFunctions.map(([name, count]) => {
									const max = analytics.topFunctions[0]?.[1] || 1;
									const width = Math.max((count / max) * 100, 8);

									return (
										<div key={name} className="space-y-1">
											<div className="flex items-center justify-between text-xs sm:text-sm gap-3">
												<span className="truncate font-medium">{name}</span>
												<span className="text-muted-foreground">{count}</span>
											</div>
											<div className="h-2 bg-muted rounded-full overflow-hidden">
												<div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${width}%` }} />
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
						<CardTitle className="text-sm sm:text-base flex items-center gap-2">
							<TrendingUp className="w-4 h-4 text-primary" />
							Recent Reel URLs
						</CardTitle>
					</CardHeader>
					<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
						{analytics.recentUrls.length === 0 ? (
							<p className="text-xs text-muted-foreground">No recent analyses.</p>
						) : (
							<div className="space-y-2">
								{analytics.recentUrls.map((url) => (
									<div key={url} className="p-2 rounded-md border border-border bg-muted/30 text-xs sm:text-sm truncate" title={url}>
										{url}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<div className="flex items-center gap-2 mb-1">
							<Activity className="w-4 h-4 text-primary" />
							<p className="text-xs text-muted-foreground">Total Analyses Loaded</p>
						</div>
						<p className="text-xl font-bold">{analytics.totalAnalyses}</p>
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<div className="flex items-center gap-2 mb-1">
							<Bot className="w-4 h-4 text-accent" />
							<p className="text-xs text-muted-foreground">AI Calls Today</p>
						</div>
						<p className="text-xl font-bold">{analytics.aiCallsToday}</p>
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardContent className="pt-5">
						<div className="flex items-center gap-2 mb-1">
							<UserCheck className="w-4 h-4 text-[hsl(var(--viral-high))]" />
							<p className="text-xs text-muted-foreground">API Failures Today</p>
						</div>
						<p className="text-xl font-bold">{analytics.apiFailuresToday}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
