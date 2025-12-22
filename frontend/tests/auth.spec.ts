import { expect, test } from "@playwright/test";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

test.describe("Autenticação", () => {
  test("fluxo feliz de registro mostra sucesso e persiste token", async ({ page }) => {
    await page.route(`${apiBase}/auth/register`, async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;

      expect(body.email).toContain("@");
      expect(typeof body.password).toBe("string");

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "token-123",
          token_type: "bearer",
          user: {
            id: "123",
            email: body.email,
            full_name: body.full_name ?? null,
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto("/register");
    await page.getByLabel("E-mail").fill("novo@spendario.dev");
    await page.getByLabel("Nome completo (opcional)").fill("Nova Pessoa");
    await page.getByLabel("Senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("status")).toContainText("Conta criada! Entrando...");
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("spendario.token"))).toBe("token-123");
  });

  test("login exibe erro 401 vindo da API", async ({ page }) => {
    await page.route(`${apiBase}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      }),
    );

    await page.goto("/login");
    await page.getByLabel("E-mail").fill("teste@spendario.dev");
    await page.getByLabel("Senha").fill("senha-errada");
    const submitButton = page.getByRole("button", { name: "Entrar" });
    await submitButton.click();

    await expect(page.getByRole("alert")).toContainText("Invalid credentials");
    await expect(submitButton).toBeEnabled();
  });

  test("registro exibe erro 400 amigável", async ({ page }) => {
    await page.route(`${apiBase}/auth/register`, (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Email already registered" }),
      }),
    );

    await page.goto("/register");
    await page.getByLabel("E-mail").fill("duplicado@spendario.dev");
    await page.getByLabel("Senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("alert")).toContainText("Email already registered");
  });
});
