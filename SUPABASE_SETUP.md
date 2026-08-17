# Supabase — ativação do Thenees Control

## O que já está pronto

- Conexão por URL e chave publicável.
- Cliente oficial do Supabase.
- Tela `/control` com autenticação e verificação de permissão administrativa.
- Migração inicial com tabelas e Row Level Security.

## Ativação no painel do Supabase

1. Abra **SQL Editor** no projeto correto.
2. Execute `supabase/migrations/202608100001_thenees_control_foundation.sql`.
3. Abra **Authentication → Users** e crie um usuário exclusivo para o Thenees Control.
4. Volte ao SQL Editor e execute, trocando o e-mail pelo usuário criado:

```sql
insert into public.admin_users (user_id, email, display_name, role)
select id, email, 'Thenees', 'owner'
from auth.users
where email = 'SEU_EMAIL_DE_LOGIN_NO_CONTROL'
on conflict (user_id) do update
set active = true, role = 'owner', display_name = 'Thenees';
```

5. Acesse `http://localhost:3001/control` e entre com esse novo usuário.

## Regras de segurança

- A senha do painel do Supabase não deve ser reutilizada.
- Não colocar `service_role` em `.env.local` com prefixo `VITE_`.
- Mensagens de contato serão gravadas futuramente por endpoint protegido com Turnstile; visitantes não possuem inserção direta no banco.
- Toda escrita das tabelas editoriais exige usuário autenticado presente em `admin_users` e ativo.
