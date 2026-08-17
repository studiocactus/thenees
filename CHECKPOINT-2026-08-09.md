# Thenees — checkpoint de evolução

Data: 9 de agosto de 2026  
Status: protótipo local validado e aprovado para continuidade.

Este documento registra o resultado consolidado da rodada. A especificação detalhada e permanentemente atualizada continua em `PROJECT_STATE.md`.

## Identidade aprovada

- Direção: editorial premium + sistema digital + cultura gamer/streaming.
- Paleta principal: `#C5FF00`, branco, cinzas, preto e roxo `#7567FF`.
- Títulos: BoldPixels.
- Interface e textos: Silkscreen.
- Botões sempre com cantos retos; formatos de cápsula estão proibidos.
- Textos informativos usam no mínimo 9 px no desktop e 10 px no celular, com contraste e entrelinha adequados.
- Crédito visual da BoldPixels foi retirado do footer; a atribuição permanece no arquivo interno `public/fonts/BOLDPIXELS-LICENSE.txt`.

## Header

- Navegação horizontal fixa com seletor pixel 16-bit no hover e na seção ativa.
- Indicador de transmissão possui estado realista:
  - offline: cinza, `DESCONECTADO`, sem link;
  - online: verde, `CONECTADO / PLATAFORMA`, com link da live.
- O status fica offline enquanto não houver integração oficial com Twitch/Kick.

## Hero — finalizada

- Título imutável em três linhas:

```text
EU JOGO.
VOCÊS INTERAGEM.
FUNCIONA.
```

- `INTERAGEM.` permanece verde com sombra pixel.
- Fundo uniforme `#1D1D21`, sem noise, granulado, círculo ou diagonal.
- Foto `public/thenees-ascii-source.jpg` usada somente como fonte invisível do canvas ASCII.
- A fotografia real nunca aparece na interface.
- Retrato ASCII preserva proporção, preenche a altura e usa recorte lateral controlado.
- Degradê de opacidade elimina a borda esquerda do canvas.
- Caracteres reagem ao ponteiro com repulsão, ondulação e cor verde.
- Rolagem aplica profundidade vertical suave, sem afastamento lateral.
- Faixa superior usa textos brancos: `SISTEMA OPERACIONAL DA COMUNIDADE` e `V.01 / 2026`.

## Sobre / Quem é o Thenees

- Título: `STREAMER POR ESCOLHA. CAOS POR NATUREZA.`
- Fundo claro uniforme, sem brilho verde.
- Marcadores de seção usam bloco verde numerado, sombra pixel e linha técnica.
- Inventário pessoal/profissional com 12 campos:
  - música, comida, lugar, sonho;
  - profissão, jogo, skill e projeto;
  - combustível criativo, hobby, defeito de fábrica e regra pessoal.
- Valores permanecem `A DEFINIR`; informações pessoais não devem ser inventadas.
- Barra verde animada ocupa `100vw`.

## Vídeos e agenda

- A live não será retransmitida dentro do site.
- O player funciona como vitrine de vídeos selecionados pelo editor e futuramente cadastrados no admin.
- Vídeo de teste: `https://www.youtube.com/watch?v=eiEJdsE7pNI`.
- Incorporação via `youtube-nocookie.com`, sem autoplay e com carregamento tardio.
- Canal oficial: `https://www.youtube.com/@theneesr`.
- Calendário usa `America/Sao_Paulo` e atualiza dias, meses e anos automaticamente.
- O site calcula datas; horário, título, jogo e plataforma vêm do Thenees Control.
- Datas sem evento deverão exibir `SEM LIVE AGENDADA`.
- Em 12/08 ativa modo festivo do aniversário do Thenees.
- Futuramente, o aniversário salvo no perfil do jogador ativará `HOJE É SEU ANIVERSÁRIO`.
- Ao finalizar o cadastro, o NeesBot anuncia o nome público e a categoria do novo jogador nos chats da Twitch e da Kick.
- No aniversário cadastrado, o bot marca o jogador nas duas plataformas e convida a comunidade a parabenizá-lo, sem divulgar idade ou ano de nascimento.

## ChatBattle

- Nome atual do game: `ChatBattle`, armazenado em configuração central e futuramente editável no admin.
- `NO OFF, VOCÊ EVOLUI.` usa roxo claro para melhor contraste.
- Dois modos: interação durante a live e perfil persistente quando offline.
- FOLLOW, SUB, BITS e DONATE são controles interativos com explicações específicas.
- Rótulos, títulos e descrições desses incentivos serão editáveis no admin.
- Regra central: `SEM PAY-TO-WIN / A COMUNIDADE SEMPRE GANHA.`
- O chat demonstrativo é animado: usuários agem e o NeesBot explica comandos, incentivos, eventos e recompensas.
- Medidores de comunidade/criatura usam barras CSS proporcionais, não caracteres.
- O painel não estica verticalmente e respeita `prefers-reduced-motion`.
- Cards de benefícios ficaram compactos e usam ícones CSS em pixel art 16-bit.

## Comunidade e quotes

- Quatro métricas preenchidas: seguidores, subs ativos, horas assistidas e clipes.
- Estratégia híbrida:
  - APIs oficiais fornecem o que estiver disponível e autorizado;
  - o sistema calcula métricas próprias;
  - o admin funciona como fallback manual.
- Mural verde alterna quotes aprovadas com texto, autor, plataforma e data brasileira.
- Somente broadcaster e moderadores autorizados podem usar `!quote mensagem`.
- Depois de persistir a quote, o NeesBot marca o autor e anuncia:

```text
@usuario, sua frase entrou para o arquivo da comunidade!
Veja em https://www.theneees.com.br/#comunidade
```

- O bot nunca anuncia antes da confirmação de gravação.
- Quotes poderão ser corrigidas, ocultadas ou inseridas no admin.
- Discord oficial centralizado em configuração: `https://discord.gg/fUEG3h2ED`.
- Todo botão/link de Discord deve usar esse endereço.

## Footer profissional

- CTA principal: `A LIVE TERMINA. A COMUNIDADE CONTINUA.`
- Botão comercial com cantos retos e contato por e-mail.
- Grade horizontal completa com marca, navegação, canais e contato.
- Status diferencia `SITE ONLINE` de `LIVE DESCONECTADA`.
- Link oficial do YouTube e Discord presentes.
- Twitch oficial: `https://www.twitch.tv/thenees`.
- Kick oficial: `https://kick.com/thenees`.
- Rodapé legal contém direitos autorais e retorno ao topo; a mensagem `BRASIL · COMUNIDADE ONLINE` foi removida.
- Regras antigas foram explicitamente sobrescritas para não colapsar a grade em uma única coluna.

## Integrações futuras

- Thenees Control será a fonte de verdade para conteúdo, agenda, game, bot, quotes, links e métricas manuais.
- Supabase será usado quando autenticação, perfis e persistência forem implementados.
- Twitch/Kick exigirão OAuth, permissões e eventos/webhooks oficiais.
- Nenhuma integração externa real está ativa nesta fase.

## Links já confirmados

- Site/comunidade: `https://www.theneees.com.br/#comunidade`
- YouTube: `https://www.youtube.com/@theneesr`
- Discord: `https://discord.gg/fUEG3h2ED`
- E-mail oficial: `contato@theneees.com.br`

## Pendências

- Preencher dados pessoais do inventário “Quem é o Thenees” pelo admin.
- Criar e cadastrar o Media Kit.
- Definir regras completas do ChatBattle.
- Criar autenticação, perfil do jogador, banco de dados e Thenees Control.
- Substituir métricas e agenda demonstrativas por dados reais.

## Validação

- Build de produção concluído com sucesso após a última alteração.
- Prévia local: `http://localhost:3001/#home`.
- Próxima sessão deve começar pela leitura de `PROJECT_STATE.md` e deste checkpoint.
