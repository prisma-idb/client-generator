import { prisma } from "$lib/prisma";
import { test, expect } from "../fixtures";
import type { Prisma } from "@prisma/client";

test("create_ValidData_SuccessfullyCreatesRecord", async ({ page }) => {
  const createQuery: Prisma.UserCreateArgs = { data: { id: 1, name: "John Doe" } };
  const result = await prisma.user.create(createQuery);

  await page.getByTestId("query-input").fill(`user.create(${JSON.stringify(createQuery)})`);
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByRole("status")).toContainText("Query executed successfully");

  const idbClientOutput = (await page.getByRole("code").textContent()) ?? "";
  expect(JSON.parse(idbClientOutput)).toEqual(result);
});

test("create_WithGeneratedId_AssignsDefaultId", async ({ page }) => {
  // TODO, also test out other fillDefaults
});
