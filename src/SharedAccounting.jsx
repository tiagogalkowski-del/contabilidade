import {useCallback,useEffect,useRef,useState} from "react";

const URL=(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/$/,"");
const KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||"";
const CONFIGURED=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(URL)&&KEY.startsWith("sb_publishable_");
const HEADERS={"apikey":KEY,"Content-Type":"application/json"};
const tableUrl=URL+"/rest/v1/contabilidade_compartilhada?id=eq.1&select=versao,dados,atualizado_em";
const rpcUrl=URL+"/rest/v1/rpc/salvar_contabilidade_compartilhada";

async function readRemote(){
 const res=await fetch(tableUrl,{headers:HEADERS,cache:"no-store"});
 const body=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(body?.message||"Falha ao ler Supabase ("+res.status+")");
 const row=Array.isArray(body)?body[0]:null;
 if(!row||!row.dados||!row.dados.data||!Array.isArray(row.dados.entries))throw new Error("Crie as tabelas Supabase antes de sincronizar.");
 return row;
}
async function writeRemote(version,payload){
 const res=await fetch(rpcUrl,{method:"POST",headers:HEADERS,body:JSON.stringify({p_versao_esperada:version,p_dados:payload})});
 const obj=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(obj?.message||"Falha ao salvar ("+res.status+")");
 return obj;
}
const payloadFor=(data,cash,entries)=>({schema:1,exercise:2026,data,cash:String(cash),entries});
function hasData(snapshot){
 return snapshot.entries.length>0||Object.values(snapshot.data).some(rows=>rows.length>0)||Number(snapshot.cash)!==0;
}
export function useSharedAccounting({data,setData,cash,setCash,entries,setEntries}){
 const initial=useRef(payloadFor(data,cash,entries));
 const [ready,setReady]=useState(!CONFIGURED),[status,setStatus]=useState(CONFIGURED?"Carregando banco compartilhado...":"Modo local — Supabase ainda não configurado"),[changeId,setChangeId]=useState(0);
 const version=useRef(null),pending=useRef(false),changes=useRef(0),timer=useRef(null),lock=useRef(false);
 const current=useRef(payloadFor(data,cash,entries));
 current.current=payloadFor(data,cash,entries);
 changes.current=changeId;
 const apply=(row)=>{
  version.current=Number(row.versao);
  setData(row.dados.data);setCash(String(row.dados.cash));setEntries(row.dados.entries);
 };
 const load=useCallback(async()=>{
  if(!CONFIGURED)return;
  if(pending.current||changes.current>0)return;
  setStatus("Carregando banco compartilhado...");
  try{
   const row=await readRemote();
   apply(row);setReady(true);lock.current=false;setStatus("Dados compartilhados sincronizados");
  }catch(e){setStatus("Erro de conexão: "+e.message);setReady(false)}
 },[setData,setCash,setEntries]);
 useEffect(()=>{
  if(!CONFIGURED)return;
  let cancelled=false;
  readRemote().then(row=>{
   if(cancelled)return;
   apply(row);setReady(true);setStatus("Dados compartilhados sincronizados");
  }).catch(e=>{if(!cancelled){setStatus("Erro de conexão: "+e.message);setReady(false)}});
  return()=>{cancelled=true};
 },[setData,setCash,setEntries]);

 const save=useCallback(async()=>{
  if(!CONFIGURED||!ready||lock.current||pending.current||changes.current===0)return;
  pending.current=true;setStatus("Salvando no Supabase...");
  const serial=changes.current;
  const payload=current.current;
  try{
   const result=await writeRemote(version.current,payload);
   version.current=Number(result.versao);
   if(changes.current===serial){changes.current=0;setChangeId(0)}
   else setChangeId(n=>n===serial?0:n);
   setStatus("Dados compartilhados salvos");
  }catch(e){
   if(e.message.includes("LIMITE_ESCRITAS")){
    setStatus("Aguardando limite de gravações...");
    timer.current=setTimeout(()=>{pending.current=false;save()},2600);
    return;
   }
   lock.current=true;
   setStatus("Alterações não salvas: "+e.message+". Faça backup antes de recarregar a página.");
  }finally{
   if(!timer.current)pending.current=false;
  }
 },[ready]);

 useEffect(()=>{
  if(!CONFIGURED||!ready||changeId===0||lock.current)return;
  clearTimeout(timer.current);timer.current=null;
  const t=setTimeout(()=>save(),900);
  return()=>clearTimeout(t);
 },[ready,changeId,data,cash,entries,save]);

 useEffect(()=>{
  if(!CONFIGURED||!ready)return;
  const t=setInterval(async()=>{
   if(pending.current||changes.current>0||lock.current)return;
   try{
    const row=await readRemote();
    if(Number(row.versao)!==version.current){apply(row);setStatus("Dados atualizados de outro usuário");}
   }catch(e){setStatus("Falha temporária ao atualizar: "+e.message)}
  },12000);
  return()=>clearInterval(t);
 },[ready,setData,setCash,setEntries]);

 function changed(setter){
  return updater=>{
   if(CONFIGURED&&(!ready||lock.current))return;
   setter(updater);
   if(CONFIGURED)setChangeId(n=>n+1);
  };
 }
 const sharedData=changed(setData),sharedCash=changed(setCash),sharedEntries=changed(setEntries);

 async function importLocal(){
  if(!CONFIGURED||!ready||pending.current||changeId!==0)return;
  if(!hasData(initial.current)){setStatus("Não há dados locais anteriores para importar.");return}
  const remote=current.current;
  const warning=hasData(remote)
    ?"ATENÇÃO: o banco já possui registros! Substituir todos os dados compartilhados pelos dados deste navegador?"
    :"Importar os cadastros e lançamentos deste navegador para o banco compartilhado?";
  if(!confirm(warning))return;
  try{
   const result=await writeRemote(version.current,initial.current);
   version.current=Number(result.versao);
   setData(initial.current.data);setCash(initial.current.cash);setEntries(initial.current.entries);
   setStatus("Dados locais importados para o Supabase.");
   initial.current=payloadFor(initial.current.data,initial.current.cash,initial.current.entries);
  }catch(e){setStatus("Importação não realizada: "+e.message)}
 }
 return {
  configured:CONFIGURED,ready,status,
  setSharedData:sharedData,setSharedCash:sharedCash,setSharedEntries:sharedEntries,
  importLocal,canImport:CONFIGURED&&ready&&hasData(initial.current),
  reload:async()=>{if(changes.current>0&&!confirm("Descartar alterações locais ainda não salvas?"))return;changes.current=0;setChangeId(0);lock.current=false;clearTimeout(timer.current);timer.current=null;pending.current=false;await load();}
 };
}
export function SharedIndicator({shared}){
 return <div className="shared-bar" role="status">
  <span className={"shared-dot "+(shared.configured&&shared.ready?"online":"offline")}/>
  <span>{shared.status}</span>
  {shared.configured&&shared.canImport&&<button type="button" onClick={shared.importLocal}>Importar dados locais anteriores</button>}
  {shared.configured&&<button type="button" onClick={shared.reload}>Recarregar dados</button>}
  {!shared.configured&&<span className="shared-note">Os dados ainda são individuais por navegador.</span>}
 </div>;
}
