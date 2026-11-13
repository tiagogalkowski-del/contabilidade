import React,{useState} from "react";
import {rebuild,accountLines,validExerciseDate} from "./Accounting.jsx";
const cents=n=>Math.round(Number(n||0)*100);
const money=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const labelDate=d=>d.split("-").reverse().join("/");
export function Credit({items,customers,suppliers,entries,setEntries,cash}){
 const [kind,setKind]=useState("venda_prazo"),[date,setDate]=useState("2026-01-01"),[dueDate,setDueDate]=useState("2026-01-01"),[partnerId,setPartnerId]=useState(""),[itemId,setItemId]=useState(""),[qty,setQty]=useState("1"),[unit,setUnit]=useState(""),[description,setDescription]=useState("");
 const [settleId,setSettleId]=useState(""),[settleDate,setSettleDate]=useState("2026-01-01"),[settleAmount,setSettleAmount]=useState("");
 const [feedback,setFeedback]=useState("");
 const state=rebuild(items,entries);
 const partners=kind==="compra_prazo"?suppliers:customers;
 const partner=partners.find(p=>p.id===partnerId);
 const item=items.find(i=>i.id===itemId);
 const debts=state.debts.filter(d=>d.remaining>0);
 const target=debts.find(d=>d.id===settleId);
 const cashAvailable=cents(cash)+state.netCash;
 const lastDate=entries.reduce((d,e)=>e.date>d?e.date:d,"2026-01-01");
 const validMoney=(n)=>Number.isSafeInteger(n)&&n>0;
 function write(entry,message){if(accountLines(entry).reduce((v,l)=>v+l.d-l.c,0)!==0){setFeedback("Lançamento contábil desequilibrado.");return}setEntries(prev=>[...prev,entry]);setFeedback(message)}
 function addCredit(ev){ev.preventDefault();setFeedback("");
  const q=Number(qty),price=cents(unit),total=q*price;
  if(!validExerciseDate(date)||!validExerciseDate(dueDate)||dueDate<date){setFeedback("Informe datas válidas de operação e vencimento no exercício de 2026.");return}
  if(date<lastDate){setFeedback("Lance os fatos em ordem cronológica para preservar o custo médio.");return}
  if(!partner||!item){setFeedback("Escolha um cliente/fornecedor e uma mercadoria cadastrados.");return}
  if(!Number.isSafeInteger(q)||q<=0||!validMoney(price)||!validMoney(total)){setFeedback("Quantidade inteira e preço unitário positivo são obrigatórios.");return}
  if(kind==="venda_prazo"&&(!state.balances[itemId]||state.balances[itemId].qty<q)){setFeedback("Estoque insuficiente para venda a prazo.");return}
  const b=state.balances[itemId];
  const costCents=kind==="venda_prazo"?Math.round(q*b.value/b.qty):0;
  const e={id:crypto.randomUUID(),createdAt:Date.now(),date,dueDate,kind,itemId,itemName:item.name,partnerId,partnerName:partner.name,quantity:q,unitCents:price,totalCents:total,costCents,description:description.trim()};
  write(e,"Operação a prazo registrada.");setQty("1");setUnit("");setDescription("");
 }
 function settle(ev){ev.preventDefault();setFeedback("");
  if(!target){setFeedback("Selecione um título em aberto.");return}
  const amount=cents(settleAmount);
  if(!validExerciseDate(settleDate)||settleDate<target.date||settleDate<lastDate){setFeedback("Data de quitação inválida ou anterior ao último lançamento.");return}
  if(!validMoney(amount)||amount>target.remaining){setFeedback("Informe valor positivo, limitado ao saldo do título.");return}
  const kind=target.kind==="compra_prazo"?"pagamento":"recebimento";
  if(kind==="pagamento"&&amount>cashAvailable){setFeedback("Caixa insuficiente para o pagamento.");return}
  const e={id:crypto.randomUUID(),createdAt:Date.now(),date:settleDate,kind,refId:target.id,itemId:target.itemId,itemName:target.itemName,partnerId:target.partnerId,partnerName:target.partnerName,totalCents:amount,description:"Baixa de "+target.kind+" em "+target.date};
  write(e,kind==="pagamento"?"Pagamento registrado.":"Recebimento registrado.");setSettleAmount("");
 }
 const payable=debts.filter(d=>d.kind==="compra_prazo").reduce((sum,d)=>sum+d.remaining,0);
 const receivable=debts.filter(d=>d.kind==="venda_prazo").reduce((sum,d)=>sum+d.remaining,0);
 return <div className="panel"><div className="section-head"><div><small>ETAPA 5</small><h3>Operações a prazo</h3></div><span className="balance-ok">Débitos = créditos</span></div>
 <p className="hint">Compras geram Fornecedores a pagar; vendas geram Clientes a receber. A baixa do título movimenta o caixa apenas no pagamento ou recebimento.</p>
 <div className="ledger-metrics"><div><span>A receber</span><strong>{money(receivable)}</strong></div><div><span>A pagar</span><strong>{money(payable)}</strong></div><div><span>Caixa disponível</span><strong>{money(cashAvailable)}</strong></div></div>
 <h3>Registrar compra ou venda a prazo</h3>
 <form onSubmit={addCredit} className="record-form"><div className="form-grid">
 <label>Operação<select value={kind} onChange={e=>{setKind(e.target.value);setPartnerId("")}}><option value="venda_prazo">Venda a prazo</option><option value="compra_prazo">Compra a prazo</option></select></label>
 <label>Data da operação<input type="date" min="2026-01-01" max="2026-12-31" value={date} required onChange={e=>setDate(e.target.value)}/></label>
 <label>Vencimento<input type="date" min="2026-01-01" max="2026-12-31" value={dueDate} required onChange={e=>setDueDate(e.target.value)}/></label>
 <label>{kind==="compra_prazo"?"Fornecedor":"Cliente"}<select value={partnerId} onChange={e=>setPartnerId(e.target.value)} required><option value="">Selecione...</option>{partners.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label>Mercadoria<select value={itemId} onChange={e=>setItemId(e.target.value)} required><option value="">Selecione...</option>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
 <label>Quantidade<input type="number" step="1" min="1" value={qty} required onChange={e=>setQty(e.target.value)}/></label>
 <label>Preço unitário (R$)<input type="number" step=".01" min=".01" value={unit} required onChange={e=>setUnit(e.target.value)}/></label>
 <label>Histórico<input maxLength="180" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Descrição opcional"/></label>
 </div>{item&&<p className="hint">Saldo disponível: {state.balances[itemId]?.qty||0} {item.unit||"un."} • Total: {money(Number(qty)*cents(unit))}</p>}
 <div className="actions"><button className="primary" disabled={!items.length||!partners.length}>Registrar a prazo</button></div></form>
 <h3>Receber ou pagar título</h3>
 <form onSubmit={settle} className="record-form"><div className="form-grid">
 <label>Título em aberto<select required value={settleId} onChange={e=>{setSettleId(e.target.value);setSettleAmount("")}}><option value="">Selecione...</option>{debts.map(d=><option key={d.id} value={d.id}>{d.kind==="compra_prazo"?"Pagar":"Receber"} • {d.partnerName} • {money(d.remaining)} • venc. {labelDate(d.dueDate)}</option>)}</select></label>
 <label>Data do pagamento/recebimento<input type="date" required min="2026-01-01" max="2026-12-31" value={settleDate} onChange={e=>setSettleDate(e.target.value)}/></label>
 <label>Valor da baixa (R$)<input type="number" required min=".01" step=".01" max={target?(target.remaining/100).toFixed(2):undefined} value={settleAmount} onChange={e=>setSettleAmount(e.target.value)}/></label>
 </div><div className="actions"><button className="primary" disabled={!debts.length}>Registrar baixa</button></div></form>
 {feedback&&<div role="status" className="notice">{feedback}</div>}
 <div className="section-head"><div><small>CONTAS A PAGAR E A RECEBER</small><h3>Títulos registrados</h3></div></div>
 {!state.debts.length?<div className="empty-state">Nenhum título registrado.</div>:<div className="table-wrap"><table><thead><tr><th>Tipo</th><th>Cliente/Fornecedor</th><th>Emissão</th><th>Vencimento</th><th>Valor original</th><th>Em aberto</th><th>Situação</th></tr></thead><tbody>{state.debts.map(d=><tr key={d.id}><td>{d.kind==="compra_prazo"?"A pagar":"A receber"}</td><td>{d.partnerName}</td><td>{labelDate(d.date)}</td><td>{labelDate(d.dueDate)}</td><td>{money(d.totalCents)}</td><td>{money(d.remaining)}</td><td>{d.remaining===0?"Quitado":"Em aberto"}</td></tr>)}</tbody></table></div>}
 <p className="hint">Pagamentos parciais são aceitos. Não há cálculo automático de juros, multas ou vencimentos fora de 2026 nesta etapa.</p>
 </div>
}
