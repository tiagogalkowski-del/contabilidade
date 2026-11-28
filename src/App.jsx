import React, { useEffect, useMemo, useState } from "react";
import {
  KIND_LABELS,
  POSTING_RULES,
  assessDraft,
  chartOfAccounts,
  computeBooks,
  csv,
  defaultSettings,
  formatBRL,
  formatDate,
  formatNumber,
  percent,
  statementCsv,
  toCents,
  validateBackup,
} from "./engine.js";
import { papelariaOpening } from "./sample.js";
import { SharedIndicator, useSharedAccounting } from "./SharedAccounting.jsx";

const DATA_KEY = "contabilidade-cadastros";
const CASH_KEY = "contabilidade-caixa-inicial";
const ENTRY_KEY = "contabilidade-lancamentos-v1";
const SETTINGS_KEY = "contabilidade-config";
const MENUS = [["inicio", "Início"], ["cadastros", "Cadastros"], ["lancamentos", "Lançamentos"], ["estoque", "Estoque"], ["prazo", "Prazo"], ["demonstracoes", "Demonstrações"], ["extras", "Extras"]];
const FICHA = {
  inicio: ["001", "Resumo do exercício"],
  cadastros: ["C1", "Cadastros"],
  lancamentos: ["L1", "Livro diário"],
  estoque: ["E1", "Ficha de estoque"],
  prazo: ["P1", "Contas a prazo"],
  extras: ["X1", "Arquivo e conferência"],
};
const REPORTS = [
  ["dre", "DRE", "D1", "Demonstração do resultado"],
  ["bp", "Balanço", "D2", "Balanço patrimonial"],
  ["dmpl", "DMPL", "D3", "Mutações do patrimônio líquido"],
  ["dfc", "DFC", "D4", "Fluxo de caixa — indireto"],
  ["direto", "Direto", "D5", "Fluxo de caixa — direto"],
  ["dva", "DVA", "D6", "Valor adicionado"],
  ["diario", "Diário", "D7", "Livro diário"],
  ["razao", "Razão", "D8", "Livro razão"],
];
const MONTH_OPTIONS = [["", "Exercício completo"], ...["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((name, index) => [`2026-${String(index + 1).padStart(2, "0")}`, name])];

function emptyData() { return { items: [], suppliers: [], customers: [], assets: [], accounts: [] }; }
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } }
function download(name, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toIso(text) {
  const value = String(text || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slash = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
  const plain = value.match(/^(\d{2})(\d{2})(\d{4})$/);
  return plain ? `${plain[3]}-${plain[2]}-${plain[1]}` : "";
}
function lastEntry(entries) {
  return [...entries].sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0)).at(-1);
}
function ledgerFrom(journal) {
  const map = new Map();
  for (const item of journal) for (const line of item.lines) {
    const account = map.get(line.role) || { name: line.name, lines: [], balance: 0 };
    account.balance += (line.d || 0) - (line.c || 0);
    account.lines.push({ date: item.date, history: item.history, debit: line.d || 0, credit: line.c || 0, balance: account.balance });
    map.set(line.role, account);
  }
  return [...map.values()];
}

export function App() {
  const [menu, setMenu] = useState("inicio");
  const [report, setReport] = useState("dre");
  const [month, setMonth] = useState("");
  const [data, setData] = useState(() => ({ ...emptyData(), ...readJson(DATA_KEY, {}) }));
  const [cash, setCash] = useState(() => localStorage.getItem(CASH_KEY) || "");
  const [entries, setEntries] = useState(() => { const value = readJson(ENTRY_KEY, []); return Array.isArray(value) ? value : []; });
  const [settings, setSettings] = useState(() => ({ ...defaultSettings(), ...readJson(SETTINGS_KEY, {}) }));
  useEffect(() => localStorage.setItem(DATA_KEY, JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem(CASH_KEY, cash), [cash]);
  useEffect(() => localStorage.setItem(ENTRY_KEY, JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);
  const shared = useSharedAccounting({ data, setData, cash, setCash, entries, setEntries, settings, setSettings });
  const books = useMemo(() => computeBooks({ items: data.items, assets: data.assets, entries, cash, settings }), [data, entries, cash, settings]);
  const reportMeta = REPORTS.find((row) => row[0] === report) || REPORTS[0];
  const [fichaNo, fichaTitle] = menu === "demonstracoes" ? [reportMeta[2], reportMeta[3]] : FICHA[menu];
  const periodLabel = month && menu === "demonstracoes" ? `${MONTH_OPTIONS.find((row) => row[0] === month)?.[1]} 2026` : "jan–dez 2026";
  function loadSample() {
    if (entries.length && !confirm("Trocar os cadastros pelo exemplo da papelaria? Os lançamentos atuais serão apagados.")) return;
    const sample = papelariaOpening();
    shared.setSharedData({ items: sample.items, suppliers: [], customers: [], assets: sample.assets, accounts: [] });
    shared.setSharedCash(sample.cash);
    shared.setSharedSettings(sample.settings);
    shared.setSharedEntries([]);
  }
  function clearAll() {
    if (!confirm("Apagar cadastros, lançamentos e saldo deste navegador?")) return;
    shared.setSharedData(emptyData()); shared.setSharedCash(""); shared.setSharedEntries([]); shared.setSharedSettings(defaultSettings());
  }
  return <div className="gaveta-app">
    <header className="gaveta">
      <span className="etiqueta">{settings.companyName || "Papelaria"} · Arquivo contábil</span>
      <span className="puxador" aria-hidden="true" />
      <span className="ano">Exercício 2026</span>
    </header>
    <SharedIndicator shared={shared} />
    <nav className="abas" aria-label="Menu principal">
      {MENUS.map(([id, name]) => <button key={id} data-tab={id} className={menu === id ? "aba on" : "aba"} onClick={() => setMenu(id)}>{name}</button>)}
    </nav>
    <main className={menu === "demonstracoes" ? "ficha com-indice" : "ficha"}>
      <div className="cab">
        <div><span className="lbl" style={{ color: "var(--margem)" }}>Ficha nº</span><div className="tp vermelho">{fichaNo}</div></div>
        <div><span className="lbl">Título</span><div className="tp">{fichaTitle}</div></div>
        <div><span className="lbl">Período</span><div className="tp">{periodLabel}</div></div>
        <div><span className="lbl">{menu === "demonstracoes" ? "Valores em" : "Método"}</span><div className="tp">{menu === "demonstracoes" ? "R$" : (books.method === "peps" ? "PEPS" : "Custo médio")}</div></div>
      </div>
      <div className="corpo">
        <div className="numeros" aria-hidden="true"><span>{Array.from({ length: 60 }, (_, index) => String(index + 1).padStart(2, "0")).join("\n")}</span></div>
        <div className="miolo">
          {menu === "inicio" && <Dashboard books={books} settings={settings} data={data} onSample={loadSample} />}
          {menu === "cadastros" && <Registers data={data} setData={shared.setSharedData} cash={cash} setCash={shared.setSharedCash} entries={entries} books={books} settings={settings} setSettings={shared.setSharedSettings} />}
          {menu === "lancamentos" && <Journal data={data} entries={entries} setEntries={shared.setSharedEntries} cash={cash} settings={settings} books={books} />}
          {menu === "estoque" && <Stock data={data} books={books} />}
          {menu === "prazo" && <Credit data={data} entries={entries} setEntries={shared.setSharedEntries} cash={cash} settings={settings} books={books} />}
          {menu === "demonstracoes" && <Statements report={report} setReport={setReport} month={month} setMonth={setMonth} settings={settings} data={data} entries={entries} cash={cash} />}
          {menu === "extras" && <Extras settings={settings} setSettings={shared.setSharedSettings} data={data} cash={cash} entries={entries} setData={shared.setSharedData} setCash={shared.setSharedCash} setEntries={shared.setSharedEntries} books={books} onSample={loadSample} onClear={clearAll} />}
        </div>
      </div>
      {menu === "demonstracoes" && <nav className="indice no-print" aria-label="Demonstrações">
        {REPORTS.map(([id, name]) => <button key={id} className={report === id ? "on" : ""} onClick={() => setReport(id)}>{name}</button>)}
      </nav>}
    </main>
  </div>;
}

function Dashboard({ books, settings, data, onSample }) {
  const empty = !data.items.length && !data.assets.length && !books.opening.cashCents;
  const cashNow = books.assetsRows.find((row) => row.name.startsWith("Caixa"))?.value || 0;
  return <div className="painel">
    <div>
      <h2>Como fechou o ano</h2>
      <p className="hint">{settings.activity}</p>
      {empty && <p className="hint">Nada cadastrado ainda. <button className="linkish" onClick={onSample}>Preencher os saldos da papelaria</button></p>}
      <div className="campos">
        <div className="campo"><span className="lbl">Receita líquida</span><span className="v">{formatNumber(books.dre.netRevenue)}</span></div>
        <div className="campo"><span className="lbl">Lucro líquido</span><span className="v">{formatNumber(books.result)}</span>{books.margins.net > 0 && <span className="s">{percent(books.margins.net)} da receita</span>}</div>
        <div className="campo"><span className="lbl">Caixa em 31/12</span><span className="v">{formatNumber(cashNow)}</span></div>
        <div className="campo"><span className="lbl">Estoque em 31/12</span><span className="v">{formatNumber(books.inventory)}</span></div>
      </div>
      <MonthBars series={books.monthly} />
    </div>
    <aside className="gaveta-contas">
      <h2>Fichas de conta</h2>
      <AccountDrawer books={books} />
      <Carimbo difference={books.difference} when="31/12/2026" />
    </aside>
  </div>;
}
function shortReais(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
function MonthBars({ series }) {
  const max = Math.max(1, ...series.map((item) => item.revenue));
  const has = series.some((item) => item.revenue);
  return <div className="graf">
    <span className="lbl">Receita líquida por mês (R$)</span>
    {!has ? <p className="hint">Sem receita no exercício. A depreciação do saldo inicial, quando houver vida útil, entra em 31/12.</p> : <>
      <div className="barras" role="img" aria-label="Receita líquida por mês">
        {series.map((item) => <div key={item.month} className={item.revenue && item.revenue === max ? "b max" : "b"} style={{ height: `${Math.max(0, Math.round((item.revenue / max) * 100))}%` }}>{item.revenue > 0 && <span>{shortReais(item.revenue)}</span>}</div>)}
      </div>
      <div className="meses">{series.map((item) => <div key={item.month}>{item.label}</div>)}</div>
    </>}
  </div>;
}
function AccountDrawer({ books }) {
  const rows = [];
  const push = (name, value, kind, always = false) => { if (always || value) rows.push({ name, value, kind }); };
  for (const row of books.assetCurrent) push(row.name, row.value, "ativo", true);
  for (const row of books.assetNonCurrent) if (!row.header) push(row.name, row.value, "ativo");
  for (const row of books.liabilityCurrent) push(row.name, row.value, "passivo");
  for (const row of books.liabilityNonCurrent) push(row.name, row.value, "passivo");
  for (const row of books.equityRows) push(row.name, row.value, "pl", true);
  return <div className="kdx">{rows.map((row, index) => <div className={`k ${row.kind}`} key={row.name} style={{ "--x": `${14 + (index * 36) % 160}px` }}><i aria-hidden="true" /><span className="n">{row.name}</span><span className="sv">{formatNumber(row.value)}</span></div>)}</div>;
}
function Carimbo({ difference, when }) {
  const ok = difference === 0;
  return <div className={ok ? "carimbo" : "carimbo nao"} role="status">{ok ? "BALANÇO CONFERE" : "NÃO CONFERE"}<small>{ok ? `ativo = passivo + PL · ${when}` : `diferença ${formatNumber(difference)}`}</small></div>;
}

function Registers({ data, setData, cash, setCash, entries, books, settings, setSettings }) {
  const [tab, setTab] = useState("items");
  const tabs = [["items", "Itens"], ["suppliers", "Fornecedores"], ["customers", "Clientes"], ["assets", "Bens"], ["metodos", "Métodos"], ["plano", "Plano de contas"]];
  return <>
    <div className="tabs">{tabs.map(([id, name]) => <button key={id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}>{name}</button>)}</div>
    {tab === "metodos" && <Methods settings={settings} setSettings={setSettings} />}
    {tab === "plano" && <Chart />}
    {tab !== "metodos" && tab !== "plano" && <RegisterEditor tab={tab} rows={data[tab] || []} setData={setData} entries={entries} books={books} />}
    {tab === "items" && <Opening cash={cash} setCash={setCash} books={books} locked={false} />}
  </>;
}
function Methods({ settings, setSettings }) {
  const set = (key, value) => setSettings({ ...settings, [key]: value });
  return <div>
    <h2>Estoque</h2>
    <div className="choices">
      <label><input type="radio" checked={settings.inventoryMethod !== "peps"} onChange={() => set("inventoryMethod", "custo_medio")} />Custo médio, recalculado a cada compra</label>
      <label><input type="radio" checked={settings.inventoryMethod === "peps"} onChange={() => set("inventoryMethod", "peps")} />PEPS</label>
    </div>
    <h2>Depreciação e amortização</h2>
    <div className="choices"><label><input type="radio" checked readOnly />Linear. O mês da compra conta como mês inteiro. Valor residual e vida útil vêm do bem.</label></div>
    <h2>Exaustão</h2>
    <div className="choices">
      <label><input type="radio" checked={settings.exhaustion !== "exaustao"} onChange={() => set("exhaustion", "nao_se_aplica")} />Não se aplica a esta empresa</label>
      <label><input type="radio" checked={settings.exhaustion === "exaustao"} onChange={() => set("exhaustion", "exaustao")} />Exaustão</label>
    </div>
    {settings.exhaustion === "exaustao" && <p className="notice bad">Esta papelaria não tem recurso mineral ou florestal. A exaustão fica registrada, mas não gera valor.</p>}
    <label className="field" style={{ maxWidth: 280 }}>Provisão para garantia (% da receita líquida)
      <input value={settings.warrantyRatePercent} onChange={(event) => set("warrantyRatePercent", event.target.value)} />
    </label>
    <p className="hint">A provisão, a depreciação e a amortização são calculadas em 31/12. Nada disso é digitado no lançamento.</p>
  </div>;
}
function Chart() {
  return <div>
    {chartOfAccounts().map((group) => <section key={group.group} className="block"><h2>{group.group}</h2><ul>{group.accounts.map((name) => <li key={name}>{name}</li>)}</ul></section>)}
    <h2>Regras de lançamento</h2>
    <div className="table-wrap"><table className="data"><thead><tr><th>Evento</th><th>Débito</th><th>Crédito</th></tr></thead><tbody>{POSTING_RULES.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>
  </div>;
}
function RegisterEditor({ tab, rows, setData, entries, books }) {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const fields = {
    items: [["name", "Descrição", true], ["sku", "Código"], ["unit", "Unidade"], ["quantity", "Quantidade inicial"], ["unitCost", "Custo unitário (R$)"]],
    suppliers: [["name", "Nome", true], ["document", "CPF / CNPJ"], ["phone", "Telefone"]],
    customers: [["name", "Nome", true], ["document", "CPF / CNPJ"], ["phone", "Telefone"]],
    assets: [["name", "Descrição", true], ["value", "Valor (R$)", true], ["usefulLife", "Vida útil (anos)"], ["residual", "Valor residual (R$)"]],
  }[tab];
  function linked(id) {
    return entries.some((entry) => entry.itemId === id || entry.partnerId === id || entry.assetId === id);
  }
  function save(event) {
    event.preventDefault();
    for (const [key, label, required] of fields) if (required && !String(form[key] ?? "").trim()) { setMessage(`Preencha ${label}.`); return; }
    if (tab === "items" && (!Number.isInteger(Number(form.quantity || 0)) || Number(form.quantity || 0) < 0 || Number(form.unitCost || 0) < 0)) { setMessage("Quantidade inteira e custo não podem ser negativos."); return; }
    if (tab === "assets" && Number(form.value) <= 0) { setMessage("Informe o valor do bem."); return; }
    const row = { ...form, id: form.id || crypto.randomUUID() };
    if (tab === "assets") { row.kind = form.kind || "imobilizado"; row.origin = form.origin || "saldo_inicial"; }
    setData((old) => ({ ...old, [tab]: form.id ? old[tab].map((item) => item.id === form.id ? row : item) : [...old[tab], row] }));
    setForm(null); setMessage("Cadastro salvo. Os relatórios foram recalculados.");
  }
  function remove(id) {
    if (linked(id)) { setMessage("Este cadastro já entrou em lançamento. Exclua os lançamentos antes, ou altere o valor."); return; }
    setData((old) => ({ ...old, [tab]: old[tab].filter((item) => item.id !== id) }));
  }
  const balanceOf = (id) => {
    if (tab === "customers") return books.debts.filter((debt) => debt.kind === "venda_prazo" && debt.partnerId === id).reduce((sum, debt) => sum + debt.remaining, 0);
    if (tab === "suppliers") return books.debts.filter((debt) => debt.kind === "compra_prazo" && debt.partnerId === id).reduce((sum, debt) => sum + debt.remaining, 0);
    return null;
  };
  return <div>
    <div className="toolbar"><h2 style={{ margin: 0 }}>{tab === "assets" ? "Bens" : tab === "items" ? "Itens vendidos" : tab === "customers" ? "Clientes" : "Fornecedores"}</h2><button className="primary" onClick={() => { setForm(tab === "assets" ? { kind: "imobilizado", origin: "saldo_inicial", residual: "0" } : {}); setMessage(""); }}>Novo</button></div>
    {message && <div className="notice">{message}</div>}
    {form && <form onSubmit={save} className="block"><div className="form-grid">
      {fields.map(([key, label, required]) => <label className="field" key={key}>{label}{required ? " *" : ""}<input required={!!required} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      {tab === "assets" && <>
        <label className="field">Tipo<select value={form.kind || "imobilizado"} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="imobilizado">Máquinas e equipamentos</option><option value="intangivel">Software ou licença</option></select></label>
        <label className="field">Origem<select value={form.origin || "saldo_inicial"} onChange={(event) => setForm({ ...form, origin: event.target.value })}><option value="saldo_inicial">Saldo inicial</option><option value="aquisicao">Compra no exercício</option></select></label>
      </>}
    </div><div className="actions" style={{ marginTop: 12 }}><button type="button" className="secondary" onClick={() => setForm(null)}>Cancelar</button><button className="primary">Salvar</button></div></form>}
    {!rows.length ? <p className="quiet">Nenhum registro.</p> : <div className="table-wrap"><table className="data"><thead><tr>{fields.map(([key, label]) => <th className={["quantity", "unitCost", "value", "residual"].includes(key) ? "num" : ""} key={key}>{label}</th>)}{tab === "assets" && <th>Tipo</th>}{(tab === "customers" || tab === "suppliers") && <th className="num">{tab === "customers" ? "A receber" : "A pagar"}</th>}<th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{fields.map(([key]) => <td className={["quantity", "unitCost", "value", "residual"].includes(key) ? "num" : ""} key={key}>{["unitCost", "value", "residual"].includes(key) && row[key] !== "" && row[key] != null ? formatBRL(toCents(row[key])) : (row[key] || "—")}</td>)}{tab === "assets" && <td>{row.kind === "intangivel" ? "Licença" : "Imobilizado"} · {row.origin === "aquisicao" ? "compra" : "saldo inicial"}</td>}{(tab === "customers" || tab === "suppliers") && <td className="num">{formatBRL(balanceOf(row.id))}</td>}<td className="actions"><button className="linkish" onClick={() => setForm(row)}>Editar</button><button className="linkish danger" onClick={() => remove(row.id)}>Excluir</button></td></tr>)}</tbody></table></div>}
  </div>;
}
function Opening({ cash, setCash, books }) {
  return <section className="block"><h2>Saldo inicial de caixa</h2>
    <label className="field" style={{ maxWidth: 280 }}>Caixa em 01/01/2026 (R$)<input value={cash} onChange={(event) => setCash(event.target.value)} /></label>
    <p className="hint">A empresa começa sem dívidas. O capital social é a soma do caixa, do estoque e dos bens de saldo inicial: <b>{formatBRL(books.capitalCents)}</b>.</p>
  </section>;
}

function Journal({ data, entries, setEntries, cash, settings, books }) {
  return <EntryForm title="Novo lançamento" mode="journal" data={data} entries={entries} setEntries={setEntries} cash={cash} settings={settings} books={books} />;
}
function Credit({ data, entries, setEntries, cash, settings, books }) {
  const byPartner = (list, kind) => list.map((partner) => ({ name: partner.name, value: books.debts.filter((debt) => debt.kind === kind && debt.partnerId === partner.id).reduce((sum, debt) => sum + debt.remaining, 0) }));
  return <>
    <EntryForm title="Operação a prazo" mode="prazo" data={data} entries={entries} setEntries={setEntries} cash={cash} settings={settings} books={books} />
    <div className="block"><h2>Saldos</h2>
      <div className="table-wrap"><table className="data"><thead><tr><th>Cliente</th><th className="num">A receber</th></tr></thead><tbody>{byPartner(data.customers, "venda_prazo").map((row) => <tr key={row.name}><td>{row.name}</td><td className="num">{formatBRL(row.value)}</td></tr>)}</tbody></table></div>
      <div className="table-wrap"><table className="data"><thead><tr><th>Fornecedor</th><th className="num">A pagar</th></tr></thead><tbody>{byPartner(data.suppliers, "compra_prazo").map((row) => <tr key={row.name}><td>{row.name}</td><td className="num">{formatBRL(row.value)}</td></tr>)}</tbody></table></div>
    </div>
  </>;
}

function EntryForm({ title, mode, data, entries, setEntries, cash, settings, books }) {
  const [draft, setDraft] = useState({ kind: mode === "prazo" ? "venda_prazo" : "compra", date: "01/01/2026", settlement: "vista", term: "curto", charge: "salarios", quantity: "1" });
  const [message, setMessage] = useState("");
  const [bad, setBad] = useState(false);
  const set = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const sales = books.movements.filter((entry) => entry.kind === "venda" || entry.kind === "venda_prazo");
  const openTitles = books.debts.filter((debt) => debt.remaining > 0);
  const openLoans = books.loans.filter((loan) => loan.remaining > 0);
  const pendingAssets = data.assets.filter((asset) => asset.origin === "aquisicao" && !entries.some((entry) => entry.kind === "aquisicao" && entry.assetId === asset.id));
  function payload() {
    const kind = draft.kind;
    const iso = toIso(draft.date);
    if (!iso) return null;
    const base = { kind, date: iso, description: (draft.description || "").trim(), settlement: draft.settlement, term: draft.term };
    if (["compra", "venda", "compra_prazo", "venda_prazo"].includes(kind)) {
      const quantity = Number(draft.quantity);
      const unit = toCents(draft.unit);
      if (!draft.itemId || !Number.isInteger(quantity) || quantity <= 0 || !unit) return null;
      base.itemId = draft.itemId;
      base.itemName = data.items.find((item) => item.id === draft.itemId)?.name;
      base.quantity = quantity;
      base.unitCents = unit;
      base.totalCents = quantity * unit;
      if (kind.endsWith("prazo")) {
        if (!draft.partnerId || !draft.dueDate) return null;
        base.partnerId = draft.partnerId;
        base.partnerName = (kind === "compra_prazo" ? data.suppliers : data.customers).find((partner) => partner.id === draft.partnerId)?.name;
        base.dueDate = toIso(draft.dueDate) || draft.dueDate;
      }
    } else if (kind === "devolucao") {
      if (!draft.refId || !Number.isInteger(Number(draft.quantity))) return null;
      base.refId = draft.refId;
      base.quantity = Number(draft.quantity);
    } else if (kind === "pagamento" || kind === "recebimento") {
      if (!draft.refId || !toCents(draft.amount)) return null;
      base.refId = draft.refId;
      base.totalCents = toCents(draft.amount);
    } else if (kind === "pagamento_emprestimo") {
      if (!draft.loanId || !toCents(draft.amount)) return null;
      base.loanId = draft.loanId;
      base.totalCents = toCents(draft.amount);
    } else if (kind === "pagamento_encargo") {
      if (!toCents(draft.amount)) return null;
      base.charge = draft.charge;
      base.totalCents = toCents(draft.amount);
    } else if (kind === "aquisicao") {
      if (!draft.assetId) return null;
      base.assetId = draft.assetId;
    } else if (toCents(draft.amount)) base.totalCents = toCents(draft.amount);
    else return null;
    return base;
  }
  const built = payload();
  const preview = built ? assessDraft({ items: data.items, assets: data.assets, entries, cash, settings }, { ...built, id: "preview", createdAt: Date.now() }) : null;
  function submit(event) {
    event.preventDefault();
    if (!toIso(draft.date)) { setBad(true); setMessage("Escreva a data como dd/mm/aaaa. O exercício só aceita 2026."); return; }
    if (!built) { setBad(true); setMessage("Preencha a data, o valor e o item ou a conta."); return; }
    const result = assessDraft({ items: data.items, assets: data.assets, entries, cash, settings }, { ...built, id: crypto.randomUUID(), createdAt: Date.now() });
    setBad(!result.ok); setMessage(result.message);
    if (!result.ok) return;
    setEntries((old) => [...old, result.entry]);
    setDraft((old) => ({ ...old, amount: "", unit: "", description: "", quantity: "1" }));
  }
  function undo() {
    const last = lastEntry(entries);
    if (!last || !confirm("Excluir o último lançamento?")) return;
    setEntries((old) => old.filter((entry) => entry.id !== last.id));
    if ((last.kind === "venda_prazo" || last.kind === "compra_prazo") && draft.refId === last.id) {
      setDraft((old) => ({ ...old, refId: "" }));
      setMessage("");
      setBad(false);
    }
  }
  const partners = draft.kind === "compra_prazo" ? data.suppliers : data.customers;
  const stockKinds = ["compra", "venda", "compra_prazo", "venda_prazo"];
  const moneyKinds = ["aluguel", "salario", "energia", "outra_despesa", "emprestimo", "juros", "dividendos", "integralizacao", "reducao_capital", "reserva", "pagamento_emprestimo", "pagamento_encargo", "pagamento", "recebimento"];
  return <div>
    <h2>{title}</h2>
    <p className="hint">Depreciação, amortização de licença e provisão para garantia não se digitam. O sistema apura os três em 31/12.</p>
    <form onSubmit={submit}><div className="form-grid">
      <label className="field">Operação<select value={draft.kind} onChange={(event) => set("kind", event.target.value)}>{mode === "prazo" ? <>
        <option value="venda_prazo">Venda a prazo</option><option value="compra_prazo">Compra a prazo</option><option value="recebimento">Recebimento</option><option value="pagamento">Pagamento a fornecedor</option>
      </> : <>
        <optgroup label="Mercadorias"><option value="compra">Compra à vista</option><option value="venda">Venda à vista</option><option value="devolucao">Devolução de venda</option></optgroup>
        <optgroup label="Despesas"><option value="aluguel">Aluguel</option><option value="salario">Salários</option><option value="energia">Água e energia</option><option value="outra_despesa">Outra despesa</option></optgroup>
        <optgroup label="Empréstimos"><option value="emprestimo">Empréstimo obtido</option><option value="pagamento_emprestimo">Pagamento de empréstimo</option><option value="juros">Juros</option><option value="pagamento_encargo">Pagar conta em aberto</option></optgroup>
        <optgroup label="Patrimônio"><option value="dividendos">Dividendos</option><option value="integralizacao">Aumento de capital</option><option value="reducao_capital">Redução de capital</option><option value="reserva">Constituição de reserva</option></optgroup>
        <optgroup label="Bens"><option value="aquisicao">Aquisição de bem</option></optgroup>
      </>}</select></label>
      <label className="field">Data (dd/mm/aaaa)<input required inputMode="numeric" placeholder="15/01/2026" value={draft.date} onChange={(event) => set("date", event.target.value)} /></label>
      {stockKinds.includes(draft.kind) && <>
        <label className="field">Mercadoria<select value={draft.itemId || ""} onChange={(event) => set("itemId", event.target.value)}><option value="">Selecione</option>{data.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field">Quantidade<input value={draft.quantity || ""} onChange={(event) => set("quantity", event.target.value)} /></label>
        <label className="field">Preço unitário (R$)<input value={draft.unit || ""} onChange={(event) => set("unit", event.target.value)} /></label>
        {draft.kind.endsWith("prazo") && <>
          <label className="field">{draft.kind === "compra_prazo" ? "Fornecedor" : "Cliente"}<select value={draft.partnerId || ""} onChange={(event) => set("partnerId", event.target.value)}><option value="">Selecione</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
          <label className="field">Vencimento (dd/mm/aaaa)<input inputMode="numeric" placeholder="28/02/2026" value={draft.dueDate || ""} onChange={(event) => set("dueDate", event.target.value)} /></label>
        </>}
      </>}
      {draft.kind === "devolucao" && <>
        <label className="field">Venda<select value={draft.refId || ""} onChange={(event) => set("refId", event.target.value)}><option value="">Selecione</option>{sales.map((sale) => <option key={sale.id} value={sale.id}>{formatDate(sale.date)} · {sale.itemName} · {sale.quantity - (sale.returnedQty || 0)} un.</option>)}</select></label>
        <label className="field">Quantidade devolvida<input value={draft.quantity || ""} onChange={(event) => set("quantity", event.target.value)} /></label>
      </>}
      {(draft.kind === "pagamento" || draft.kind === "recebimento") && <label className="field">Título<select value={draft.refId || ""} onChange={(event) => set("refId", event.target.value)}><option value="">Selecione</option>{openTitles.filter((debt) => draft.kind === "pagamento" ? debt.kind === "compra_prazo" : debt.kind === "venda_prazo").map((debt) => <option key={debt.id} value={debt.id}>{debt.partnerName} · {formatBRL(debt.remaining)}</option>)}</select></label>}
      {draft.kind === "pagamento_emprestimo" && <label className="field">Empréstimo<select value={draft.loanId || ""} onChange={(event) => set("loanId", event.target.value)}><option value="">Selecione</option>{openLoans.map((loan) => <option key={loan.id} value={loan.id}>{formatDate(loan.date)} · {formatBRL(loan.remaining)} · {loan.term === "longo" ? "longo" : "curto"}</option>)}</select></label>}
      {draft.kind === "pagamento_encargo" && <label className="field">Conta<select value={draft.charge} onChange={(event) => set("charge", event.target.value)}><option value="salarios">Salários a pagar</option><option value="aluguel">Aluguel a pagar</option><option value="juros">Juros a pagar</option><option value="dividendos">Dividendos a pagar</option></select></label>}
      {draft.kind === "emprestimo" && <label className="field">Prazo<select value={draft.term} onChange={(event) => set("term", event.target.value)}><option value="curto">Curto prazo — empréstimos bancários</option><option value="longo">Longo prazo — financiamentos</option></select></label>}
      {draft.kind === "aquisicao" && <label className="field">Bem comprado no exercício<select value={draft.assetId || ""} onChange={(event) => set("assetId", event.target.value)}><option value="">Selecione</option>{pendingAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} · {formatBRL(toCents(asset.value))}</option>)}</select></label>}
      {["aluguel", "salario", "juros", "dividendos"].includes(draft.kind) && <label className="field">Forma<select value={draft.settlement} onChange={(event) => set("settlement", event.target.value)}><option value="vista">À vista, pelo caixa</option><option value="pagar">Fica a pagar</option></select></label>}
      {moneyKinds.includes(draft.kind) && <label className="field">Valor (R$)<input value={draft.amount || ""} onChange={(event) => set("amount", event.target.value)} /></label>}
      <label className="field">Histórico<input value={draft.description || ""} maxLength={180} onChange={(event) => set("description", event.target.value)} /></label>
    </div>
    {preview && <div className={preview.ok ? "notice" : "notice bad"}>{preview.ok ? "Prévia do lançamento" : preview.message}{preview.ok && <table className="data preview"><tbody>{preview.lines.map((line, index) => <tr key={index}><td className={line.c ? "journal-line credit" : ""}>{line.d ? "D" : "C"} {line.name}</td><td className="num">{formatNumber(line.d || line.c)}</td></tr>)}</tbody></table>}</div>}
    {message && !preview && <div className={bad ? "notice bad" : "notice"}>{message}</div>}
    <div className="actions" style={{ marginTop: 12 }}><button className="primary">Registrar</button>{entries.length > 0 && <button type="button" className="secondary" onClick={undo}>Excluir último</button>}</div>
    </form>
    <JournalTable rows={books.journal.filter((row) => mode !== "prazo" || ["compra_prazo", "venda_prazo", "pagamento", "recebimento"].includes(row.kind))} />
  </div>;
}
function JournalTable({ rows }) {
  if (!rows.length) return <p className="quiet">Nenhum lançamento.</p>;
  return <div className="table-wrap block"><table className="data"><thead><tr><th>Data</th><th>Histórico</th><th>Partidas</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td>{row.synthetic ? "Apuração · " : ""}{row.history || KIND_LABELS[row.kind]}</td><td>{row.lines.map((line, index) => {
      const credit = row.kind === "devolucao" ? !line.c : !!line.c;
      return <div className={credit ? "journal-line credit" : "journal-line"} key={index}><span>{credit ? "C" : "D"} {line.name}</span><span className="num">{formatNumber(line.d || line.c)}</span></div>;
    })}</td></tr>)}
  </tbody></table></div>;
}

function Stock({ data, books }) {
  const [itemId, setItemId] = useState(data.items[0]?.id || "");
  const item = data.items.find((row) => row.id === itemId) || data.items[0];
  return <>
    <h2>Posição</h2>
    <p className="hint">Custo {books.method === "peps" ? "PEPS" : "médio"}. A devolução volta pelo custo da saída original, mesmo que uma compra posterior tenha mudado a média.</p>
    <StockTable items={data.items} balances={books.balances} />
    {item && <>
      <div className="filters"><label className="field">Ficha<select value={item.id} onChange={(event) => setItemId(event.target.value)}>{data.items.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label></div>
      <Kardex item={item} movements={books.movements.filter((row) => row.itemId === item.id)} />
    </>}
  </>;
}
function StockTable({ items, balances }) {
  if (!items.length) return <p className="quiet">Cadastre os itens para ver o estoque.</p>;
  return <div className="table-wrap"><table className="data"><thead><tr><th>Item</th><th className="num">Quantidade</th><th className="num">Custo médio</th><th className="num">Valor</th></tr></thead><tbody>
    {items.map((item) => {
      const row = balances[item.id] || { qty: 0, value: 0 };
      return <tr key={item.id}><td>{item.name}</td><td className="num">{row.qty}</td><td className="num">{row.qty ? formatBRL(Math.round(row.value / row.qty)) : "—"}</td><td className="num">{formatBRL(row.value)}</td></tr>;
    })}
  </tbody></table></div>;
}
function unitCost(total, qty) { return qty ? Math.round(total / qty) : 0; }
function cell(qty, total) { return qty ? <>{qty}</> : ""; }
function Kardex({ item, movements }) {
  const openingQty = Number(item.quantity || 0);
  const safeQty = Number.isInteger(openingQty) && openingQty > 0 ? openingQty : 0;
  const openingValue = Math.round(safeQty * (toCents(item.unitCost) || 0));
  const rows = [{ date: "2026-01-01", history: "Saldo inicial", inQty: 0, inTotal: 0, outQty: 0, outTotal: 0, balQty: safeQty, balTotal: openingValue }, ...movements.map((row) => {
    const delta = row.afterValue - row.beforeValue;
    const inbound = delta > 0;
    const total = Math.abs(delta);
    return { date: row.date, history: KIND_LABELS[row.kind] || row.kind, inQty: inbound ? row.quantity : 0, inTotal: inbound ? total : 0, outQty: inbound ? 0 : row.quantity, outTotal: inbound ? 0 : total, balQty: row.afterQty, balTotal: row.afterValue };
  })];
  const show = (qty, total) => qty ? formatNumber(total) : "";
  return <div className="table-wrap"><table className="kardex"><thead>
    <tr><th rowSpan="2">Data</th><th rowSpan="2">Histórico</th><th colSpan="3">Entrada</th><th colSpan="3">Saída</th><th colSpan="3">Saldo</th></tr>
    <tr><th className="num">Qtd</th><th className="num">Unit.</th><th className="num">Total</th><th className="num">Qtd</th><th className="num">Unit.</th><th className="num">Total</th><th className="num">Qtd</th><th className="num">Unit.</th><th className="num">Total</th></tr>
  </thead><tbody>
    {rows.map((row, index) => <tr key={index}>
      <td>{formatDate(row.date)}</td><td>{row.history}</td>
      <td className="num">{cell(row.inQty)}</td><td className="num">{row.inQty ? formatNumber(unitCost(row.inTotal, row.inQty)) : ""}</td><td className="num">{show(row.inQty, row.inTotal)}</td>
      <td className="num">{cell(row.outQty)}</td><td className="num">{row.outQty ? formatNumber(unitCost(row.outTotal, row.outQty)) : ""}</td><td className="num">{show(row.outQty, row.outTotal)}</td>
      <td className="num">{row.balQty}</td><td className="num">{row.balQty ? formatNumber(unitCost(row.balTotal, row.balQty)) : ""}</td><td className="num">{formatNumber(row.balTotal)}</td>
    </tr>)}
  </tbody></table></div>;
}

function Statements({ report, month, setMonth, settings, data, entries, cash }) {
  const books = useMemo(() => computeBooks({ items: data.items, assets: data.assets, entries, cash, settings, month }), [data, entries, cash, settings, month]);
  const period = month ? `${MONTH_OPTIONS.find((row) => row[0] === month)?.[1]} de 2026` : "1º de janeiro a 31 de dezembro de 2026";
  const when = month ? `31/${month.slice(5)}/2026` : "31/12/2026";
  return <>
    <div className="filters no-print">
      <label className="field">Período<select value={month} onChange={(event) => setMonth(event.target.value)}>{MONTH_OPTIONS.map(([value, label]) => <option key={value || "ano"} value={value}>{label}</option>)}</select></label>
      <button className="secondary" onClick={() => download("demonstracoes-2026.csv", statementCsv(books), "text/csv")}>Exportar CSV</button>
      <button className="secondary" onClick={() => window.print()}>Imprimir</button>
    </div>
    {month === "2026-12" && <p className="hint">Dezembro inclui as operações do mês e a apuração do ano inteiro, lançada em 31/12. A soma dos doze meses fecha com o lucro anual.</p>}
    {report === "dre" && <Sheet><Lines rows={books.dreLines} /></Sheet>}
    {report === "bp" && <Balance period={period} when={when} books={books} />}
    {report === "dmpl" && <Dmpl books={books} />}
    {report === "dfc" && <CashFlow books={books} />}
    {report === "direto" && <DirectFlow books={books} />}
    {report === "dva" && <Dva books={books} />}
    {report === "diario" && <Sheet><JournalTable rows={books.journal} /></Sheet>}
    {report === "razao" && <Ledger journal={books.journal} />}
  </>;
}
function Sheet({ children }) {
  return <div className="relato">{children}</div>;
}
function Lines({ rows }) {
  let inside = false;
  return <table className="statement"><tbody>{rows.map((row, index) => {
    if (row.kind === "header" || row.header) { inside = true; return <tr className="group" key={index}><th colSpan="2">{row.label || row.name}</th></tr>; }
    const indent = row.depth || (inside && row.kind === "item");
    if (row.kind === "total" || row.kind === "grand") inside = false;
    return <tr className={row.kind === "grand" ? "grand" : row.kind === "total" ? "total" : indent ? "indent" : ""} key={index}><td>{row.label || row.name}</td><td className={row.value === 0 ? "num zero" : "num"}>{formatNumber(row.value)}</td></tr>;
  })}</tbody></table>;
}
function Balance({ when, books }) {
  const ativo = [{ name: "Ativo circulante", header: true }, ...books.assetCurrent, { name: "Ativo não circulante", header: true }, ...books.assetNonCurrent, { name: "Total do ativo", value: books.assetsTotal, kind: "grand" }];
  const passivo = [{ name: "Passivo circulante", header: true }, ...books.liabilityCurrent, { name: "Passivo não circulante", header: true }, ...books.liabilityNonCurrent, { name: "Total do passivo", value: books.liabilitiesTotal, kind: "total" }, { name: "Patrimônio líquido", header: true }, ...books.equityRows.map((row) => ({ ...row, depth: 1 })), { name: "Total do passivo e do patrimônio líquido", value: books.liabilitiesTotal + books.equityTotal, kind: "grand" }];
  return <Sheet>
    <h3>Ativo</h3><Lines rows={ativo} />
    <h3>Passivo e patrimônio líquido</h3><Lines rows={passivo} />
    <Carimbo difference={books.difference} when={when} />
  </Sheet>;
}
function Dmpl({ books }) {
  const rows = [...books.dmplRows, { name: "Saldo final", capital: books.dmplFinal.capital, reserves: books.dmplFinal.reserves, retained: books.dmplFinal.retained }];
  return <Sheet>
    <div className="table-wrap"><table className="matrix"><thead><tr><th></th><th className="num">Capital social</th><th className="num">Reservas de lucros</th><th className="num">Lucros acumulados</th><th className="num">Total</th></tr></thead><tbody>
      {rows.map((row) => <tr className={row.name === "Saldo final" ? "grand" : ""} key={row.name}><td>{row.name}</td><td className="num">{formatNumber(row.capital)}</td><td className="num">{formatNumber(row.reserves)}</td><td className="num">{formatNumber(row.retained)}</td><td className="num">{formatNumber(row.capital + row.reserves + row.retained)}</td></tr>)}
    </tbody></table></div>
  </Sheet>;
}
function CashFlow({ books }) {
  const flow = books.indirect;
  const rows = [
    { name: "Atividades operacionais", header: true }, ...flow.operational, { name: "Caixa gerado nas operações", value: flow.operatingNet, kind: "total" },
    { name: "Atividades de investimento", header: true }, ...flow.investing, { name: "Caixa usado em investimento", value: flow.investingNet, kind: "total" },
    { name: "Atividades de financiamento", header: true }, ...flow.financing, { name: "Caixa líquido de financiamento", value: flow.financingNet, kind: "total" },
    { name: "Variação do caixa", value: flow.cashChange, kind: "total" },
    { name: "Caixa inicial", value: books.cashFlow.openingCash, kind: "item" },
    { name: "Caixa final", value: books.cashFlow.closingCash, kind: "grand" },
  ];
  return <Sheet><Lines rows={rows} /><p className="hint">Juros pagos permanecem no operacional, pelo lucro líquido e pelo ajuste de juros a pagar.</p></Sheet>;
}
function DirectFlow({ books }) {
  const groups = books.direct.groups;
  const section = (title, rows, sign = 1) => [{ name: title, header: true }, ...(rows.length ? rows.map((row) => ({ name: row.name, value: sign * row.value })) : [{ name: "—", value: 0 }])];
  const rows = [
    ...section("Entradas operacionais", groups.operatingIn),
    ...section("Saídas operacionais", groups.operatingOut, -1),
    { name: "Caixa operacional", value: books.direct.operatingNet, kind: "total" },
    ...section("Investimentos", groups.investingOut, -1),
    { name: "Caixa de investimento", value: books.direct.investingNet, kind: "total" },
    ...section("Entradas de financiamento", groups.financingIn),
    ...section("Saídas de financiamento", groups.financingOut, -1),
    { name: "Caixa de financiamento", value: books.direct.financingNet, kind: "total" },
    { name: "Variação do caixa", value: books.direct.operatingNet + books.direct.investingNet + books.direct.financingNet, kind: "grand" },
  ];
  return <Sheet><p className="hint">Visão extra. A folha pede o método indireto.</p><Lines rows={rows} /></Sheet>;
}
function Dva({ books }) {
  const dva = books.dva;
  const rows = [
    { name: "Receitas", header: true }, ...dva.revenues, { name: "Receita líquida", value: dva.netRevenue, kind: "total" },
    { name: "Insumos adquiridos de terceiros", header: true }, ...dva.inputs,
    { name: "Valor adicionado bruto", value: dva.grossAdded, kind: "total" },
    { name: "Retenções", header: true }, ...dva.retentions,
    { name: "Valor adicionado líquido", value: dva.netAdded, kind: "total" },
    { name: "Distribuição", header: true }, ...dva.distribution,
    { name: "Valor distribuído", value: dva.distributed, kind: "grand" },
  ];
  return <Sheet><Lines rows={rows} /><p className="hint">{dva.difference === 0 ? "O valor adicionado líquido foi todo distribuído." : `Diferença de ${formatNumber(dva.difference)}.`}</p></Sheet>;
}
function Ledger({ journal }) {
  const accounts = ledgerFrom(journal);
  return <Sheet>{accounts.map((account) => <section className="account" key={account.name}><h3>{account.name}</h3><table className="data"><thead><tr><th>Data</th><th>Histórico</th><th className="num">Débito</th><th className="num">Crédito</th><th className="num">Saldo</th></tr></thead><tbody>{account.lines.map((line, index) => <tr key={index}><td>{formatDate(line.date)}</td><td>{line.history}</td><td className="num">{line.debit ? formatNumber(line.debit) : ""}</td><td className="num">{line.credit ? formatNumber(line.credit) : ""}</td><td className="num">{formatNumber(line.balance)}</td></tr>)}</tbody></table></section>)}{!accounts.length && <p className="quiet">Sem movimento.</p>}</Sheet>;
}

function Extras({ settings, setSettings, data, cash, entries, setData, setCash, setEntries, books, onSample, onClear }) {
  const [message, setMessage] = useState("");
  const [bad, setBad] = useState(false);
  function restore(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = validateBackup(JSON.parse(String(reader.result)));
        setData({ ...emptyData(), ...parsed.data });
        setCash(String(parsed.cash));
        setEntries(parsed.entries);
        if (parsed.settings) setSettings({ ...defaultSettings(), ...parsed.settings });
        setBad(false); setMessage("Cópia restaurada. Os relatórios foram recalculados.");
      } catch (error) { setBad(true); setMessage(error.message || "Arquivo recusado."); }
    };
    reader.readAsText(file);
  }
  const diary = [["Data", "Histórico", "Conta", "Débito", "Crédito"]];
  for (const row of books.journal) for (const line of row.lines) diary.push([formatDate(row.date), row.history, line.name, line.d ? (line.d / 100).toFixed(2) : "", line.c ? (line.c / 100).toFixed(2) : ""]);
  return <>
    <div className="form-grid">
      <label className="field">Nome da empresa<input value={settings.companyName} onChange={(event) => setSettings({ ...settings, companyName: event.target.value })} /></label>
      <label className="field">Atividade<input value={settings.activity} onChange={(event) => setSettings({ ...settings, activity: event.target.value })} /></label>
    </div>
    <p className="hint">Período travado em 01/01/2026 a 31/12/2026. Data fora desse intervalo é recusada e não altera o saldo.</p>
    <div className="tool-row">
      <button className="secondary" onClick={() => download("papelaria-2026.json", JSON.stringify({ schema: 1, exercise: 2026, data, cash, entries, settings }, null, 2), "application/json")}>Baixar cópia</button>
      <label className="secondary">Restaurar<input type="file" accept="application/json" hidden onChange={(event) => event.target.files?.[0] && restore(event.target.files[0])} /></label>
      <button className="secondary" onClick={() => download("diario-2026.csv", csv(diary), "text/csv")}>CSV do diário</button>
      <button className="secondary" onClick={() => download("demonstracoes-2026.csv", statementCsv(books), "text/csv")}>CSV das demonstrações</button>
      <button className="secondary" onClick={() => window.print()}>Imprimir</button>
      <button className="secondary" onClick={onSample}>Saldos da papelaria</button>
      <button className="secondary" onClick={onClear}>Apagar dados deste navegador</button>
    </div>
    {message && <div className={bad ? "notice bad" : "notice"}>{message}</div>}
    <section className="block"><h2>Conferência</h2>
      <ul>
        <li>Lucro líquido calculado: {formatBRL(books.result)}</li>
        <li>Capital social calculado a partir dos saldos iniciais: {formatBRL(books.capitalCents)}</li>
        <li>Depreciação do período: {formatBRL(books.depreciation)} · Amortização: {formatBRL(books.amortization)} · Provisão: {formatBRL(books.provision)}</li>
        <li>{books.difference === 0 ? "O balanço fecha." : `O balanço tem diferença de ${formatBRL(books.difference)}.`}</li>
        {books.issues.map((issue) => <li key={issue}>{issue}</li>)}
        {!books.issues.length && <li>Ficha de estoque, títulos, razão e demonstrações contam a mesma história.</li>}
      </ul>
    </section>
  </>;
}
