import { expect, test, type Page } from "@playwright/test";

const seedSession = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("spendario.token", "token-e2e");
    localStorage.setItem(
      "spendario.user",
      JSON.stringify({ id: "user-1", email: "nav@spendario.dev", full_name: "Usuário Teste" }),
    );
  });
};

test("redireciona para login se não houver token", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("Shell autenticado", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test("navega entre rotas protegidas e mantém estado", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();

    await page.getByRole("link", { name: "Despesas" }).click();
    await expect(page).toHaveURL(/\/expenses/);
    await expect(page.getByRole("heading", { name: "Lista e filtros" })).toBeVisible();

    await page.getByRole("link", { name: "Categorias" }).click();
    await expect(page).toHaveURL(/\/categories/);
    await expect(page.getByRole("heading", { name: "Organize suas despesas" })).toBeVisible();
  });

  test("logout limpa localStorage e volta para login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Sessão ativa")).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("spendario.token"))).toBe(null);
  });

  test("menu mobile abre e permite navegar", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("link", { name: "Despesas" }).click();
    await expect(page).toHaveURL(/\/expenses/);
  });
});
