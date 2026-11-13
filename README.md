# Contabilidade — Sistema Contábil FURB

Sistema acadêmico desenvolvido em React + Vite, seguindo as etapas da atividade da FURB.

## Etapa 1 — Estrutura
- Sete menus e navegação.
- Exercício contábil fixo de 01/01/2026 a 31/12/2026.

## Etapa 2 — Cadastros
- Cadastro, edição e exclusão de itens, fornecedores, clientes, bens/equipamentos e plano de contas.
- Campos de saldo inicial por item (quantidade e custo unitário).
- Conferência do ativo inicial: caixa + estoque + equipamentos.
- Capital inicial esperado: R$ 39.250,00.
- Persistência temporária no navegador via localStorage.

> Observação: os dados cadastrados ficam no navegador utilizado. Para persistência compartilhada entre dispositivos e publicação final, será necessário conectar um banco de dados (por exemplo, Supabase).

## Rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
