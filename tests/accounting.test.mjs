import {test,after} from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {writeFile,unlink} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import path from "node:path";

const output=path.resolve(".accounting-test-bundle.mjs");
const result=await build({
 entryPoints:["src/Accounting.jsx","src/Results.jsx","src/ExtraStatements.jsx","src/ProjectTools.jsx"],
 bundle:true,platform:"node",format:"esm",packages:"external",write:false,outfile:output,logLevel:"silent"
});
await writeFile(output,result.outputFiles[0].contents);
after(async()=>{await unlink(output).catch(()=>{});});
const {rebuild,accountLines,validExerciseDate,computeStatement,computeExtraStatements,validateBackup,csv}=await import(pathToFileURL(output).href);
const items=[{id:"item1",name:"Produto",quantity:10,unitCost:100}];
const assets=[{id:"asset1",name:"Equipamento",value:8250,residual:250}];
const entry=(kind,date,totalCents,more={},time=1)=>({id:kind+"-"+time,kind,date,totalCents,createdAt:time,...more});
const entries=[
 entry("compra","2026-01-02",200000,{itemId:"item1",quantity:10},1),
 entry("venda","2026-01-03",100000,{itemId:"item1",quantity:4,costCents:60000},2),
 entry("venda_prazo","2026-01-04",60000,{itemId:"item1",quantity:2,costCents:30000,dueDate:"2026-02-01",partnerId:"client1"},3),
 entry("recebimento","2026-01-05",20000,{refId:"venda_prazo-3"},4),
 entry("aluguel","2026-01-06",10000,{},5),
 entry("emprestimo","2026-01-07",500000,{},6),
 entry("amortizacao","2026-01-08",100000,{loanId:"emprestimo-6"},7),
 entry("depreciacao","2026-01-09",25000,{assetId:"asset1"},8)
];
test("partidas dobradas em todas as classes de eventos",()=>{
 const cases=[
  ...entries,
  entry("compra_prazo","2026-01-10",10000,{itemId:"item1",quantity:1}),
  entry("pagamento","2026-01-11",5000,{refId:"compra_prazo-1"}),
  ...["salario","energia","outra_despesa","juros"].map(k=>entry(k,"2026-01-12",500))
 ];
 for(const e of cases){const lines=accountLines(e);assert.ok(lines.length>0,e.kind);assert.equal(lines.reduce((s,l)=>s+l.d-l.c,0),0,e.kind);}
});
test("saldo de estoque, devedor, empréstimo e caixa",()=>{
 const r=rebuild(items,entries);
 assert.equal(r.balances.item1.qty,14);
 assert.equal(r.balances.item1.value,210000);
 assert.equal(r.netCash,310000);
 assert.equal(r.debts[0].remaining,40000);
 assert.equal(r.loans[0].remaining,400000);
 assert.equal(r.depreciation.asset1,25000);
});
test("DRE e balanço encerram sem diferença",()=>{
 const s=computeStatement({items,assets,entries,cash:30000,capital:39250});
 assert.equal(s.revenue,160000);
 assert.equal(s.cmv,90000);
 assert.equal(s.operating,35000);
 assert.equal(s.result,35000);
 assert.equal(s.assetsTotal,4360000);
 assert.equal(s.liabilitiesTotal,400000);
 assert.equal(s.equityTotal,3960000);
 assert.equal(s.difference,0);
 assert.deepEqual(s.issues,[]);
});
test("balancete e DFC conciliam com Balanço",()=>{
 const s=computeExtraStatements({items,assets,entries,cash:30000,capital:39250});
 assert.equal(s.trialDifference,0);
 assert.equal(s.cashChange,310000);
 assert.equal(s.closingCash,3310000);
 assert.equal(s.cashDifference,0);
});
test("datas fora de 2026 não são aceitas",()=>{
 assert.equal(validExerciseDate("2026-02-29"),false);
 assert.equal(validExerciseDate("2026-12-31"),true);
 assert.equal(validExerciseDate("2027-01-01"),false);
});
test("backup JSON aceito e arquivo inválido rejeitado",()=>{
 const backup={schema:1,exercise:2026,data:{items,assets,suppliers:[],customers:[],accounts:[]},cash:"30000",entries};
 assert.equal(validateBackup(backup).entries.length,8);
 assert.throws(()=>validateBackup({...backup,exercise:2027}));
 assert.throws(()=>validateBackup({...backup,entries:[{...entries[0],date:"2027-01-01"}]}));
 assert.throws(()=>validateBackup({...backup,data:{...backup.data,items:[]}}));
});
test("CSV neutraliza fórmula em campos textuais",()=>{
 assert.match(csv([["=cmd|x","normal"]]),/"'=cmd\|x"/);
 assert.match(csv([["texto; com delimitador"]]),/"texto; com delimitador"/);
});
