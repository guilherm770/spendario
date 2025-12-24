import { expect, test, type Page } from "@playwright/test";

const seedSession = async (page: Page, onboardingData?: Record<string, unknown>) => {
  await page.addInitScript((data) => {
    localStorage.setItem("spendario.token", "token-onboarding");
    localStorage.setItem("spendario.user", JSON.stringify({ id: "user-1", email: "onboard@spendario.dev" }));
    if (data) {
      localStorage.setItem("spendario.onboarding", JSON.stringify(data));
    } else {
      localStorage.removeItem("spendario.onboarding");
    }
  }, onboardingData);
};

const readStatus = async (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("spendario.onboarding");
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as { status?: string }).status ?? null;
    } catch {
      return null;
    }
  });

test("fluxo feliz conclui onboarding e redireciona", async ({ page }) => {
  await seedSession(page);

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Configuração inicial" })).toBeVisible();

  await page.getByLabel("País").selectOption("Portugal");
  await page.getByLabel("Moeda").selectOption("EUR - Euro");
  await page.getByRole("button", { name: "Avançar" }).click();

  await expect(page.getByRole("heading", { name: "Categorias favoritas" })).toBeVisible();
  await page.getByLabel("Lazer").check();
  await page.getByLabel("Outros").uncheck();

  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page.getByRole("status")).toContainText("Onboarding concluído");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  await expect.poll(async () => readStatus(page)).toBe("completed");
});

test("pode retomar progresso salvo e ficar na etapa 2", async ({ page }) => {
  await seedSession(page, {
    step: 2,
    country: "Estados Unidos",
    currency: "USD - Dólar americano",
    categories: ["Alimentação", "Lazer", "Assinaturas"],
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Categorias favoritas" })).toBeVisible();
  await expect(page.getByLabel("Assinaturas")).toBeChecked();
  await expect(page.getByText("Estados Unidos / USD - Dólar americano")).toBeVisible();
});

test("pular onboarding salva status e redireciona", async ({ page }) => {
  await seedSession(page);

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Pular" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  await expect.poll(async () => readStatus(page)).toBe("skipped");
});
