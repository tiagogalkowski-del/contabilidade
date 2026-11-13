import React,{useState} from "react";
import {rebuild,accountLines,validExerciseDate} from "./Accounting.jsx";
const fmt=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const moneyToCents=n=>Math.round(Number(n||0)*100);
const labels={aluguel:"Pagamento de aluguel",salario:"Pagamento de salários",energia:"Pagamento de energia/água",outra_despesa:"Outra despesa operacional",emprestimo:"Recebimento de empréstimo",amortizacao:"Amortização de empréstimo",juros:"Pagamento de juros",depreciacao:"Depreciação de bem"};
export function Events({assets,items,entries,setEntries,cash}){
 const [kind,setKind]=useState("aluguel"),[date,setDate]=useState("2026-01-01"),[amount,setAmount]=useState(""),[note,setNote]=useState(""),[assetId,setAssetId]=useState(""),[loanId,setLoanId]=useState(""),[message,setMessage]=useState("");
 const state=rebuild(items,entries);
 const loans=state.loans||[];
 const loan=loans.find(l=>l.id===loanId);
 const asset=assets.find(a=>a.id===assetId);
 const depreciated=state.depreciation?.[assetId]||0;
 const limit=asset?Math.max(0,moneyToCents(asset.value)-moneyToCents(asset.residual)-depreciated):0;
 const cashAvailable=moneyToCents(cash)+state.netCash;
 const lastDate=entries.reduce((d,e)=>e.date>d?e.date:d,"2026-01-01");
 const spend=["aluguel","salario","energia","outra_despesa","amortizacao","juros"].includes(kind);
 function submit(ev){ev.preventDefault();setMessage("");
  const totalCents=moneyToCents(amount);
  if(!validExerciseDate(date)||date<lastDate){setMessage("Data inválida ou anterior ao último lançamento. Registre os fatos em ordem cronológica.");return}
  if(!Number.isSafeInteger(totalCents)||totalCents<=0){setMessage("Informe um valor maior que zero, com até duas casas decimais.");return}
  if(spend&&totalCents>cashAvailable){setMessage("Caixa insuficiente para este pagamento.");return}
  if(kind==="amortizacao"&&(!loan||loan.remaining<=0||totalCents>loan.remaining)){setMessage("Selecione um empréstimo e informe uma amortização até o saldo devido.");return}
  if(kind==="depreciacao"&&(!asset||totalCents>limit)){setMessage("Selecione um bem e respeite o valor depreciável remanescente.");return}
  const entry={id:crypto.randomUUID(),createdAt:Date.now(),kind,date,totalCents,description:note.trim(),...(kind==="depreciacao"?{assetId,assetName:asset.name}:{}) ,...(kind==="amortizacao"?{loanId}:{})};
  const lines=accountLines(entry);
  if(!lines.length||lines.reduce((sum,l)=>sum+l.d-l.c,0)!==0){setMessage("Partidas dobradas inválidas.");return}
  setEntries(previous=>[...previous,entry]);setAmount("");setNote("");setMessage("Evento registrado no livro diário.");
 }
 const eventEntries=entries.filter(e=>Object.hasOwn(labels,e.kind));
 return <div className="panel">
 <div className="section-head"><div><small>ETAPA 6</small><h3>Demais eventos contábeis</h3></div><span className="balance-ok">Partidas dobradas</span></div>
 <p className="hint">Informe somente operações que ocorreram na atividade. Os valores não são preenchidos automaticamente. Despesas são pagas à vista; empréstimos têm controle do principal e depreciação não movimenta o caixa.</p>
 <div className="ledger-metrics"><div><span>Caixa após eventos</span><strong>{fmt(cashAvailable)}</strong></div><div><span>Empréstimos a pagar</span><strong>{fmt(loans.reduce((s,l)=>s+l.remaining,0))}</strong></div><div><span>Depreciação acumulada</span><strong>{fmt(Object.values(state.depreciation||{}).reduce((s,v)=>s+v,0))}</strong></div></div>
 <form className="record-form" onSubmit={submit}>
 <div className="form-grid">
 <label>Tipo de evento<select value={kind} onChange={e=>{setKind(e.target.value);setLoanId("");setAssetId("");setAmount("");setMessage("")}}>{Object.entries(labels).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label>
 <label>Data do fato<input type="date" min="2026-01-01" max="2026-12-31" required value={date} onChange={e=>setDate(e.target.value)}/></label>
 {kind==="amortizacao"&&<label>Empréstimo<select required value={loanId} onChange={e=>setLoanId(e.target.value)}><option value="">Selecione...</option>{loans.filter(l=>l.remaining>0).map(l=><option key={l.id} value={l.id}>{l.description||"Empréstimo de "+l.date} — saldo {fmt(l.remaining)}</option>)}</select></label>}
 {kind==="depreciacao"&&<label>Bem/equipamento<select required value={assetId} onChange={e=>setAssetId(e.target.value)}><option value="">Selecione...</option>{assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
 <label>Valor do evento (R$)<input type="number" min=".01" step=".01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label>Histórico<input value={note} maxLength="180" onChange={e=>setNote(e.target.value)} placeholder="Complemento do lançamento"/></label>
 </div>
 {kind==="depreciacao"&&<p className="hint">Limite depreciável restante do bem: {fmt(limit)}. O valor informado é a despesa deste lançamento; confira o método de depreciação da atividade.</p>}
 {kind==="amortizacao"&&<p className="hint">Principal do empréstimo em aberto: {fmt(loan?.remaining||0)}. Juros devem ser lançados separadamente.</p>}
 {message&&<div className="notice" role="status">{message}</div>}
 <div className="actions"><button className="primary" disabled={kind==="depreciacao"?!asset||limit<=0:kind==="amortizacao"?!loan||loan.remaining<=0:false}>Registrar evento</button></div>
 </form>
 <div className="section-head"><div><small>HISTÓRICO</small><h3>Eventos registrados</h3></div></div>
 {!eventEntries.length?<div className="empty-state">Nenhum evento registrado.</div>:<div className="table-wrap"><table><thead><tr><th>Data</th><th>Evento</th><th>Histórico</th><th>Valor</th><th>Contas (D/C)</th></tr></thead><tbody>{[...eventEntries].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt).map(e=><tr key={e.id}><td>{e.date.split("-").reverse().join("/")}</td><td>{labels[e.kind]}</td><td>{e.description||e.assetName||"—"}</td><td>{fmt(e.totalCents)}</td><td>{accountLines(e).map((l,i)=><div className="journal-line" key={i}>{l.d?"D":"C"} — {l.name}: {fmt(l.d||l.c)}</div>)}</td></tr>)}</tbody></table></div>}
 <p className="hint">Não inclua tributos, provisões ou encargos automaticamente: serão validados conforme o enunciado original.</p>
 </div>;
}
