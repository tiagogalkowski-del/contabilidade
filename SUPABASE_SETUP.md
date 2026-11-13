# Supabase compartilhado — Sistema Contábil FURB

Projeto Supabase informado: `https://xfsuukxxvnvwsivuqgzg.supabase.co`

## Como ativar (uma vez)

1. Abra o seu projeto Supabase em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Em **SQL Editor**, execute por completo o arquivo [supabase/migrations/20261113_public_shared_accounting.sql](supabase/migrations/20261113_public_shared_accounting.sql). Ele cria uma linha compartilhada, histórico privado, permissões de leitura e função controlada de gravação.
3. Vá a **Project Settings → API Keys** (ou **Connect → API Keys**, conforme a versão). Copie SOMENTE a chave **publishable** do projeto, começando em `sb_publishable_`. Não use a chave secret ou `service_role`.
4. Na Vercel, projeto **contabilidade → Settings → Environment Variables**, configure:
   - `VITE_SUPABASE_URL`: `https://xfsuukxxvnvwsivuqgzg.supabase.co` (já informada à Vercel)
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: sua chave `sb_publishable_...` (ainda precisa ser adicionada)
5. Faça um novo deploy de produção para que as variáveis sejam incorporadas ao bundle do Vite.
6. Ao abrir o site, veja o status **Dados compartilhados sincronizados**. Na primeira vez, se existirem cadastros no navegador, use **Importar dados locais anteriores** para migrá-los. A importação substitui o conjunto compartilhado mediante confirmação.

## Comportamento

- Todos leem a mesma linha de dados no Supabase; qualquer visitante também pode substituí-la.
- Escritas usam versão otimista para evitar que duas abas sobrescrevam alterações simultâneas inadvertidamente. Um conflito pede recarga; faça backup antes.
- Leituras são atualizadas a cada 12 segundos; escritas têm espera curta e limite de frequência (2 segundos) no banco.
- Dados são gravados como JSON em uma única linha para preservar o formato do aplicativo e manter a migração simples. Não é um modelo multiusuário adequado para dados reais.
- A tabela de histórico não é pública, mas o proprietário do banco pode restaurar versões pelo SQL Editor.

## Aviso de segurança

**Esta configuração é apenas para exercícios com informações fictícias.**
Qualquer pessoa com acesso ao site (ou à API pública) consegue ler e alterar os dados. Não insira CPF, CNPJ, telefone, endereço, dados comerciais reais ou outras informações pessoais. Chaves de API públicas não fornecem autenticação. Para uso real, implemente login com regras de acesso por usuário/organização, limite na borda e auditoria.
