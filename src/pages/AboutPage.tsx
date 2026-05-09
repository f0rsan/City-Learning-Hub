export default function AboutPage() {
  return (
    <main className="page-stack">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">来源和信任规则</p>
          <h1>我们怎样整理深圳活动</h1>
          <p>这个 Hub 先做深圳单城市价值判断。系统负责发现和评估活动，人工只处理低信心、高风险和争议信息。</p>
        </div>
      </section>
      <section className="detail-grid">
        <article className="detail-card">
          <h2>收录标准</h2>
          <p>必须有可验证来源、推荐理由、风险提示和判断信心，官方来源只提高可信度，不直接代表值得去。</p>
        </article>
        <article className="detail-card">
          <h2>儿童活动</h2>
          <p>儿童相关活动必须补齐适龄、陪同要求和安全注意事项，否则不会进入亲子精选。</p>
        </article>
        <article className="detail-card">
          <h2>信息变化</h2>
          <p>活动取消、过期、链接失效或信息待确认时，会降低展示优先级或从本周精选移出。</p>
        </article>
        <article className="detail-card">
          <h2>持续更新</h2>
          <p>第一版按 80% 系统判断、20% 人工校准推进。人工负责校准，不负责逐条主观精选。</p>
        </article>
      </section>
    </main>
  );
}
