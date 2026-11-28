import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountLines,
  assessDraft,
  cashDelta,
  chartOfAccounts,
  computeBooks,
  computeExtraStatements,
  computeStatement,
  rebuild,
  validExerciseDate,
  validateBackup,
  csv,
} from "../src/engine.js";

const entry = (kind, date, totalCents, more = {}, time = 1) => ({ id: `${kind}-${time}`, kind, date, totalCents, createdAt: time, ...more });
const legacyItems = [{ id: "item1", name: "Produto", quantity: 10, unitCost: 100 }];
const legacyAssets = [{ id: "asset1", name: "Equipamento", value: 8250, residual: 250 }];
const legacyEntries = [
  entry("compra", "2026-01-02", 200000, { itemId: "item1", quantity: 10 }, 1),
  entry("venda", "2026-01-03", 100000, { itemId: "item1", quantity: 4, costCents: 60000 }, 2),
  entry("venda_prazo", "2026-01-04", 60000, { itemId: "item1", quantity: 2, costCents: 30000, dueDate: "2026-02-01", partnerId: "client1" }, 3),
  entry("recebimento", "2026-01-05", 20000, { refId: "venda_prazo-3" }, 4),
  entry("aluguel", "2026-01-06", 10000, {}, 5),
  entry("emprestimo", "2026-01-07", 500000, {}, 6),
  entry("amortizacao", "2026-01-08", 100000, { loanId: "emprestimo-6" }, 7),
  entry("depreciacao", "2026-01-09", 25000, { assetId: "asset1" }, 8),
];

test("partidas dobradas e datas do exercício", () => {
  const cases = [
    ...legacyEntries,
    entry("compra_prazo", "2026-01-10", 10000, { itemId: "item1", quantity: 1 }),
    entry("pagamento", "2026-01-11", 5000, { refId: "compra_prazo-1" }),
    ...["salario", "energia", "outra_despesa", "juros"].map((kind) => entry(kind, "2026-01-12", 500)),
    entry("aluguel", "2026-01-13", 800, { settlement: "pagar" }),
    entry("dividendos", "2026-01-14", 700, { settlement: "pagar" }),
    entry("aquisicao", "2026-01-15", 900, { assetKind: "intangivel" }),
    entry("integralizacao", "2026-01-16", 400),
    entry("reserva", "2026-01-17", 300),
  ];
  for (const item of cases) {
    const lines = accountLines(item);
    assert.ok(lines.length > 0, item.kind);
    assert.equal(lines.reduce((sum, line) => sum + line.d - line.c, 0), 0, item.kind);
  }
  assert.equal(validExerciseDate("2026-02-29"), false);
  assert.equal(validExerciseDate("2026-12-31"), true);
  assert.equal(validExerciseDate("2027-01-01"), false);
  assert.equal(validExerciseDate("2025-12-31"), false);
});

test("cenário antigo de estoque, DRE, balanço e caixa continua fechando", () => {
  const stock = rebuild(legacyItems, legacyEntries);
  assert.equal(stock.balances.item1.qty, 14);
  assert.equal(stock.balances.item1.value, 210000);
  assert.equal(stock.netCash, 310000);
  assert.equal(stock.debts[0].remaining, 40000);
  assert.equal(stock.loans[0].remaining, 400000);
  assert.equal(stock.depreciation.asset1, 25000);
  const books = computeStatement({ items: legacyItems, assets: legacyAssets, entries: legacyEntries, cash: 30000, capital: 39250 });
  assert.equal(books.revenue, 160000);
  assert.equal(books.cmv, 90000);
  assert.equal(books.operating, 35000);
  assert.equal(books.result, 35000);
  assert.equal(books.assetsTotal, 4360000);
  assert.equal(books.liabilitiesTotal, 400000);
  assert.equal(books.equityTotal, 3960000);
  assert.equal(books.difference, 0);
  assert.deepEqual(books.issues, []);
  assert.equal(books.capitalCents, 3925000);
  const extra = computeExtraStatements({ items: legacyItems, assets: legacyAssets, entries: legacyEntries, cash: 30000, capital: 39250 });
  assert.equal(extra.trialDifference, 0);
  assert.equal(extra.cashChange, 310000);
  assert.equal(extra.closingCash, 3310000);
  assert.equal(extra.cashDifference, 0);
  assert.equal(extra.financingNet, 400000);
  assert.equal(books.indirect.operational.some((line) => line.name === "(+) Depreciação" && line.value === 25000), true);
  assert.equal(books.dva.difference, 0);
});

test("pagamento de empréstimo não é amortização de intangível", () => {
  const books = computeBooks({ items: legacyItems, assets: legacyAssets, entries: legacyEntries, cash: 30000 });
  assert.equal(books.amortization, 0);
  assert.equal(books.indirect.financing.find((line) => line.name === "Pagamento de empréstimos").value, -100000);
  assert.equal(books.indirect.operational.find((line) => line.name === "(+) Amortização").value, 0);
  assert.equal(books.liabilityCurrent.find((line) => line.name === "Empréstimos bancários").value, 400000);
});

test("folha de estruturas: nomes do balanço, da DRE, da DFC, da DMPL e da DVA", () => {
  const chart = chartOfAccounts().flatMap((group) => group.accounts);
  for (const name of [
    "Caixa e equivalentes de caixa", "Clientes", "Estoque de mercadorias", "Máquinas e equipamentos",
    "(-) Depreciação acumulada", "Softwares e licenças", "(-) Amortização acumulada", "Fornecedores",
    "Salários a pagar", "Aluguel a pagar", "Empréstimos bancários", "Juros a pagar", "Provisão para garantia",
    "Dividendos a pagar", "Financiamentos e empréstimos de longo prazo", "Capital social", "Reservas de lucros", "Lucros acumulados",
  ]) assert.ok(chart.includes(name), name);
  const books = computeBooks({ items: legacyItems, assets: legacyAssets, entries: legacyEntries, cash: 30000 });
  const dre = books.dreLines.map((line) => line.label);
  for (const label of ["Receita bruta de vendas", "(-) Devoluções de vendas", "Receita líquida", "(-) CMV", "Resultado bruto", "Aluguel", "Salários", "Depreciação", "Amortização", "Provisão para garantia", "Resultado operacional", "Despesas de financiamento", "Juros", "Lucro líquido"]) {
    assert.ok(dre.includes(label), label);
  }
  for (const label of ["Lucro líquido", "(+) Depreciação", "(+) Amortização", "(-) Aumento de clientes", "(-) Aumento de estoques", "(+) Aumento de fornecedores", "(+) Aumento de salários, aluguel e juros a pagar", "(+) Aumento da provisão para garantia"]) {
    assert.ok(books.indirect.operational.some((line) => line.name === label), label);
  }
  for (const label of ["Compra de equipamentos", "Compra de licença"]) assert.ok(books.indirect.investing.some((line) => line.name === label), label);
  for (const label of ["Aumento de capital", "Empréstimos obtidos", "Pagamento de empréstimos", "Dividendos pagos"]) assert.ok(books.indirect.financing.some((line) => line.name === label), label);
  assert.deepEqual(books.dmplRows.map((row) => row.name), ["Saldo inicial", "Aumento/redução de capital", "Lucro líquido do período", "Constituição de reservas", "Dividendos"]);
  assert.equal(books.dva.distribution.find((row) => row.name.startsWith("Governo")).value, 0);
});

test("depreciação, amortização, provisão e lucro do controle da página 2", () => {
  const items = [
    { id: "caderno", name: "Caderno 96 folhas", quantity: 100, unitCost: "12.00" },
    { id: "caneta", name: "Caneta esferográfica azul", quantity: 300, unitCost: "1.50" },
    { id: "resma", name: "Resma de papel", quantity: 80, unitCost: "20.00" },
  ];
  const assets = [
    { id: "loja", name: "Equipamentos da loja", kind: "imobilizado", origin: "saldo_inicial", value: "6000.00", usefulLife: "10", residual: "0" },
    { id: "prateleira", name: "Prateleira", kind: "imobilizado", origin: "aquisicao", value: "2400.00", usefulLife: "5", residual: "0" },
    { id: "licenca", name: "Licença", kind: "intangivel", origin: "aquisicao", value: "4000.00", usefulLife: "5", residual: "0" },
  ];
  const entries = [
    entry("aquisicao", "2026-01-10", 400000, { assetId: "licenca", assetKind: "intangivel" }, 1),
    entry("venda", "2026-01-15", 60 * 26110, { itemId: "caderno", quantity: 60 }, 2),
    entry("devolucao", "2026-01-20", 1, { refId: "venda-2", quantity: 10 }, 3),
    entry("aluguel", "2026-02-01", 200000, {}, 4),
    entry("aquisicao", "2026-03-01", 240000, { assetId: "prateleira", assetKind: "imobilizado" }, 5),
    entry("salario", "2026-04-01", 400000, {}, 6),
    entry("energia", "2026-05-01", 50000, {}, 7),
    entry("outra_despesa", "2026-06-01", 56100, {}, 8),
    entry("juros", "2026-07-01", 200000, {}, 9),
  ];
  const books = computeBooks({ items, assets, entries, cash: "30000", settings: { warrantyRatePercent: "2", inventoryMethod: "custo_medio", depreciationMethod: "linear" } });
  assert.equal(books.depreciation, 100000);
  assert.equal(books.amortization, 80000);
  assert.equal(books.provision, 26110);
  assert.equal(books.dre.netRevenue, 1305500);
  assert.equal(books.dre.cmv, 60000);
  assert.equal(books.result, 133290);
  assert.equal(books.difference, 0);
  assert.deepEqual(books.issues, []);
  assert.equal(books.capitalCents, 3925000);
  assert.equal(books.indirect.cashChange, books.cashFlow.closingCash - books.cashFlow.openingCash);
  assert.equal(books.dva.difference, 0);
  assert.equal(books.dmplFinal.total, books.equityTotal);
  const leaves = books.dreLines.filter((line) => line.kind === "item").reduce((sum, line) => sum + line.value, 0);
  assert.equal(leaves, books.result);
  const labels = books.dreLines.map((line) => line.label);
  const salarios = labels.indexOf("Salários");
  const energia = labels.indexOf("Água e energia");
  const outras = labels.indexOf("Outras despesas operacionais");
  const depreciacao = labels.indexOf("Depreciação");
  assert.ok(salarios < energia && energia < outras && outras < depreciacao);
  const doubled = computeBooks({ items, assets, entries, cash: "30000", settings: { warrantyRatePercent: "4", depreciationMethod: "linear" } });
  assert.equal(doubled.provision, 52220);
});

test("mês da compra conta inteiro e dezembro deprecia um mês", () => {
  const assets = [{ id: "bem", name: "Bem", kind: "imobilizado", origin: "aquisicao", value: "1200", usefulLife: "1", residual: "0" }];
  const entries = [entry("aquisicao", "2026-12-15", 120000, { assetId: "bem", assetKind: "imobilizado" })];
  const books = computeBooks({ assets, entries, cash: 200000, settings: { depreciationMethod: "linear", warrantyRatePercent: "0" } });
  assert.equal(books.depreciation, 10000);
});

test("devolução volta pelo custo da saída, não pelo custo médio da hora", () => {
  const items = [{ id: "item", name: "Item", quantity: 10, unitCost: 10 }];
  const entries = [
    entry("venda", "2026-02-01", 10000, { itemId: "item", quantity: 4 }, 1),
    entry("compra", "2026-03-01", 12000, { itemId: "item", quantity: 6 }, 2),
    entry("devolucao", "2026-04-01", 1, { refId: "venda-1", quantity: 4 }, 3),
  ];
  const stock = rebuild(items, entries);
  assert.equal(stock.balances.item.qty, 16);
  assert.equal(stock.balances.item.value, 22000);
});

test("venda acima do estoque, pagamento acima do título e caixa curto são recusados", () => {
  const ctx = { items: legacyItems, entries: [], cash: 50, settings: {} };
  const over = assessDraft(ctx, entry("venda", "2026-03-01", 100, { itemId: "item1", quantity: 11 }));
  assert.equal(over.ok, false);
  assert.match(over.message, /Estoque insuficiente/);
  const poor = assessDraft(ctx, entry("compra", "2026-03-01", 10000, { itemId: "item1", quantity: 1 }));
  assert.equal(poor.ok, false);
  assert.match(poor.message, /Caixa insuficiente/);
  const outside = assessDraft(ctx, entry("aluguel", "2026-02-29", 100));
  assert.equal(outside.ok, false);
  const credit = assessDraft({ ...ctx, cash: 1000, customers: [{ id: "c", name: "Cli" }] }, entry("venda_prazo", "2026-03-01", 5000, { itemId: "item1", quantity: 1, dueDate: "2026-04-01", partnerId: "c" }));
  assert.equal(credit.ok, true);
  const tooMuch = assessDraft({ ...ctx, cash: 1000, entries: [credit.entry] }, entry("recebimento", "2026-03-02", credit.entry.totalCents + 1, { refId: credit.entry.id }, 2));
  assert.equal(tooMuch.ok, false);
  assert.match(tooMuch.message, /saldo do título/);
  assert.equal(rebuild(legacyItems, legacyEntries).balances.item1.qty, rebuild(legacyItems, [...legacyEntries, entry("venda", "2026-03-01", 100, { itemId: "item1", quantity: 999 }, 9)]).balances.item1.qty);
});

test("capital segue o saldo inicial, sem usar 39.250 como constante", () => {
  const books = computeBooks({ cash: 10000 });
  assert.equal(books.capitalCents, 1000000);
  assert.equal(books.equityRows.find((row) => row.name === "Capital social").value, 1000000);
  assert.equal(books.difference, 0);
});

test("PEPS e custo médio produzem CMV diferente", () => {
  const items = [{ id: "item", quantity: 10, unitCost: 10 }];
  const entries = [entry("compra", "2026-01-02", 20000, { itemId: "item", quantity: 10 }), entry("venda", "2026-01-03", 30000, { itemId: "item", quantity: 10 }, 2)];
  assert.equal(rebuild(items, entries, { inventoryMethod: "custo_medio" }).entries[1].costCents, 15000);
  assert.equal(rebuild(items, entries, { inventoryMethod: "peps" }).entries[1].costCents, 10000);
});

test("empréstimo longo, encargos a pagar, reserva e dividendos fecham o balanço", () => {
  const entries = [
    entry("emprestimo", "2026-01-05", 500000, { term: "longo" }, 1),
    entry("salario", "2026-01-06", 80000, { settlement: "pagar" }, 2),
    entry("juros", "2026-01-07", 10000, { settlement: "pagar" }, 3),
    entry("dividendos", "2026-02-01", 20000, { settlement: "pagar" }, 4),
    entry("reserva", "2026-03-01", 5000, {}, 5),
  ];
  const books = computeBooks({ entries, cash: 100000, settings: { warrantyRatePercent: "0" } });
  assert.equal(books.liabilityNonCurrent[0].value, 500000);
  assert.equal(books.liabilityCurrent.find((row) => row.name === "Salários a pagar").value, 80000);
  assert.equal(books.liabilityCurrent.find((row) => row.name === "Juros a pagar").value, 10000);
  assert.equal(books.liabilityCurrent.find((row) => row.name === "Dividendos a pagar").value, 20000);
  assert.equal(books.equityRows.find((row) => row.name === "Reservas de lucros").value, 5000);
  assert.equal(books.difference, 0);
  assert.equal(books.indirect.financing.find((line) => line.name === "Dividendos pagos").value, 0);
  assert.equal(books.issues.length, 0);
  const paid = assessDraft({ entries, cash: 100000 }, entry("pagamento_encargo", "2026-02-02", 20000, { charge: "dividendos" }, 6));
  assert.equal(paid.ok, true);
  assert.equal(cashDelta(paid.entry), -20000);
});

test("backup antigo é aceito e data fora de 2026 é recusada", () => {
  const backup = { schema: 1, exercise: 2026, data: { items: legacyItems, assets: legacyAssets, suppliers: [], customers: [{ id: "client1", name: "Cliente" }], accounts: [] }, cash: "30000", entries: legacyEntries };
  assert.equal(validateBackup(backup).entries.length, 8);
  assert.throws(() => validateBackup({ ...backup, exercise: 2027 }));
  assert.throws(() => validateBackup({ ...backup, entries: [{ ...legacyEntries[0], date: "2027-01-01" }] }));
  assert.throws(() => validateBackup({ ...backup, data: { ...backup.data, items: [] } }));
  assert.match(csv([["=cmd|x"]]), /"'=cmd\|x"/);
});
