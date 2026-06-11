import AudienceEntry from "../components/AudienceEntry";
import WeeklySection from "../components/WeeklySection";
import { getReferenceActivities, getWeeklyFeatured } from "../domain/activitySelectors";
import { getPublicEvaluatedActivities } from "../domain/candidateStore";

export default function HomePage() {
  const publicActivities = getPublicEvaluatedActivities();
  const featured = getWeeklyFeatured(publicActivities);
  const reference = getReferenceActivities(publicActivities);

  return (
    <main className="hub-main">
      <section className="hero compact-hero feed-hero">
        <div className="hero-copy">
          <p className="eyebrow">深圳学习活动</p>
          <h1>深圳本周值得去</h1>
          <div className="hero-signal-row" aria-label="本周信息概览">
            <span>{featured.length} 条精选</span>
            <span>{reference.length} 条可参考</span>
            <span>真实采集</span>
          </div>
        </div>
      </section>

      <section className="hub-board" aria-label="深圳学习活动信息流">
        <div className="feed-column">
          <WeeklySection
            title="本周精选"
            subtitle="确定性更强，先看判断。"
            activities={featured}
            emptyStateText="暂无明确时间的精选活动，下一次采集后更新。"
          />

          <WeeklySection
            title="更多可参考活动"
            subtitle="系统筛过，出发前再核对。"
            activities={reference}
            emptyStateText="暂无更多可参考活动。"
          />
        </div>

        <aside className="feed-rail" aria-label="快速入口">
          <div className="rail-panel">
            <strong>快速选择</strong>
            <div className="audience-grid secondary-audience-grid" aria-label="选择入口">
              <AudienceEntry type="family" />
              <AudienceEntry type="adult" />
            </div>
          </div>
          <div className="rail-panel rail-note">
            <strong>阅读顺序</strong>
            <p>先看状态和判断，再看时间地点，最后进详情核对依据。</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
