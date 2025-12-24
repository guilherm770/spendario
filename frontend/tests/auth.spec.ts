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

  test("login feliz exibe sucesso e persiste token", async ({ page }) => {
    await page.route(`${apiBase}/auth/login`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "token-login",
          token_type: "bearer",
          user: {
            id: "abc",
            email: "usuario@spendario.dev",
            full_name: null,
            created_at: new Date().toISOString(),
          },
        }),
      }),
    );

    await page.goto("/login");
    await page.getByLabel("E-mail").fill("usuario@spendario.dev");
    await page.getByLabel("Senha").fill("senha-muito-segura");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("status")).toContainText("Login realizado! Redirecionando...");
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("spendario.token"))).toBe("token-login");
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

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("validação inline mostra mensagens sem submeter", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("E-mail").fill("email-invalido");
    await page.getByLabel("Senha").fill("123");
    await page.getByLabel("Nome completo (opcional)").fill("Ab");

    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeVisible();
    await expect(page.getByText("Use pelo menos 3 caracteres.")).toBeVisible();
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

    await expect(page.getByText("Email already registered")).toBeVisible();
  });
});
