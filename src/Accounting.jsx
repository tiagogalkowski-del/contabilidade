import React,{useState} from "react";

const KEY="contabilidade-lancamentos-v1";
export function loadEntries(){try{const value=JSON.parse(localStorage.getItem(KEY));return Array.isArray(value)?value:[]}catch{return []}}
export function saveEntries(entries){localStorage.setItem(KEY,JSON.stringify(entries))}
const toCents=v=>Math.round(Number(v||0)*100);
const brl=c=> (c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function rebuild(items,entries){
 const balances=Object.fromEntries(items.map(i=>[i.id,{qty:Number(i.quantity||0),value:Math.round(Number(i.quantity||0)*toCents(i.unitCost))}]));
 const ordered=[...entries].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt);
 const movements=[];let netCash=0;
 for(const e of ordered){
  const b=balances[e.itemId];
  if(!b)continue;
  const beforeQty=b.qty,beforeValue=b.value;
  if(e.kind==="compra"){b.qty+=e.quantity;b.value+=e.totalCents;netCash-=e.totalCents}
  else if(e.kind==="venda"){b.qty-=e.quantity;b.value-=e.costCents;netCash+=e.totalCents}
  movements.push({...e,beforeQty,beforeValue,afterQty:b.qty,afterValue:b.value})
 }
 return {balances,movements,netCash}
}
function lines(e){return e.kind==="compra"?
 [{name:"Estoque de mercadorias",d:e.totalCents,c:0},{name:"Caixa",d:0,c:e.totalCents}]:
 [{name:"Caixa",d:e.totalCents,c:0},{name:"Receita de vendas",d:0,c:e.totalCents},{name:"Custo das mercadorias vendidas",d:e.costCents,c:0},{name:"Estoque de mercadorias",d:0,c:e.costCents}]}
export function Ledger({items,entries,setEntries,cash}){
 const [kind,setKind]=useState("compra"),[date,setDate]=useState("2026-01-01"),[itemId,setItemId]=useState(""),[qty,setQty]=useState("1"),[unit,setUnit]=useState(""),[note,setNote]=useState(""),[msg,setMsg]=useState("");
 const state=rebuild(items,entries),available=state.balances[itemId],current=items.find(i=>i.id===itemId),cashCents=toCents(cash)+state.netCash;
 function submit(ev){ev.preventDefault();setMsg("");
  const quantity=Number(qty),price=toCents(unit),total=quantity*price;
  if(!/^2026-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date+"T12:00:00Z"))||new Date(date+"T12:00:00Z").toISOString().slice(0,10)!==date){setMsg("Informe uma data válida no exercício de 2026.");return}
  if(!current){setMsg("Selecione uma mercadoria cadastrada.");return}
  if(!Number.isSafeInteger(quantity)||quantity<=0||!Number.isSafeInteger(price)||price<=0||!Number.isSafeInteger(total)){setMsg("Informe quantidade inteira e preço unitário positivos.");return}
  if(entries.some(x=>x.date>date)){setMsg("Registre as operações por ordem cronológica para manter o custo médio correto.");return}
  if(kind==="compra"&&total>cashCents){setMsg("Saldo de caixa insuficiente para a compra à vista.");return}
  if(kind==="venda"&&(!available||quantity>available.qty)){setMsg("Estoque insuficiente para esta venda.");return}
  const costCents=kind==="venda"?Math.round(quantity*available.value/available.qty):0;
  const entry={id:crypto.randomUUID(),createdAt:Date.now(),date,kind,itemId,itemName:current.name,quantity,unitCents:price,totalCents:total,costCents,description:note.trim()};
  if(lines(entry).reduce((v,l)=>v+l.d-l.c,0)!==0){setMsg("Os débitos e créditos não conferem.");return}
  setEntries(previous=>[...previous,entry]);setQty("1");setUnit("");setNote("");setMsg("Lançamento registrado.");
 }
 function undo(){if(!entries.length||!confirm("Excluir o último lançamento?"))return;const last=[...entries].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt).at(-1);setEntries(previous=>previous.filter(e=>e.id!==last.id))}
 return <div className="panel"><div className="section-head"><div><small>ETAPA 3</small><h3>Compras e vendas à vista</h3></div><span className="balance-ok">Débito = Crédito</span></div>
 <p className="hint">As operações atualizam o estoque pelo custo médio móvel. Cadastre primeiro mercadorias e saldo inicial de caixa na aba Cadastros.</p>
 <div className="ledger-metrics"><div><span>Caixa atual</span><strong>{brl(cashCents)}</strong></div><div><span>Operações</span><strong>{entries.length}</strong></div><div><span>Estoque atual</span><strong>{brl(Object.values(state.balances).reduce((s,b)=>s+b.value,0))}</strong></div></div>
 <form className="record-form" onSubmit={submit}><div className="form-grid">
 <label>Operação<select value={kind} onChange={e=>setKind(e.target.value)}><option value="compra">Compra à vista</option><option value="venda">Venda à vista</option></select></label>
 <label>Data<input type="date" value={date} min="2026-01-01" max="2026-12-31" onChange={e=>setDate(e.target.value)} required/></label>
 <label>Mercadoria<select value={itemId} onChange={e=>setItemId(e.target.value)} required><option value="">Selecione...</option>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
 <label>Quantidade<input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)} required/></label>
 <label>Preço unitário (R$)<input type="number" min=".01" step=".01" value={unit} onChange={e=>setUnit(e.target.value)} required/></label>
 <label>Histórico<input value={note} maxLength="180" onChange={e=>setNote(e.target.value)} placeholder="Descrição opcional"/></label>
 </div>{current&&<p className="hint">Saldo disponível: {available?.qty??0} {current.unit||"un."} · Total: {brl(Number(qty)*toCents(unit))}</p>}{msg&&<div className="notice" role="status">{msg}</div>}
 <div className="actions"><button className="primary" disabled={!items.length}>Registrar lançamento</button></div></form>
 <div className="section-head"><div><small>LIVRO DIÁRIO</small><h3>Histórico</h3></div>{entries.length>0&&<button className="secondary" onClick={undo}>Excluir último</button>}</div>
 {!state.movements.length?<div className="empty-state">Nenhum lançamento registrado.</div>:<div className="table-wrap"><table><thead><tr><th>Data</th><th>Operação</th><th>Item</th><th>Quantidade</th><th>Valor</th><th>Débitos / Créditos</th></tr></thead><tbody>{state.movements.map(e=><tr key={e.id}><td>{e.date.split("-").reverse().join("/")}</td><td>{e.kind==="compra"?"Compra":"Venda"}</td><td>{e.itemName}</td><td>{e.quantity}</td><td>{brl(e.totalCents)}</td><td>{lines(e).map((l,i)=><div className="journal-line" key={i}>{l.d?"D":"C"} — {l.name}: {brl(l.d||l.c)}</div>)}</td></tr>)}</tbody></table></div>}
 <p className="hint">Operações a prazo serão implementadas em etapa posterior. Dados guardados apenas neste navegador.</p></div>
}
export function Inventory({items,entries}){
 const [filter,setFilter]=useState(""),[chosen,setChosen]=useState("");
 const {balances,movements}=rebuild(items,entries);
 const shown=items.filter(i=>(i.name+" "+(i.sku||"")).toLowerCase().includes(filter.toLowerCase()));
 const history=movements.filter(e=>!chosen||e.itemId===chosen);
 return <div className="panel"><div className="section-head"><div><small>ETAPA 4</small><h3>Controle de estoque</h3></div><span className="balance-ok">Custo médio móvel</span></div>
 <p className="hint">Saldo inicial dos cadastros + compras à vista − custo das vendas. O saldo é recalculado por data.</p>
 <div className="ledger-metrics"><div><span>Itens cadastrados</span><strong>{items.length}</strong></div><div><span>Unidades disponíveis</span><strong>{items.reduce((s,i)=>s+(balances[i.id]?.qty||0),0)}</strong></div><div><span>Valor em estoque</span><strong>{brl(items.reduce((s,i)=>s+(balances[i.id]?.value||0),0))}</strong></div></div>
 <label className="inventory-search">Pesquisar mercadoria<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Código ou nome"/></label>
 {!items.length?<div className="empty-state">Cadastre uma mercadoria para consultar o estoque.</div>:<div className="table-wrap"><table><thead><tr><th>Código</th><th>Mercadoria</th><th>Saldo</th><th>Custo médio unitário</th><th>Valor total</th><th>Situação</th></tr></thead><tbody>{shown.map(i=>{const b=balances[i.id]||{qty:0,value:0};return <tr key={i.id}><td>{i.sku||"—"}</td><td>{i.name}</td><td>{b.qty} {i.unit||"un."}</td><td>{brl(b.qty?b.value/b.qty:0)}</td><td>{brl(b.value)}</td><td>{b.qty?"Disponível":"Sem saldo"}</td></tr>})}</tbody></table></div>}
 <div className="section-head"><div><small>KARDEX SIMPLIFICADO</small><h3>Movimentações</h3></div></div>
 <label className="inventory-search">Filtrar item<select value={chosen} onChange={e=>setChosen(e.target.value)}><option value="">Todos</option>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
 {!history.length?<div className="empty-state">Nenhuma movimentação registrada.</div>:<div className="table-wrap"><table><thead><tr><th>Data</th><th>Mercadoria</th><th>Tipo</th><th>Entrada</th><th>Saída</th><th>Custo da saída</th><th>Saldo</th><th>Valor do saldo</th></tr></thead><tbody>{history.map(e=><tr key={e.id}><td>{e.date.split("-").reverse().join("/")}</td><td>{e.itemName}</td><td>{e.kind==="compra"?"Compra":"Venda"}</td><td>{e.kind==="compra"?e.quantity:"—"}</td><td>{e.kind==="venda"?e.quantity:"—"}</td><td>{e.kind==="venda"?brl(e.costCents):"—"}</td><td>{e.afterQty}</td><td>{brl(e.afterValue)}</td></tr>)}</tbody></table></div>}
 </div>
}
