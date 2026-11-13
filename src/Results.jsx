import React from "react";
import {accountLines,rebuild} from "./Accounting.jsx";

const toCents=n=>Math.round(Number(n||0)*100);
const money=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const revenueAccounts=["Receita de vendas"];
const costAccounts=["Custo das mercadorias vendidas"];
const expenseAccounts=["Despesa com aluguel","Despesa com salários","Despesa com água e energia","Outras despesas operacionais","Despesa com juros","Despesa com depreciação"];
const allExpenseAccounts=[...costAccounts,...expenseAccounts];
function rowsTotal(rows){return rows.reduce((s,r)=>s+r.value,0)}
export function computeStatement({items=[],assets=[],entries=[],cash=0,capital=39250}){
 const state=rebuild(items,entries);
 const openingCash=toCents(cash);
 const openingInventory=items.reduce((sum,i)=>sum+Number(i.quantity||0)*toCents(i.unitCost),0);
 const openingEquipment=assets.reduce((sum,a)=>sum+toCents(a.value),0);
 const openingTotal=openingCash+openingInventory+openingEquipment;
 const capitalCents=toCents(capital);
 const journals=entries.map(e=>({id:e.id,date:e.date,lines:accountLines(e)}));
 const ledger=new Map();
 function post(name,d,c){const current=ledger.get(name)||{name,debit:0,credit:0};current.debit+=d;current.credit+=c;ledger.set(name,current)}
 post("Caixa",openingCash,0);post("Estoque de mercadorias",openingInventory,0);
 post("Bens e equipamentos",openingEquipment,0);post("Capital social",0,capitalCents);
 for(const j of journals)for(const line of j.lines)post(line.name,line.d,line.c);
 function balance(name){const a=ledger.get(name);return a?a.debit-a.credit:0}
 const revenues=revenueAccounts.map(name=>({name,value:-balance(name)}));
 const costs=costAccounts.map(name=>({name,value:balance(name)}));
 const expenses=expenseAccounts.map(name=>({name,value:balance(name)}));
 const revenue=rowsTotal(revenues),cmv=rowsTotal(costs),operating=rowsTotal(expenses);
 const gross=revenue-cmv,result=gross-operating;
 const cashEnd=openingCash+state.netCash;
 const inventory=Object.values(state.balances).reduce((sum,b)=>sum+b.value,0);
 const customers=state.debts.filter(d=>d.kind==="venda_prazo").reduce((sum,d)=>sum+d.remaining,0);
 const suppliers=state.debts.filter(d=>d.kind==="compra_prazo").reduce((sum,d)=>sum+d.remaining,0);
 const loans=state.loans.reduce((sum,l)=>sum+l.remaining,0);
 const accumulatedDep=Object.values(state.depreciation).reduce((sum,n)=>sum+n,0);
 const assetsRows=[{name:"Caixa",value:cashEnd},{name:"Estoques",value:inventory},{name:"Clientes a receber",value:customers},{name:"Bens e equipamentos",value:openingEquipment},{name:"(-) Depreciação acumulada",value:-accumulatedDep}];
 const liabilitiesRows=[{name:"Fornecedores a pagar",value:suppliers},{name:"Empréstimos a pagar",value:loans}];
 const equityRows=[{name:"Capital social",value:capitalCents},{name:"Resultado do exercício",value:result}];
 const assetsTotal=rowsTotal(assetsRows);
 const liabilitiesTotal=rowsTotal(liabilitiesRows);
 const equityTotal=rowsTotal(equityRows);
 const difference=assetsTotal-liabilitiesTotal-equityTotal;
 const totalDebits=[...ledger.values()].reduce((s,a)=>s+a.debit,0);
 const totalCredits=[...ledger.values()].reduce((s,a)=>s+a.credit,0);
 const issues=[];
 if(openingTotal!==capitalCents)issues.push("Saldos iniciais diferentes do capital informado: diferença de "+money(openingTotal-capitalCents)+".");
 for(const j of journals)if(!j.lines.length||j.lines.reduce((s,l)=>s+l.d-l.c,0)!==0)issues.push("Lançamento sem partidas dobradas válidas em "+j.date+".");
 if(balance("Caixa")!==cashEnd)issues.push("Divergência entre caixa do razão e caixa das movimentações.");
 if(balance("Estoque de mercadorias")!==inventory)issues.push("Divergência entre estoque do razão e custo médio móvel.");
 if(balance("Clientes")!==customers)issues.push("Divergência entre clientes do razão e títulos a receber.");
 if(-balance("Fornecedores")!==suppliers)issues.push("Divergência entre fornecedores do razão e títulos a pagar.");
 if(-balance("Empréstimos a pagar")!==loans)issues.push("Divergência entre razão e saldo de empréstimos.");
 if(-balance("Depreciação acumulada")!==accumulatedDep)issues.push("Divergência de depreciação acumulada.");
 if(difference!==0)issues.push("Balanço Patrimonial apresenta diferença de "+money(difference)+".");
 const trial=[...ledger.values()].map(a=>({name:a.name,debit:a.debit,credit:a.credit,net:a.debit-a.credit}));
 return {openingTotal,capitalCents,revenues,costs,expenses,revenue,cmv,operating,gross,result,assetsRows,liabilitiesRows,equityRows,assetsTotal,liabilitiesTotal,equityTotal,difference,totalDebits,totalCredits,trial,issues,entriesCount:entries.length};
}
function Table({title,rows,totalLabel,total}){return <div className="statement-block"><h3>{title}</h3><div className="table-wrap"><table><thead><tr><th>Conta</th><th className="amount-cell">Valor (R$)</th></tr></thead><tbody>{rows.map(r=><tr key={r.name}><td>{r.name}</td><td className="amount-cell">{money(r.value)}</td></tr>)}<tr className="statement-total"><td>{totalLabel}</td><td className="amount-cell">{money(total)}</td></tr></tbody></table></div></div>}
export function Results({items,assets,entries,cash,capital,view="dre"}){
 const s=computeStatement({items,assets,entries,cash,capital});
 return <div className="panel"><div className="section-head"><div><small>ETAPA 7 — EXERCÍCIO 2026</small><h3>Apuração do resultado e Balanço Patrimonial</h3></div><span className={s.issues.length?"balance-pending":"balance-ok"}>{s.issues.length?"Conferência pendente":"Balanço conferido"}</span></div>
 <p className="hint">Valores calculados dos cadastros iniciais e dos lançamentos registrados neste navegador. O capital de R$ 39.250,00 é uma referência do enunciado e não é ajustado automaticamente para forçar o balanço.</p>
 <div className="ledger-metrics"><div><span>Receita de vendas</span><strong>{money(s.revenue)}</strong></div><div><span>Lucro ou prejuízo</span><strong>{money(s.result)}</strong></div><div><span>Diferença do balanço</span><strong>{money(s.difference)}</strong></div></div>
 {view==="dre"&&<><div className="section-head"><div><small>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</small><h3>DRE — 01/01 a 31/12/2026</h3></div></div>
 <Table title="Receitas" rows={s.revenues} totalLabel="Receita total" total={s.revenue}/>
 <Table title="Custos das mercadorias" rows={s.costs} totalLabel="Lucro bruto (receita − CMV)" total={s.gross}/>
 <Table title="Despesas" rows={s.expenses} totalLabel="Total de despesas" total={s.operating}/>
 <div className="statement-result"><span>Resultado líquido do exercício</span><strong>{money(s.result)}</strong></div>
 </>}
 {view==="balanco"&&<><div className="section-head"><div><small>POSIÇÃO PATRIMONIAL EM 31/12/2026</small><h3>Balanço Patrimonial</h3></div></div>
 <Table title="Ativo" rows={s.assetsRows} totalLabel="Total do ativo" total={s.assetsTotal}/>
 <Table title="Passivo" rows={s.liabilitiesRows} totalLabel="Total do passivo" total={s.liabilitiesTotal}/>
 <Table title="Patrimônio líquido" rows={s.equityRows} totalLabel="Total do patrimônio líquido" total={s.equityTotal}/>
 <div className="statement-result"><span>Passivo + patrimônio líquido</span><strong>{money(s.liabilitiesTotal+s.equityTotal)}</strong></div>
 <div className="statement-result"><span>Diferença: ativo − (passivo + PL)</span><strong>{money(s.difference)}</strong></div>
 </>}
 <div className="section-head"><div><small>CONFERÊNCIAS</small><h3>Validação do exercício</h3></div></div>
 {s.issues.length?<div className="statement-warning"><strong>Verificações pendentes ({s.issues.length})</strong><ul>{s.issues.map((msg,i)=><li key={i}>{msg}</li>)}</ul></div>:<div className="statement-success">Conferência contábil sem divergências identificadas pelas regras implementadas.</div>}
 <p className="hint">Saldos iniciais: {money(s.openingTotal)} · Capital informado: {money(s.capitalCents)} · Partidas no razão: débitos {money(s.totalDebits)} e créditos {money(s.totalCredits)}.</p>
 {view==="razao"&&<><div className="section-head"><div><small>RAZÃO SINTÉTICO</small><h3>Movimentação por conta</h3></div></div>
 <div className="table-wrap"><table><thead><tr><th>Conta</th><th className="amount-cell">Débitos</th><th className="amount-cell">Créditos</th><th className="amount-cell">Saldo devedor (+) / credor (−)</th></tr></thead><tbody>{s.trial.map(r=><tr key={r.name}><td>{r.name}</td><td className="amount-cell">{money(r.debit)}</td><td className="amount-cell">{money(r.credit)}</td><td className="amount-cell">{money(r.net)}</td></tr>)}</tbody></table></div>
 </>}
 <p className="hint">A DRE é simplificada e considera somente eventos já implementados. Tributos, encargos e demais ajustes dependem da folha original da atividade; resultado de referência de R$ 1.332,90 ainda não foi validado.</p>
 </div>;
}
