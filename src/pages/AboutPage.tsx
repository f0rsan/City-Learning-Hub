export default function AboutPage() {
  return (
    <main className="page-stack">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">来源和信任规则</p>
          <h1>我们怎样整理深圳活动</h1>
          <p>这个 Hub 先做深圳单城市精选。活动来自可信来源池、主办方提交和用户纠错，但投稿不会直接公开。</p>
        </div>
      </section>
      <section className="detail-grid">
        <article className="detail-card">
          <h2>收录标准</h2>
          <p>必须有可验证来源，必须写清适合人群、时间地点、费用、报名门槛和注意事项。</p>
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
          <p>第一版先人工精选和审核，自动收集会在收录规则稳定后加入。</p>
        </article>
      </section>
    </main>
  );
}
