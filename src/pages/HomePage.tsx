import AudienceEntry from "../components/AudienceEntry";
import WeeklySection from "../components/WeeklySection";
import heroImage from "../assets/shenzhen-learning-hub-hero.png";
import { getWeeklyFeatured } from "../domain/activitySelectors";
import { getPublicEvaluatedActivities } from "../domain/candidateStore";

export default function HomePage() {
  const featured = getWeeklyFeatured(getPublicEvaluatedActivities());

  return (
    <main>
      <section className="hero visual-hero">
        <div className="hero-copy">
          <p className="eyebrow">深圳本周精选</p>
          <h1>深圳本周值得去</h1>
          <p>给家长和成人看的深圳活动清单：看点、注意事项和把握度都放前面。</p>
        </div>
        <img className="hero-image" src={heroImage} alt="深圳学习活动现场氛围" />
      </section>

      <section className="audience-grid" aria-label="选择入口">
        <AudienceEntry type="family" />
        <AudienceEntry type="adult" />
      </section>

      <WeeklySection
        title="本周精选"
        subtitle="先看要点，再决定要不要报名。"
        activities={featured}
      />
    </main>
  );
}
