import { expect, test, type Page, type Route } from "@playwright/test";

const seedSession = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("spendario.token", "token-e2e");
    localStorage.setItem(
      "spendario.user",
      JSON.stringify({ id: "user-1", email: "nav@spendario.dev", full_name: "Usuário Teste" }),
    );
  });
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const mockCreateExpense = async (route: Route) => {
  const request = route.request();
  const payload = (await request.postDataJSON()) as Record<string, unknown> | null;
  if (!payload) return route.abort();

  expect(typeof payload.amount).toBe("string");
  expect(payload.currency).toBe("BRL");
  expect(payload.description).toBe("Mercado da semana");
  expect(payload.category_id).toBe(7);
  expect(String(payload.transaction_date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({
      id: "exp-123",
      user_id: "user-1",
      ...payload,
      created_at: new Date().toISOString(),
    }),
  });
};

const createSample = () => [
  {
    id: "exp-1",
    amount: "90.00",
    currency: "BRL",
    description: "Mercado antigo",
    transaction_date: "2024-01-01",
    category_id: 7,
  },
];

test.describe("Formulário rápido de despesa", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test("envia despesa pelo Enter com feedback rápido", async ({ page }) => {
    await page.route(`${API_BASE}/expenses*`, async (route) => {
      const method = route.request().method();
      if (route.request().resourceType() === "document") return route.continue();
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
      }
      if (route.request().method() === "POST") {
        return mockCreateExpense(route);
      }
      return route.continue();
    });
    await page.goto("/expenses");

    await page.getByTestId("expense-amount").fill("120.50");
    await page.getByTestId("expense-category").fill("Supermercado");
    await page.getByTestId("expense-description").fill("Mercado da semana");

    await page.getByTestId("expense-description").press("Enter");

    await expect(page.getByTestId("expense-feedback")).toContainText("Despesa salva");
    await expect(page.getByTestId("expense-amount")).toHaveValue("");
    await expect(page.getByTestId("expense-description")).toHaveValue("");
  });

  test("mostra validação inline quando campos estão vazios", async ({ page }) => {
    await page.route(`${API_BASE}/expenses*`, async (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
      }
      return route.continue();
    });

    await page.goto("/expenses");

    await page.getByTestId("expense-submit").click();

    await expect(page.getByText("Informe um valor maior que zero.")).toBeVisible();
    await expect(page.getByText("Adicione uma descrição curta.")).toBeVisible();
    await expect(page.getByText("Selecione uma categoria da lista.")).toBeVisible();
  });

  test("edita despesa inline e reflete na lista", async ({ page }) => {
    let expenses = createSample();
    await page.route(`${API_BASE}/expenses*`, async (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      const method = route.request().method();
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: expenses }),
        });
      }
      if (method === "PUT") {
        const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
        expect(payload.description).toBe("Mercado revisado");
        expenses = expenses.map((item) =>
          item.id === "exp-1" ? { ...item, ...payload, id: "exp-1" } : item,
        );
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...expenses.find((item) => item.id === "exp-1"),
            ...payload,
            id: "exp-1",
          }),
        });
      }
      return route.continue();
    });

    await page.goto("/expenses");
    await page.getByTestId("expense-edit-exp-1").click();

    await page.getByTestId("edit-amount").fill("150.00");
    await page.getByTestId("edit-category").fill("Supermercado");
    await page.getByTestId("edit-description").fill("Mercado revisado");

    const putPromise = page.waitForResponse(
      (resp) => resp.url().includes("/expenses/exp-1") && resp.request().method() === "PUT",
    );
    await page.getByTestId("edit-submit").click();
    await putPromise;

    await expect(page.getByTestId("expense-row-exp-1")).toContainText("Mercado revisado", { timeout: 10_000 });
    await expect(page.getByTestId("expense-row-exp-1")).toContainText("R$ 150,00", { timeout: 10_000 });
  });

  test("exclui despesa com confirmação", async ({ page }) => {
    let expenses = createSample();
    await page.route(`${API_BASE}/expenses*`, async (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      const method = route.request().method();
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: expenses }),
        });
      }
      if (method === "DELETE") {
        expect(route.request().url()).toContain("exp-1");
        expenses = expenses.filter((item) => item.id !== "exp-1");
        return route.fulfill({ status: 204, body: "" });
      }
      return route.continue();
    });

    await page.goto("/expenses");
    await page.getByTestId("expense-delete-exp-1").click();
    const deletePromise = page.waitForResponse(
      (resp) => resp.url().includes("/expenses/exp-1") && resp.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Confirmar" }).click();
    await deletePromise;

    await expect(page.getByTestId("expense-row-exp-1")).toHaveCount(0, { timeout: 10_000 });
  });
});
