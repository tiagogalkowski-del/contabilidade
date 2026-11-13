import React,{useEffect,useMemo,useState} from "react";
import{createRoot}from"react-dom/client";
import"./styles.css";
import {Ledger,Inventory,loadEntries,saveEntries} from "./Accounting.jsx";
import {Credit} from "./Credit.jsx";
import {Events} from "./Events.jsx";
import {Results} from "./Results.jsx";
import {ExtraStatements} from "./ExtraStatements.jsx";
import {ProjectTools} from "./ProjectTools.jsx";

const CAPITAL=39250;
const menus=[["inicio","⌂","Início"],["cadastros","▣","Cadastros"],["lancamentos","↔","Lançamentos"],["estoque","▤","Estoque"],["prazo","◷","A Prazo"],["eventos","◆","Demais Eventos"],["resultado","▥","Resultado e Balanço"],["demonstracoes","▦","Demonstrações"],["ferramentas","⚙","Ferramentas e Testes"]];
const info={inicio:["Visão geral","Sistema contábil acadêmico — exercício de 2026."],cadastros:["Cadastros","Itens, clientes, fornecedores, bens e plano de contas."],lancamentos:["Lançamentos","Registro contábil com débito e crédito."],estoque:["Estoque","Controle de entradas, saídas, saldo e custo médio."],prazo:["Operações a prazo","Contas a receber e contas a pagar."],eventos:["Demais eventos","Aluguel, salários, empréstimos, juros e outros eventos."],resultado:["Resultado e Balanço","Demonstração do resultado e Balanço Patrimonial."],demonstracoes:["Outras demonstrações","Balancete, fluxo de caixa e patrimônio líquido."],ferramentas:["Ferramentas e testes","Backup, exportação e conferências finais."]};
const sections=[
 {id:"items",label:"Itens",fields:[["name","Descrição","text",true],["sku","Código","text"],["unit","Unidade","text"],["quantity","Quantidade inicial","number"],["unitCost","Custo unitário inicial (R$)","number"]]},
 {id:"suppliers",label:"Fornecedores",fields:[["name","Nome / Razão social","text",true],["document","CPF / CNPJ","text"],["phone","Telefone","text"],["email","E-mail","email"],["address","Endereço","text"]]},
 {id:"customers",label:"Clientes",fields:[["name","Nome / Razão social","text",true],["document","CPF / CNPJ","text"],["phone","Telefone","text"],["email","E-mail","email"],["address","Endereço","text"]]},
 {id:"assets",label:"Bens e equipamentos",fields:[["name","Descrição do bem","text",true],["acquiredAt","Data de aquisição","date"],["value","Valor de aquisição (R$)","number",true],["usefulLife","Vida útil (anos)","number"],["residual","Valor residual (R$)","number"]]},
 {id:"accounts",label:"Plano de contas",fields:[["code","Código","text",true],["name","Nome da conta","text",true],["group","Grupo","select",true,["Ativo","Passivo","Patrimônio Líquido","Receita","Despesa"]],["nature","Natureza","select",true,["Devedora","Credora"]]]}
];
const emptyData=()=>Object.fromEntries(sections.map(s=>[s.id,[]]));
function readData(){try{return JSON.parse(localStorage.getItem("contabilidade-cadastros"))||emptyData()}catch{return emptyData()}}
function money(n){return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function App(){
 const[active,setActive]=useState("inicio"),[data,setData]=useState(readData),[tab,setTab]=useState("items");
 useEffect(()=>localStorage.setItem("contabilidade-cadastros",JSON.stringify(data)),[data]);
 const [cash,setCash]=useState(()=>localStorage.getItem("contabilidade-caixa-inicial")||"");
 useEffect(()=>localStorage.setItem("contabilidade-caixa-inicial",cash),[cash]);
 const [entries,setEntries]=useState(loadEntries);
 useEffect(()=>saveEntries(entries),[entries]);
 const [editing,setEditing]=useState(null),[form,setForm]=useState({});
 const [notice,setNotice]=useState("");
 const current=sections.find(s=>s.id===tab)||sections[0];
 const stockValue=data.items.reduce((a,x)=>a+Number(x.quantity||0)*Number(x.unitCost||0),0);
 const equipmentValue=data.assets.reduce((a,x)=>a+Number(x.value||0),0);
 const totalAssets=Number(cash||0)+stockValue+equipmentValue;
 const balanced=Math.abs(totalAssets-CAPITAL)<0.005;
 function selectTab(id){setTab(id);setEditing(null);setForm({});setNotice("")}
 function startNew(){setEditing("new");setForm({})}
 function edit(row){setEditing(row.id);setForm({...row})}
 function save(e){
  e.preventDefault();
  for(const [key,label,type,required] of current.fields){if(required&&!String(form[key]??"").trim()){setNotice("Preencha o campo obrigatório: "+label);return}}
  if(current.id==="items"&&(Number(form.quantity||0)<0||Number(form.unitCost||0)<0)){setNotice("Quantidade e custo não podem ser negativos.");return}
  if(current.id==="assets"&&(Number(form.value||0)<=0||Number(form.usefulLife||0)<0)){setNotice("Informe valor positivo e vida útil válida.");return}
  if(editing!=="new"&&((tab==="assets"&&entries.some(e=>e.kind==="depreciacao"&&e.assetId===editing))||(tab==="items"&&entries.some(e=>e.itemId===editing))||(tab==="suppliers"&&entries.some(e=>e.kind==="compra_prazo"&&e.partnerId===editing))||(tab==="customers"&&entries.some(e=>e.kind==="venda_prazo"&&e.partnerId===editing)))){setNotice("Não é possível editar cadastro vinculado a lançamentos.");return}
  const row={...form,id:editing==="new"?crypto.randomUUID():editing};
  setData(old=>({...old,[tab]:editing==="new"?[...old[tab],row]:old[tab].map(x=>x.id===editing?row:x)}));
  setEditing(null);setForm({});setNotice("Cadastro salvo com sucesso.");
 }
 function remove(id){if((tab==="assets"&&entries.some(e=>e.kind==="depreciacao"&&e.assetId===id))||(tab==="items"&&entries.some(e=>e.itemId===id))||(tab==="suppliers"&&entries.some(e=>e.kind==="compra_prazo"&&e.partnerId===id))||(tab==="customers"&&entries.some(e=>e.kind==="venda_prazo"&&e.partnerId===id))){setNotice("Não é possível excluir cadastro vinculado a lançamentos.");return}if(!confirm("Excluir este cadastro?"))return;setData(old=>({...old,[tab]:old[tab].filter(x=>x.id!==id)}));setNotice("Cadastro excluído.")}
 return <div className="app"><aside><div className="brand"><b>Σ</b><div><strong>Sistema Contábil</strong><small>FURB • 2026</small></div></div><nav><label>MENU PRINCIPAL</label>{menus.map(([id,icon,name])=><button className={active===id?"active":""} onClick={()=>setActive(id)} key={id}><i>{icon}</i>{name}</button>)}</nav><footer>Exercício<strong>01/01/2026 — 31/12/2026</strong></footer></aside>
 <main><header><div><small>CONTABILIDADE GERAL</small><h1>{info[active][0]}</h1></div><div className="period">Período<strong>2026</strong></div></header><section><div className="intro"><div><h2>{info[active][1]}</h2><p>Período contábil fixo: 01/01/2026 a 31/12/2026.</p></div><span className="status">● Etapas 1 a 10 — validação dos dados pendente</span></div>
 {active==="inicio"?<Dashboard data={data} totalAssets={totalAssets} balanced={balanced}/>:active==="cadastros"?<div className="panel"><div className="tabs">{sections.map(s=><button key={s.id} className={tab===s.id?"selected":""} onClick={()=>selectTab(s.id)}>{s.label}<span>{data[s.id].length}</span></button>)}</div><div className="section-head"><div><small>CADASTROS</small><h3>{current.label}</h3></div><button className="primary" onClick={startNew}>+ Novo cadastro</button></div>
 {notice&&<div className="notice">{notice}</div>}
 {editing!==null?<form className="record-form" onSubmit={save}><div className="form-grid">{current.fields.map(([key,label,type,required,options])=><label key={key}>{label}{type==="select"?<select required={!!required} value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Selecione...</option>{options.map(o=><option key={o}>{o}</option>)}</select>:<input type={type} required={!!required} min={type==="number"?"0":type==="date"?"2026-01-01":undefined} max={type==="date"?"2026-12-31":undefined} step={type==="number"?"0.01":undefined} value={form[key]??""} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}</div><div className="actions"><button type="button" className="secondary" onClick={()=>{setEditing(null);setForm({})}}>Cancelar</button><button className="primary" type="submit">Salvar cadastro</button></div></form>:<DataTable section={current} rows={data[tab]} onEdit={edit} onRemove={remove}/>}
 </div>:null}
 {active==="lancamentos"&&<Ledger items={data.items} entries={entries} setEntries={setEntries} cash={cash}/>}
 {active==="estoque"&&<Inventory items={data.items} entries={entries}/>}
 {active==="prazo"&&<Credit items={data.items} customers={data.customers} suppliers={data.suppliers} entries={entries} setEntries={setEntries} cash={cash}/>}
 {active==="eventos"&&<Events items={data.items} assets={data.assets} entries={entries} setEntries={setEntries} cash={cash}/>}
 {active==="resultado"&&<Results items={data.items} assets={data.assets} entries={entries} cash={cash} capital={CAPITAL}/>}
 {active==="demonstracoes"&&<ExtraStatements items={data.items} assets={data.assets} entries={entries} cash={cash} capital={CAPITAL}/>}
 {active==="ferramentas"&&<ProjectTools data={data} cash={cash} entries={entries} setData={setData} setCash={setCash} setEntries={setEntries} capital={CAPITAL}/>}
 {active==="cadastros"&&<OpeningBalances cash={cash} setCash={entries.length?undefined:setCash} stockValue={stockValue} equipmentValue={equipmentValue} totalAssets={totalAssets} balanced={balanced} items={data.items} assets={data.assets}/>}
 </section></main></div>
}
function DataTable({section,rows,onEdit,onRemove}){return rows.length===0?<div className="empty-state"><strong>Nenhum registro cadastrado</strong><p>Use “Novo cadastro” para adicionar o primeiro registro.</p></div>:<div className="table-wrap"><table><thead><tr>{section.fields.map(f=><th key={f[0]}>{f[1]}</th>)}<th>Ações</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}>{section.fields.map(f=><td key={f[0]}>{f[2]==="number"&&["unitCost","value","residual"].includes(f[0])?money(r[f[0]]):r[f[0]]||"—"}</td>)}<td><button className="link-btn" onClick={()=>onEdit(r)}>Editar</button><button className="link-btn danger" onClick={()=>onRemove(r.id)}>Excluir</button></td></tr>)}</tbody></table></div>}
function OpeningBalances({cash,setCash,stockValue,equipmentValue,totalAssets,balanced,items,assets}){return <div className="opening"><div className="section-head"><div><small>SALDOS INICIAIS</small><h3>Conferência do capital inicial</h3></div><span className={balanced?"balance-ok":"balance-pending"}>{balanced?"Ativo confere":"Pendente de conferência"}</span></div><p className="hint">Informe o saldo inicial do caixa. O estoque e os equipamentos são calculados a partir dos cadastros acima. Não preenchemos valores que não aparecem na atividade.</p><label className="cash-field">Saldo inicial do caixa (R$)<input type="number" min="0" step="0.01" value={cash} disabled={!setCash} onChange={e=>setCash?.(e.target.value)} placeholder="0,00"/></label><div className="balance-grid"><div><span>Caixa</span><strong>{money(cash)}</strong></div><div><span>Estoque inicial ({items.length} itens)</span><strong>{money(stockValue)}</strong></div><div><span>Equipamentos ({assets.length} bens)</span><strong>{money(equipmentValue)}</strong></div><div className="total"><span>Total do ativo inicial</span><strong>{money(totalAssets)}</strong></div><div><span>Capital inicial esperado</span><strong>{money(CAPITAL)}</strong></div><div><span>Diferença</span><strong>{money(totalAssets-CAPITAL)}</strong></div></div><p className="hint">Critério de teste da atividade: ativo inicial = capital inicial de R$ 39.250,00. Ajuste os saldos conforme os dados fornecidos no restante do caderno.</p></div>}
function Dashboard({data,totalAssets,balanced}){const count=sections.reduce((a,s)=>a+data[s.id].length,0);return <><div className="cards">{[["Capital inicial",money(CAPITAL),"Patrimônio inicial esperado"],["Cadastros",String(count),"Registros salvos neste navegador"],["Ativo inicial",money(totalAssets),"Caixa + estoque + equipamentos"],["Conferência",balanced?"Conferido":"Pendente",balanced?"Ativo igual ao capital":"Ajustar saldos iniciais"]].map(x=><article className="card" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></article>)}</div><div className="grid"><div className="panel"><small>ETAPA 1</small><h3>Estrutura concluída</h3><ul><li>✓ Menus de cadastros, lançamentos e relatórios disponíveis</li><li>✓ Exercício fixado em 2026</li><li>✓ Navegação entre menus</li></ul></div><div className="panel"><small>ETAPA 2</small><h3>Cadastros</h3><p>Itens, fornecedores, clientes, bens e plano de contas. Os dados ficam salvos neste navegador.</p><div className="target">Capital inicial esperado<strong>{money(CAPITAL)}</strong></div></div></div></>}
createRoot(document.getElementById("root")).render(<App/>);