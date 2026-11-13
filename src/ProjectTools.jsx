import React,{useRef,useState} from "react";
import {accountLines,validExerciseDate} from "./Accounting.jsx";
import {computeStatement} from "./Results.jsx";
import {computeExtraStatements} from "./ExtraStatements.jsx";

const SCHEMA=1;
const sections=["items","suppliers","customers","assets","accounts"];
const validEntryKinds=new Set(["compra","venda","compra_prazo","venda_prazo","pagamento","recebimento","aluguel","salario","energia","outra_despesa","emprestimo","amortizacao","juros","depreciacao"]);
const fmt=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
function download(name,content,mime){
 const blob=new Blob([content],{type:mime});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
const csvValue=value=>{
 let v=String(value??"");
 if(/^[\s]*[=+@-]/.test(v))v="'"+v;
 return '"'+v.replaceAll('"','""')+'"';
};
export function csv(rows){
 return "\uFEFF"+rows.map(row=>row.map(csvValue).join(";")).join("\r\n")+"\r\n";
}
export function validateBackup(json){
 if(!json||typeof json!=="object"||Array.isArray(json)||json.schema!==SCHEMA||json.exercise!==2026)throw Error("Arquivo incompatível com o sistema contábil de 2026.");
 if(!json.data||typeof json.data!=="object"||Array.isArray(json.data)||!sections.every(k=>Array.isArray(json.data[k])))throw Error("Backup não contém os cinco cadastros.");
 if(typeof json.cash!=="string"&&typeof json.cash!=="number")throw Error("Saldo inicial do caixa inválido.");
 if(!Number.isFinite(Number(json.cash))||Number(json.cash)<0||Number(json.cash)>1e12)throw Error("Saldo inicial do caixa fora do limite.");
 if(!Array.isArray(json.entries)||json.entries.length>50000||sections.some(k=>json.data[k].length>10000))throw Error("Quantidade de registros inválida.");
 const ids=new Set();
 for(const k of sections)for(const row of json.data[k]){
  if(!row||typeof row!=="object"||typeof row.id!=="string"||!row.id||ids.has(row.id))throw Error("Cadastros com IDs ausentes ou duplicados.");
  ids.add(row.id);
  if(k==="items"&&(!Number.isFinite(Number(row.quantity||0))||Number(row.quantity||0)<0||!Number.isInteger(Number(row.quantity||0))||!Number.isFinite(Number(row.unitCost||0))||Number(row.unitCost||0)<0))throw Error("Estoque inicial inválido.");
  if(k==="assets"&&(!Number.isFinite(Number(row.value))||Number(row.value)<=0||Number(row.residual||0)>Number(row.value)))throw Error("Bem com valores inválidos.");
 }
 const entryIds=new Set(),known=new Map();
 for(const e of [...json.entries].sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.createdAt||0)-(b.createdAt||0))){
  if(!e||typeof e!=="object"||!validEntryKinds.has(e.kind)||typeof e.id!=="string"||!e.id||entryIds.has(e.id)||!validExerciseDate(e.date))throw Error("Lançamento inválido ou duplicado.");
  if(!Number.isSafeInteger(e.totalCents)||e.totalCents<=0)throw Error("Valor inválido no lançamento.");
  if(["compra","venda","compra_prazo","venda_prazo"].includes(e.kind)){
   if(!json.data.items.some(i=>i.id===e.itemId)||!Number.isInteger(e.quantity)||e.quantity<=0)throw Error("Lançamento de estoque sem item/quantidade válida.");
   if(e.kind.includes("prazo")&&(!validExerciseDate(e.dueDate)||e.dueDate<e.date||!json.data[e.kind==="compra_prazo"?"suppliers":"customers"].some(p=>p.id===e.partnerId)))throw Error("Título a prazo incompleto.");
   if(e.kind.startsWith("venda")&&(!Number.isSafeInteger(e.costCents)||e.costCents<0))throw Error("CMV inválido.");
  }
  if(["pagamento","recebimento"].includes(e.kind)){
   const ref=known.get(e.refId);
   if(!ref||ref.kind!==(e.kind==="pagamento"?"compra_prazo":"venda_prazo")||e.date<ref.date)throw Error("Baixa sem título correspondente.");
  }
  if(e.kind==="amortizacao"&&(!known.has(e.loanId)||known.get(e.loanId).kind!=="emprestimo"))throw Error("Amortização sem empréstimo.");
  if(e.kind==="depreciacao"&&!json.data.assets.some(a=>a.id===e.assetId))throw Error("Depreciação sem bem cadastrado.");
  const lines=accountLines(e);
  if(!lines.length||lines.some(l=>!Number.isSafeInteger(l.d)||!Number.isSafeInteger(l.c))||lines.reduce((n,l)=>n+l.d-l.c,0)!==0)throw Error("Débitos e créditos inválidos.");
  entryIds.add(e.id);known.set(e.id,e);
 }
 return {data:json.data,cash:String(json.cash),entries:json.entries};
}
export function ProjectTools({data,cash,entries,setData,setCash,setEntries,capital}){
 const fileRef=useRef(null);
 const [message,setMessage]=useState("");
 const s=computeStatement({items:data.items,assets:data.assets,entries,cash,capital});
 const other=computeExtraStatements({items:data.items,assets:data.assets,entries,cash,capital});
 function backup(){
  const obj={schema:SCHEMA,exercise:2026,exportedAt:new Date().toISOString(),data,cash,entries};
  download("contabilidade-furb-backup-2026.json",JSON.stringify(obj,null,2),"application/json;charset=utf-8");
  setMessage("Backup gerado. Guarde o arquivo em local seguro.");
 }
 async function restore(event){
  const f=event.target.files?.[0];event.target.value="";if(!f)return;
  if(f.size>3_000_000){setMessage("Arquivo maior que 3 MB.");return}
  try{
   const obj=validateBackup(JSON.parse(await f.text()));
   if(!confirm("Restaurar este backup? Isso substitui TODOS os cadastros, lançamentos e saldo inicial deste navegador."))return;
   setData(obj.data);setCash(obj.cash);setEntries(obj.entries);setMessage("Backup restaurado. Confira as demonstrações.");
  }catch(error){setMessage("Importação cancelada: "+error.message)}
 }
 function exportCsv(){
  const rows=[["Data","Tipo","Histórico","Mercadoria","Parceiro","Valor (R$)","Débito","Crédito"]];
  for(const e of [...entries].sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||0)-(b.createdAt||0))){
   for(const line of accountLines(e))rows.push([e.date,e.kind,e.description||"",e.itemName||e.assetName||"",e.partnerName||"",((e.totalCents||0)/100).toFixed(2).replace(".",","),line.d?line.name:"",line.c?line.name:""]);
  }
  download("contabilidade-furb-livro-diario-2026.csv",csv(rows),"text/csv;charset=utf-8");
  setMessage("Livro diário exportado em CSV compatível com Excel.");
 }
 function exportStatements(){
  const rows=[["Relatório","Conta","Valor (R$)"]];
  const add=(name,arr)=>arr.forEach(r=>rows.push([name,r.name,(r.value/100).toFixed(2).replace(".",",")]));
  add("DRE - Receitas",s.revenues);add("DRE - Custos",s.costs);add("DRE - Despesas",s.expenses);
  rows.push(["DRE","Resultado líquido",(s.result/100).toFixed(2).replace(".",",")]);
  add("Balanço - Ativo",s.assetsRows);add("Balanço - Passivo",s.liabilitiesRows);add("Balanço - PL",s.equityRows);
  rows.push(["Balanço","Diferença",(s.difference/100).toFixed(2).replace(".",",")]);
  add("DFC - Entradas operacionais",other.groups.operatingIn);add("DFC - Saídas operacionais",other.groups.operatingOut);
  rows.push(["DFC","Variação do caixa",(other.cashChange/100).toFixed(2).replace(".",",")]);
  download("contabilidade-furb-demonstracoes-2026.csv",csv(rows),"text/csv;charset=utf-8");
  setMessage("Demonstrativos exportados em CSV.");
 }
 return <div className="panel">
 <div className="section-head"><div><small>ETAPA 9 — FERRAMENTAS</small><h3>Backup e exportação</h3></div></div>
 <p className="hint">Os dados ficam no navegador. Use o backup JSON antes de limpar o histórico, trocar de computador ou testar importações.</p>
 <div className="tool-actions">
 <button type="button" className="primary" onClick={backup}>Baixar backup JSON</button>
 <button type="button" className="secondary" onClick={()=>fileRef.current?.click()}>Restaurar backup JSON</button>
 <button type="button" className="secondary" onClick={exportCsv}>Exportar livro diário CSV</button>
 <button type="button" className="secondary" onClick={exportStatements}>Exportar demonstrações CSV</button>
 <button type="button" className="secondary" onClick={()=>window.print()}>Imprimir / salvar PDF</button>
 </div>
 <input ref={fileRef} style={{display:"none"}} type="file" accept=".json,application/json" onChange={restore}/>
 {message&&<div className="notice" role="status">{message}</div>}
 <div className="section-head"><div><small>ETAPA 10 — CONFERÊNCIA FINAL</small><h3>Checklist contábil</h3></div></div>
 <div className="ledger-metrics">
 <div><span>Lançamentos</span><strong>{entries.length}</strong></div>
 <div><span>Lucro apurado</span><strong>{fmt(s.result)}</strong></div>
 <div><span>Diferença no balanço</span><strong>{fmt(s.difference)}</strong></div>
 </div>
 <ul className="final-checks">
 <li>{s.openingTotal===s.capitalCents?"✓":"⚠"} Ativo inicial igual ao capital informado: {fmt(s.openingTotal)} / {fmt(s.capitalCents)}</li>
 <li>{s.totalDebits===s.totalCredits?"✓":"⚠"} Débitos e créditos do razão: {fmt(s.totalDebits)} / {fmt(s.totalCredits)}</li>
 <li>{other.trialDifference===0?"✓":"⚠"} Balancete: diferença {fmt(other.trialDifference)}</li>
 <li>{other.cashDifference===0?"✓":"⚠"} Conciliação DFC x caixa do balanço: {fmt(other.cashDifference)}</li>
 <li>{s.difference===0?"✓":"⚠"} Ativo = Passivo + PL: diferença {fmt(s.difference)}</li>
 <li>○ Conferir lançamentos e resultado de referência de R$ 1.332,90 com a folha original do exercício</li>
 </ul>
 {s.issues.length>0?<div className="statement-warning"><strong>Pendências detectadas</strong><ul>{s.issues.map((msg,i)=><li key={i}>{msg}</li>)}</ul></div>:<div className="statement-success">As verificações automáticas estão consistentes. A validação com o enunciado ainda é necessária.</div>}
 <p className="hint">Exportações CSV e PDF não equivalem a demonstrações oficiais. A impressão usa a função de impressão do navegador.</p>
 </div>;
}
