# Shenzhen Learning Hub Implementation Plan

> Superseded on 2026-05-09 by `docs/superpowers/plans/2026-05-09-system-evaluation-first-hub.md`. This archived plan reflects the earlier manual-curation-first direction and must not be used for new implementation.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of the Shenzhen weekly learning-and-exchange Hub: a single-city website with weekly curated activities, parent-child and adult entry points, activity judgment pages, submission/correction flows, and a lightweight maintenance view.

**Architecture:** Use a React single-page app with a small domain layer, local seed data, and a storage abstraction backed by browser localStorage for the first version. Keep public discovery, trust rules, and maintenance workflows separate so the data layer can later be replaced by a real backend without rewriting the user-facing pages.

**Tech Stack:** Vite, React, TypeScript, React Router, Vitest, Testing Library, Playwright, CSS modules or plain CSS.

---

## Scope

This plan implements the first version from `docs/superpowers/specs/2026-05-08-shenzhen-learning-hub-design.md`.

It includes:

- Shenzhen-only public website.
- Weekly curated activity list.
- Parent-child and adult discovery paths.
- Activity cards and activity detail judgment pages.
- Submission and correction forms.
- Lightweight maintenance screen for reviewing submissions and corrections.
- Trust states for expired, cancelled, uncertain, and weak child-safety information.
- Responsive checks on desktop and mobile.

It does not include:

- Multi-city support.
- User accounts.
- Payment or ticketing.
- Automatic web crawling.
- Full community posting.
- Production database.

## File Structure

Create this structure:

```text
package.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
vitest.setup.ts
playwright.config.ts
src/
  main.tsx
  App.tsx
  styles.css
  assets/
    shenzhen-learning-hub-hero.png
  domain/
    types.ts
    sampleData.ts
    activitySelectors.ts
    localStore.ts
  components/
    ActivityCard.tsx
    ActivityDetail.tsx
    AudienceEntry.tsx
    Layout.tsx
    StatusBadge.tsx
    WeeklySection.tsx
  pages/
    HomePage.tsx
    AudiencePage.tsx
    ActivityPage.tsx
    SubmitActivityPage.tsx
    CorrectionPage.tsx
    AdminPage.tsx
    AboutPage.tsx
  test/
    render.tsx
tests/
  AppSmoke.test.tsx
  domain/
    activitySelectors.test.ts
    localStore.test.ts
  pages/
    HomePage.test.tsx
    ActivityPage.test.tsx
    SubmitAndAdmin.test.tsx
e2e/
  hub.spec.ts
```

Responsibility boundaries:

- `src/domain/*` owns activity shape, sample content, filtering, trust rules, and local storage.
- `src/components/*` owns reusable UI blocks.
- `src/pages/*` owns route-level page composition.
- `tests/*` covers domain behavior and route behavior.
- `e2e/*` verifies the full user journey in a real browser.

---

### Task 1: Scaffold The App And Test Harness

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/render.tsx`
- Create: `tests/AppSmoke.test.tsx`

- [ ] **Step 1: Create project manifest**

Create `package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 3: Add Vite and TypeScript config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts"
  }
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "e2e"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Add test setup**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

Create `src/test/render.tsx`:

```tsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

export function renderRoute(ui: ReactElement, initialPath = "/") {
  window.history.pushState({}, "Test page", initialPath);
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}
```

- [ ] **Step 5: Add browser test config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
```

- [ ] **Step 6: Add initial app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>深圳学习 Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>深圳本周值得去</h1>
      <p>城市学习 Hub 正在搭建中。</p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #14201d;
  background: #f6f8f5;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

a {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 48px 24px;
}
```

Create `tests/AppSmoke.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { renderRoute } from "../src/test/render";

describe("App smoke test", () => {
  it("renders the initial Shenzhen hub shell", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Verify scaffold**

Run:

```bash
npm run build
npm run test:run
```

Expected: build succeeds and Vitest reports no failing tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json vitest.setup.ts playwright.config.ts src tests/AppSmoke.test.tsx
git commit -m "chore: scaffold Shenzhen learning hub app"
```

---

### Task 2: Add Activity Model, Seed Data, And Trust Rules

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/sampleData.ts`
- Create: `src/domain/activitySelectors.ts`
- Test: `tests/domain/activitySelectors.test.ts`

- [ ] **Step 1: Write domain tests first**

Create `tests/domain/activitySelectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  filterByAudience,
  getActivityBySlug,
  getPublishedActivities,
  getTrustState,
  getWeeklyFeatured
} from "../../src/domain/activitySelectors";
import { sampleActivities } from "../../src/domain/sampleData";

describe("activity selectors", () => {
  it("returns only published activities for public pages", () => {
    const visible = getPublishedActivities(sampleActivities);
    expect(visible.every((activity) => activity.status === "published")).toBe(true);
  });

  it("keeps weekly featured activities curated and current", () => {
    const featured = getWeeklyFeatured(sampleActivities);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    expect(featured.every((activity) => activity.weeklyFeatured)).toBe(true);
    expect(featured.every((activity) => activity.status === "published")).toBe(true);
  });

  it("filters activities for parent-child and adult entry points", () => {
    expect(filterByAudience(sampleActivities, "family").every((activity) => activity.audience.includes("family"))).toBe(true);
    expect(filterByAudience(sampleActivities, "adult").every((activity) => activity.audience.includes("adult"))).toBe(true);
  });

  it("finds an activity by slug", () => {
    const activity = getActivityBySlug(sampleActivities, "nanshan-ai-family-day");
    expect(activity?.title).toBe("南山 AI 互动体验日");
  });

  it("marks weak child information as not ready for family curation", () => {
    const activity = getActivityBySlug(sampleActivities, "child-safety-weak-sample");
    expect(activity).toBeDefined();
    expect(getTrustState(activity!).level).toBe("blocked");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- tests/domain/activitySelectors.test.ts
```

Expected: FAIL because the domain files do not exist yet.

- [ ] **Step 3: Add domain types**

Create `src/domain/types.ts`:

```ts
export type Audience = "family" | "adult";
export type ActivityStatus = "draft" | "published" | "expired" | "cancelled" | "uncertain";
export type Difficulty = "入门" | "进阶" | "专业";
export type PriceType = "免费" | "收费" | "公益";

export type ActivitySource = {
  id: string;
  name: string;
  type: "venue" | "university" | "bookstore" | "tech-park" | "community" | "conference-platform" | "organizer";
  url: string;
  trustLevel: "high" | "medium" | "unverified";
  lastChecked: string;
};

export type Activity = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "电子展会" | "游戏展会" | "科技展会" | "技术大会" | "社科讲座" | "读书沙龙" | "Hackathon" | "亲子科技";
  audience: Audience[];
  tags: string[];
  district: "南山" | "福田" | "宝安" | "龙岗" | "罗湖" | "盐田" | "光明";
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  priceType: PriceType;
  priceNote: string;
  reservationRequired: boolean;
  ageBand?: string;
  difficulty: Difficulty;
  recommendation: string;
  bestFor: string;
  cautions: string[];
  officialUrl: string;
  sourceId: string;
  lastConfirmedAt: string;
  status: ActivityStatus;
  weeklyFeatured: boolean;
  childSafetyComplete: boolean;
};

export type TrustState = {
  level: "clear" | "warning" | "blocked";
  label: string;
  message: string;
};
```

- [ ] **Step 4: Add Shenzhen sample data**

Create `src/domain/sampleData.ts`:

```ts
import type { Activity, ActivitySource } from "./types";

export const sampleSources: ActivitySource[] = [
  {
    id: "nanshan-tech-museum",
    name: "南山科技馆",
    type: "venue",
    url: "https://example.com/nanshan-tech",
    trustLevel: "high",
    lastChecked: "2026-05-08"
  },
  {
    id: "shenzhen-book-city",
    name: "深圳书城",
    type: "bookstore",
    url: "https://example.com/shenzhen-book-city",
    trustLevel: "high",
    lastChecked: "2026-05-08"
  },
  {
    id: "tech-community",
    name: "深圳技术社区",
    type: "community",
    url: "https://example.com/shenzhen-tech-community",
    trustLevel: "medium",
    lastChecked: "2026-05-08"
  }
];

export const sampleActivities: Activity[] = [
  {
    id: "a1",
    slug: "nanshan-ai-family-day",
    title: "南山 AI 互动体验日",
    summary: "适合第一次带孩子接触 AI 展示和互动装置的周末活动。",
    category: "亲子科技",
    audience: ["family"],
    tags: ["AI", "亲子同行", "互动体验"],
    district: "南山",
    venue: "南山科技馆",
    address: "深圳市南山区科技园片区",
    startAt: "2026-05-16T14:00:00+08:00",
    endAt: "2026-05-16T16:00:00+08:00",
    priceType: "免费",
    priceNote: "免费，需提前预约",
    reservationRequired: true,
    ageBand: "8-12 岁",
    difficulty: "入门",
    recommendation: "有互动环节，不只是看展，适合孩子建立对 AI 的第一印象。",
    bestFor: "想带孩子接触科技展陈的家庭。",
    cautions: ["低龄儿童需要家长全程陪同", "预约名额可能提前满"],
    officialUrl: "https://example.com/events/nanshan-ai-family-day",
    sourceId: "nanshan-tech-museum",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a2",
    slug: "ai-product-meetup",
    title: "AI 产品实践 Meetup",
    summary: "面向产品、技术和创业者的 AI 应用交流活动。",
    category: "技术大会",
    audience: ["adult"],
    tags: ["AI", "产品", "创业"],
    district: "福田",
    venue: "深业上城共享会议厅",
    address: "深圳市福田区皇岗路",
    startAt: "2026-05-17T19:30:00+08:00",
    endAt: "2026-05-17T21:30:00+08:00",
    priceType: "收费",
    priceNote: "早鸟票 39 元",
    reservationRequired: true,
    difficulty: "进阶",
    recommendation: "主题聚焦真实产品落地，适合认识深圳 AI 应用圈子。",
    bestFor: "产品经理、开发者、创业者。",
    cautions: ["不适合儿童", "现场座位有限"],
    officialUrl: "https://example.com/events/ai-product-meetup",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a3",
    slug: "social-science-reading-salon",
    title: "城市与技术社科读书沙龙",
    summary: "围绕城市生活、技术变化和公共空间的读书讨论。",
    category: "读书沙龙",
    audience: ["adult"],
    tags: ["社科", "读书", "城市"],
    district: "南山",
    venue: "深圳书城南山城",
    address: "深圳市南山区中心路",
    startAt: "2026-05-18T15:00:00+08:00",
    endAt: "2026-05-18T17:00:00+08:00",
    priceType: "公益",
    priceNote: "公益活动，需报名",
    reservationRequired: true,
    difficulty: "入门",
    recommendation: "门槛不高，但主题能帮助成人从技术之外理解城市变化。",
    bestFor: "喜欢读书、城市议题和公共讨论的成人。",
    cautions: ["建议提前阅读推荐章节"],
    officialUrl: "https://example.com/events/social-science-reading-salon",
    sourceId: "shenzhen-book-city",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a4",
    slug: "shenzhen-game-expo-family",
    title: "深圳游戏体验展亲子上午场",
    summary: "面向家庭的游戏互动体验和游戏制作启蒙讲解。",
    category: "游戏展会",
    audience: ["family", "adult"],
    tags: ["游戏", "亲子同行", "创作启蒙"],
    district: "宝安",
    venue: "宝安国际会展中心",
    address: "深圳市宝安区福海街道展城路",
    startAt: "2026-05-19T10:00:00+08:00",
    endAt: "2026-05-19T12:00:00+08:00",
    priceType: "收费",
    priceNote: "家庭票 99 元起",
    reservationRequired: true,
    ageBand: "10 岁以上",
    difficulty: "入门",
    recommendation: "比单纯试玩更有学习价值，包含游戏制作流程讲解。",
    bestFor: "对游戏、动画和互动媒体感兴趣的家庭。",
    cautions: ["展馆较大，建议预留交通时间", "部分区域声音较大"],
    officialUrl: "https://example.com/events/shenzhen-game-expo-family",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a5",
    slug: "hardware-hackathon-weekend",
    title: "周末硬件 Hackathon",
    summary: "围绕智能硬件原型制作的两天协作挑战。",
    category: "Hackathon",
    audience: ["adult"],
    tags: ["硬件", "Hackathon", "创客"],
    district: "南山",
    venue: "深圳湾创业广场",
    address: "深圳市南山区高新南九道",
    startAt: "2026-05-16T09:30:00+08:00",
    endAt: "2026-05-17T18:00:00+08:00",
    priceType: "免费",
    priceNote: "免费，需团队报名",
    reservationRequired: true,
    difficulty: "专业",
    recommendation: "适合有开发或硬件基础的人高密度认识同好。",
    bestFor: "开发者、硬件工程师、创客团队。",
    cautions: ["强度较高", "不适合无基础体验"],
    officialUrl: "https://example.com/events/hardware-hackathon-weekend",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a6",
    slug: "electronics-maker-fair",
    title: "电子创客开放日",
    summary: "电子制作、传感器和开源硬件的展示与体验。",
    category: "电子展会",
    audience: ["family", "adult"],
    tags: ["电子", "创客", "开源硬件"],
    district: "福田",
    venue: "华强北创新中心",
    address: "深圳市福田区华强北路",
    startAt: "2026-05-18T10:30:00+08:00",
    endAt: "2026-05-18T16:30:00+08:00",
    priceType: "免费",
    priceNote: "免费入场，部分工作坊收费",
    reservationRequired: false,
    ageBand: "9 岁以上",
    difficulty: "入门",
    recommendation: "深圳本地特色很强，能把电子产业和动手体验连接起来。",
    bestFor: "想理解深圳电子产业和创客文化的家庭或成人。",
    cautions: ["工作坊名额有限", "低龄儿童需家长陪同"],
    officialUrl: "https://example.com/events/electronics-maker-fair",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: true,
    childSafetyComplete: true
  },
  {
    id: "a7",
    slug: "cancelled-ai-lecture",
    title: "已取消的 AI 公开课样例",
    summary: "用于验证取消状态不会进入精选。",
    category: "技术大会",
    audience: ["adult"],
    tags: ["AI"],
    district: "南山",
    venue: "测试场地",
    address: "深圳市南山区",
    startAt: "2026-05-15T19:00:00+08:00",
    endAt: "2026-05-15T21:00:00+08:00",
    priceType: "免费",
    priceNote: "免费",
    reservationRequired: true,
    difficulty: "入门",
    recommendation: "取消状态样例。",
    bestFor: "测试用。",
    cautions: ["活动已取消"],
    officialUrl: "https://example.com/events/cancelled-ai-lecture",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "cancelled",
    weeklyFeatured: false,
    childSafetyComplete: true
  },
  {
    id: "a8",
    slug: "child-safety-weak-sample",
    title: "儿童科技体验信息不足样例",
    summary: "用于验证儿童相关信息不足时不能进入亲子精选。",
    category: "亲子科技",
    audience: ["family"],
    tags: ["亲子"],
    district: "龙岗",
    venue: "测试场地",
    address: "深圳市龙岗区",
    startAt: "2026-05-19T14:00:00+08:00",
    endAt: "2026-05-19T15:30:00+08:00",
    priceType: "免费",
    priceNote: "免费",
    reservationRequired: false,
    difficulty: "入门",
    recommendation: "儿童信息不足样例。",
    bestFor: "测试用。",
    cautions: [],
    officialUrl: "https://example.com/events/child-safety-weak-sample",
    sourceId: "tech-community",
    lastConfirmedAt: "2026-05-08",
    status: "published",
    weeklyFeatured: false,
    childSafetyComplete: false
  }
];
```

- [ ] **Step 5: Add selectors and trust rules**

Create `src/domain/activitySelectors.ts`:

```ts
import type { Activity, Audience, TrustState } from "./types";

export function getPublishedActivities(activities: Activity[]) {
  return activities.filter((activity) => activity.status === "published");
}

export function getWeeklyFeatured(activities: Activity[]) {
  return getPublishedActivities(activities)
    .filter((activity) => activity.weeklyFeatured && getTrustState(activity).level !== "blocked")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function filterByAudience(activities: Activity[], audience: Audience) {
  return getPublishedActivities(activities)
    .filter((activity) => activity.audience.includes(audience))
    .filter((activity) => (audience === "family" ? activity.childSafetyComplete : true))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function getActivityBySlug(activities: Activity[], slug: string) {
  return activities.find((activity) => activity.slug === slug);
}

export function getTrustState(activity: Activity): TrustState {
  if (activity.status === "cancelled") {
    return {
      level: "blocked",
      label: "活动已取消",
      message: "这个活动不能进入本周精选，详情页需要提示用户不要前往。"
    };
  }

  if (activity.status === "expired") {
    return {
      level: "warning",
      label: "活动已过期",
      message: "这个活动可以保留在过期记录中，但不能出现在本周精选。"
    };
  }

  if (activity.status === "uncertain") {
    return {
      level: "warning",
      label: "信息待确认",
      message: "活动信息还没有确认，应避免重点推荐。"
    };
  }

  if (activity.audience.includes("family") && !activity.childSafetyComplete) {
    return {
      level: "blocked",
      label: "亲子信息不足",
      message: "儿童相关活动必须补齐适龄、陪同要求和注意事项后才能进入亲子精选。"
    };
  }

  return {
    level: "clear",
    label: "信息已确认",
    message: `来源信息最后确认于 ${activity.lastConfirmedAt}。`
  };
}
```

- [ ] **Step 6: Verify domain behavior**

Run:

```bash
npm run test:run -- tests/domain/activitySelectors.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain tests/domain
git commit -m "feat: add Shenzhen activity domain model"
```

---

### Task 3: Build Public Home, Audience Pages, And Activity Cards

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/Layout.tsx`
- Create: `src/components/AudienceEntry.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/ActivityCard.tsx`
- Create: `src/components/WeeklySection.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/AudiencePage.tsx`
- Test: `tests/pages/HomePage.test.tsx`

- [ ] **Step 1: Write page tests first**

Create `tests/pages/HomePage.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("HomePage", () => {
  it("shows the weekly Shenzhen positioning and two audience entries", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /带孩子去学习/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /大人去交流/ })).toBeInTheDocument();
  });

  it("shows curated activity cards with recommendation reasons", () => {
    renderRoute(<App />);

    expect(screen.getByText("南山 AI 互动体验日")).toBeInTheDocument();
    expect(screen.getByText(/有互动环节，不只是看展/)).toBeInTheDocument();
  });

  it("filters the family route to parent-child activities", () => {
    renderRoute(<App />, "/audience/family");

    expect(screen.getByRole("heading", { name: "带孩子去学习" })).toBeInTheDocument();
    expect(screen.getByText("南山 AI 互动体验日")).toBeInTheDocument();
    expect(screen.queryByText("AI 产品实践 Meetup")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- tests/pages/HomePage.test.tsx
```

Expected: FAIL because routes and page components do not exist yet.

- [ ] **Step 3: Add layout and routing**

Modify `src/App.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ActivityPage from "./pages/ActivityPage";
import AdminPage from "./pages/AdminPage";
import AudiencePage from "./pages/AudiencePage";
import CorrectionPage from "./pages/CorrectionPage";
import HomePage from "./pages/HomePage";
import SubmitActivityPage from "./pages/SubmitActivityPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/audience/:audience" element={<AudiencePage />} />
        <Route path="/activities/:slug" element={<ActivityPage />} />
        <Route path="/submit" element={<SubmitActivityPage />} />
        <Route path="/correct/:slug" element={<CorrectionPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
```

Create temporary page stubs for routes that later tasks will replace:

```tsx
// src/pages/ActivityPage.tsx
export default function ActivityPage() {
  return <p>活动详情页正在搭建。</p>;
}
```

```tsx
// src/pages/SubmitActivityPage.tsx
export default function SubmitActivityPage() {
  return <p>提交活动页正在搭建。</p>;
}
```

```tsx
// src/pages/CorrectionPage.tsx
export default function CorrectionPage() {
  return <p>纠错页正在搭建。</p>;
}
```

```tsx
// src/pages/AdminPage.tsx
export default function AdminPage() {
  return <p>维护页正在搭建。</p>;
}
```

```tsx
// src/pages/AboutPage.tsx
export default function AboutPage() {
  return <p>关于本站：深圳单城市学习精选。</p>;
}
```

- [ ] **Step 4: Add layout component**

Create `src/components/Layout.tsx`:

```tsx
import { CalendarDays, ClipboardPlus, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          深圳学习 Hub
        </Link>
        <nav aria-label="主导航">
          <Link to="/">本周精选</Link>
          <Link to="/audience/family">亲子</Link>
          <Link to="/audience/adult">成人</Link>
          <Link to="/submit">
            <ClipboardPlus size={18} aria-hidden="true" />
            提交活动
          </Link>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <Link to="/about">来源说明</Link>
        <span>
          <CalendarDays size={16} aria-hidden="true" />
          每周更新
        </span>
        <span>
          <MapPinned size={16} aria-hidden="true" />
          深圳单城市
        </span>
      </footer>
    </div>
  );
}
```

- [ ] **Step 5: Add reusable activity UI**

Create `src/components/StatusBadge.tsx`:

```tsx
import { getTrustState } from "../domain/activitySelectors";
import type { Activity } from "../domain/types";

type StatusBadgeProps = {
  activity: Activity;
};

export default function StatusBadge({ activity }: StatusBadgeProps) {
  const trust = getTrustState(activity);
  return <span className={`status-badge ${trust.level}`}>{trust.label}</span>;
}
```

Create `src/components/ActivityCard.tsx`:

```tsx
import { Clock, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import type { Activity } from "../domain/types";

type ActivityCardProps = {
  activity: Activity;
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const date = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(activity.startAt));

  return (
    <article className="activity-card">
      <div className="card-topline">
        <span>{activity.category}</span>
        <StatusBadge activity={activity} />
      </div>
      <h3>
        <Link to={`/activities/${activity.slug}`}>{activity.title}</Link>
      </h3>
      <p className="summary">{activity.summary}</p>
      <dl className="activity-facts">
        <div>
          <Clock size={16} aria-hidden="true" />
          <dt>时间</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <MapPin size={16} aria-hidden="true" />
          <dt>地点</dt>
          <dd>
            {activity.district} · {activity.venue}
          </dd>
        </div>
        <div>
          <Ticket size={16} aria-hidden="true" />
          <dt>费用</dt>
          <dd>{activity.priceNote}</dd>
        </div>
      </dl>
      <p className="recommendation">{activity.recommendation}</p>
      <div className="tag-row">
        {activity.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
```

Create `src/components/AudienceEntry.tsx`:

```tsx
import { ArrowRight, Baby, Users } from "lucide-react";
import { Link } from "react-router-dom";

type AudienceEntryProps = {
  type: "family" | "adult";
};

export default function AudienceEntry({ type }: AudienceEntryProps) {
  const isFamily = type === "family";
  return (
    <Link className="audience-entry" to={`/audience/${type}`}>
      {isFamily ? <Baby aria-hidden="true" /> : <Users aria-hidden="true" />}
      <span>
        <strong>{isFamily ? "带孩子去学习" : "大人去交流"}</strong>
        <small>
          {isFamily
            ? "适龄、体验价值、预约门槛和陪同要求"
            : "科技、读书、社科、创业和技术交流"}
        </small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
```

Create `src/components/WeeklySection.tsx`:

```tsx
import ActivityCard from "./ActivityCard";
import type { Activity } from "../domain/types";

type WeeklySectionProps = {
  title: string;
  subtitle: string;
  activities: Activity[];
};

export default function WeeklySection({ title, subtitle, activities }: WeeklySectionProps) {
  return (
    <section className="weekly-section" aria-labelledby="weekly-title">
      <div className="section-heading">
        <h2 id="weekly-title">{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="activity-grid">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add home and audience pages**

Create `src/pages/HomePage.tsx`:

```tsx
import AudienceEntry from "../components/AudienceEntry";
import WeeklySection from "../components/WeeklySection";
import { getWeeklyFeatured } from "../domain/activitySelectors";
import { sampleActivities } from "../domain/sampleData";

export default function HomePage() {
  const featured = getWeeklyFeatured(sampleActivities);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">深圳单城市 · 每周精选</p>
          <h1>深圳本周值得去</h1>
          <p>
            帮你从零碎活动信息里筛出真正值得带孩子去、或者大人自己去学习交流的活动。
          </p>
        </div>
        <div className="hero-panel" aria-label="本周判断标准">
          <strong>本周筛选标准</strong>
          <span>有可信来源</span>
          <span>有推荐理由</span>
          <span>有适合人群和注意事项</span>
        </div>
      </section>

      <section className="audience-grid" aria-label="选择入口">
        <AudienceEntry type="family" />
        <AudienceEntry type="adult" />
      </section>

      <WeeklySection
        title="本周精选"
        subtitle="不是活动越多越好，而是每个活动都能解释为什么值得去。"
        activities={featured}
      />
    </main>
  );
}
```

Create `src/pages/AudiencePage.tsx`:

```tsx
import { Navigate, useParams } from "react-router-dom";
import WeeklySection from "../components/WeeklySection";
import { filterByAudience } from "../domain/activitySelectors";
import { sampleActivities } from "../domain/sampleData";
import type { Audience } from "../domain/types";

function isAudience(value: string | undefined): value is Audience {
  return value === "family" || value === "adult";
}

export default function AudiencePage() {
  const { audience } = useParams();

  if (!isAudience(audience)) {
    return <Navigate to="/" replace />;
  }

  const activities = filterByAudience(sampleActivities, audience);
  const title = audience === "family" ? "带孩子去学习" : "大人去交流";
  const subtitle =
    audience === "family"
      ? "优先展示适龄、可亲子同行、注意事项清楚的活动。"
      : "优先展示科技、产业、读书、社科和技术交流活动。";

  return (
    <main className="page-stack">
      <section className="page-hero">
        <p className="eyebrow">深圳精选入口</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      <WeeklySection title={title} subtitle={subtitle} activities={activities} />
    </main>
  );
}
```

- [ ] **Step 7: Add responsive base styles**

Modify `src/styles.css` with a complete responsive layout:

```css
:root {
  color: #14201d;
  background: #f6f8f5;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

a {
  color: inherit;
  text-decoration: none;
}

.site-shell {
  min-height: 100vh;
  background: #f6f8f5;
}

.site-header,
.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 18px 24px;
}

.brand {
  font-weight: 800;
}

nav,
.site-footer {
  flex-wrap: wrap;
}

nav,
.site-footer,
.site-footer span {
  display: flex;
  align-items: center;
  gap: 14px;
}

main {
  max-width: 1180px;
  margin: 0 auto;
  padding: 16px 24px 56px;
}

.hero,
.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr);
  gap: 28px;
  align-items: stretch;
  padding: 54px 0 34px;
}

.hero h1,
.page-hero h1 {
  margin: 0;
  max-width: 760px;
  font-size: clamp(40px, 7vw, 86px);
  line-height: 0.98;
}

.hero p,
.page-hero p {
  max-width: 720px;
  color: #46534e;
  font-size: 18px;
  line-height: 1.7;
}

.eyebrow {
  margin: 0 0 14px;
  color: #006b5f;
  font-weight: 800;
}

.hero-panel,
.audience-entry,
.activity-card {
  border: 1px solid #d9e2dc;
  background: #ffffff;
  border-radius: 8px;
}

.hero-panel {
  display: grid;
  gap: 12px;
  align-content: center;
  padding: 24px;
}

.hero-panel span {
  color: #46534e;
}

.audience-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 8px 0 36px;
}

.audience-entry {
  display: grid;
  grid-template-columns: 40px 1fr 24px;
  gap: 16px;
  align-items: center;
  padding: 22px;
}

.audience-entry svg {
  color: #006b5f;
}

.audience-entry strong,
.audience-entry small {
  display: block;
}

.audience-entry small {
  margin-top: 6px;
  color: #5c6762;
  line-height: 1.5;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  font-size: 32px;
}

.section-heading p {
  max-width: 520px;
  color: #5c6762;
  line-height: 1.6;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.activity-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 18px;
}

.card-topline,
.tag-row,
.activity-facts div {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-topline {
  justify-content: space-between;
  color: #5c6762;
  font-size: 13px;
}

.activity-card h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
}

.summary,
.recommendation {
  margin: 0;
  color: #46534e;
  line-height: 1.6;
}

.activity-facts {
  display: grid;
  gap: 10px;
  margin: 0;
}

.activity-facts dt {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.activity-facts dd {
  margin: 0;
  color: #46534e;
}

.recommendation {
  padding: 12px;
  background: #eef5f1;
  border-radius: 8px;
}

.tag-row span,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  background: #edf0ed;
  color: #34423d;
  font-size: 13px;
}

.status-badge.clear {
  background: #e1f3ed;
  color: #006b5f;
}

.status-badge.warning {
  background: #fff3d8;
  color: #7c5200;
}

.status-badge.blocked {
  background: #ffe3df;
  color: #9a2c1f;
}

.page-stack {
  display: grid;
  gap: 26px;
}

@media (max-width: 860px) {
  .hero,
  .page-hero,
  .audience-grid,
  .activity-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }
}
```

- [ ] **Step 8: Verify public pages**

Run:

```bash
npm run test:run -- tests/pages/HomePage.test.tsx
npm run build
```

Expected: both commands PASS.

- [ ] **Step 9: Commit**

```bash
git add src tests/pages
git commit -m "feat: build weekly public discovery pages"
```

---

### Task 4: Build Activity Detail Judgment Pages

**Files:**

- Create: `src/components/ActivityDetail.tsx`
- Modify: `src/pages/ActivityPage.tsx`
- Test: `tests/pages/ActivityPage.test.tsx`

- [ ] **Step 1: Write activity detail tests first**

Create `tests/pages/ActivityPage.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("ActivityPage", () => {
  it("shows decision details before the official link", () => {
    renderRoute(<App />, "/activities/nanshan-ai-family-day");

    expect(screen.getByRole("heading", { name: "南山 AI 互动体验日" })).toBeInTheDocument();
    expect(screen.getByText(/适合第一次带孩子接触 AI/)).toBeInTheDocument();
    expect(screen.getByText(/低龄儿童需要家长全程陪同/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看官方报名页面" })).toBeInTheDocument();
  });

  it("shows a clear warning for cancelled activities", () => {
    renderRoute(<App />, "/activities/cancelled-ai-lecture");

    expect(screen.getByText("活动已取消")).toBeInTheDocument();
    expect(screen.getByText(/不能进入本周精选/)).toBeInTheDocument();
  });

  it("redirects unknown activities to the homepage", () => {
    renderRoute(<App />, "/activities/missing-activity");

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- tests/pages/ActivityPage.test.tsx
```

Expected: FAIL because detail components are not implemented.

- [ ] **Step 3: Add activity detail component**

Create `src/components/ActivityDetail.tsx`:

```tsx
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { getTrustState } from "../domain/activitySelectors";
import type { Activity } from "../domain/types";
import StatusBadge from "./StatusBadge";

type ActivityDetailProps = {
  activity: Activity;
};

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const trust = getTrustState(activity);
  const start = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(activity.startAt));

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{activity.category}</p>
          <h1>{activity.title}</h1>
          <p>{activity.summary}</p>
          <div className="tag-row">
            {activity.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <aside className={`trust-panel ${trust.level}`}>
          <StatusBadge activity={activity} />
          <p>{trust.message}</p>
        </aside>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <h2>是否值得去</h2>
          <p>{activity.recommendation}</p>
          <h3>适合谁</h3>
          <p>{activity.bestFor}</p>
        </article>

        <article className="detail-card">
          <h2>基本信息</h2>
          <dl className="detail-list">
            <div>
              <dt>时间</dt>
              <dd>{start}</dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>
                <MapPin size={16} aria-hidden="true" />
                {activity.district} · {activity.venue}
              </dd>
            </div>
            <div>
              <dt>费用</dt>
              <dd>{activity.priceNote}</dd>
            </div>
            <div>
              <dt>预约</dt>
              <dd>{activity.reservationRequired ? "需要提前预约" : "无需预约或现场确认"}</dd>
            </div>
            <div>
              <dt>难度</dt>
              <dd>{activity.difficulty}</dd>
            </div>
            {activity.ageBand ? (
              <div>
                <dt>年龄</dt>
                <dd>{activity.ageBand}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="detail-card">
          <h2>去之前要知道</h2>
          <ul>
            {activity.cautions.map((caution) => (
              <li key={caution}>
                <AlertTriangle size={16} aria-hidden="true" />
                {caution}
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-card">
          <h2>来源和更新</h2>
          <p>最后确认时间：{activity.lastConfirmedAt}</p>
          <p>请以官方页面的报名和临时变更为准。</p>
          <div className="detail-actions">
            <a href={activity.officialUrl} target="_blank" rel="noreferrer">
              查看官方报名页面
              <ExternalLink size={16} aria-hidden="true" />
            </a>
            <Link to={`/correct/${activity.slug}`}>纠错或补充信息</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Wire route page**

Modify `src/pages/ActivityPage.tsx`:

```tsx
import { Navigate, useParams } from "react-router-dom";
import ActivityDetail from "../components/ActivityDetail";
import { getActivityBySlug } from "../domain/activitySelectors";
import { sampleActivities } from "../domain/sampleData";

export default function ActivityPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(sampleActivities, slug) : undefined;

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  return <ActivityDetail activity={activity} />;
}
```

- [ ] **Step 5: Add detail styles**

Append to `src/styles.css`:

```css
.detail-page {
  display: grid;
  gap: 24px;
}

.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 340px);
  gap: 24px;
  padding: 44px 0 18px;
}

.detail-hero h1 {
  margin: 0;
  max-width: 780px;
  font-size: clamp(36px, 6vw, 72px);
  line-height: 1;
}

.detail-hero p {
  color: #46534e;
  line-height: 1.7;
}

.trust-panel,
.detail-card {
  border: 1px solid #d9e2dc;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
}

.trust-panel.warning {
  border-color: #e7c36d;
  background: #fff9e9;
}

.trust-panel.blocked {
  border-color: #ee9f91;
  background: #fff0ee;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-card h2,
.detail-card h3 {
  margin-top: 0;
}

.detail-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.detail-list div {
  display: grid;
  gap: 4px;
}

.detail-list dt {
  color: #5c6762;
  font-size: 13px;
}

.detail-list dd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.detail-card ul {
  display: grid;
  gap: 10px;
  padding-left: 0;
  list-style: none;
}

.detail-card li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.detail-actions a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 10px 12px;
  background: #14201d;
  color: #ffffff;
}

.detail-actions a + a {
  background: #edf0ed;
  color: #14201d;
}

@media (max-width: 860px) {
  .detail-hero,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Verify detail pages**

Run:

```bash
npm run test:run -- tests/pages/ActivityPage.test.tsx
npm run test:run -- tests/pages/HomePage.test.tsx
npm run build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src tests/pages
git commit -m "feat: add activity judgment pages"
```

---

### Task 5: Add Submissions, Corrections, And Lightweight Maintenance

**Files:**

- Create: `src/domain/localStore.ts`
- Modify: `src/pages/SubmitActivityPage.tsx`
- Modify: `src/pages/CorrectionPage.tsx`
- Modify: `src/pages/AdminPage.tsx`
- Test: `tests/domain/localStore.test.ts`
- Test: `tests/pages/SubmitAndAdmin.test.tsx`

- [ ] **Step 1: Write storage and workflow tests first**

Create `tests/domain/localStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createCorrection, createSubmission, getCorrections, getSubmissions, reviewSubmission } from "../../src/domain/localStore";

beforeEach(() => {
  localStorage.clear();
});

describe("localStore", () => {
  it("stores submitted activities as pending review", () => {
    createSubmission({
      title: "深圳科技公开课",
      organizer: "测试主办方",
      contact: "contact@example.com",
      officialUrl: "https://example.com/new-event",
      note: "适合成人"
    });

    expect(getSubmissions()[0]).toMatchObject({
      title: "深圳科技公开课",
      status: "pending"
    });
  });

  it("reviews a submission without publishing it directly", () => {
    const submission = createSubmission({
      title: "深圳科技公开课",
      organizer: "测试主办方",
      contact: "contact@example.com",
      officialUrl: "https://example.com/new-event",
      note: "适合成人"
    });

    reviewSubmission(submission.id, "accepted", "来源可信，进入活动暂存区");

    expect(getSubmissions()[0]).toMatchObject({
      status: "accepted",
      reviewNote: "来源可信，进入活动暂存区"
    });
  });

  it("stores corrections for later review", () => {
    createCorrection({
      activitySlug: "nanshan-ai-family-day",
      issueType: "时间地点变化",
      message: "官方页面显示时间改为 15:00",
      contact: "reader@example.com"
    });

    expect(getCorrections()[0]).toMatchObject({
      activitySlug: "nanshan-ai-family-day",
      status: "pending"
    });
  });
});
```

Create `tests/pages/SubmitAndAdmin.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

beforeEach(() => {
  localStorage.clear();
});

describe("submission and admin workflow", () => {
  it("lets organizers submit an activity for review", async () => {
    const user = userEvent.setup();
    renderRoute(<App />, "/submit");

    await user.type(screen.getByLabelText("活动名称"), "深圳电子展周末场");
    await user.type(screen.getByLabelText("主办方"), "测试主办方");
    await user.type(screen.getByLabelText("联系方式"), "contact@example.com");
    await user.type(screen.getByLabelText("官方链接"), "https://example.com/event");
    await user.type(screen.getByLabelText("补充说明"), "适合 10 岁以上亲子同行");
    await user.click(screen.getByRole("button", { name: "提交审核" }));

    expect(screen.getByText("已提交，等待审核")).toBeInTheDocument();
  });

  it("shows pending submissions in the maintenance page", async () => {
    const user = userEvent.setup();
    const view = renderRoute(<App />, "/submit");

    await user.type(screen.getByLabelText("活动名称"), "深圳电子展周末场");
    await user.type(screen.getByLabelText("主办方"), "测试主办方");
    await user.type(screen.getByLabelText("联系方式"), "contact@example.com");
    await user.type(screen.getByLabelText("官方链接"), "https://example.com/event");
    await user.type(screen.getByLabelText("补充说明"), "适合 10 岁以上亲子同行");
    await user.click(screen.getByRole("button", { name: "提交审核" }));

    view.unmount();
    renderRoute(<App />, "/admin");
    expect(screen.getByText("深圳电子展周末场")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:run -- tests/domain/localStore.test.ts tests/pages/SubmitAndAdmin.test.tsx
```

Expected: FAIL because store and pages are not implemented.

- [ ] **Step 3: Add local storage workflow**

Create `src/domain/localStore.ts`:

```ts
export type SubmissionStatus = "pending" | "accepted" | "rejected";
export type CorrectionStatus = "pending" | "resolved" | "dismissed";

export type ActivitySubmissionInput = {
  title: string;
  organizer: string;
  contact: string;
  officialUrl: string;
  note: string;
};

export type ActivitySubmission = ActivitySubmissionInput & {
  id: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewNote?: string;
};

export type ActivityCorrectionInput = {
  activitySlug: string;
  issueType: string;
  message: string;
  contact: string;
};

export type ActivityCorrection = ActivityCorrectionInput & {
  id: string;
  status: CorrectionStatus;
  createdAt: string;
};

const submissionKey = "shenzhen-learning-hub.submissions";
const correctionKey = "shenzhen-learning-hub.corrections";

function readList<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function writeList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSubmissions() {
  return readList<ActivitySubmission>(submissionKey);
}

export function createSubmission(input: ActivitySubmissionInput) {
  const submission: ActivitySubmission = {
    ...input,
    id: createId("submission"),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  writeList(submissionKey, [submission, ...getSubmissions()]);
  return submission;
}

export function reviewSubmission(id: string, status: Exclude<SubmissionStatus, "pending">, reviewNote: string) {
  const updated = getSubmissions().map((submission) =>
    submission.id === id ? { ...submission, status, reviewNote } : submission
  );
  writeList(submissionKey, updated);
}

export function getCorrections() {
  return readList<ActivityCorrection>(correctionKey);
}

export function createCorrection(input: ActivityCorrectionInput) {
  const correction: ActivityCorrection = {
    ...input,
    id: createId("correction"),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  writeList(correctionKey, [correction, ...getCorrections()]);
  return correction;
}
```

- [ ] **Step 4: Add submit page**

Modify `src/pages/SubmitActivityPage.tsx`:

```tsx
import { FormEvent, useState } from "react";
import { createSubmission } from "../domain/localStore";

export default function SubmitActivityPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createSubmission({
      title: String(form.get("title")),
      organizer: String(form.get("organizer")),
      contact: String(form.get("contact")),
      officialUrl: String(form.get("officialUrl")),
      note: String(form.get("note"))
    });
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <main className="form-page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">主办方提交</p>
          <h1>提交深圳活动</h1>
          <p>提交后会进入审核，不会直接公开。请提供可验证的官方链接。</p>
        </div>
      </section>

      {submitted ? <p className="success-message">已提交，等待审核</p> : null}

      <form className="hub-form" onSubmit={handleSubmit}>
        <label>
          活动名称
          <input name="title" required />
        </label>
        <label>
          主办方
          <input name="organizer" required />
        </label>
        <label>
          联系方式
          <input name="contact" required />
        </label>
        <label>
          官方链接
          <input name="officialUrl" required type="url" />
        </label>
        <label>
          补充说明
          <textarea name="note" required rows={5} />
        </label>
        <button type="submit">提交审核</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Add correction page**

Modify `src/pages/CorrectionPage.tsx`:

```tsx
import { FormEvent, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getActivityBySlug } from "../domain/activitySelectors";
import { createCorrection } from "../domain/localStore";
import { sampleActivities } from "../domain/sampleData";

export default function CorrectionPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(sampleActivities, slug) : undefined;
  const [submitted, setSubmitted] = useState(false);

  if (!activity || !slug) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createCorrection({
      activitySlug: slug,
      issueType: String(form.get("issueType")),
      message: String(form.get("message")),
      contact: String(form.get("contact"))
    });
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <main className="form-page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">纠错或补充</p>
          <h1>{activity.title}</h1>
          <p>请告诉我们哪里不准确，确认后会更新活动信息。</p>
        </div>
      </section>

      {submitted ? <p className="success-message">已收到，等待确认</p> : null}

      <form className="hub-form" onSubmit={handleSubmit}>
        <label>
          问题类型
          <select name="issueType" required>
            <option value="时间地点变化">时间地点变化</option>
            <option value="报名链接失效">报名链接失效</option>
            <option value="费用或预约信息变化">费用或预约信息变化</option>
            <option value="适龄或注意事项需要补充">适龄或注意事项需要补充</option>
          </select>
        </label>
        <label>
          补充说明
          <textarea name="message" required rows={5} />
        </label>
        <label>
          联系方式
          <input name="contact" required />
        </label>
        <button type="submit">提交纠错</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Add maintenance page**

Modify `src/pages/AdminPage.tsx`:

```tsx
import { useMemo, useState } from "react";
import { getCorrections, getSubmissions, reviewSubmission } from "../domain/localStore";

export default function AdminPage() {
  const [version, setVersion] = useState(0);
  const submissions = useMemo(() => getSubmissions(), [version]);
  const corrections = useMemo(() => getCorrections(), [version]);

  function acceptSubmission(id: string) {
    reviewSubmission(id, "accepted", "来源可信，进入活动暂存区");
    setVersion((current) => current + 1);
  }

  return (
    <main className="admin-page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">轻量维护</p>
          <h1>投稿和纠错处理</h1>
          <p>第一版只处理审核状态，不直接把投稿公开到精选列表。</p>
        </div>
      </section>

      <section className="admin-grid">
        <article className="detail-card">
          <h2>活动投稿</h2>
          {submissions.length === 0 ? <p>暂无投稿。</p> : null}
          {submissions.map((submission) => (
            <div className="admin-item" key={submission.id}>
              <strong>{submission.title}</strong>
              <span>{submission.status}</span>
              <p>{submission.note}</p>
              <button type="button" onClick={() => acceptSubmission(submission.id)}>
                标记进入暂存区
              </button>
            </div>
          ))}
        </article>

        <article className="detail-card">
          <h2>用户纠错</h2>
          {corrections.length === 0 ? <p>暂无纠错。</p> : null}
          {corrections.map((correction) => (
            <div className="admin-item" key={correction.id}>
              <strong>{correction.issueType}</strong>
              <span>{correction.status}</span>
              <p>{correction.message}</p>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Add form and admin styles**

Append to `src/styles.css`:

```css
.compact {
  padding-bottom: 10px;
}

.form-page,
.admin-page {
  max-width: 900px;
}

.hub-form {
  display: grid;
  gap: 16px;
  max-width: 720px;
  border: 1px solid #d9e2dc;
  border-radius: 8px;
  padding: 22px;
  background: #ffffff;
}

.hub-form label {
  display: grid;
  gap: 8px;
  color: #34423d;
  font-weight: 700;
}

.hub-form input,
.hub-form select,
.hub-form textarea {
  width: 100%;
  border: 1px solid #cbd6cf;
  border-radius: 8px;
  padding: 12px;
  color: #14201d;
  font: inherit;
}

.hub-form button,
.admin-item button {
  width: fit-content;
  border: 0;
  border-radius: 8px;
  padding: 12px 16px;
  background: #006b5f;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.success-message {
  max-width: 720px;
  border-radius: 8px;
  padding: 14px 16px;
  background: #e1f3ed;
  color: #006b5f;
  font-weight: 800;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.admin-item {
  display: grid;
  gap: 8px;
  border-top: 1px solid #edf0ed;
  padding: 14px 0;
}

.admin-item span {
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  background: #edf0ed;
  font-size: 13px;
}

@media (max-width: 860px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 8: Verify workflow**

Run:

```bash
npm run test:run -- tests/domain/localStore.test.ts tests/pages/SubmitAndAdmin.test.tsx
npm run test:run
npm run build
```

Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "feat: add submission and maintenance workflow"
```

---

### Task 6: Add Visual Asset, Source Explanation, And Empty-State Polish

**Files:**

- Create: `src/assets/shenzhen-learning-hub-hero.png`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/AboutPage.tsx`
- Modify: `src/styles.css`
- Test: `tests/pages/HomePage.test.tsx`

- [ ] **Step 1: Add a real visual asset**

Create `src/assets/shenzhen-learning-hub-hero.png` as a generated bitmap image.

Use this prompt if generating it:

```text
A modern editorial photo-illustration of Shenzhen as a learning city: families and adults moving through a bright technology exhibition space, subtle city skyline cues, warm daylight, real-world event hub feeling, not cartoonish, not dark, not blurred, no text.
```

Save the file as:

```text
src/assets/shenzhen-learning-hub-hero.png
```

- [ ] **Step 2: Update home page to use the image**

Modify `src/pages/HomePage.tsx` to import and render the asset:

```tsx
import AudienceEntry from "../components/AudienceEntry";
import WeeklySection from "../components/WeeklySection";
import { getWeeklyFeatured } from "../domain/activitySelectors";
import { sampleActivities } from "../domain/sampleData";
import heroImage from "../assets/shenzhen-learning-hub-hero.png";

export default function HomePage() {
  const featured = getWeeklyFeatured(sampleActivities);

  return (
    <main>
      <section className="hero visual-hero">
        <div className="hero-copy">
          <p className="eyebrow">深圳单城市 · 每周精选</p>
          <h1>深圳本周值得去</h1>
          <p>
            帮你从零碎活动信息里筛出真正值得带孩子去、或者大人自己去学习交流的活动。
          </p>
        </div>
        <img className="hero-image" src={heroImage} alt="深圳学习活动现场氛围" />
      </section>

      <section className="audience-grid" aria-label="选择入口">
        <AudienceEntry type="family" />
        <AudienceEntry type="adult" />
      </section>

      <WeeklySection
        title="本周精选"
        subtitle="不是活动越多越好，而是每个活动都能解释为什么值得去。"
        activities={featured}
      />
    </main>
  );
}
```

- [ ] **Step 3: Update home page test for visual asset**

Modify `tests/pages/HomePage.test.tsx` by adding:

```tsx
it("shows a Shenzhen learning visual", () => {
  renderRoute(<App />);

  expect(screen.getByRole("img", { name: "深圳学习活动现场氛围" })).toBeInTheDocument();
});
```

- [ ] **Step 4: Add source explanation page**

Modify `src/pages/AboutPage.tsx`:

```tsx
export default function AboutPage() {
  return (
    <main className="page-stack">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">来源和信任规则</p>
          <h1>我们怎样整理深圳活动</h1>
          <p>
            这个 Hub 先做深圳单城市精选。活动来自可信来源池、主办方提交和用户纠错，
            但投稿不会直接公开。
          </p>
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
```

- [ ] **Step 5: Add image styles**

Append to `src/styles.css`:

```css
.visual-hero {
  min-height: 520px;
}

.hero-image {
  width: 100%;
  min-height: 360px;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #d9e2dc;
}

@media (max-width: 860px) {
  .visual-hero {
    min-height: auto;
  }

  .hero-image {
    min-height: 260px;
  }
}
```

- [ ] **Step 6: Verify visual asset and source page**

Run:

```bash
npm run test:run -- tests/pages/HomePage.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src tests/pages
git commit -m "feat: add visual identity and source explanation"
```

---

### Task 7: Add End-To-End Browser Checks

**Files:**

- Create: `e2e/hub.spec.ts`

- [ ] **Step 1: Write end-to-end tests**

Create `e2e/hub.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home page guides users into family and adult discovery", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "深圳本周值得去" })).toBeVisible();
  await expect(page.getByRole("link", { name: /带孩子去学习/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /大人去交流/ })).toBeVisible();
  await expect(page.getByText("南山 AI 互动体验日")).toBeVisible();

  await page.getByRole("link", { name: /带孩子去学习/ }).click();
  await expect(page.getByRole("heading", { name: "带孩子去学习" })).toBeVisible();
  await expect(page.getByText("南山 AI 互动体验日")).toBeVisible();
});

test("activity detail page shows decision information and correction entry", async ({ page }) => {
  await page.goto("/activities/nanshan-ai-family-day");

  await expect(page.getByRole("heading", { name: "南山 AI 互动体验日" })).toBeVisible();
  await expect(page.getByText("是否值得去")).toBeVisible();
  await expect(page.getByText(/低龄儿童需要家长全程陪同/)).toBeVisible();
  await expect(page.getByRole("link", { name: "纠错或补充信息" })).toBeVisible();
});

test("submission appears in maintenance page", async ({ page }) => {
  await page.goto("/submit");

  await page.getByLabel("活动名称").fill("深圳电子展周末场");
  await page.getByLabel("主办方").fill("测试主办方");
  await page.getByLabel("联系方式").fill("contact@example.com");
  await page.getByLabel("官方链接").fill("https://example.com/event");
  await page.getByLabel("补充说明").fill("适合 10 岁以上亲子同行");
  await page.getByRole("button", { name: "提交审核" }).click();
  await expect(page.getByText("已提交，等待审核")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByText("深圳电子展周末场")).toBeVisible();
});
```

- [ ] **Step 2: Install browser binaries if needed**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium is available for Playwright.

- [ ] **Step 3: Run end-to-end tests**

Run:

```bash
npm run e2e
```

Expected: all desktop and mobile Playwright tests PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e playwright.config.ts
git commit -m "test: add end-to-end hub checks"
```

---

### Task 8: Final Verification And Delivery Check

**Files:**

- Modify only if verification finds a real issue.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run test:run
npm run build
npm run e2e
```

Expected: all PASS.

- [ ] **Step 2: Manually inspect the app in a browser**

Run:

```bash
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

Check:

- Home page shows Shenzhen weekly positioning.
- Hero visual renders.
- Parent-child and adult entry links work.
- Activity card opens a detail page.
- Detail page shows recommendation, suitable audience, caution notes, source timing, official link, and correction link.
- Submit page stores a new submission.
- Admin page shows the new submission.
- Mobile width keeps text readable and controls usable.

- [ ] **Step 3: Fix any issues found**

If a check fails, edit the affected file directly, rerun the failing command, then rerun the full check from Step 1.

- [ ] **Step 4: Confirm git state**

Run:

```bash
git status --short --branch
```

Expected: either clean working tree or only intentional final changes.

- [ ] **Step 5: Final commit if verification required fixes**

If Step 3 changed files:

```bash
git add src tests e2e
git commit -m "fix: polish verified hub experience"
```

---

## Spec Coverage Review

- Product positioning: Tasks 3, 4, 6.
- Parent-child and adult entry points: Tasks 2, 3, 7.
- Weekly curated list: Tasks 2, 3, 7.
- Activity judgment cards and detail pages: Tasks 3, 4, 7.
- Submission and correction flows: Task 5.
- Lightweight maintenance flow: Task 5.
- Trust handling for cancelled, expired, uncertain, and child-safety cases: Tasks 2, 4, 5.
- Mobile readability and browser verification: Tasks 6, 7, 8.
- Realistic Shenzhen sample content: Task 2.

## Execution Notes

- Keep commits at the end of each task.
- Do not add multi-city support while implementing this plan.
- Do not add accounts, payment, or automatic crawling while implementing this plan.
- Preserve the product promise: curated weekly Shenzhen learning and exchange activities, not a generic event search engine.
