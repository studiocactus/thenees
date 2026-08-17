# Ativação da Twitch — Thenees

## Estado atual

A integração foi ativada em 10/08/2026. Este documento permanece como referência de manutenção e recuperação.

## 1. Aplicativo Twitch

Criar um aplicativo em `https://dev.twitch.tv/console/apps` e cadastrar como OAuth Redirect URL:

`https://ilvdxbqrjsmaqoongwkw.supabase.co/functions/v1/twitch-oauth-callback`

Categoria sugerida: Chat Bot.

## 2. Segredos das Edge Functions

Configurar no Supabase:

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI=https://ilvdxbqrjsmaqoongwkw.supabase.co/functions/v1/twitch-oauth-callback`
- `TWITCH_EVENTSUB_CALLBACK=https://ilvdxbqrjsmaqoongwkw.supabase.co/functions/v1/twitch-eventsub`
- `TWITCH_EVENTSUB_SECRET` com 64 caracteres aleatórios
- `BOT_WORKER_SECRET` com outro valor aleatório
- `SITE_URL=https://www.theneees.com.br`

## 3. Funções a publicar

- `twitch-oauth-start`
- `twitch-oauth-callback`
- `twitch-eventsub`
- `twitch-subscribe`
- `twitch-worker`
- `platform-disconnect`

## 4. Ativação pelo Control

1. Entrar em `06 / Administração → Integrações`.
2. Clicar em `Conectar Twitch`.
3. Autorizar a conta oficial do canal.
4. Voltar ao Control e clicar em `Ativar EventSub`.
5. Usar `Testar fila` para validar o primeiro envio.

## Escopos solicitados

- `user:read:chat`
- `user:write:chat`
- `user:bot`
- `channel:bot`
- `moderator:read:followers`
- `channel:read:subscriptions`
- `bits:read`
- `channel:read:redemptions`

Tokens e refresh tokens são gravados somente no schema privado do banco e recuperados apenas pelas funções com service role.

## Estado validado

- OAuth: conectado à conta `Thenees`.
- EventSub: `ACTIVE`.
- Worker: validado com fila vazia e nenhum envio acidental ao chat.
- Reautorização futura: usar `06 / Administração → Integrações → Reautorizar Twitch` sempre que os escopos mudarem.
