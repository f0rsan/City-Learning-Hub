import AudienceEntry from "../components/AudienceEntry";
import WeeklySection from "../components/WeeklySection";
import { getReferenceActivities, getWeeklyFeatured } from "../domain/activitySelectors";
import { getPublicEvaluatedActivities } from "../domain/candidateStore";

export default function HomePage() {
  const publicActivities = getPublicEvaluatedActivities();
  const featured = getWeeklyFeatured(publicActivities);
  const reference = getReferenceActivities(publicActivities);

  return (
    <main>
      <section className="hero compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">深圳学习活动</p>
          <h1>深圳本周值得去</h1>
          <p>给家长和成人看的活动清单：先看价值、风险和可靠性。</p>
          <div className="hero-signal-row" aria-label="本周信息概览">
            <span>{featured.length} 条精选</span>
            <span>{reference.length} 条可参考</span>
            <span>真实采集</span>
          </div>
        </div>
      </section>

      <WeeklySection
        title="本周精选"
        subtitle="按时间排列，先看判断，再进详情。"
        activities={featured}
      />

      <WeeklySection
        title="更多可参考活动"
        subtitle="系统筛过，适合继续查看；出发前再核对时间和报名。"
        activities={reference}
      />

      <section className="audience-grid secondary-audience-grid" aria-label="选择入口">
        <AudienceEntry type="family" />
        <AudienceEntry type="adult" />
      </section>
    </main>
  );
}
