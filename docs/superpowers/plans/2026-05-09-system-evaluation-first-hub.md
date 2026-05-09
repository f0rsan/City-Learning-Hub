# 系统评估优先 Hub 实施计划

> **给后续执行代理：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐项推进本计划。步骤使用 checkbox（`- [ ]`）语法追踪进度。

**目标：** 把 Shenzhen Learning Hub 从人工整理活动，转为“80% 系统驱动的活动价值判断引擎 + 20% 人工校准”的产品。

**架构：** 保留当前 React/Vite 应用，在其上加入候选活动发现、评估信号、评分、推荐解释和人工校准的领域层。公开页面读取系统评估后的推荐；后台页面负责查看和校准系统判断，而不是人工逐条编辑每个活动。

**技术栈：** Vite、React、TypeScript、React Router、localStorage 原型存储、Vitest、Testing Library、Playwright。

---

## 策略锁定

这个产品不是活动列表，而是一个帮助用户在参加之前判断“这个活动是否值得去”的决策系统。

运行原则是：

- 80% 系统判断：来源发现、字段提取、来源可信度、组织方历史、场地信号、历史规律、公开反馈信号、风险识别、推荐解释。
- 20% 人工校准：低信心、高风险、证据冲突、新来源质量、规则纠偏。

人工整理不是主流程。人的作用是校准层和异常处理层。

## 当前基线

已经可用：

- 公开首页。
- 亲子入口和成人入口。
- 活动详情判断页。
- 活动提交和纠错页面。
- 轻量后台页面，用于查看提交状态和纠错信息。
- 单元测试、构建检查和 Playwright 浏览器端到端测试。

已知缺口：

- 公开页面仍然读取静态种子活动。
- 后台尚未展示评估信号。
- 用户提交不会变成系统可评估的候选活动。
- 纠错不会影响风险、可信度或状态。
- 没有来源池。
- 没有系统推荐分。
- 卡片没有展示信心等级或证据拆解。
- 本地原型数据没有导入/导出能力。

## 文件结构

创建或修改：

- `src/domain/evaluationTypes.ts`：评估信号、评分、信心、证据和校准类型。
- `src/domain/evaluationRules.ts`：确定性评分规则和推荐解释生成。
- `src/domain/candidateStore.ts`：本地候选活动存储和种子活动合并。
- `src/domain/sourcePool.ts`：第一版稳定的深圳活动来源池。
- `src/domain/calibrationStore.ts`：人工校准记录和纠错影响。
- `src/components/EvaluationBadge.tsx`：推荐等级和信心等级展示。
- `src/components/EvidenceSummary.tsx`：来源、组织方、场地、历史、社媒和风险证据摘要。
- `src/pages/AdminPage.tsx`：从人工审核队列改为系统评估和校准控制台。
- `src/components/ActivityCard.tsx`：展示推荐理由、风险理由、信心和证据。
- `src/components/ActivityDetail.tsx`：在官方链接之前展示完整评估拆解。
- `tests/domain/evaluationRules.test.ts`：评分和信心规则覆盖。
- `tests/domain/candidateStore.test.ts`：种子活动和本地候选活动合并覆盖。
- `tests/pages/EvaluationAdmin.test.tsx`：校准工作流覆盖。
- `e2e/hub.spec.ts`：更新浏览器流程，验证评估后的推荐。

## 任务 1：Git 基线和计划保护

**文件：**

- 已有：全部项目文件。

- [x] **步骤 1：在迁移后的文件夹中初始化 Git**

运行：

```bash
git init
git add .
git commit -m "chore: baseline migrated Shenzhen learning hub"
```

预期结果：迁移后可运行的项目已提交到干净的 `main` 分支。

- [x] **步骤 2：提交策略更新**

运行：

```bash
git add docs
git commit -m "docs: shift hub strategy to system evaluation first"
```

预期结果：策略文档已经作为独立提交保存，和运行时代码提交分开。

## 任务 2：增加评估领域模型

**文件：**

- 创建：`src/domain/evaluationTypes.ts`
- 创建：`tests/domain/evaluationRules.test.ts`
- 修改：`src/domain/types.ts`

- [ ] **步骤 1：先写失败的评估输出测试**

新增测试，确认每个被评估的活动都具备：

- 推荐等级。
- 信心等级。
- 价值理由。
- 风险理由。
- 证据信号。
- 亲子适配和成人适配分开判断。

运行：

```bash
npm run test:run -- tests/domain/evaluationRules.test.ts
```

预期结果：失败，因为评估类型和规则还不存在。

- [ ] **步骤 2：增加评估类型**

实现这些类型：

- `SignalScore`
- `EvidenceSignal`
- `AudienceFit`
- `ActivityEvaluation`
- `RecommendationLevel`
- `ConfidenceLevel`
- `CalibrationNote`

- [ ] **步骤 3：验证类型集成**

运行：

```bash
npm run build
```

预期结果：TypeScript 编译通过。

## 任务 3：实现基于规则的系统评估

**文件：**

- 创建：`src/domain/evaluationRules.ts`
- 修改：`tests/domain/evaluationRules.test.ts`

- [ ] **步骤 1：编写评分测试**

覆盖这些情况：

- 官方来源提高可信度，但不会自动提高活动价值。
- 缺少儿童安全信息时，不能给出高信心亲子推荐。
- 已取消活动必须被拦截。
- 新组织方如果内容质量好，可以是中等信心，而不是自动低价值。
- 社媒信号不能单独主导最终评分。

- [ ] **步骤 2：实现确定性评分**

创建函数：

- `evaluateActivity(activity, context)`
- `scoreSourceSignal(activity, source)`
- `scoreOrganizerSignal(activity, organizerHistory)`
- `scoreVenueSignal(activity, venueHistory)`
- `scoreContentSignal(activity)`
- `scoreRiskSignal(activity)`
- `deriveRecommendationLevel(evaluation)`
- `deriveConfidenceLevel(evaluation)`

- [ ] **步骤 3：验证评分行为**

运行：

```bash
npm run test:run -- tests/domain/evaluationRules.test.ts
npm run build
```

预期结果：测试和构建都通过。

## 任务 4：建立候选活动存储

**文件：**

- 创建：`src/domain/candidateStore.ts`
- 修改：`src/domain/localStore.ts`
- 创建：`tests/domain/candidateStore.test.ts`

- [ ] **步骤 1：先写失败的候选活动存储测试**

测试必须覆盖：

- 种子活动和本地候选活动可以合并。
- 可以识别重复的 slug 或官方 URL。
- 用户提交可以变成候选草稿。
- 已发布候选活动必须经过评估后，才可以出现在公开推荐里。

- [ ] **步骤 2：实现本地候选活动存储**

第一版使用 localStorage，但 API 要保持可替换：

- `getCandidateActivities()`
- `saveCandidateActivity(candidate)`
- `createCandidateFromSubmission(submissionId)`
- `updateCandidateStatus(id, status)`
- `resetCandidateData()`

- [ ] **步骤 3：验证候选活动存储**

运行：

```bash
npm run test:run -- tests/domain/candidateStore.test.ts
npm run test:run
```

预期结果：全部测试通过。

## 任务 5：把人工后台替换为评估控制台

**文件：**

- 修改：`src/pages/AdminPage.tsx`
- 创建：`src/components/EvidenceSummary.tsx`
- 创建：`src/components/EvaluationBadge.tsx`
- 创建：`tests/pages/EvaluationAdmin.test.tsx`

- [ ] **步骤 1：先写失败的后台测试**

测试必须验证：

- 后台展示系统推荐等级。
- 后台展示信心等级。
- 后台展示价值理由和风险理由。
- 后台可以确认、降低信心、拒绝或送入校准。
- 后台可以把已确认的用户提交转成候选草稿。

- [ ] **步骤 2：实现评估控制台界面**

后台分区：

- 系统推荐。
- 需要校准。
- 候选草稿。
- 影响可信度的纠错。
- 来源池健康度。

- [ ] **步骤 3：验证后台工作流**

运行：

```bash
npm run test:run -- tests/pages/EvaluationAdmin.test.tsx
npm run build
```

预期结果：测试和构建都通过。

## 任务 6：更新公开卡片和详情页，解释系统判断

**文件：**

- 修改：`src/components/ActivityCard.tsx`
- 修改：`src/components/ActivityDetail.tsx`
- 修改：`tests/pages/HomePage.test.tsx`
- 修改：`tests/pages/ActivityPage.test.tsx`

- [ ] **步骤 1：先写失败的公开页面测试**

测试必须验证：

- 卡片展示推荐等级。
- 卡片展示信心等级。
- 卡片至少展示一个价值理由。
- 有风险时，卡片至少展示一个风险理由。
- 详情页在官方链接前展示证据拆解。

- [ ] **步骤 2：更新公开组件**

卡片和详情页应该展示：

- 为什么值得去。
- 为什么可能不适合。
- 来源可信度。
- 组织方信号。
- 场地信号。
- 有历史或社媒信号时展示对应信息。
- 信心等级。

- [ ] **步骤 3：验证公开页面**

运行：

```bash
npm run test:run -- tests/pages/HomePage.test.tsx tests/pages/ActivityPage.test.tsx
npm run build
```

预期结果：测试和构建都通过。

## 任务 7：把提交和纠错接入评估

**文件：**

- 修改：`src/domain/localStore.ts`
- 修改：`src/pages/SubmitActivityPage.tsx`
- 修改：`src/pages/CorrectionPage.tsx`
- 修改：`tests/pages/SubmitAndAdmin.test.tsx`

- [ ] **步骤 1：先写失败的工作流测试**

测试必须验证：

- 用户提交的活动进入候选池，而不是直接变成公开推荐。
- 纠错可以标记链接失效、活动取消、时间变化或场地变化。
- 纠错处理后会影响风险或信心。

- [ ] **步骤 2：实现纠错影响**

纠错类型应该映射成结构化影响：

- 活动取消会把状态降为 cancelled。
- 链接失效会降低来源信心。
- 时间或场地变化会降低信心，直到重新确认。
- 重复纠错会提高风险。

- [ ] **步骤 3：验证工作流**

运行：

```bash
npm run test:run -- tests/pages/SubmitAndAdmin.test.tsx
npm run e2e
```

预期结果：测试和浏览器流程都通过。

## 任务 8：增加来源池和模拟自动采集队列

**文件：**

- 创建：`src/domain/sourcePool.ts`
- 创建：`src/domain/collectionQueue.ts`
- 创建：`tests/domain/collectionQueue.test.ts`
- 修改：`src/pages/AdminPage.tsx`

- [ ] **步骤 1：先写失败的来源队列测试**

测试必须验证：

- 稳定来源可以被列出。
- 一次采集运行会创建候选记录。
- 来源失败会被记录。
- 采集到的候选活动必须经过评估后，才可以公开展示。

- [ ] **步骤 2：实现原型来源池**

先从人工维护的来源定义开始。本任务不抓取真实网站，目标是安全地建模采集管线。

- [ ] **步骤 3：验证来源队列**

运行：

```bash
npm run test:run -- tests/domain/collectionQueue.test.ts
npm run build
```

预期结果：测试和构建都通过。

## 任务 9：增加数据导出和导入

**文件：**

- 创建：`src/domain/exportImport.ts`
- 修改：`src/pages/AdminPage.tsx`
- 创建：`tests/domain/exportImport.test.ts`

- [ ] **步骤 1：先写失败的导出/导入测试**

测试必须验证：

- 导出包含候选活动、评估、用户提交、纠错、校准记录和来源健康度。
- 导入在写入前先验证数据形状。
- 格式错误的导入会被拒绝。

- [ ] **步骤 2：实现导出/导入**

为本地原型数据增加 JSON 导出和导入函数。

- [ ] **步骤 3：验证备份流程**

运行：

```bash
npm run test:run -- tests/domain/exportImport.test.ts
npm run test:run
```

预期结果：全部测试通过。

## 任务 10：端到端验证系统判断

**文件：**

- 修改：`e2e/hub.spec.ts`

- [ ] **步骤 1：更新 Playwright 测试**

浏览器测试必须覆盖：

- 首页展示评估后的推荐。
- 详情页展示价值理由、风险理由、证据和信心。
- 用户提交进入候选队列。
- 校准会改变推荐等级或信心等级。
- 移动端布局仍然可读。

- [ ] **步骤 2：运行完整验证**

运行：

```bash
npm run test:run
npm run build
npm run e2e
```

预期结果：全部检查通过。

## 信心循环

实施开始前，必须验证这些判断：

- 产品中心是系统判断，不是人工整理。
- 人工工作是校准和异常处理，不是每个活动都必须人工编辑。
- 公开推荐必须包含证据和信心。
- 社媒反馈只是一个信号，不能单独主导判断。
- 官方来源会提高可信度，但不等于活动一定有价值。
- 新组织方可以在较低信心下被推荐，而不是直接被拒绝。
- 候选活动不能仅仅因为被用户提交就公开展示。
- 每个推荐都必须同时解释价值和风险。

如果代码或文档与任何一条冲突，先修正文档，再开始实现。
