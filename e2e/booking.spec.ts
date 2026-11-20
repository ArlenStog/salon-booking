import { expect, test, type Page } from "@playwright/test";

/** A date N days from today (salon calendar), skipping Sundays when the shop is closed. */
function openDay(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(d);
}

const uniqueEmail = () => `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

async function register(page: Page, name = "Test User") {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/book$/);
}

async function chooseServiceAndDay(page: Page, service: string, date: string) {
  // Accessible name is e.g. "Haircut 1200 RSD 30 min" — anchor on the price so
  // "Haircut" doesn't also match "Haircut + beard".
  const escaped = service.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await page.getByRole("button", { name: new RegExp(`^${escaped} \\d`) }).click();
  await page.getByLabel("Date").fill(date);
}

const timeButtons = (page: Page) => page.getByRole("group", { name: "Available times" }).getByRole("button");

test("guests are sent to login before booking", async ({ page }) => {
  await page.goto("/book");
  await expect(page).toHaveURL(/\/login\?next=%2Fbook/);
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  // Next.js renders its own (empty) route-announcer alert, so match by text.
  await expect(page.getByRole("alert").filter({ hasText: "Wrong email or password" })).toBeVisible();
});

test("book, see it in my appointments, then cancel", async ({ page }) => {
  await register(page);
  await chooseServiceAndDay(page, "Haircut", openDay(2));

  const first = timeButtons(page).first();
  const time = await first.textContent();
  await first.click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByTestId("confirmation")).toContainText(`Haircut`);
  await expect(page.getByTestId("confirmation")).toContainText(time!);

  await page.getByRole("link", { name: "My appointments" }).first().click();
  const row = page.getByTestId("appointment").filter({ hasText: "Haircut" });
  await expect(row).toContainText(time!);

  await row.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Nothing booked yet.")).toBeVisible();
  await expect(page.getByTestId("appointment").filter({ hasText: "Cancelled" })).toBeVisible();
});

test("a booked slot disappears for everyone else", async ({ browser }) => {
  const date = openDay(3);

  const alice = await (await browser.newContext()).newPage();
  await register(alice, "Alice");
  await chooseServiceAndDay(alice, "Beard trim", date);
  const taken = (await timeButtons(alice).first().textContent())!;
  await timeButtons(alice).first().click();
  await alice.getByRole("button", { name: "Confirm booking" }).click();
  await expect(alice.getByTestId("confirmation")).toBeVisible();

  const bob = await (await browser.newContext()).newPage();
  await register(bob, "Bob");
  await chooseServiceAndDay(bob, "Beard trim", date);
  await expect(timeButtons(bob).first()).toBeVisible();
  await expect(timeButtons(bob).filter({ hasText: taken })).toHaveCount(0);
});

test("the API refuses a double booking", async ({ page }) => {
  await register(page);
  const date = openDay(4);
  const { slots } = await (await page.request.get(`/api/slots?serviceId=1&date=${date}`)).json();
  const body = { serviceId: 1, startsAt: slots[0] };

  expect((await page.request.post("/api/appointments", { data: body })).status()).toBe(201);
  const second = await page.request.post("/api/appointments", { data: body });
  expect(second.status()).toBe(409);
  expect(await second.json()).toEqual({ error: "That time is no longer available" });
});

test("AI suggestion pre-fills service, day and time", async ({ page }) => {
  await register(page);
  const date = openDay(5);
  const { slots } = await (await page.request.get(`/api/slots?serviceId=3&date=${date}`)).json();

  // The model call is mocked: we test our UI's handling of the response, not Claude.
  await page.route("**/api/ai/parse", (route) =>
    route.fulfill({
      json: { serviceId: 3, date, slots: [slots[2]], reply: "Haircut + beard, here is a free time." },
    }),
  );

  await page.getByLabel("Describe what you want").fill("haircut and beard, afternoon");
  await page.getByRole("button", { name: "Find a time" }).click();

  await expect(page.getByTestId("ai-reply")).toHaveText("Haircut + beard, here is a free time.");
  await expect(page.getByRole("button", { name: /^Haircut \+ beard/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Date")).toHaveValue(date);
  await expect(timeButtons(page).and(page.locator("[aria-pressed=true]"))).toHaveCount(1);
});

test("admin sees bookings on the schedule", async ({ page, browser }) => {
  const date = openDay(6);
  const customer = await (await browser.newContext()).newPage();
  await register(customer, "Scheduled Customer");
  const { slots } = await (await customer.request.get(`/api/slots?serviceId=4&date=${date}`)).json();
  await customer.request.post("/api/appointments", { data: { serviceId: 4, startsAt: slots[0] } });

  await page.goto("/login?next=/admin");
  await page.getByLabel("Email").fill("admin@e2e.test");
  await page.getByLabel("Password").fill("e2e-admin-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  await page.getByLabel("Date").fill(date);
  await expect(page.getByText("Scheduled Customer")).toBeVisible();
});

test("non-admins can't open the admin page", async ({ page }) => {
  await register(page);
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});
