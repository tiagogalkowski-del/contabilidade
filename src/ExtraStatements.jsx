import React from "react";
import {computeStatement} from "./Results.jsx";

const cents=n=>Math.round(Number(n||0)*100);
const money=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const total=rows=>rows.reduce((sum,row)=>sum+row.value,0);

export function computeExtraStatements({items=[],assets=[],entries=[],cash=0,capital=39250}){
 const statement=computeStatement({items,assets,entries,cash,capital});
 const trial=statement.trial.map(row=>({
  name:row.name,
  debit:Math.max(0,row.net),
  credit:Math.max(0,-row.net)
 })).filter(row=>row.debit||row.credit);
 const totalDebit=trial.reduce((s,r)=>s+r.debit,0);
 const totalCredit=trial.reduce((s,r)=>s+r.credit,0);
 const groups={
  operatingIn:[{name:"Recebimentos de vendas à vista",value:0},{name:"Recebimentos de clientes a prazo",value:0}],
  operatingOut:[{name:"Pagamentos de compras à vista",value:0},{name:"Pagamentos a fornecedores",value:0},{name:"Aluguéis e despesas operacionais pagas",value:0},{name:"Salários pagos",value:0},{name:"Água e energia pagas",value:0},{name:"Juros pagos",value:0}],
  financingIn:[{name:"Empréstimos obtidos",value:0}],
  financingOut:[{name:"Amortização de empréstimos",value:0}]
 };
 const byKind={
  venda:["operatingIn",0],recebimento:["operatingIn",1],
  compra:["operatingOut",0],pagamento:["operatingOut",1],
  aluguel:["operatingOut",2],outra_despesa:["operatingOut",2],
  salario:["operatingOut",3],energia:["operatingOut",4],juros:["operatingOut",5],
  emprestimo:["financingIn",0],amortizacao:["financingOut",0]
 };
 for(const entry of entries){
  const destination=byKind[entry.kind];
  if(destination)groups[destination[0]][destination[1]].value+=Number(entry.totalCents||0);
 }
 const operatingNet=total(groups.operatingIn)-total(groups.operatingOut);
 const financingNet=total(groups.financingIn)-total(groups.financingOut);
 const investingNet=0;
 const cashChange=operatingNet+financingNet+investingNet;
 const openingCash=cents(cash);
 const closingCash=openingCash+cashChange;
 const balanceCash=statement.assetsRows.find(row=>row.name==="Caixa")?.value??0;
 const equity=[
  {name:"Capital social inicial",value:statement.capitalCents},
  {name:"Lucro/prejuízo apurado no exercício",value:statement.result}
 ];
 return {statement,trial,totalDebit,totalCredit,trialDifference:totalDebit-totalCredit,groups,operatingNet,financingNet,investingNet,cashChange,openingCash,closingCash,balanceCash,cashDifference:closingCash-balanceCash,equity,equityClosing:total(equity)};
}
function CashTable({title,rows,negative=false}){
 return <div className="statement-block"><h3>{title}</h3><div className="table-wrap"><table><thead><tr><th>Movimentação</th><th className="amount-cell">Valor</th></tr></thead><tbody>{rows.map(r=><tr key={r.name}><td>{r.name}</td><td className="amount-cell">{money(r.value)}</td></tr>)}<tr className="statement-total"><td>Total {negative?"de saídas":"de entradas"}</td><td className="amount-cell">{money(total(rows))}</td></tr></tbody></table></div></div>
}
function SummaryLine({name,value}){return <div className="statement-result"><span>{name}</span><strong>{money(value)}</strong></div>}
export function ExtraStatements({view="balancete",...props}){
 const s=computeExtraStatements(props);
 const ok=s.trialDifference===0&&s.cashDifference===0&&!s.statement.issues.length;
 return <div className="panel">
  <div className="section-head"><div><small>ETAPA 8 — EXERCÍCIO DE 2026</small><h3>Demais demonstrações contábeis</h3></div><span className={ok?"balance-ok":"balance-pending"}>{ok?"Conferências consistentes":"Revisão necessária"}</span></div>
  <p className="hint">Relatórios complementares simplificados, derivados dos lançamentos e do capital inicial cadastrados. Não substituem demonstrativos oficiais nem criam operações que não constam da atividade.</p>
  <div className="ledger-metrics">
   <div><span>Balancete — diferença</span><strong>{money(s.trialDifference)}</strong></div>
   <div><span>Variação do caixa</span><strong>{money(s.cashChange)}</strong></div>
   <div><span>Patrimônio líquido final</span><strong>{money(s.equityClosing)}</strong></div>
  </div>
  {view==="balancete"&&<><div className="section-head"><div><small>RELATÓRIO 1</small><h3>Balancete de verificação em 31/12/2026</h3></div></div>
  <div className="table-wrap"><table><thead><tr><th>Conta</th><th className="amount-cell">Saldo devedor</th><th className="amount-cell">Saldo credor</th></tr></thead><tbody>{s.trial.map(r=><tr key={r.name}><td>{r.name}</td><td className="amount-cell">{money(r.debit)}</td><td className="amount-cell">{money(r.credit)}</td></tr>)}<tr className="statement-total"><td>Total</td><td className="amount-cell">{money(s.totalDebit)}</td><td className="amount-cell">{money(s.totalCredit)}</td></tr></tbody></table></div>
  <p className="hint">Balancete anterior ao encerramento das contas de resultado. O saldo inicial do patrimônio é registrado pelo capital informado e exige conferência com os ativos iniciais.</p>
  </>}
  {view==="dfc"&&<><div className="section-head"><div><small>RELATÓRIO 2</small><h3>Demonstração dos Fluxos de Caixa — método direto simplificado</h3></div></div>
  <CashTable title="Entradas operacionais" rows={s.groups.operatingIn}/>
  <CashTable title="Saídas operacionais" rows={s.groups.operatingOut} negative/>
  <SummaryLine name="Fluxo líquido operacional" value={s.operatingNet}/>
  <CashTable title="Entradas de financiamento" rows={s.groups.financingIn}/>
  <CashTable title="Saídas de financiamento" rows={s.groups.financingOut} negative/>
  <SummaryLine name="Fluxo líquido de financiamento" value={s.financingNet}/>
  <p className="hint">Não há fluxo de investimentos registrado durante o exercício nas funcionalidades atuais; os bens do cadastro são tratados como saldo inicial, não como aquisições de 2026.</p>
  <SummaryLine name="Variação líquida do caixa" value={s.cashChange}/>
  <SummaryLine name="Saldo inicial do caixa" value={s.openingCash}/>
  <SummaryLine name="Saldo final do caixa" value={s.closingCash}/>
  </>}
  {view==="pl"&&<><div className="section-head"><div><small>RELATÓRIO 3</small><h3>Movimentação do patrimônio líquido — simplificada</h3></div></div>
  <div className="statement-block"><div className="table-wrap"><table><thead><tr><th>Descrição</th><th className="amount-cell">Valor</th></tr></thead><tbody>{s.equity.map(r=><tr key={r.name}><td>{r.name}</td><td className="amount-cell">{money(r.value)}</td></tr>)}<tr className="statement-total"><td>Patrimônio líquido ao final de 2026</td><td className="amount-cell">{money(s.equityClosing)}</td></tr></tbody></table></div></div>
  <p className="hint">Não foram implementados aportes posteriores, distribuição de lucros ou reservas. O resultado é demonstrado sem simular distribuição nem encerramento definitivo.</p>
  </>}
  <div className="section-head"><div><small>RECONCILIAÇÃO</small><h3>Conferência entre demonstrativos</h3></div></div>
  {ok?<div className="statement-success">Balancete e fluxo de caixa conciliados com os lançamentos e o balanço cadastrado.</div>:<div className="statement-warning"><strong>Há informações pendentes de conferência.</strong><ul>
   {s.trialDifference!==0&&<li>Balancete apresenta diferença de {money(s.trialDifference)}.</li>}
   {s.cashDifference!==0&&<li>Caixa da DFC difere do balanço em {money(s.cashDifference)}.</li>}
   {s.statement.issues.map((issue,i)=><li key={i}>{issue}</li>)}
  </ul></div>}
  <p className="hint">A confirmação dos dados do enunciado e testes com lançamentos de exemplo fazem parte da etapa final. Os relatórios usam apenas dados deste navegador.</p>
 </div>;
}
