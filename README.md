# Thenees — protótipo navegável

## Abrir no navegador

1. Abra esta pasta no terminal.
2. Execute `npm install` (necessário apenas na primeira vez).
3. Execute `npm run dev`.
4. Abra o endereço local mostrado no terminal, normalmente `http://localhost:3001`.

Para encerrar a prévia, pressione `Ctrl + C` no terminal.

## Estrutura principal

- `app/page.tsx`: conteúdo e interações da landing page.
- `app/globals.css`: identidade visual, animações e responsividade.
- `app/layout.tsx`: título, descrição e idioma do site.

Este é um protótipo visual. Links de Twitch, Kick, Discord, YouTube e Media Kit usam destinos provisórios e devem ser substituídos pelos endereços oficiais.

## Supabase

O cliente oficial está preparado em `lib/supabase/client.ts`.

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave publicável do projeto.
3. Importe `getSupabaseBrowserClient()` apenas em recursos que precisem acessar o Supabase.

`.env.local` não deve ser enviado ao GitHub. Senhas de conta, `service_role`, SMTP e outros segredos nunca podem usar o prefixo `VITE_` nem aparecer no código do navegador.

## Documentação do estado aprovado

Consulte `PROJECT_STATE.md` antes de qualquer alteração. O documento registra a identidade, tipografia, Hero, estrutura, interações, decisões descartadas e regras de preservação do protótipo atual.

## Respostas aleatórias do bot

Campos de mensagem de comandos, timers e mensagens automáticas aceitam uma variação por linha. A cada envio, o bot escolhe uma das linhas preenchidas aleatoriamente; linhas vazias são ignoradas. Esse recurso não usa inteligência artificial nem serviços pagos.

O Control inclui um gerador local de ideias com tons natural, bem-humorado e animado. As sugestões são produzidas a partir de uma biblioteca interna, podem conter variáveis do bot e só são adicionadas depois da seleção do administrador. O gerador não envia dados para serviços externos.

O modo futuro com IA está especificado em `docs/AI_MESSAGE_MODE_FUTURE.md`, mas permanece desativado e sem chamadas externas.
