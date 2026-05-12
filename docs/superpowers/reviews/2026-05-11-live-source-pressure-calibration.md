# 真实来源接入：采集质量压测与权重校准（执行记录）

执行时间：2026-05-11  
目标：在不改变产品核心理念下，把“真实来源接入 + 质量压测 + 权重校准”落地到可运行流程。

---

## 1) 本轮落地内容

### 实时来源适配（真实源）
- Eventbrite 深圳页（JSON-LD 事件列表解析）
- 豆瓣同城深圳页（活动链接与标题解析）

代码：
- [liveSourceAdapters.ts](/Users/yangyingjia/Shenzhen%20Learning%20Hub/src/domain/liveSourceAdapters.ts)

### 压测与校准脚本
- 新增脚本：`npm run collection:stress`
- 实现：多轮并发采集、成功率/延迟/去重率统计、自动建议 `trustLevel` 与 `signalWeight`

代码：
- [run-live-calibration.mjs](/Users/yangyingjia/Shenzhen%20Learning%20Hub/scripts/collection/run-live-calibration.mjs)
- [package.json](/Users/yangyingjia/Shenzhen%20Learning%20Hub/package.json)

### 校准结果固化
- 把压测建议写入来源权重覆盖：
  - `eventbrite-shenzhen` -> `trustLevel=high`, `signalWeight=1.27`
  - `douban-shenzhen` -> `trustLevel=high`, `signalWeight=1.29`

代码：
- [sourceCalibration.ts](/Users/yangyingjia/Shenzhen%20Learning%20Hub/src/domain/sourceCalibration.ts)
- [sourcePool.ts](/Users/yangyingjia/Shenzhen%20Learning%20Hub/src/domain/sourcePool.ts)
- [evaluationRules.ts](/Users/yangyingjia/Shenzhen%20Learning%20Hub/src/domain/evaluationRules.ts)

---

## 2) 压测结果（4轮，并发2）

报告文件：
- [live-source-calibration-2026-05-11.json](/Users/yangyingjia/Shenzhen%20Learning%20Hub/docs/superpowers/reports/live-source-calibration-2026-05-11.json)

关键指标：

| Source | SuccessRate | AvgLatency | AvgItems/Run | UniqueRatio | QualityScore | 建议 |
|---|---:|---:|---:|---:|---:|---|
| Eventbrite 深圳 | 1.00 | 1685ms | 16 | 0.391 | 0.828 | high / 1.27 |
| 豆瓣同城深圳 | 1.00 | 872ms | 87 | 0.422 | 0.856 | high / 1.29 |

结论：
- 两个来源在当前网络条件下稳定可采。
- 去重率不是“越高越好”，目前值反映同轮重复出现的热门活动，需要后续做跨轮去重和热度衰减。

---

## 3) 规则漏洞循环（Are you 100% confident?）

本轮先识别漏洞，再修复，再复验：

1. 漏洞：来源评分之前只看 `trustLevel`，无法表达“同信任等级下的数据质量差异”。  
   修复：引入 `signalWeight`，来源分数按权重缩放并封顶。

2. 漏洞：采集仅模拟，不能证明真实来源可用性。  
   修复：加入真实源适配器 + 压测脚本，输出可审计报告。

3. 漏洞：校准建议没有落到运行时。  
   修复：新增 `sourceCalibrationOverrides`，运行时覆盖 trust 和权重。

复验结果：
- 单测：73/73 通过  
- 构建：通过  
- E2E：14/14 通过  

在“本地可验证范围”（代码、测试、真实源压测）内，本轮可判定为可上线级别的高置信执行完成。

