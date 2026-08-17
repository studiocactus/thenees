# Thenees — checkpoint de 16/08/2026

Este checkpoint registra o estado validado antes da continuidade do roteiro oficial.

## Etapa 1 — Agenda e vídeos

- Agenda editável no `Thenees Control > Conteúdo do site > Agenda e vídeos`.
- Cada live possui data e horário BRT, plataforma, título, jogo, descrição e status de publicação.
- O horário do `datetime-local` é convertido explicitamente entre `America/Sao_Paulo` e UTC, sem mudar após salvar.
- As lives são exibidas no Control em linhas sequenciais e padronizadas.
- A landing mostra a próxima live em destaque, com data, horário, título, jogo e plataforma, seguida apenas pelas três próximas transmissões.
- Inclusão, edição, despublicação e exclusão são propagadas para a landing por Supabase, sinal entre abas e atualização de segurança.
- Vídeo editorial, capa e publicação também são administráveis e sincronizados.

## Etapa 2 — Páginas, textos e links oficiais

- Hero, perfil e textos institucionais permanecem editáveis pelo Control.
- Links oficiais usam uma lista por plataforma, com seleção, URL, edição e remoção.
- Twitch, Kick, YouTube e Discord existentes são preservados automaticamente ao migrar do formato antigo.
- Plataformas adicionais disponíveis: Instagram, TikTok, X/Twitter, Facebook, Spotify e LinkedIn.
- Os canais salvos aparecem abaixo do status do footer e na área de Parcerias.
- E-mail oficial e link da comunidade permanecem como destinos institucionais separados.
- Alterações salvas são notificadas à landing aberta em outra aba.

## Etapa 3 — Equipe, moderadores e permissões

- Papéis: `owner`, `admin`, `editor` e `moderator`.
- `owner` e `admin`: operação completa; alterações no papel owner continuam protegidas por trigger no banco.
- `editor`: dashboard, conteúdo do site, métricas públicas e área comercial.
- `moderator`: dashboard, ChatBattle, NeesBot, quotes, aniversários, transmissão e encurtador.
- A navegação agora é filtrada por subárea, e não apenas por categoria, evitando exibir módulos recusados pelas políticas RLS.
- A conta da sessão não pode suspender nem alterar a própria função pela interface.
- Conteúdo, comunidade, bot e administração continuam protegidos no Supabase pelas políticas de função.

## Validação

- `npm run build`: concluído sem erros após as alterações.
- Rotas compiladas: `/`, `/control`, `/control/setup-password`, `/go/:slug` e `/jogar`.

## Próxima auditoria

Etapa 4: métricas, quotes e aniversários. Validar persistência, publicação automática na landing, permissões de moderação, edição por chat e modo festa.

### Progresso da etapa 4

- Métricas públicas e quotes agora compartilham atualização em tempo real, sinal direto entre abas e fallback periódico.
- Quando todos os registros públicos forem removidos ou despublicados, a landing limpa o conteúdo antigo em vez de preservar dados obsoletos.
- Criação, edição, mudança de status e exclusão de quotes notificam imediatamente a landing.
- Alterações do modo festa e da mensagem de aniversário também emitem o sinal de atualização da comunidade.
- Novas quotes usam explicitamente o fuso `America/Sao_Paulo` antes da gravação UTC.
- Build de produção validado após a sincronização.
