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
          <p className="eyebrow">深圳单城市 · 每周精选</p>
          <h1>深圳本周值得去</h1>
          <p>用系统化证据从零碎活动信息里筛出真正值得带孩子去、或者大人自己去学习交流的活动。</p>
        </div>
        <img className="hero-image" src={heroImage} alt="深圳学习活动现场氛围" />
      </section>

      <section className="audience-grid" aria-label="选择入口">
        <AudienceEntry type="family" />
        <AudienceEntry type="adult" />
      </section>

      <WeeklySection
        title="本周精选"
        subtitle="不是活动越多越好，而是每个活动都要解释价值、风险和判断信心。"
        activities={featured}
      />
    </main>
  );
}
