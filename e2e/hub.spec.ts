import { expect, test } from "@playwright/test";

test("home page guides users into family and adult discovery", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "深圳本周值得去" })).toBeVisible();
  await expect(page.getByRole("img", { name: "深圳学习活动现场氛围" })).toBeVisible();
  await expect(page.getByRole("link", { name: /带孩子去学习/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /大人去交流/ })).toBeVisible();
  await expect(page.getByText("南山 AI 互动体验日")).toBeVisible();
  await expect(page.getByText(/系统推荐/).first()).toBeVisible();
  await expect(page.getByText(/判断信心/).first()).toBeVisible();

  await page.getByRole("link", { name: /带孩子去学习/ }).click();
  await expect(page.getByRole("heading", { name: "带孩子去学习" })).toBeVisible();
  await expect(page.getByText("南山 AI 互动体验日")).toBeVisible();
});

test("activity detail page shows decision information and correction entry", async ({ page }) => {
  await page.goto("/activities/nanshan-ai-family-day");

  await expect(page.getByRole("heading", { name: "南山 AI 互动体验日" })).toBeVisible();
  await expect(page.getByText("是否值得去")).toBeVisible();
  await expect(page.getByText("系统判断依据")).toBeVisible();
  await expect(page.getByText(/来源可信度/)).toBeVisible();
  await expect(page.getByText(/判断信心/).first()).toBeVisible();
  await expect(page.getByText(/低龄儿童需要家长全程陪同/)).toBeVisible();
  await expect(page.getByRole("link", { name: "纠错或补充信息" })).toBeVisible();
});

test("submission enters candidate queue and can be calibrated", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/submit");

  await page.getByLabel("活动名称").fill("深圳电子展周末场");
  await page.getByLabel("主要人群").selectOption("亲子和成人");
  await page.getByLabel("时间").fill("周六 10:00");
  await page.getByLabel("区域").fill("福田");
  await page.getByLabel("地点").fill("会展中心");
  await page.getByLabel("官方链接").fill("https://example.com/event");
  await page.getByLabel("联系方式").fill("contact@example.com");
  await page.getByLabel("推荐理由").fill("适合 10 岁以上亲子同行，也适合成人了解电子展趋势");
  await page.getByRole("button", { name: "提交到候选池" }).click();
  await expect(page.getByText("已进入候选池")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByText("深圳电子展周末场")).toBeVisible();
  await expect(page.getByText("候选草稿").first()).toBeVisible();
  await page.getByRole("button", { name: /降低信心/ }).first().click();
  await expect(page.getByText("已降低信心，等待更多证据")).toBeVisible();
});

test("mobile layout keeps system judgment readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "深圳本周值得去" })).toBeVisible();
  await expect(page.getByText(/为什么值得去/).first()).toBeVisible();
  await expect(page.getByText(/主要风险/).first()).toBeVisible();
});
