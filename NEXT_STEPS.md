# Sequência oficial de evolução — Thenees

Checkpoint mais recente: `CHECKPOINT-2026-08-16.md`.

Ordem obrigatória atual:

1. Agenda e vídeos editáveis conectados à landing — concluído e validado.
2. Páginas, textos e links oficiais editáveis — concluído e validado.
3. Equipe, moderadores e permissões — implementado; navegação por subárea alinhada às políticas RLS.
4. Métricas, quotes e aniversários — próxima auditoria ativa.
5. Media Kit, parcerias e mensagens.
6. Arquitetura, comandos e automações do NeesBot.
7. Integração do bot com Twitch.
8. Integração do bot com Kick.
9. Status de live e métricas das plataformas.
10. Responsividade, acessibilidade, segurança e publicação.
11. Somente depois, desenvolvimento dedicado do ChatBattle.

Este é o roteiro oficial para avançar sem perder decisões ou misturar etapas.

## 01 — Dashboard e jogadores
- Total cadastrado, presença recente, estado e plataforma.
- Concluído em 10/08/2026: tabelas `game_players` e `game_presence` instaladas no Supabase e indicadores conectados ao Dashboard.

## 02 — Cadastro e perfil do ChatBattle
- Autenticação, vínculo com Twitch/Kick, categoria, personagem e aniversário.
- Concluído em 10/08/2026: rota `/jogar`, autenticação por e-mail, perfil básico e permissões individuais instaladas no Supabase.
- Próxima evolução desta etapa: avatar, inventário, conquistas, ranking e vínculo oficial com Twitch/Kick.

## 03 — Equipe e permissões
- Papéis de owner, admin, editor e moderador, com histórico de alterações.
- Concluído em 10/08/2026: convites por e-mail, ativação automática no primeiro acesso, gestão de equipe e navegação filtrada por função.
- Escopos atuais: owner/admin administram toda a operação; editor cuida de conteúdo e área comercial; moderador cuida de comunidade, jogadores e operação do bot.
- A conta owner possui proteção adicional no banco: somente outro owner pode alterá-la ou atribuir esse papel.

## 04 — Conteúdo administrável
- Agenda, vídeos, páginas, links e métricas.
- Concluído em 10/08/2026: agenda e vídeo em destaque agora são editáveis no módulo `01.03` e alimentam a landing page.
- Próximo: demais páginas, textos institucionais e links oficiais.
- Concluído em 10/08/2026: textos de Sobre, Game, Comunidade, Parcerias, Lab e rodapé, além de Twitch, Kick, YouTube, Discord, e-mail e link da comunidade, são editáveis no Control.
- Concluído em 10/08/2026: equipe, moderadores e permissões por função foram instalados no Control e no banco.

## Próxima etapa ativa — Comunidade
- Preencher e administrar as quatro métricas da área 04.
- Criar arquivo de quotes com autor, data, origem, aprovação e publicação.
- Preparar aniversários e o modo festa para usuários cadastrados.
- Definir fontes automáticas Twitch/Kick e o preenchimento manual de segurança pelo Control.
- Preparar os eventos que futuramente serão consumidos pelo NeesBot.
- Concluído em 10/08/2026: quatro métricas editáveis com origem e fallback manual alimentam a landing page.
- Concluído em 10/08/2026: arquivo de quotes com cadastro manual, moderação e publicação automática na área verde da comunidade.
- Concluído em 10/08/2026: aniversários dos jogadores, mensagem personalizada e modo festa administrável.
- O envio efetivo das mensagens para Twitch e Kick será ativado nas etapas do NeesBot e das plataformas.

## Próxima etapa ativa — Comercial
- Transformar o Media Kit em conteúdo administrável.
- Organizar formatos comerciais, diferenciais e métricas usadas na apresentação.
- Criar gestão de parcerias e caixa de mensagens do formulário de contato.
- Preparar estados de leitura, resposta, arquivamento e spam.
- Concluído em 10/08/2026: capa, apresentação, diferencial e quatro formatos comerciais são editáveis pelo Control.
- Concluído em 10/08/2026: o Media Kit reutiliza as métricas públicas da comunidade e os dados de contato oficiais.
- Concluído em 10/08/2026: formulário público conectado ao banco com verificação humana, honeypot e limite por e-mail.
- Concluído em 10/08/2026: caixa de entrada com notas internas e estados nova, lida, respondida, arquivada e spam.

## Próxima etapa ativa — NeesBot
- Definir arquitetura de canais, comandos, eventos e fila de mensagens.
- Criar configurações administráveis sem armazenar segredos no navegador.
- Preparar automações de cadastro, aniversário, quote e eventos do ChatBattle.
- Registrar tentativas, entregas, erros e reprocessamento.
- Manter adaptadores separados para Twitch e Kick, que serão conectados nas etapas seguintes.
- Concluído em 10/08/2026: canais Twitch/Kick, seis comandos, cinco automações, fila, logs e reprocessamento foram estruturados.
- Concluído em 10/08/2026: novos jogadores e quotes aprovadas criam eventos deduplicados automaticamente.
- Concluído em 10/08/2026: aniversários do dia podem ser enfileirados pelo Control com deduplicação diária.
- Concluído em 10/08/2026: comandos, permissões, cooldowns, templates e destinos são editáveis por owner, admin e moderador.

## Etapa concluída — Twitch
- Adaptador de autenticação e conexão do NeesBot com a Twitch publicado e ativo.
- Consumir a fila compartilhada e enviar mensagens no canal oficial.
- Receber chat, comandos, follows, subs, bits e estado da transmissão.
- Manter tokens exclusivamente no ambiente seguro do servidor.
- Registrar entregas e falhas no histórico do NeesBot.
- Implementado localmente em 10/08/2026: OAuth, refresh automático, EventSub com HMAC, comandos, eventos e worker da fila.
- Instalado no banco em 10/08/2026: schema privado de tokens, estados OAuth, metadados das integrações, eventos e assinaturas EventSub.
- Concluído em 10/08/2026: seis Edge Functions publicadas, segredos protegidos configurados, canal oficial autorizado, EventSub ativo e worker validado com fila vazia.

## Próxima etapa ativa — Kick
- Registrar o aplicativo oficial e mapear o fluxo OAuth disponível para a conta Thenees.
- Implementar o adaptador Kick separado sobre o mesmo núcleo do NeesBot.
- Receber eventos suportados, enviar mensagens do bot e registrar entregas/falhas na fila compartilhada.
- Manter fallback manual onde a plataforma não oferecer métricas ou eventos equivalentes aos da Twitch.
- A sessão CLI atualmente autenticada não tem acesso ao projeto `ilvdxbqrjsmaqoongwkw`; a tentativa de listar funções retornou HTTP 403.

## Ponto exato de retomada — próxima sessão

1. Testar no chat da Twitch: `!addcom !discord Entre no servidor: https://discord.gg/fUEG3h2ED`.
2. Confirmar que o NeesBot responde e que `!discord` aparece em `Control > NeesBot > Eventos do chat`.
3. Executar `!discord` e confirmar que o bot publica o link configurado.
4. Se não houver resposta, abrir `twitch-eventsub > Invocations/Logs` no Supabase e verificar se o evento `channel.chat.message` chegou; depois conferir `bot_outbox` e `bot_delivery_logs`.
5. Não clicar em `Deploy updates` sem alterações. O editor publicado não deve conter `_shared` nem imports `./` ou `../`; funções editadas pelo painel precisam ser empacotadas em um único `index.ts`.
6. Após validar Twitch, iniciar o adaptador Kick sobre a mesma fila do NeesBot.

## 05 — NeesBot
- Cadastros, aniversários, quotes, comandos e mensagens automáticas.

## 06 — Twitch e Kick
- Status de live, métricas e eventos de follow, sub, bits e donate.

## 07 — Finalização
- Testes, acessibilidade, segurança, conteúdo final, domínio e publicação.
