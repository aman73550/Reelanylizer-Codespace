import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PremiumInsights } from "@/lib/types";
import {
  FileText, Layers, Clock, Lightbulb, Hash, Users, Calendar, Target,
  CheckCircle, XCircle, Zap, ArrowUp, ArrowDown, TrendingUp, Star,
  BarChart3, Wand2, Shield, AlertTriangle, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

interface Props {
  data: PremiumInsights;
}

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
    <Icon className="w-4 h-4 text-primary" /> {title}
  </h3>
);

const potentialColor = (p: string) => {
  const l = p.toLowerCase();
  if (l.includes("very high")) return "hsl(var(--viral-high))";
  if (l.includes("high")) return "hsl(var(--chart-2))";
  if (l.includes("medium")) return "hsl(var(--chart-4))";
  return "hsl(var(--chart-5))";
};

const impactBadge = (impact: string) => {
  const l = impact.toLowerCase();
  if (l === "high") return "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))] border-[hsl(var(--viral-high))]/20";
  if (l === "medium") return "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20";
  return "bg-muted text-muted-foreground border-border";
};

const effortBadge = (effort: string) => {
  const l = effort.toLowerCase();
  if (l === "easy") return "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]";
  if (l === "medium") return "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]";
  return "bg-destructive/10 text-destructive";
};

const PremiumAnalysisCards = ({ data }: Props) => {
  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      {data.executiveSummary && (
        <motion.div {...fadeIn(0.1)}>
          <Card className="p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
            <SectionTitle icon={FileText} title="Executive Summary" />
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{data.executiveSummary}</p>
          </Card>
        </motion.div>
      )}

      {/* Viral Formula — What Worked / Improve / Quick Wins */}
      {data.viralFormula && (
        <motion.div {...fadeIn(0.15)}>
          <Card className="p-5 border border-border bg-card">
            <SectionTitle icon={Zap} title="Viral Formula Breakdown" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-[hsl(var(--viral-high))]/5 border border-[hsl(var(--viral-high))]/20">
                <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--viral-high))] font-semibold mb-2 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Strengths</p>
                <ul className="space-y-1.5">
                  {data.viralFormula.whatWorked.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-[hsl(var(--viral-high))] flex-shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold mb-2 flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Improve</p>
                <ul className="space-y-1.5">
                  {data.viralFormula.whatToImprove.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2 flex items-center gap-1"><Wand2 className="w-3 h-3" /> Quick Wins</p>
                <ul className="space-y-1.5">
                  {data.viralFormula.quickWins.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Zap className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Category Influence Chart */}
      {data.categoryInfluence && (
        <motion.div {...fadeIn(0.2)}>
          <Card className="p-5 border border-border bg-card">
            <SectionTitle icon={Layers} title="Category Viral Potential" />
            <p className="text-xs text-muted-foreground mt-1 mb-3">{data.categoryInfluence.explanation}</p>

            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Your Category: {data.categoryInfluence.yourCategory}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: potentialColor(data.categoryInfluence.viralPotential) }}>
                {data.categoryInfluence.viralPotential}
              </span>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryInfluence.topCategories.map(c => ({
                  name: c.category.split("/")[0],
                  value: c.potential === "Very High" ? 95 : c.potential === "High" ? 75 : c.potential === "Medium-High" ? 60 : c.potential === "Medium" ? 45 : 25,
                  full: c.category,
                }))} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number, _name: string, props: any) => {
                      const item = data.categoryInfluence!.topCategories.find(c => c.category.split("/")[0] === props.payload.name);
                      return [item?.potential || value, item?.category || "Category"];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {data.categoryInfluence.topCategories.map((c, i) => (
                      <Cell key={i} fill={potentialColor(c.potential)} fillOpacity={
                        c.category.toLowerCase().includes(data.categoryInfluence!.yourCategory.toLowerCase().split(" ")[0]) ? 1 : 0.5
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Reel Age Factor */}
      {data.reelAgeFactor && (
        <motion.div {...fadeIn(0.25)}>
          <Card className="p-5 border border-border bg-card">
            <SectionTitle icon={Clock} title="Reel Age & Viral Window" />
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Estimated Age</span>
                  <span className="text-xs font-semibold text-foreground">{data.reelAgeFactor.estimatedAge}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Viral Window</span>
                  <span className={`text-xs font-bold ${
                    data.reelAgeFactor.viralWindowStatus === "Peak" ? "text-[hsl(var(--viral-high))]" :
                    data.reelAgeFactor.viralWindowStatus === "Narrowing" ? "text-[hsl(var(--chart-4))]" :
                    "text-destructive"
                  }`}>{data.reelAgeFactor.viralWindowStatus}</span>
                </div>
                <Progress value={
                  data.reelAgeFactor.viralWindowStatus === "Peak" ? 95 :
                  data.reelAgeFactor.viralWindowStatus === "Narrowing" ? 60 :
                  data.reelAgeFactor.viralWindowStatus === "Declining" ? 30 :
                  data.reelAgeFactor.viralWindowStatus === "Closed" ? 5 : 50
                } className="h-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{data.reelAgeFactor.explanation}</p>
          </Card>
        </motion.div>
      )}

      {/* Hook Deep Dive + Alternative Hooks */}
      {data.hookDeepDive && (
        <motion.div {...fadeIn(0.3)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={Lightbulb} title="Hook Deep Dive & Alternatives" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Hook:</span>
              <span className="text-xs font-medium text-foreground capitalize">{data.hookDeepDive.currentHookType}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                data.hookDeepDive.effectiveness === "Strong" ? "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]" :
                data.hookDeepDive.effectiveness === "Average" ? "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]" :
                "bg-destructive/10 text-destructive"
              }`}>{data.hookDeepDive.effectiveness}</span>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alternative Hooks:</p>
              {data.hookDeepDive.alternativeHooks.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{h}</span>
                </div>
              ))}
            </div>
            {data.hookDeepDive.thumbnailTips.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Thumbnail Tips:</p>
                {data.hookDeepDive.thumbnailTips.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Wand2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" /> {t}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Caption Rewrite + Hashtag Strategy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.captionRewrite && (
          <motion.div {...fadeIn(0.35)}>
            <Card className="p-5 border border-border bg-card space-y-2 h-full">
              <SectionTitle icon={FileText} title="Improved Caption" />
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground leading-relaxed">{data.captionRewrite.improvedCaption}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{data.captionRewrite.whyBetter}</p>
            </Card>
          </motion.div>
        )}
        {data.hashtagStrategy && (
          <motion.div {...fadeIn(0.35)}>
            <Card className="p-5 border border-border bg-card space-y-2 h-full">
              <SectionTitle icon={Hash} title="Recommended Hashtags" />
              <div className="flex flex-wrap gap-1.5">
                {data.hashtagStrategy.recommended.map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-muted">Niche: {data.hashtagStrategy.mix.niche}</span>
                <span className="px-2 py-0.5 rounded bg-muted">Broad: {data.hashtagStrategy.mix.broad}</span>
                <span className="px-2 py-0.5 rounded bg-muted">Trending: {data.hashtagStrategy.mix.trending}</span>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Competitor Comparison */}
      {data.competitorComparison && data.competitorComparison.length > 0 && (
        <motion.div {...fadeIn(0.4)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={Users} title="Competitor Comparison" />
            <div className="space-y-2">
              {data.competitorComparison.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.trait}</p>
                    <p className="text-[10px] text-muted-foreground">{c.tip}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    c.yourScore === "Good" ? "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]" :
                    c.yourScore === "Average" ? "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]" :
                    "bg-destructive/10 text-destructive"
                  }`}>{c.yourScore}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Content Calendar */}
      {data.contentCalendar && (
        <motion.div {...fadeIn(0.45)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={Calendar} title="Best Posting Times" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.contentCalendar.bestTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{t.day.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{t.time}</p>
                    <p className="text-[10px] text-muted-foreground">{t.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" /> Recommended frequency: {data.contentCalendar.frequency}
            </p>
          </Card>
        </motion.div>
      )}

      {/* 5-Step Improvement Roadmap */}
      {data.improvementRoadmap && data.improvementRoadmap.length > 0 && (
        <motion.div {...fadeIn(0.5)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={Target} title="5-Step Improvement Roadmap" />
            <div className="space-y-3">
              {data.improvementRoadmap.map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary-bg flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{s.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-foreground">{s.title}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${impactBadge(s.impact)}`}>{s.impact} impact</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${effortBadge(s.effort)}`}>{s.effort}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Creator Checklist */}
      {data.creatorChecklist && data.creatorChecklist.length > 0 && (
        <motion.div {...fadeIn(0.55)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={Shield} title="Creator Pre-Post Checklist" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.creatorChecklist.map((c, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${c.done ? "bg-[hsl(var(--viral-high))]/5 border-[hsl(var(--viral-high))]/20" : "bg-destructive/5 border-destructive/20"}`}>
                  {c.done
                    ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--viral-high))] flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  }
                  <span className="text-[11px] text-foreground flex-1">{c.item}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.category}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Common Mistakes */}
      {data.commonMistakes && data.commonMistakes.length > 0 && (
        <motion.div {...fadeIn(0.6)}>
          <Card className="p-5 border border-border bg-card space-y-3">
            <SectionTitle icon={AlertTriangle} title="Common Mistakes to Avoid" />
            <div className="space-y-2">
              {data.commonMistakes.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{m.mistake}</p>
                      <p className="text-[10px] text-[hsl(var(--viral-high))] mt-1 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> Fix: {m.fix}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Engagement Boost Tips */}
      {data.engagementBoostTips && data.engagementBoostTips.length > 0 && (
        <motion.div {...fadeIn(0.65)}>
          <Card className="p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card space-y-3">
            <SectionTitle icon={TrendingUp} title="Engagement Boost Tips" />
            <div className="space-y-2">
              {data.engagementBoostTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="w-5 h-5 rounded-full gradient-primary-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary-foreground">{i + 1}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* YouTube Policy Compliance Check */}
      {data.youtubePolicyCheck && (
        <motion.div {...fadeIn(0.7)}>
          <Card className="p-5 border border-destructive/30 bg-gradient-to-br from-destructive/5 via-card to-card space-y-4">
            <SectionTitle icon={Shield} title="YouTube Policy Compliance" />
            
            {/* Overall Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                data.youtubePolicyCheck.overallStatus?.toLowerCase() === "safe" ? "bg-[hsl(var(--viral-high))]/20" :
                data.youtubePolicyCheck.overallStatus?.toLowerCase() === "warning" ? "bg-[hsl(var(--chart-4))]/20" :
                "bg-destructive/20"
              }`}>
                {data.youtubePolicyCheck.overallStatus?.toLowerCase() === "safe" ? 
                  <CheckCircle className="w-5 h-5 text-[hsl(var(--viral-high))]" /> :
                  <AlertTriangle className={`w-5 h-5 ${data.youtubePolicyCheck.overallStatus?.toLowerCase() === "warning" ? "text-[hsl(var(--chart-4))]" : "text-destructive"}`} />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{data.youtubePolicyCheck.overallStatus}</p>
                <p className="text-xs text-muted-foreground">
                  Monetization: {data.youtubePolicyCheck.monetizationEligible ? "✅ Eligible" : "❌ Not Eligible"}
                  {data.youtubePolicyCheck.ageRestrictionLikely && " · ⚠️ Age Restricted"}
                </p>
              </div>
            </div>

            {/* Policy Issues */}
            {data.youtubePolicyCheck.issues && data.youtubePolicyCheck.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policy Checks</p>
                {data.youtubePolicyCheck.issues.map((issue, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    issue.status?.toLowerCase() === "pass" ? "bg-[hsl(var(--viral-high))]/5 border-[hsl(var(--viral-high))]/20" :
                    issue.status?.toLowerCase() === "warning" ? "bg-[hsl(var(--chart-4))]/5 border-[hsl(var(--chart-4))]/20" :
                    "bg-destructive/5 border-destructive/20"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {issue.status?.toLowerCase() === "pass" ? 
                        <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--viral-high))]" /> :
                        issue.status?.toLowerCase() === "warning" ?
                        <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--chart-4))]" /> :
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      }
                      <span className="text-xs font-bold text-foreground">{issue.policy}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        issue.status?.toLowerCase() === "pass" ? "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]" :
                        issue.status?.toLowerCase() === "warning" ? "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]" :
                        "bg-destructive/10 text-destructive"
                      }`}>{issue.status}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{issue.detail}</p>
                    {issue.recommendation && issue.status?.toLowerCase() !== "pass" && (
                      <p className="text-[11px] text-primary mt-1">💡 {issue.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Copyright Risk */}
            {data.youtubePolicyCheck.copyrightRisk && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs font-semibold text-foreground mb-1">🎵 Copyright Risk: {data.youtubePolicyCheck.copyrightRisk.riskLevel}</p>
                <p className="text-[11px] text-muted-foreground">Music: {data.youtubePolicyCheck.copyrightRisk.musicUsed}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{data.youtubePolicyCheck.copyrightRisk.explanation}</p>
              </div>
            )}

            {/* Monetization Tips */}
            {data.youtubePolicyCheck.shortsMonetizationTips && data.youtubePolicyCheck.shortsMonetizationTips.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monetization Tips</p>
                {data.youtubePolicyCheck.shortsMonetizationTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <Star className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {data.youtubePolicyCheck.summary && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">{data.youtubePolicyCheck.summary}</p>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default PremiumAnalysisCards;
