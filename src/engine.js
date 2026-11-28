// "amortizacao" e "pagamento_emprestimo" quitam o principal do empréstimo.
// A amortização de licença só existe na apuração "amortizacao_bem", em 31/12.

export const ROLES = {
  caixa: "Caixa e equivalentes de caixa",
  clientes: "Clientes",
  estoque: "Estoque de mercadorias",
  imobilizado: "Máquinas e equipamentos",
  depreciacao_acum: "Depreciação acumulada",
  intangivel: "Softwares e licenças",
  amortizacao_acum: "Amortização acumulada",
  fornecedores: "Fornecedores",
  salarios_pagar: "Salários a pagar",
  aluguel_pagar: "Aluguel a pagar",
  emprestimos_cp: "Empréstimos bancários",
  juros_pagar: "Juros a pagar",
  provisao_garantia: "Provisão para garantia",
  dividendos_pagar: "Dividendos a pagar",
  emprestimos_lp: "Financiamentos e empréstimos de longo prazo",
  capital: "Capital social",
  reservas: "Reservas de lucros",
  dividendos: "Dividendos",
  destinacao_reservas: "Constituição de reservas",
  receita: "Receita bruta de vendas",
  devolucoes: "Devoluções de vendas",
  cmv: "Custo das mercadorias vendidas",
  despesa_aluguel: "Aluguel",
  despesa_salarios: "Salários",
  despesa_energia: "Água e energia",
  despesa_outras: "Outras despesas operacionais",
  despesa_depreciacao: "Depreciação",
  despesa_amortizacao: "Amortização",
  despesa_provisao: "Provisão para garantia",
  despesa_juros: "Juros",
};

export const DEFAULT_LABELS = ROLES;

const OPERATING_ROLES = [
  "despesa_aluguel",
  "despesa_salarios",
  "despesa_energia",
  "despesa_outras",
  "despesa_depreciacao",
  "despesa_amortizacao",
  "despesa_provisao",
];

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const KIND_LABELS = {
  compra: "Compra à vista",
  venda: "Venda à vista",
  compra_prazo: "Compra a prazo",
  venda_prazo: "Venda a prazo",
  pagamento: "Pagamento a fornecedor",
  recebimento: "Recebimento de cliente",
  devolucao: "Devolução de venda",
  aluguel: "Aluguel",
  salario: "Salários",
  energia: "Água e energia",
  outra_despesa: "Outra despesa operacional",
  emprestimo: "Empréstimo obtido",
  amortizacao: "Pagamento de empréstimo",
  pagamento_emprestimo: "Pagamento de empréstimo",
  juros: "Juros",
  dividendos: "Dividendos",
  aquisicao: "Aquisição de bem",
  depreciacao: "Depreciação",
  amortizacao_bem: "Amortização de intangível",
  provisao: "Provisão para garantia",
  pagamento_encargo: "Pagamento de conta",
  integralizacao: "Aumento de capital",
  reducao_capital: "Redução de capital",
  reserva: "Constituição de reserva",
};

export const POSTING_RULES = [
  ["Compra à vista", "Estoque de mercadorias", "Caixa e equivalentes de caixa"],
  ["Compra a prazo", "Estoque de mercadorias", "Fornecedores"],
  ["Venda à vista", "Caixa e CMV", "Receita bruta de vendas e Estoque"],
  ["Venda a prazo", "Clientes e CMV", "Receita bruta de vendas e Estoque"],
  ["Devolução de venda", "Devoluções e Estoque, pelo custo da saída", "Caixa ou Clientes, e CMV"],
  ["Pagamento a fornecedor", "Fornecedores", "Caixa e equivalentes de caixa"],
  ["Recebimento de cliente", "Caixa e equivalentes de caixa", "Clientes"],
  ["Aluguel à vista", "Aluguel", "Caixa e equivalentes de caixa"],
  ["Aluguel a pagar", "Aluguel", "Aluguel a pagar"],
  ["Salários à vista", "Salários", "Caixa e equivalentes de caixa"],
  ["Salários a pagar", "Salários", "Salários a pagar"],
  ["Juros pagos", "Juros", "Caixa e equivalentes de caixa"],
  ["Juros a pagar", "Juros", "Juros a pagar"],
  ["Pagamento de empréstimo", "Empréstimos bancários ou Financiamentos", "Caixa e equivalentes de caixa"],
  ["Empréstimo de curto prazo", "Caixa e equivalentes de caixa", "Empréstimos bancários"],
  ["Empréstimo de longo prazo", "Caixa e equivalentes de caixa", "Financiamentos e empréstimos de longo prazo"],
  ["Dividendos pagos", "Dividendos", "Caixa e equivalentes de caixa"],
  ["Dividendos a pagar", "Dividendos", "Dividendos a pagar"],
  ["Compra de equipamentos", "Máquinas e equipamentos", "Caixa e equivalentes de caixa"],
  ["Compra de licença", "Softwares e licenças", "Caixa e equivalentes de caixa"],
  ["Aumento de capital", "Caixa e equivalentes de caixa", "Capital social"],
  ["Constituição de reservas", "Lucros acumulados", "Reservas de lucros"],
  ["Depreciação em 31/12", "Depreciação", "Depreciação acumulada"],
  ["Amortização de licença em 31/12", "Amortização", "Amortização acumulada"],
  ["Provisão para garantia em 31/12", "Provisão para garantia", "Provisão para garantia"],
];

export function chartOfAccounts() {
  return [
    { group: "Ativo circulante", accounts: [ROLES.caixa, ROLES.clientes, ROLES.estoque] },
    { group: "Ativo não circulante — Imobilizado", accounts: [ROLES.imobilizado, `(-) ${ROLES.depreciacao_acum}`] },
    { group: "Ativo não circulante — Intangível", accounts: [ROLES.intangivel, `(-) ${ROLES.amortizacao_acum}`] },
    { group: "Passivo circulante", accounts: [ROLES.fornecedores, ROLES.salarios_pagar, ROLES.aluguel_pagar, ROLES.emprestimos_cp, ROLES.juros_pagar, ROLES.provisao_garantia, ROLES.dividendos_pagar] },
    { group: "Passivo não circulante", accounts: [ROLES.emprestimos_lp] },
    { group: "Patrimônio líquido", accounts: [ROLES.capital, ROLES.reservas, "Lucros acumulados"] },
  ];
}

export function defaultSettings() {
  return {
    companyName: "Papelaria",
    activity: "Compra mercadorias e vende no balcão e a prazo.",
    inventoryMethod: "custo_medio",
    depreciationMethod: "linear",
    exhaustion: "nao_se_aplica",
    warrantyRatePercent: "2",
    warrantyMonths: "12",
  };
}

export function toCents(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return NaN;
    return Math.round(value * 100);
  }
  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw) return 0;
  const neg = raw.startsWith("-");
  const body = neg ? raw.slice(1) : raw;
  const norm = body.includes(",") ? body.replace(/\./g, "").replace(",", ".") : body;
  if (!/^\d+(\.\d+)?$/.test(norm)) return NaN;
  const [ints, frac = ""] = norm.split(".");
  let cents = Number(ints) * 100 + Number((frac + "00").slice(0, 2));
  if (frac[2] >= "5") cents += 1;
  return Number.isSafeInteger(cents) ? (neg ? -cents : cents) : NaN;
}

export function formatBRL(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(cents) {
  const value = Number(cents || 0) / 100;
  const abs = Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `(${abs})` : abs;
}

export function formatDate(iso) {
  if (!iso || String(iso).length < 10) return "—";
  return String(iso).slice(0, 10).split("-").reverse().join("/");
}

export function percent(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function validExerciseDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return false;
  const [year, month, day] = date.split("-").map(Number);
  if (year !== 2026) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function asNumber(value) {
  if (typeof value === "number") return value;
  if (value == null || value === "") return 0;
  const n = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function asQty(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

function labelOf(role) {
  return ROLES[role] || role;
}

function loanRole(entry) {
  return entry.term === "longo" ? "emprestimos_lp" : "emprestimos_cp";
}

function chargeRole(charge) {
  return { salarios: "salarios_pagar", aluguel: "aluguel_pagar", juros: "juros_pagar", dividendos: "dividendos_pagar" }[charge] || "";
}

export function accountLines(entry) {
  const line = (role, d, c) => ({ role, name: labelOf(role), d: d || 0, c: c || 0 });
  const amount = entry.totalCents || 0;
  const cost = entry.costCents || 0;
  const payable = entry.settlement === "pagar";
  let rows = [];
  switch (entry.kind) {
    case "compra":
      rows = [line("estoque", amount, 0), line("caixa", 0, amount)];
      break;
    case "compra_prazo":
      rows = [line("estoque", amount, 0), line("fornecedores", 0, amount)];
      break;
    case "venda":
      rows = [line("caixa", amount, 0), line("receita", 0, amount), line("cmv", cost, 0), line("estoque", 0, cost)];
      break;
    case "venda_prazo":
      rows = [line("clientes", amount, 0), line("receita", 0, amount), line("cmv", cost, 0), line("estoque", 0, cost)];
      break;
    case "pagamento":
      rows = [line("fornecedores", amount, 0), line("caixa", 0, amount)];
      break;
    case "recebimento":
      rows = [line("caixa", amount, 0), line("clientes", 0, amount)];
      break;
    case "devolucao":
      rows = [line("devolucoes", amount, 0), line("caixa", 0, entry.cashCents || 0), line("clientes", 0, entry.creditCents || 0), line("estoque", cost, 0), line("cmv", 0, cost)];
      break;
    case "aluguel":
      rows = [line("despesa_aluguel", amount, 0), line(payable ? "aluguel_pagar" : "caixa", 0, amount)];
      break;
    case "salario":
      rows = [line("despesa_salarios", amount, 0), line(payable ? "salarios_pagar" : "caixa", 0, amount)];
      break;
    case "energia":
      rows = [line("despesa_energia", amount, 0), line("caixa", 0, amount)];
      break;
    case "outra_despesa":
      rows = [line("despesa_outras", amount, 0), line("caixa", 0, amount)];
      break;
    case "emprestimo":
      rows = [line("caixa", amount, 0), line(loanRole(entry), 0, amount)];
      break;
    case "amortizacao":
    case "pagamento_emprestimo":
      rows = [line(loanRole(entry), amount, 0), line("caixa", 0, amount)];
      break;
    case "juros":
      rows = [line("despesa_juros", amount, 0), line(payable ? "juros_pagar" : "caixa", 0, amount)];
      break;
    case "dividendos":
      rows = [line("dividendos", amount, 0), line(payable ? "dividendos_pagar" : "caixa", 0, amount)];
      break;
    case "pagamento_encargo":
      rows = [line(chargeRole(entry.charge), amount, 0), line("caixa", 0, amount)];
      break;
    case "aquisicao":
      rows = [line(entry.assetKind === "intangivel" ? "intangivel" : "imobilizado", amount, 0), line("caixa", 0, amount)];
      break;
    case "integralizacao":
      rows = [line("caixa", amount, 0), line("capital", 0, amount)];
      break;
    case "reducao_capital":
      rows = [line("capital", amount, 0), line("caixa", 0, amount)];
      break;
    case "reserva":
      rows = [line("destinacao_reservas", amount, 0), line("reservas", 0, amount)];
      break;
    case "depreciacao":
      rows = [line("despesa_depreciacao", amount, 0), line("depreciacao_acum", 0, amount)];
      break;
    case "amortizacao_bem":
      rows = [line("despesa_amortizacao", amount, 0), line("amortizacao_acum", 0, amount)];
      break;
    case "provisao":
      rows = [line("despesa_provisao", amount, 0), line("provisao_garantia", 0, amount)];
      break;
    default:
      rows = [];
  }
  return rows.filter((row) => row.d || row.c);
}

export function cashDelta(entry) {
  return accountLines(entry).reduce((sum, line) => sum + (line.role === "caixa" ? line.d - line.c : 0), 0);
}

function consume(item, quantity, method) {
  if (method === "peps") {
    let left = quantity;
    let cost = 0;
    while (left > 0 && item.lots.length) {
      const lot = item.lots[0];
      const take = Math.min(left, lot.qty);
      const lotCost = take === lot.qty ? lot.value : Math.round((take * lot.value) / lot.qty);
      cost += lotCost;
      lot.qty -= take;
      lot.value -= lotCost;
      left -= take;
      if (lot.qty === 0) item.lots.shift();
    }
    item.qty -= quantity;
    item.value -= cost;
    return cost;
  }
  const cost = quantity === item.qty ? item.value : Math.round((quantity * item.value) / item.qty);
  item.qty -= quantity;
  item.value -= cost;
  return cost;
}

function receive(item, quantity, value, method) {
  item.qty += quantity;
  item.value += value;
  if (method === "peps") item.lots.push({ qty: quantity, value });
}

function reject(raw, message) {
  return { ...raw, error: message };
}

export function rebuild(items, entries, options = {}) {
  const method = options.inventoryMethod || "custo_medio";
  const stock = new Map();
  for (const item of items || []) {
    const qty = asQty(item.quantity || 0);
    const safeQty = Number.isInteger(qty) && qty > 0 ? qty : 0;
    const value = Math.round(safeQty * (toCents(item.unitCost) || 0));
    stock.set(item.id, { qty: safeQty, value: Number.isFinite(value) ? value : 0, lots: safeQty > 0 ? [{ qty: safeQty, value }] : [] });
  }
  const debts = [];
  const debtMap = new Map();
  const loans = [];
  const loanMap = new Map();
  const sales = new Map();
  const acquired = new Set();
  const depreciation = {};
  const owing = { salarios: 0, aluguel: 0, juros: 0, dividendos: 0 };
  const enriched = [];
  let netCash = 0;
  const ordered = [...(entries || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));

  for (const raw of ordered) {
    if (!raw || typeof raw !== "object") continue;
    const amount = raw.totalCents || 0;
    const badAmount = !Number.isSafeInteger(amount) || amount <= 0;
    if (["compra", "compra_prazo", "venda", "venda_prazo"].includes(raw.kind)) {
      const item = stock.get(raw.itemId);
      const qty = asQty(raw.quantity);
      if (!item) { enriched.push(reject(raw, "Mercadoria não cadastrada. Nada foi alterado.")); continue; }
      if (!Number.isInteger(qty) || qty <= 0 || badAmount) { enriched.push(reject(raw, "Quantidade inteira e valor positivo são obrigatórios. Nada foi alterado.")); continue; }
      if (String(raw.kind).endsWith("prazo") && (!validExerciseDate(raw.dueDate) || raw.dueDate < raw.date)) { enriched.push(reject(raw, "Vencimento inválido. Use uma data de 2026, igual ou posterior à operação.")); continue; }
      const beforeQty = item.qty;
      const beforeValue = item.value;
      if (raw.kind === "compra" || raw.kind === "compra_prazo") {
        receive(item, qty, amount, method);
        if (raw.kind === "compra") netCash -= amount;
        const entry = { ...raw, quantity: qty, beforeQty, beforeValue, afterQty: item.qty, afterValue: item.value, movement: true };
        if (raw.kind === "compra_prazo") { entry.remaining = amount; debts.push(entry); debtMap.set(entry.id, entry); }
        enriched.push(entry);
        continue;
      }
      if (qty > item.qty) { enriched.push(reject(raw, "Estoque insuficiente para esta venda. Nada foi alterado.")); continue; }
      const costCents = consume(item, qty, method);
      if (raw.kind === "venda") netCash += amount;
      const entry = { ...raw, quantity: qty, costCents, returnedQty: 0, returnedRevenue: 0, returnedCost: 0, beforeQty, beforeValue, afterQty: item.qty, afterValue: item.value, movement: true };
      if (raw.kind === "venda_prazo") { entry.remaining = amount; debts.push(entry); debtMap.set(entry.id, entry); }
      sales.set(entry.id, entry);
      enriched.push(entry);
      continue;
    }
    if (raw.kind === "devolucao") {
      const sale = sales.get(raw.refId);
      const qty = asQty(raw.quantity);
      if (!sale) { enriched.push(reject(raw, "Devolução sem venda correspondente. Nada foi alterado.")); continue; }
      if (raw.date < sale.date) { enriched.push(reject(raw, "A devolução não pode ser anterior à venda.")); continue; }
      const remainingQty = sale.quantity - (sale.returnedQty || 0);
      if (!Number.isInteger(qty) || qty <= 0 || qty > remainingQty) { enriched.push(reject(raw, "Quantidade devolvida maior que a vendida. Nada foi alterado.")); continue; }
      const stockItem = stock.get(sale.itemId);
      if (!stockItem) { enriched.push(reject(raw, "Mercadoria da venda não está mais cadastrada.")); continue; }
      const revenue = qty === remainingQty ? sale.totalCents - sale.returnedRevenue : Math.round((qty * sale.totalCents) / sale.quantity);
      const cost = qty === remainingQty ? sale.costCents - sale.returnedCost : Math.round((qty * sale.costCents) / sale.quantity);
      sale.returnedQty += qty;
      sale.returnedRevenue += revenue;
      sale.returnedCost += cost;
      let creditCents = 0;
      let cashCents = revenue;
      if (sale.kind === "venda_prazo") {
        const debt = debtMap.get(sale.id);
        creditCents = Math.min(debt ? debt.remaining : 0, revenue);
        cashCents = revenue - creditCents;
        if (debt) debt.remaining -= creditCents;
      }
      const beforeQty = stockItem.qty;
      const beforeValue = stockItem.value;
      receive(stockItem, qty, cost, method);
      netCash -= cashCents;
      enriched.push({ ...raw, itemId: sale.itemId, itemName: sale.itemName, partnerId: sale.partnerId, partnerName: sale.partnerName, quantity: qty, totalCents: revenue, costCents: cost, cashCents, creditCents, beforeQty, beforeValue, afterQty: stockItem.qty, afterValue: stockItem.value, movement: true });
      continue;
    }
    if (raw.kind === "pagamento" || raw.kind === "recebimento") {
      const debt = debtMap.get(raw.refId);
      const expected = raw.kind === "pagamento" ? "compra_prazo" : "venda_prazo";
      if (!debt || debt.kind !== expected) { enriched.push(reject(raw, "Título não encontrado. Nada foi alterado.")); continue; }
      if (raw.date < debt.date) { enriched.push(reject(raw, "A baixa não pode ser anterior ao título.")); continue; }
      if (badAmount || amount > debt.remaining) { enriched.push(reject(raw, "Valor maior que o saldo do título. Nada foi alterado.")); continue; }
      debt.remaining -= amount;
      netCash += raw.kind === "recebimento" ? amount : -amount;
      enriched.push({ ...raw });
      continue;
    }
    if (raw.kind === "emprestimo") {
      if (badAmount) { enriched.push(reject(raw, "Informe um valor de empréstimo maior que zero.")); continue; }
      const entry = { ...raw, term: raw.term === "longo" ? "longo" : "curto", remaining: amount };
      loans.push(entry); loanMap.set(entry.id, entry); netCash += amount; enriched.push(entry); continue;
    }
    if (raw.kind === "amortizacao" || raw.kind === "pagamento_emprestimo") {
      const loan = loanMap.get(raw.loanId);
      if (!loan || badAmount || amount > loan.remaining) { enriched.push(reject(raw, "Pagamento maior que o saldo do empréstimo. Nada foi alterado.")); continue; }
      if (raw.date < loan.date) { enriched.push(reject(raw, "O pagamento não pode ser anterior ao empréstimo.")); continue; }
      loan.remaining -= amount;
      netCash -= amount;
      enriched.push({ ...raw, term: loan.term || "curto" });
      continue;
    }
    if (raw.kind === "pagamento_encargo") {
      const role = chargeRole(raw.charge);
      if (!role || badAmount || amount > owing[raw.charge]) { enriched.push(reject(raw, "Pagamento maior que o saldo da conta. Nada foi alterado.")); continue; }
      owing[raw.charge] -= amount;
      netCash -= amount;
      enriched.push({ ...raw });
      continue;
    }
    if (["aluguel", "salario", "juros"].includes(raw.kind)) {
      if (badAmount) { enriched.push(reject(raw, "Informe um valor maior que zero.")); continue; }
      const key = raw.kind === "salario" ? "salarios" : raw.kind === "aluguel" ? "aluguel" : "juros";
      if (raw.settlement === "pagar") owing[key] += amount;
      else netCash -= amount;
      enriched.push({ ...raw });
      continue;
    }
    if (raw.kind === "dividendos") {
      if (badAmount) { enriched.push(reject(raw, "Informe um valor de dividendos maior que zero.")); continue; }
      if (raw.settlement === "pagar") owing.dividendos += amount;
      else netCash -= amount;
      enriched.push({ ...raw });
      continue;
    }
    if (["energia", "outra_despesa", "reducao_capital"].includes(raw.kind)) {
      if (badAmount) { enriched.push(reject(raw, "Informe um valor maior que zero.")); continue; }
      netCash -= amount;
      enriched.push({ ...raw });
      continue;
    }
    if (raw.kind === "integralizacao") {
      if (badAmount) { enriched.push(reject(raw, "Informe o valor do aumento de capital.")); continue; }
      netCash += amount;
      enriched.push({ ...raw });
      continue;
    }
    if (raw.kind === "reserva") {
      if (badAmount) { enriched.push(reject(raw, "Informe o valor da reserva.")); continue; }
      enriched.push({ ...raw });
      continue;
    }
    if (raw.kind === "aquisicao") {
      if (!raw.assetId || acquired.has(raw.assetId) || badAmount) { enriched.push(reject(raw, "Aquisição inválida ou bem já lançado. Nada foi alterado.")); continue; }
      acquired.add(raw.assetId);
      netCash -= amount;
      enriched.push({ ...raw, assetKind: raw.assetKind === "intangivel" ? "intangivel" : "imobilizado" });
      continue;
    }
    if (raw.kind === "depreciacao") {
      if (badAmount) { enriched.push(reject(raw, "Depreciação inválida.")); continue; }
      depreciation[raw.assetId] = (depreciation[raw.assetId] || 0) + amount;
      enriched.push({ ...raw });
      continue;
    }
    enriched.push(reject(raw, "Tipo de lançamento desconhecido."));
  }
  const balances = Object.fromEntries([...stock.entries()].map(([id, row]) => [id, { qty: row.qty, value: row.value }]));
  return { balances, movements: enriched.filter((entry) => entry.movement && !entry.error), debts, loans, depreciation, netCash, entries: enriched, owing };
}

export function assessDraft(ctx, draft) {
  const entry = { ...draft, id: draft.id || `draft-${Date.now()}`, createdAt: draft.createdAt || Date.now() };
  if (!validExerciseDate(entry.date)) return { ok: false, message: "Informe uma data válida em 2026. Datas fora do exercício são recusadas." };
  if (["compra_prazo", "venda_prazo"].includes(entry.kind) && (!validExerciseDate(entry.dueDate) || entry.dueDate < entry.date)) {
    return { ok: false, message: "O vencimento precisa cair em 2026 e não pode ser anterior à operação." };
  }
  if (entry.kind === "aquisicao") {
    const asset = (ctx.assets || []).find((item) => item.id === entry.assetId);
    if (!asset) return { ok: false, message: "Selecione o bem cadastrado." };
    if ((asset.origin || "saldo_inicial") !== "aquisicao") return { ok: false, message: "Este bem é saldo inicial e não passa pelo caixa." };
    entry.totalCents = toCents(asset.value);
    entry.assetKind = asset.kind === "intangivel" ? "intangivel" : "imobilizado";
    entry.assetName = asset.name;
  }
  const result = rebuild(ctx.items || [], [...(ctx.entries || []), entry], { inventoryMethod: ctx.settings?.inventoryMethod || "custo_medio" });
  const saved = result.entries.find((row) => row.id === entry.id);
  if (!saved || saved.error) return { ok: false, message: saved?.error || "Não foi possível registrar o lançamento." };
  let running = toCents(ctx.cash);
  for (const row of result.entries) {
    if (row.error) continue;
    const delta = cashDelta(row);
    if (row.id === saved.id && running + delta < 0) return { ok: false, message: "Caixa insuficiente para esta saída. Nada foi alterado." };
    running += delta;
  }
  const lines = accountLines(saved);
  if (!lines.length || lines.reduce((sum, line) => sum + line.d - line.c, 0) !== 0) return { ok: false, message: "Débito e crédito não fecham. Nada foi alterado." };
  return { ok: true, entry: saved, lines, message: "Débito e crédito conferem." };
}

function monthsInUse(asset, entries) {
  if ((asset.origin || "saldo_inicial") !== "aquisicao") return 12;
  const found = (entries || []).find((entry) => entry.kind === "aquisicao" && entry.assetId === asset.id && !entry.error);
  if (!found || !validExerciseDate(found.date)) return 0;
  return 12 - Number(found.date.slice(5, 7)) + 1;
}

function straightLine(cost, residual, lifeYears, months) {
  const life = asNumber(lifeYears);
  if (!life || life <= 0 || !months) return 0;
  const base = Math.max(0, cost - Math.min(toCents(residual) || 0, cost));
  return Math.round((base * months) / (life * 12));
}

function warrantyRate(settings) {
  if (!settings || settings.warrantyRatePercent == null || settings.warrantyRatePercent === "") return 0;
  const rate = asNumber(settings.warrantyRatePercent);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

function buildClosings(assets, entries, settings) {
  const closings = [];
  const method = settings?.depreciationMethod || "linear";
  let gross = 0;
  let returns = 0;
  for (const entry of entries) {
    if (entry.kind === "venda" || entry.kind === "venda_prazo") gross += entry.totalCents || 0;
    if (entry.kind === "devolucao") returns += entry.totalCents || 0;
  }
  const netRevenue = gross - returns;
  (assets || []).forEach((asset, index) => {
    const acquired = entries.find((entry) => entry.kind === "aquisicao" && entry.assetId === asset.id && !entry.error);
    const opening = (asset.origin || "saldo_inicial") !== "aquisicao";
    if (!opening && !acquired) return;
    const cost = acquired ? acquired.totalCents : toCents(asset.value);
    const months = monthsInUse(asset, entries);
    const target = method === "linear" ? straightLine(cost, asset.residual || 0, asset.usefulLife, months) : 0;
    const already = entries.filter((entry) => entry.kind === "depreciacao" && entry.assetId === asset.id).reduce((sum, entry) => sum + entry.totalCents, 0);
    const amount = Math.max(0, target - already);
    if (!amount) return;
    const intangible = (asset.kind || "imobilizado") === "intangivel";
    closings.push({
      id: `apuracao-${asset.id}`,
      kind: intangible ? "amortizacao_bem" : "depreciacao",
      date: "2026-12-31",
      createdAt: 9e15 + index,
      assetId: asset.id,
      assetName: asset.name,
      totalCents: amount,
      synthetic: true,
      description: intangible ? "Amortização linear apurada em 31/12" : "Depreciação linear apurada em 31/12",
    });
  });
  const rate = warrantyRate(settings);
  const provision = netRevenue > 0 ? Math.round((netRevenue * rate) / 100) : 0;
  if (provision > 0) {
    closings.push({
      id: "apuracao-provisao",
      kind: "provisao",
      date: "2026-12-31",
      createdAt: 9e15 + 100,
      totalCents: provision,
      synthetic: true,
      description: `Provisão para garantia de ${String(settings.warrantyRatePercent).replace(".", ",")}% da receita líquida`,
    });
  }
  return closings;
}

function createLedger() { return new Map(); }
function post(ledger, role, debit, credit) {
  if (!debit && !credit) return;
  const current = ledger.get(role) || { role, debit: 0, credit: 0 };
  current.debit += debit || 0;
  current.credit += credit || 0;
  ledger.set(role, current);
}
function netOf(ledger, role) {
  const row = ledger.get(role);
  return row ? row.debit - row.credit : 0;
}
function postEntry(ledger, entry) {
  for (const line of accountLines(entry)) post(ledger, line.role, line.d, line.c);
}
function resultFrom(ledger) {
  const gross = -netOf(ledger, "receita");
  const returns = netOf(ledger, "devolucoes");
  const netRevenue = gross - returns;
  const cmv = netOf(ledger, "cmv");
  const operatingLines = OPERATING_ROLES.map((role) => ({ role, name: ROLES[role], value: netOf(ledger, role) }));
  const operating = operatingLines.reduce((sum, row) => sum + row.value, 0);
  const interest = netOf(ledger, "despesa_juros");
  const grossProfit = netRevenue - cmv;
  const operational = grossProfit - operating;
  return { gross, returns, netRevenue, cmv, operatingLines, operating, interest, grossProfit, operational, result: operational - interest };
}
function openingFigures(items, assets, cash) {
  const cashCents = toCents(cash) || 0;
  const inventory = (items || []).reduce((sum, item) => {
    const qty = asQty(item.quantity || 0);
    const safeQty = Number.isInteger(qty) && qty > 0 ? qty : 0;
    return sum + Math.round(safeQty * (toCents(item.unitCost) || 0));
  }, 0);
  let imobilizado = 0;
  let intangivel = 0;
  for (const asset of assets || []) {
    if ((asset.origin || "saldo_inicial") === "aquisicao") continue;
    const value = toCents(asset.value) || 0;
    if ((asset.kind || "imobilizado") === "intangivel") intangivel += value;
    else imobilizado += value;
  }
  return { cashCents, inventory, imobilizado, intangivel, capital: cashCents + inventory + imobilizado + intangivel };
}
function ledgerFrom(opening, entries) {
  const ledger = createLedger();
  post(ledger, "caixa", opening.cashCents, 0);
  post(ledger, "estoque", opening.inventory, 0);
  post(ledger, "imobilizado", opening.imobilizado, 0);
  post(ledger, "intangivel", opening.intangivel, 0);
  post(ledger, "capital", 0, opening.capital);
  for (const entry of entries) postEntry(ledger, entry);
  return ledger;
}
function creditBalance(ledger, role) { return -netOf(ledger, role); }

function sumRows(rows) { return rows.reduce((sum, row) => sum + (row.value || 0), 0); }

function indirectFlow(flowResult, startLedger, endLedger, flowEntries) {
  const delta = (role, credit = false) => (credit ? creditBalance(endLedger, role) : netOf(endLedger, role)) - (credit ? creditBalance(startLedger, role) : netOf(startLedger, role));
  const dep = flowResult.operatingLines.find((row) => row.role === "despesa_depreciacao")?.value || 0;
  const amort = flowResult.operatingLines.find((row) => row.role === "despesa_amortizacao")?.value || 0;
  const clients = delta("clientes");
  const stock = delta("estoque");
  const suppliers = delta("fornecedores", true);
  const accruals = delta("salarios_pagar", true) + delta("aluguel_pagar", true) + delta("juros_pagar", true);
  const provision = delta("provisao_garantia", true);
  const operational = [
    { name: "Lucro líquido", value: flowResult.result },
    { name: "(+) Depreciação", value: dep },
    { name: "(+) Amortização", value: amort },
    { name: "(-) Aumento de clientes", value: -clients },
    { name: "(-) Aumento de estoques", value: -stock },
    { name: "(+) Aumento de fornecedores", value: suppliers },
    { name: "(+) Aumento de salários, aluguel e juros a pagar", value: accruals },
    { name: "(+) Aumento da provisão para garantia", value: provision },
  ];
  let equipment = 0;
  let license = 0;
  let capitalIn = 0;
  let loansIn = 0;
  let loansOut = 0;
  let dividendsPaid = 0;
  for (const entry of flowEntries) {
    const cash = cashDelta(entry);
    if (entry.kind === "aquisicao") {
      if (entry.assetKind === "intangivel") license += cash;
      else equipment += cash;
    } else if (entry.kind === "integralizacao") capitalIn += cash;
    else if (entry.kind === "reducao_capital") capitalIn += cash;
    else if (entry.kind === "emprestimo") loansIn += cash;
    else if (entry.kind === "amortizacao" || entry.kind === "pagamento_emprestimo") loansOut += cash;
    else if (entry.kind === "dividendos" && entry.settlement !== "pagar") dividendsPaid += cash;
    else if (entry.kind === "pagamento_encargo" && entry.charge === "dividendos") dividendsPaid += cash;
  }
  const investing = [
    { name: "Compra de equipamentos", value: equipment },
    { name: "Compra de licença", value: license },
  ];
  const financing = [
    { name: "Aumento de capital", value: capitalIn },
    { name: "Empréstimos obtidos", value: loansIn },
    { name: "Pagamento de empréstimos", value: loansOut },
    { name: "Dividendos pagos", value: dividendsPaid },
  ];
  const operatingNet = sumRows(operational);
  const investingNet = sumRows(investing);
  const financingNet = sumRows(financing);
  return { operational, investing, financing, operatingNet, investingNet, financingNet, cashChange: operatingNet + investingNet + financingNet };
}

function directFlow(flowEntries) {
  const groups = { operatingIn: [], operatingOut: [], investingOut: [], financingIn: [], financingOut: [] };
  const index = new Map();
  const put = (bucket, name, value) => {
    const key = `${bucket}:${name}`;
    if (!index.has(key)) { const row = { name, value: 0 }; index.set(key, row); groups[bucket].push(row); }
    index.get(key).value += value;
  };
  for (const entry of flowEntries) {
    const cash = cashDelta(entry);
    if (!cash) continue;
    if (entry.kind === "aquisicao") put("investingOut", entry.assetKind === "intangivel" ? "Compra de licença" : "Compra de equipamentos", -cash);
    else if (entry.kind === "integralizacao" || entry.kind === "emprestimo") put("financingIn", entry.kind === "integralizacao" ? "Aumento de capital" : "Empréstimos obtidos", cash);
    else if (entry.kind === "reducao_capital" || entry.kind === "amortizacao" || entry.kind === "pagamento_emprestimo") put("financingOut", entry.kind === "reducao_capital" ? "Redução de capital" : "Pagamento de empréstimos", -cash);
    else if ((entry.kind === "dividendos" && entry.settlement !== "pagar") || (entry.kind === "pagamento_encargo" && entry.charge === "dividendos")) put("financingOut", "Dividendos pagos", -cash);
    else if (cash > 0) put("operatingIn", KIND_LABELS[entry.kind] || entry.kind, cash);
    else put("operatingOut", entry.kind === "juros" || (entry.kind === "pagamento_encargo" && entry.charge === "juros") ? "Juros pagos" : (KIND_LABELS[entry.kind] || entry.kind), -cash);
  }
  const total = (rows) => rows.reduce((sum, row) => sum + row.value, 0);
  return {
    groups,
    operatingNet: total(groups.operatingIn) - total(groups.operatingOut),
    investingNet: -total(groups.investingOut),
    financingNet: total(groups.financingIn) - total(groups.financingOut),
  };
}

function buildDva(dre, dividends) {
  const pick = (role) => dre.operatingLines.find((row) => row.role === role)?.value || 0;
  const energy = pick("despesa_energia");
  const other = pick("despesa_outras");
  const provision = pick("despesa_provisao");
  const depreciation = pick("despesa_depreciacao");
  const amortization = pick("despesa_amortizacao");
  const salaries = pick("despesa_salarios");
  const rent = pick("despesa_aluguel");
  const inputs = [
    { name: "Custo das mercadorias vendidas", value: dre.cmv },
    { name: "Provisão para garantia", value: provision },
  ];
  if (energy || other) inputs.push({ name: "Água, energia e outros serviços", value: energy + other });
  const inputTotal = inputs.reduce((sum, row) => sum + row.value, 0);
  const grossAdded = dre.netRevenue - inputTotal;
  const netAdded = grossAdded - depreciation - amortization;
  const retained = dre.result - dividends;
  const distribution = [
    { name: "Pessoal — salários", value: salaries },
    { name: "Governo — tributos", value: 0 },
    { name: "Financiadores — juros", value: dre.interest },
    { name: "Financiadores — aluguéis", value: rent },
    { name: "Sócios — dividendos", value: dividends },
    { name: "Sócios — lucros retidos", value: retained },
  ];
  const distributed = distribution.reduce((sum, row) => sum + row.value, 0);
  return {
    revenues: [{ name: "Vendas de mercadorias", value: dre.gross }, { name: "(-) Devoluções de vendas", value: -dre.returns }],
    inputs,
    retentions: [{ name: "Depreciação", value: depreciation }, { name: "Amortização", value: amortization }],
    distribution,
    netRevenue: dre.netRevenue,
    grossAdded,
    netAdded,
    toDistribute: netAdded,
    distributed,
    difference: netAdded - distributed,
  };
}

function dreLines(dre) {
  const pick = (role) => dre.operatingLines.find((row) => row.role === role)?.value || 0;
  const lines = [
    { label: "Receita bruta de vendas", value: dre.gross, kind: "item" },
    { label: "(-) Devoluções de vendas", value: -dre.returns, kind: "item" },
    { label: "Receita líquida", value: dre.netRevenue, kind: "total" },
    { label: "(-) CMV", value: -dre.cmv, kind: "item" },
    { label: "Resultado bruto", value: dre.grossProfit, kind: "total" },
    { label: "Despesas operacionais", kind: "header" },
    { label: "Aluguel", value: -pick("despesa_aluguel"), kind: "item" },
    { label: "Salários", value: -pick("despesa_salarios"), kind: "item" },
  ];
  if (pick("despesa_energia")) lines.push({ label: "Água e energia", value: -pick("despesa_energia"), kind: "item" });
  if (pick("despesa_outras")) lines.push({ label: "Outras despesas operacionais", value: -pick("despesa_outras"), kind: "item" });
  lines.push(
    { label: "Depreciação", value: -pick("despesa_depreciacao"), kind: "item" },
    { label: "Amortização", value: -pick("despesa_amortizacao"), kind: "item" },
    { label: "Provisão para garantia", value: -pick("despesa_provisao"), kind: "item" },
    { label: "Resultado operacional", value: dre.operational, kind: "total" },
    { label: "Despesas de financiamento", kind: "header" },
    { label: "Juros", value: -dre.interest, kind: "item" },
    { label: "Lucro líquido", value: dre.result, kind: "grand" },
  );
  return lines;
}

export function computeBooks({ items = [], assets = [], entries = [], cash = 0, settings = {}, month = "" } = {}) {
  const method = settings.inventoryMethod || "custo_medio";
  const userEntries = (entries || []).filter((entry) => entry && !entry.synthetic);
  const full = rebuild(items, userEntries, { inventoryMethod: method });
  const usable = full.entries.filter((entry) => !entry.error);
  const closings = buildClosings(assets, usable, settings);
  const combined = [...usable, ...closings].sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0));
  const opening = openingFigures(items, assets, cash);
  const startEntries = month ? combined.filter((entry) => String(entry.date) < `${month}-01`) : [];
  const throughEntries = month ? combined.filter((entry) => String(entry.date) <= `${month}-31`) : combined;
  const flowEntries = month ? combined.filter((entry) => String(entry.date).startsWith(month)) : combined;
  const startLedger = ledgerFrom(opening, startEntries);
  const endLedger = ledgerFrom(opening, throughEntries);
  const flowLedger = createLedger();
  for (const entry of flowEntries) postEntry(flowLedger, entry);
  const dreBase = resultFrom(flowLedger);
  const ytd = resultFrom(endLedger);
  const lines = dreLines(dreBase);
  const indirect = indirectFlow(dreBase, startLedger, endLedger, flowEntries);
  const direct = directFlow(flowEntries);
  const openingCash = netOf(startLedger, "caixa");
  const closingCash = netOf(endLedger, "caixa");
  const dividends = netOf(endLedger, "dividendos");
  const reserves = creditBalance(endLedger, "reservas");
  const flowDividends = flowEntries.filter((entry) => entry.kind === "dividendos").reduce((sum, entry) => sum + entry.totalCents, 0);
  const flowReserves = flowEntries.filter((entry) => entry.kind === "reserva").reduce((sum, entry) => sum + entry.totalCents, 0);
  const startDividends = netOf(startLedger, "dividendos");
  const startReserves = creditBalance(startLedger, "reservas");
  const startCapital = creditBalance(startLedger, "capital");
  const endCapital = creditBalance(endLedger, "capital");
  const startRetained = resultFrom(startLedger).result - startDividends - startReserves;
  const lucros = ytd.result - dividends - reserves;
  const equityRows = [
    { name: "Capital social", value: endCapital },
    { name: "Reservas de lucros", value: reserves },
    { name: "Lucros acumulados", value: lucros },
  ];
  const assetCurrent = [
    { name: ROLES.caixa, value: netOf(endLedger, "caixa") },
    { name: ROLES.clientes, value: netOf(endLedger, "clientes") },
    { name: ROLES.estoque, value: netOf(endLedger, "estoque") },
  ];
  const assetNonCurrent = [
    { name: "Imobilizado", header: true },
    { name: ROLES.imobilizado, value: netOf(endLedger, "imobilizado"), depth: 1 },
    { name: `(-) ${ROLES.depreciacao_acum}`, value: netOf(endLedger, "depreciacao_acum"), depth: 1 },
    { name: "Intangível", header: true },
    { name: ROLES.intangivel, value: netOf(endLedger, "intangivel"), depth: 1 },
    { name: `(-) ${ROLES.amortizacao_acum}`, value: netOf(endLedger, "amortizacao_acum"), depth: 1 },
  ];
  const liabilityCurrent = [
    { name: ROLES.fornecedores, value: creditBalance(endLedger, "fornecedores") },
    { name: ROLES.salarios_pagar, value: creditBalance(endLedger, "salarios_pagar") },
    { name: ROLES.aluguel_pagar, value: creditBalance(endLedger, "aluguel_pagar") },
    { name: ROLES.emprestimos_cp, value: creditBalance(endLedger, "emprestimos_cp") },
    { name: ROLES.juros_pagar, value: creditBalance(endLedger, "juros_pagar") },
    { name: ROLES.provisao_garantia, value: creditBalance(endLedger, "provisao_garantia") },
    { name: ROLES.dividendos_pagar, value: creditBalance(endLedger, "dividendos_pagar") },
  ];
  const liabilityNonCurrent = [{ name: ROLES.emprestimos_lp, value: creditBalance(endLedger, "emprestimos_lp") }];
  const assetsTotal = sumRows(assetCurrent) + sumRows(assetNonCurrent);
  const liabilitiesTotal = sumRows(liabilityCurrent) + sumRows(liabilityNonCurrent);
  const equityTotal = sumRows(equityRows);
  const difference = assetsTotal - liabilitiesTotal - equityTotal;
  const endDate = month ? `${month}-31` : "2026-12-31";
  const scoped = rebuild(items, userEntries.filter((entry) => !month || String(entry.date) <= endDate), { inventoryMethod: method });
  const inventory = Object.values(scoped.balances).reduce((sum, row) => sum + row.value, 0);
  const customers = scoped.debts.filter((debt) => debt.kind === "venda_prazo").reduce((sum, debt) => sum + debt.remaining, 0);
  const suppliers = scoped.debts.filter((debt) => debt.kind === "compra_prazo").reduce((sum, debt) => sum + debt.remaining, 0);
  const loanBalance = scoped.loans.reduce((sum, loan) => sum + loan.remaining, 0);
  const autoDep = throughEntries.filter((entry) => entry.synthetic && entry.kind === "depreciacao").reduce((sum, entry) => sum + entry.totalCents, 0);
  const autoAmort = throughEntries.filter((entry) => entry.kind === "amortizacao_bem").reduce((sum, entry) => sum + entry.totalCents, 0);
  const provision = throughEntries.filter((entry) => entry.kind === "provisao").reduce((sum, entry) => sum + entry.totalCents, 0);
  const issues = [];
  for (const entry of full.entries) if (entry.error) issues.push(`${formatDate(entry.date)}: ${entry.error}`);
  if (netOf(endLedger, "estoque") !== inventory) issues.push("O estoque do razão não confere com a ficha de custo.");
  if (netOf(endLedger, "clientes") !== customers) issues.push("O saldo de clientes não confere com os títulos.");
  if (creditBalance(endLedger, "fornecedores") !== suppliers) issues.push("O saldo de fornecedores não confere com os títulos.");
  if (creditBalance(endLedger, "emprestimos_cp") + creditBalance(endLedger, "emprestimos_lp") !== loanBalance) issues.push("O saldo de empréstimos não confere com o controle.");
  if (creditBalance(endLedger, "depreciacao_acum") !== Object.values(scoped.depreciation).reduce((sum, value) => sum + value, 0) + autoDep) issues.push("A depreciação acumulada não confere.");
  if (creditBalance(endLedger, "amortizacao_acum") !== autoAmort) issues.push("A amortização acumulada não confere.");
  if (creditBalance(endLedger, "provisao_garantia") !== provision) issues.push("A provisão para garantia não confere.");
  if (indirect.cashChange !== closingCash - openingCash || direct.operatingNet + direct.investingNet + direct.financingNet !== closingCash - openingCash) issues.push("O fluxo de caixa não concilia com o caixa do balanço.");
  if (difference !== 0) issues.push(`O balanço não fecha. Diferença de ${formatBRL(difference)}.`);
  const dmplRows = [
    { name: "Saldo inicial", capital: startCapital, reserves: startReserves, retained: startRetained },
    { name: "Aumento/redução de capital", capital: endCapital - startCapital, reserves: 0, retained: 0 },
    { name: "Lucro líquido do período", capital: 0, reserves: 0, retained: dreBase.result },
    { name: "Constituição de reservas", capital: 0, reserves: flowReserves, retained: -flowReserves },
    { name: "Dividendos", capital: 0, reserves: 0, retained: -flowDividends },
  ];
  const dmplFinal = {
    capital: dmplRows.reduce((sum, row) => sum + row.capital, 0),
    reserves: dmplRows.reduce((sum, row) => sum + row.reserves, 0),
    retained: dmplRows.reduce((sum, row) => sum + row.retained, 0),
  };
  dmplFinal.total = dmplFinal.capital + dmplFinal.reserves + dmplFinal.retained;
  if (dmplFinal.total !== equityTotal || dmplFinal.retained !== lucros) issues.push("A DMPL não fecha com o patrimônio líquido.");
  const dva = buildDva(dreBase, flowDividends);
  if (dva.difference !== 0) issues.push("A DVA não fecha com a distribuição.");
  const journal = [];
  if (!month || month === "2026-01") {
    const openingLines = [
      { role: "caixa", name: ROLES.caixa, d: opening.cashCents, c: 0 },
      { role: "estoque", name: ROLES.estoque, d: opening.inventory, c: 0 },
      { role: "imobilizado", name: ROLES.imobilizado, d: opening.imobilizado, c: 0 },
      { role: "intangivel", name: ROLES.intangivel, d: opening.intangivel, c: 0 },
      { role: "capital", name: ROLES.capital, d: 0, c: opening.capital },
    ].filter((row) => row.d || row.c);
    if (openingLines.length) journal.push({ id: "abertura", date: "2026-01-01", history: "Abertura do exercício", lines: openingLines });
  }
  for (const entry of flowEntries) {
    journal.push({ id: entry.id, date: entry.date, history: entry.description || entry.assetName || entry.itemName || KIND_LABELS[entry.kind] || entry.kind, kind: entry.kind, synthetic: !!entry.synthetic, lines: accountLines(entry) });
  }
  const trial = [...endLedger.values()].map((row) => ({ role: row.role, name: ROLES[row.role] || row.role, debit: row.debit, credit: row.credit, net: row.debit - row.credit }));
  const monthly = MONTHS.map((label, index) => {
    const key = `2026-${String(index + 1).padStart(2, "0")}`;
    const sliceLedger = createLedger();
    for (const entry of combined.filter((entry) => String(entry.date).startsWith(key))) postEntry(sliceLedger, entry);
    const monthResult = resultFrom(sliceLedger);
    return { month: key, label, revenue: monthResult.netRevenue, cmv: monthResult.cmv, profit: monthResult.result };
  });
  let cashRunning = opening.cashCents;
  for (const point of monthly) {
    cashRunning += usable.filter((entry) => String(entry.date).startsWith(point.month)).reduce((sum, entry) => sum + cashDelta(entry), 0);
    point.cash = cashRunning;
  }
  return {
    method,
    opening,
    capitalCents: opening.capital,
    openingTotal: opening.capital,
    balances: scoped.balances,
    movements: scoped.movements,
    debts: scoped.debts,
    loans: scoped.loans,
    netCash: full.netCash,
    closings,
    dre: dreBase,
    dreLines: lines,
    revenue: dreBase.gross,
    cmv: dreBase.cmv,
    operating: dreBase.operating,
    result: dreBase.result,
    ytdResult: ytd.result,
    assetCurrent,
    assetNonCurrent,
    liabilityCurrent,
    liabilityNonCurrent,
    equityRows,
    assetsTotal,
    liabilitiesTotal,
    equityTotal,
    difference,
    lucros,
    issues,
    trial,
    totalDebits: trial.reduce((sum, row) => sum + row.debit, 0),
    totalCredits: trial.reduce((sum, row) => sum + row.credit, 0),
    journal,
    monthly,
    margins: { gross: dreBase.netRevenue > 0 ? dreBase.grossProfit / dreBase.netRevenue : null, net: dreBase.netRevenue > 0 ? dreBase.result / dreBase.netRevenue : null },
    dmplRows,
    dmplFinal,
    dva,
    indirect,
    direct,
    cashFlow: { ...indirect, groups: direct.groups, openingCash, closingCash, balanceCash: closingCash, cashDifference: indirect.cashChange - (closingCash - openingCash) },
    inventory,
    customers,
    suppliers,
    loanBalance,
    provision,
    depreciation: (dreBase.operatingLines.find((row) => row.role === "despesa_depreciacao")?.value || 0),
    amortization: (dreBase.operatingLines.find((row) => row.role === "despesa_amortizacao")?.value || 0),
    entriesCount: userEntries.length,
    revenues: [{ name: ROLES.receita, value: dreBase.gross }],
    costs: [{ name: ROLES.cmv, value: dreBase.cmv }],
    expenses: dreBase.operatingLines.filter((row) => row.value).map((row) => ({ name: row.name, value: row.value })),
    assetsRows: [...assetCurrent, ...assetNonCurrent.filter((row) => !row.header)],
    liabilitiesRows: [...liabilityCurrent, ...liabilityNonCurrent],
  };
}

export function computeStatement(props) { return computeBooks(props || {}); }
export function computeExtraStatements(props) {
  const books = computeBooks(props || {});
  const totalDebit = books.trial.reduce((sum, row) => sum + Math.max(0, row.net), 0);
  const totalCredit = books.trial.reduce((sum, row) => sum + Math.max(0, -row.net), 0);
  return {
    statement: books,
    trial: books.trial.map((row) => ({ name: row.name, debit: Math.max(0, row.net), credit: Math.max(0, -row.net), net: row.net })),
    totalDebit,
    totalCredit,
    trialDifference: totalDebit - totalCredit,
    groups: books.direct.groups,
    operatingNet: books.indirect.operatingNet,
    financingNet: books.indirect.financingNet,
    investingNet: books.indirect.investingNet,
    cashChange: books.indirect.cashChange,
    openingCash: books.cashFlow.openingCash,
    closingCash: books.cashFlow.closingCash,
    balanceCash: books.cashFlow.balanceCash,
    cashDifference: books.cashFlow.cashDifference,
    equity: books.equityRows,
    equityClosing: books.equityTotal,
  };
}

const SCHEMA = 1;
const sections = ["items", "suppliers", "customers", "assets", "accounts"];
const validEntryKinds = new Set(["compra", "venda", "compra_prazo", "venda_prazo", "pagamento", "recebimento", "devolucao", "aluguel", "salario", "energia", "outra_despesa", "emprestimo", "amortizacao", "pagamento_emprestimo", "juros", "dividendos", "aquisicao", "depreciacao", "pagamento_encargo", "integralizacao", "reducao_capital", "reserva"]);

export function validateBackup(json) {
  if (!json || typeof json !== "object" || Array.isArray(json) || json.schema !== SCHEMA || json.exercise !== 2026) throw Error("Arquivo incompatível com o sistema contábil de 2026.");
  if (!json.data || typeof json.data !== "object" || Array.isArray(json.data) || !sections.every((key) => Array.isArray(json.data[key]))) throw Error("Backup não contém os cadastros.");
  if (typeof json.cash !== "string" && typeof json.cash !== "number") throw Error("Saldo inicial do caixa inválido.");
  if (!Number.isFinite(Number(json.cash)) || Number(json.cash) < 0 || Number(json.cash) > 1e12) throw Error("Saldo inicial do caixa fora do limite.");
  if (!Array.isArray(json.entries) || json.entries.length > 50000 || sections.some((key) => json.data[key].length > 10000)) throw Error("Quantidade de registros inválida.");
  const ids = new Set();
  for (const key of sections) for (const row of json.data[key]) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id)) throw Error("Cadastros com IDs ausentes ou duplicados.");
    ids.add(row.id);
    if (key === "items" && (!Number.isFinite(Number(row.quantity || 0)) || Number(row.quantity || 0) < 0 || !Number.isInteger(Number(row.quantity || 0)) || !Number.isFinite(Number(row.unitCost || 0)) || Number(row.unitCost || 0) < 0)) throw Error("Estoque inicial inválido.");
    if (key === "assets" && (!Number.isFinite(Number(row.value)) || Number(row.value) <= 0 || Number(row.residual || 0) > Number(row.value))) throw Error("Bem com valores inválidos.");
  }
  const entryIds = new Set();
  const known = new Map();
  for (const entry of [...json.entries].sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0))) {
    if (!entry || typeof entry !== "object" || !validEntryKinds.has(entry.kind) || typeof entry.id !== "string" || !entry.id || entryIds.has(entry.id) || !validExerciseDate(entry.date)) throw Error("Lançamento inválido ou duplicado.");
    if (!Number.isSafeInteger(entry.totalCents) || entry.totalCents <= 0) throw Error("Valor inválido no lançamento.");
    if (["compra", "venda", "compra_prazo", "venda_prazo"].includes(entry.kind)) {
      if (!json.data.items.some((item) => item.id === entry.itemId) || !Number.isInteger(entry.quantity) || entry.quantity <= 0) throw Error("Lançamento de estoque sem item ou quantidade válida.");
      if (entry.kind.includes("prazo") && (!validExerciseDate(entry.dueDate) || entry.dueDate < entry.date || !json.data[entry.kind === "compra_prazo" ? "suppliers" : "customers"].some((partner) => partner.id === entry.partnerId))) throw Error("Título a prazo incompleto.");
      if (entry.kind.startsWith("venda") && (!Number.isSafeInteger(entry.costCents) || entry.costCents < 0)) throw Error("CMV inválido.");
    }
    if (entry.kind === "devolucao") {
      const sale = known.get(entry.refId);
      if (!sale || !["venda", "venda_prazo"].includes(sale.kind) || entry.date < sale.date || !Number.isInteger(entry.quantity) || entry.quantity <= 0) throw Error("Devolução sem venda correspondente.");
    }
    if (["pagamento", "recebimento"].includes(entry.kind)) {
      const ref = known.get(entry.refId);
      if (!ref || ref.kind !== (entry.kind === "pagamento" ? "compra_prazo" : "venda_prazo") || entry.date < ref.date) throw Error("Baixa sem título correspondente.");
    }
    if ((entry.kind === "amortizacao" || entry.kind === "pagamento_emprestimo") && (!known.has(entry.loanId) || known.get(entry.loanId).kind !== "emprestimo")) throw Error("Amortização sem empréstimo.");
    if (entry.kind === "depreciacao" && !json.data.assets.some((asset) => asset.id === entry.assetId)) throw Error("Depreciação sem bem cadastrado.");
    if (entry.kind === "aquisicao" && !json.data.assets.some((asset) => asset.id === entry.assetId)) throw Error("Aquisição sem bem cadastrado.");
    const lines = accountLines(entry);
    if (!lines.length || lines.some((line) => !Number.isSafeInteger(line.d) || !Number.isSafeInteger(line.c)) || lines.reduce((sum, line) => sum + line.d - line.c, 0) !== 0) throw Error("Débitos e créditos inválidos.");
    entryIds.add(entry.id);
    known.set(entry.id, entry);
  }
  return { data: json.data, cash: String(json.cash), entries: json.entries, settings: json.settings || null };
}

const csvValue = (value) => {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export function csv(rows) { return `\uFEFF${rows.map((row) => row.map(csvValue).join(";")).join("\r\n")}\r\n`; }
export function statementCsv(books) {
  const rows = [["Demonstração", "Conta", "Valor"]];
  const add = (name, label, value) => rows.push([name, label, (Number(value || 0) / 100).toFixed(2).replace(".", ",")]);
  for (const line of books.dreLines) if (line.value != null) add("DRE", line.label, line.value);
  for (const line of books.assetsRows) add("Balanço", line.name, line.value);
  for (const line of books.liabilitiesRows) add("Balanço", line.name, line.value);
  for (const line of books.equityRows) add("Balanço", line.name, line.value);
  for (const line of books.indirect.operational) add("DFC indireto", line.name, line.value);
  for (const line of books.indirect.investing) add("DFC indireto", line.name, line.value);
  for (const line of books.indirect.financing) add("DFC indireto", line.name, line.value);
  add("DFC indireto", "Variação do caixa", books.indirect.cashChange);
  return csv(rows);
}
