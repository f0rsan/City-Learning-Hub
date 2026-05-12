export default function AboutPage() {
  return (
    <main className="page-stack">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">来源说明</p>
          <h1>深圳活动怎么选</h1>
          <p>汇总展会、讲座、沙龙和技术活动，标出适合人群和注意事项。</p>
        </div>
      </section>
      <section className="detail-grid">
        <article className="detail-card">
          <h2>来源可查</h2>
          <p>没有可核对的页面或线索，不会放进精选。官方渠道能增加可信度，但不代表活动一定值得去。</p>
        </article>
        <article className="detail-card">
          <h2>亲子活动</h2>
          <p>儿童相关活动必须补齐适龄、陪同要求和安全注意事项，否则不会进入亲子精选。</p>
        </article>
        <article className="detail-card">
          <h2>信息变化</h2>
          <p>活动取消、过期、链接失效或信息待确认时，会降低展示优先级或从本周精选移出。</p>
        </article>
        <article className="detail-card">
          <h2>每周更新</h2>
          <p>自动搜集和初筛，人只处理信息不清或风险较高的活动。</p>
        </article>
      </section>
    </main>
  );
}
