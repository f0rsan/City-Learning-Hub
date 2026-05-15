import { expect, test } from "@playwright/test";

const familyActivityTitle = "南图双语故事会|Presents for Dad";
const familyActivitySlug = "南图双语故事会-presents-for-dad-88a32e99e4";
const encodedFamilyActivitySlug = encodeURIComponent(familyActivitySlug);
const hiddenMobileActivityTitle = "E-IOT 嵌入式与物联网展";

test("home page guides users into family and adult discovery", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "深圳本周值得去" })).toBeVisible();
  await expect(page.getByText("真实采集")).toBeVisible();
  await expect(page.getByRole("link", { name: /带孩子去学习/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /成人学习交流/ })).toBeVisible();
  await expect(page.getByTitle(/来源：/).first()).toBeVisible();
  await expect(page.getByRole("img", { name: "AI服务器先进制造技术创新系列论坛封面" })).toBeVisible();
  await expect(page.getByText(/强推荐|值得考虑|谨慎选择|不建议前往/).first()).toBeVisible();
  await expect(page.getByText(/高可靠|可参考|待核对/).first()).toBeVisible();

  await page.getByRole("link", { name: /带孩子去学习/ }).click();
  await expect(page.getByRole("heading", { name: "带孩子去学习" })).toBeVisible();
  await expect(page.getByText(familyActivityTitle)).toBeVisible();
});

test("shows a visible fallback when the app script is blocked", async ({ page }) => {
  await page.route(/\/src\/main\.tsx|\/assets\/index-.*\.js/, (route) => route.abort());

  await page.goto("/");

  await expect(page.getByText("正在打开深圳学习 Hub")).toBeVisible();
  await expect(page.getByText("网络较慢时可能需要几秒。若一直停留，请刷新，或用系统浏览器打开。")).toBeVisible();
});

test("activity detail page shows decision information and correction entry", async ({ page }, testInfo) => {
  await page.goto(`/activities/${familyActivitySlug}`);

  await expect(page.getByRole("heading", { name: familyActivityTitle })).toBeVisible();
  await expect(page.getByText("是否值得去")).toBeVisible();
  await expect(page.getByText("参考依据")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "查看核对信息" }).click();
  }
  await expect(page.getByText(/^来源$/)).toBeVisible();
  await expect(page.getByText(/高可靠|可参考|待核对/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "补充信息或更正" })).toBeVisible();
});

test("activity card body opens the detail page", async ({ page }) => {
  await page.goto("/audience/family");

  await page.getByText(familyActivityTitle).click();

  await expect(page).toHaveURL(new RegExp(`/activities/${encodedFamilyActivitySlug}$`));
  await expect(page.getByRole("heading", { name: familyActivityTitle })).toBeVisible();
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
  await page.getByLabel("活动链接").fill("https://www.szcec.com/szcec/cn-schedule/current/index.html");
  await page.getByLabel("联系方式").fill("contact@city-learning.local");
  await page.getByLabel("你为什么推荐它").fill("适合 10 岁以上亲子同行，也适合成人了解电子展趋势");
  await page.getByRole("button", { name: "推荐这个活动" }).click();
  await expect(page.getByText("已收到")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "后台登录" })).toBeVisible();
  await page.getByLabel("后台密码").fill("2026@admin");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page.getByText("深圳电子展周末场")).toBeVisible();
  await expect(page.getByText("待补充").first()).toBeVisible();
  await page.getByRole("button", { name: /降为待观察/ }).first().click();
  await expect(page.getByText("已降为待观察")).toBeVisible();
});

test("mobile layout keeps system judgment readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "深圳本周值得去" })).toBeVisible();
  await expect(page.getByText(/看点/).first()).toBeVisible();
  await expect(page.getByText(/注意/).first()).toBeVisible();
});

test("supports light and dark theme toggle", async ({ page }) => {
  await page.goto("/");

  const themeToggle = page.getByRole("button", { name: /切换深色模式|切换浅色模式/ });
  await expect(themeToggle).toBeVisible();

  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  await themeToggle.click();
  const after = await html.getAttribute("data-theme");

  expect(before).not.toBe(after);
});

test("mobile home uses progressive disclosure for weekly list", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: /展开其余 \d+ 条活动/ })).toBeVisible();
  await expect(page.getByText(hiddenMobileActivityTitle)).toHaveCount(0);
});

test("mobile detail collapses reasons and evidence by default", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/activities/${familyActivitySlug}`);

  const reasonsToggle = page.locator(".detail-fold-toggle").first();
  const evidenceToggle = page.locator(".detail-fold-toggle").nth(1);

  await expect(reasonsToggle).toBeVisible();
  await expect(evidenceToggle).toBeVisible();
  await expect(reasonsToggle).toHaveAttribute("aria-expanded", "false");
  await expect(evidenceToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "适合谁" })).toHaveCount(0);
  await expect(page.getByText(/^来源$/)).toHaveCount(0);

  await reasonsToggle.click();
  await expect(page.getByRole("heading", { name: "适合谁" })).toBeVisible();
  await expect(reasonsToggle).toHaveAttribute("aria-expanded", "true");

  await evidenceToggle.click();
  await expect(page.getByText(/^来源$/)).toBeVisible();
  await expect(evidenceToggle).toHaveAttribute("aria-expanded", "true");
});
