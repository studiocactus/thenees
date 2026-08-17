# Thenees — estado aprovado do protótipo

Última consolidação: 9 de agosto de 2026 — checkpoint completo da landing page após Hero, Sobre, Live, Game, Comunidade e Footer.

Este documento registra o estado visual e conceitual aprovado do protótipo. Ele deve ser consultado antes de qualquer alteração para evitar regressões ou perda de decisões já tomadas.

## 1. Visão do produto

O Thenees é um hub de streamer e comunidade, não apenas um site institucional. O produto reúne:

- identidade e apresentação do Thenees;
- acesso às lives na Twitch e Kick;
- game integrado ao chat;
- área futura do personagem de cada membro;
- comunidade;
- parcerias e mídia comercial;
- experimentos do Thenees Lab;
- teaser do painel administrativo Thenees Control.

Conceito central: **THENEES — Community Operating System**.

## 2. Direção visual aprovada

A linguagem combina:

- design editorial premium;
- pixel art e cultura gamer;
- interfaces de sistema;
- fotografia cinematográfica;
- humor em textos e pequenos estados;
- bastante contraste e hierarquia tipográfica.

O gamer deve aparecer como linguagem visual sofisticada, e não como excesso de HUD, ícones ou elementos decorativos.

### Paleta principal

- Verde de identidade: `#C5FF00`.
- Preto principal: `#0D0D0D`.
- Fundo escuro aprovado da Hero: `#1D1D21`.
- Branco quente: aproximadamente `#F4F4EF`.
- Fundo claro geral: aproximadamente `#F6F6F2`.
- Roxo secundário: aproximadamente `#7567FF`.
- Cinzas são usados em divisórias, cards e textos secundários.

## 3. Tipografia aprovada

### Títulos

Fonte: **BoldPixels**, criada por YukiPixels.

- Arquivo local: `public/fonts/boldpixels.woff2`.
- Licença: CC BY-SA 4.0.
- Crédito mantido no rodapé.
- Títulos e palavras destacadas devem usar a mesma família BoldPixels.
- Em títulos compostos, a parte normal fica limpa e a palavra destacada pode receber cor e sombra pixelada.

### Interface e textos

Fonte: **Silkscreen**.

- Arquivos locais: `public/fonts/silkscreen-400.ttf` e `public/fonts/silkscreen-700.ttf`.
- Usada em navegação, botões, indicadores, status e textos gerais do protótipo.

### Decisão descartada

Chakra Petch chegou a ser testada em elementos `<p>`, mas a solicitação foi desfeita. O site deve continuar com a tipografia anterior nos parágrafos.

## 4. Hero Section — estado atual aprovado

A Hero é uma composição fotográfica inspirada em portfólios editoriais futuristas, particularmente na direção visual do site Omnira.

### Elementos principais

- Navegação horizontal fixa e escura.
- Título dominante à esquerda.
- Retrato do Thenees ocupando a área direita.
- Fundo sólido e uniforme `#1D1D21`, sem noise ou granulação.
- Sem círculo verde ou linha diagonal verde no fundo da Hero.
- O canvas ASCII é totalmente transparente e se integra ao fundo sem divisão vertical.
- O efeito utiliza a composição da fotografia — streamer, headset, microfone e setup — como mapa de caracteres.
- O enquadramento usa preenchimento proporcional, sem esticar a fonte: ocupa toda a altura e recorta somente o excesso lateral.
- O arquivo fotográfico não é exibido diretamente; ele serve apenas como fonte invisível de dados para formar o retrato.
- O retrato visível é composto exclusivamente por uma camada ASCII gerada em tempo real.
- Ao mover o mouse sobre o retrato, os caracteres próximos ao cursor se deslocam, ondulam e recebem destaque verde.
- Em dispositivos sem mouse e com movimento reduzido, a camada ASCII permanece estática.
- Não há fotografia, brilho decorativo, ruído ou textura visível atrás do retrato ASCII.
- Pequenos indicadores digitais, sem cantos brancos de enquadramento.
- O indicador da Hero exibe `SISTEMA ONLINE` e a hora de São Paulo. Ele comunica a disponibilidade do site, não o estado da transmissão.
- O status duplicado que ficava sobre o retrato ASCII, no lado direito, foi removido.
- Botões para assistir à live e conhecer o game.
- Texto de apoio sobre Twitch, Kick, games e comunidade.
- Movimento vertical sutil de profundidade durante a rolagem, sem afastamento lateral dos elementos.
- O bloco inferior de texto não possui fundo em degradê.
- Os dois botões seguem o mesmo tamanho, alinhamento, borda e sombra; no botão verde o texto é preto.
- A etiqueta superior foi traduzida para `SISTEMA OPERACIONAL DA COMUNIDADE`.
- Os textos `SISTEMA OPERACIONAL DA COMUNIDADE` e `V.01 / 2026` aparecem em branco puro.
- Tratamento responsivo próprio para telas menores.

### Foto utilizada

- Fonte invisível do efeito ASCII: `public/thenees-ascii-source.jpg`.
- Origem fornecida pelo usuário: `E:/Entretenimento/Eu/IMG-20210929-WA0133.jpg`.
- A fotografia nunca é renderizada diretamente: ela serve apenas como mapa de luminosidade para os caracteres do canvas.
- A composição horizontal completa é preservada no ASCII, com setup, microfone e streamer, e os caracteres ganham intensidade gradualmente da esquerda para a direita.
- O mapa de caracteres ocupa as extremidades superior e inferior da Hero sem distorcer a fotografia; o encaixe proporcional recorta apenas o excesso lateral e preserva o streamer como foco.
- A borda esquerda do canvas começa totalmente transparente e revela os caracteres em um degradê progressivo, impedindo que a linha inicial do efeito fique visível.

### Título imutável

O título deve permanecer exatamente com estas palavras, ordem e três linhas:

```text
EU JOGO.
VOCÊS INTERAGEM.
FUNCIONA.
```

Regras:

- não alterar o texto;
- não alterar a ordem;
- não criar uma quarta linha;
- `INTERAGEM.` permanece destacado em verde;
- o destaque pode manter sombra pixelada;
- o restante usa BoldPixels sem sombra tipográfica.

## 5. Seções da landing page

### Header

- Fixo no topo.
- Logo `THENEES°`.
- Links: Home, Sobre, Live, Game, Comunidade, Parcerias e Lab.
- Indicador de transmissão à direita, sempre com cantos retos.
- Estado padrão sem integração: bolinha cinza e texto `LIVE DESCONECTADA`, sem link.
- Quando uma plataforma confirmar a live: fundo `#C5FF00`, bolinha ativa, texto `CONECTADO / TWITCH` ou `CONECTADO / KICK` e link direto para a transmissão.
- O verde nunca deve aparecer no indicador quando a live estiver offline.
- Menu adaptado para celular.

### Sobre

Título:

```text
STREAMER POR ESCOLHA.
CAOS POR NATUREZA.
```

Todo o título usa BoldPixels. `NATUREZA.` recebe o destaque visual; o restante fica sem sombra.

A seção possui um inventário pessoal e profissional responsivo com doze campos:

- música preferida;
- comida;
- lugar;
- sonho.
- o que eu faço;
- jogo favorito;
- skill principal;
- projeto atual;
- combustível criativo;
- hobby fora da tela;
- defeito de fábrica;
- regra pessoal.

O bloco mistura linguagem profissional e humor gamer, apresentando personalidade, trabalho e gostos. Os valores permanecem como `A DEFINIR` e serão preenchidos pelo Thenees Control; não inventar informações pessoais.

O fundo da seção é claro e uniforme, sem degradê ou brilho verde no canto superior direito.

Os marcadores de seção usam o padrão premium de fase: número dentro de um bloco verde retangular com sombra pixel, uma pequena linha técnica e o nome da seção. O antigo quadrado preto com ponto verde foi removido de todos os títulos de seção.

A barra verde animada ao final da seção ocupa `100vw`, atravessando a tela inteira independentemente do padding do conteúdo.

### Live

- O painel escuro não incorpora nem retransmite a live, evitando consumo de banda desnecessário no site.
- O espaço funciona como vitrine de vídeos, cortes e histórias produzidos pelo editor.
- O conteúdo destacado, título, mídia e link serão cadastrados futuramente pelo Thenees Control.
- Vídeo usado no protótipo: `https://www.youtube.com/watch?v=eiEJdsE7pNI`, incorporado pelo domínio de privacidade avançada `youtube-nocookie.com` e com carregamento tardio.
- Antes da reprodução, o player usa uma capa própria sem molduras brancas, com play quadrado e os botões retos `CLIQUE E COPIE O LINK` e `ASSISTA NO YOUTUBE`.
- O terminal do Thenees Lab funciona como uma vitrine de experimentos: mostra ChatBattle, NeesBot e Links do Chat com descrição, estado, progresso e um log recente.
- A barra de rolagem do navegador usa o verde `#C5FF00`, trilho escuro e cantos retos, seguindo a identidade do projeto.
- Em `THENEES_PROFILE`, a música preferida é `Without You — Avicii`, com equalizador pixelado animado e link oficial para o Spotify.
- O `THENEES_PROFILE` está preenchido com comida, Japão como lugar e sonho, atuação como Diretor de Arte/Streamer, Rock N’ Roll Racing, skill, projeto, combustível criativo, hobby, defeito e regra pessoal fornecidos pelo Thenees.
- O card `EVOLUÇÃO CONTÍNUA` usa uma seta pixelada de subida com `XP` e partículas animadas, comunicando progressão de personagem com clareza.
- Os ícones dos três cards do game são animados: o chat simula digitação, o personagem possui idle e pisca, e a evolução mostra XP ascendente.
- O botão `FALAR COM O THENEES` abre um modal de contato responsivo com nome, e-mail, assunto, mensagem, honeypot e desafio humano no protótipo. O envio real deverá usar endpoint seguro e Cloudflare Turnstile no backend; o protótipo não simula uma entrega inexistente.
- Os links de ação `CONHEÇA A HISTÓRIA`, `BAIXAR MEDIA KIT` e `FALAR COM O THENEES` recebem rollover pixelado em `#7567FF`, com texto branco e deslocamento da seta.
- `BAIXAR MEDIA KIT` foi evoluído para `ACESSAR MEDIA KIT`: abre uma apresentação comercial responsiva com posicionamento, métricas identificadas como demonstração, formatos de parceria, diferencial do ChatBattle, contato, impressão/salvamento em PDF e acesso direto ao formulário de proposta. O conteúdo será administrável pelo Thenees Control.
- Auditoria responsiva final: em telas de até `520px`, o status detalhado da live é ocultado para preservar logo e menu; modais bloqueiam a rolagem da página de fundo e o Media Kit não permite rolagem horizontal.
- Conexão Supabase preparada com o cliente oficial, URL e chave publicável em `.env.local` protegido, modelo em `.env.example` e fábrica central em `lib/supabase/client.ts`. Nenhuma senha ou chave administrativa é armazenada no projeto.
- Thenees Control Fase 1 criado em `/control`: login via Supabase Auth, segunda verificação na tabela `admin_users`, shell responsivo do painel e oito módulos planejados. A migração inicial com RLS está em `supabase/migrations/202608100001_thenees_control_foundation.sql` e deve ser aplicada no painel do Supabase antes do primeiro acesso.
- O iframe oficial do YouTube só é criado depois do clique no play, reduzindo carregamento inicial e evitando controles externos sobre a capa personalizada.
- O texto `YOUTUBE / THENEES` aponta para o canal oficial `https://www.youtube.com/@theneesr`; o rótulo `VÍDEO EDITORIAL` foi removido.
- Player editorial com botão de cantos retos e cantos técnicos.
- Agenda premium com próxima live destacada, dia, horário, tema, plataforma e texto de apoio.
- As colunas da agenda reservam espaço fixo para horários em fonte pixel, impedindo sobreposição com títulos; em larguras menores a plataforma é ocultada antes de comprimir o conteúdo.
- O calendário usa `America/Sao_Paulo`, destaca o dia atual brasileiro e calcula automaticamente os três dias seguintes, atravessando corretamente mudanças de mês e ano.
- `12/08` é o aniversário do Thenees. Nessa data, o destaque principal troca automaticamente o verde por um modo festivo rosa/roxo/amarelo e exibe `HOJE É MEU ANIVERSÁRIO / PARTY MODE`.
- Quando houver autenticação no game, a data de aniversário salva no perfil do jogador será comparada com a data brasileira atual. Em caso de coincidência, o mesmo visual festivo será ativado com `HOJE É SEU ANIVERSÁRIO`.
- Toda a agenda será editável pelo painel administrativo e poderá futuramente ser sincronizada com um calendário.
- O calendário público calcula somente datas e dias da semana no fuso brasileiro. Horário, título da live, jogo e plataforma são definidos exclusivamente pelo Thenees no painel administrativo.
- Os conteúdos exibidos no protótipo são registros demonstrativos com o mesmo formato esperado do futuro Thenees Control.
- Se não existir transmissão cadastrada para uma data, a versão integrada deverá apresentar `SEM LIVE AGENDADA` em vez de inventar conteúdo.
- Textos mantêm humor controlado sobre atrasos e decisões questionáveis.

### Game

Conceito correto: game persistente integrado ao chat da live.

Dois modos alternáveis:

1. **Durante a live**
   - O chat funciona como controle.
   - Comandos como `!atacar`, `!defender`, `!inventário` e `!grupo`.
   - Follows, subs, bits e donates também ativam efeitos, itens, buffs, batalhas ou eventos coletivos.
   - Os quatro incentivos são botões interativos; ao selecionar cada um, a interface explica seu efeito específico no ChatBattle.
   - Rótulo, título e descrição de cada incentivo serão campos editáveis no Thenees Control. Os textos atuais são apenas dados demonstrativos.
   - Regra de design: sem pay-to-win. O apoio financeiro pode mudar o caminho e aumentar o caos, mas nunca compra vantagem individual sobre a comunidade.
   - Princípio central: `A COMUNIDADE SEMPRE GANHA.`
   - Batalhas e decisões coletivas.
   - O painel de chat possui uma demonstração animada em loop: usuários enviam comandos e incentivos; o NeesBot registra, explica os efeitos, atualiza a batalha e comunica recompensas coletivas.
   - Os medidores de comunidade e criatura são barras CSS proporcionais e animadas, não caracteres de texto.
   - O painel do chat mantém altura baseada no próprio conteúdo e não é esticado pela coluna explicativa ao lado.
   - A animação é substituída pelo estado completo e estático quando `prefers-reduced-motion` estiver ativo.

2. **Quando estiver off**
   - Cada pessoa acessa a área do próprio personagem.
   - Perfil, nível, inventário, conquistas e ranking.
   - O progresso permanece entre as transmissões.

Título atual:

```text
NA LIVE, VOCÊ JOGA.
NO OFF, VOCÊ EVOLUI.
```

- `NO OFF, VOCÊ EVOLUI.` usa o roxo claro `#7567FF`, com sombra pixel suave para manter contraste no fundo claro.
- Nome atual do game: `ChatBattle`.
- O botão da seção exibe o nome do game em vez de `ACESSAR DEVLOG`.
- O nome será editável nas configurações do game no Thenees Control; o protótipo já utiliza uma configuração central.
- Os três cards de benefícios usam ícones CSS em pixel art 16-bit (chat, personagem e evolução), sem símbolos vetoriais genéricos.
- Os cards são compactos verticalmente, com altura aproximada de 205 px no desktop.

### Comunidade

- Apresentação da comunidade.
- Quatro estatísticas preenchidas: seguidores, subs ativos, horas assistidas e clipes.
- Arquitetura híbrida: Twitch/Kick alimentam automaticamente o que suas APIs e permissões permitirem; métricas calculadas ou indisponíveis possuem fallback manual no admin.
- Mural verde de quotes em rotação automática.
- O bot aceitará `!quote mensagem` somente do broadcaster ou de moderadores autorizados, salvando texto, autor original, plataforma e data brasileira.
- Após concluir um novo cadastro no game, o NeesBot anunciará nos chats da Twitch e da Kick o nome público do jogador e sua categoria no ChatBattle.
- Na data de aniversário informada pelo jogador, o NeesBot publicará uma mensagem nas duas plataformas para a comunidade parabenizá-lo. A mensagem pública não revela ano de nascimento nem idade.
- Os anúncios de cadastro e aniversário só serão disparados após confirmação do servidor e deverão possuir controle contra mensagens duplicadas entre Twitch e Kick.
- Depois de salvar uma quote, o bot responde no chat marcando o autor, confirma que a frase foi enviada ao site e publica o link `https://www.theneees.com.br/#comunidade`.
- Modelo da resposta: `@usuario, sua frase entrou para o arquivo da comunidade! Veja em https://www.theneees.com.br/#comunidade`.
- A confirmação só é enviada depois que o servidor persistir a quote com sucesso; falhas não podem gerar anúncio falso no chat.
- Todas as quotes aprovadas permanecem armazenadas e entram na rotação pública para incentivar participação.
- Quotes também poderão ser corrigidas, ocultadas ou incluídas manualmente no Thenees Control.
- Chamada para o Discord oficial: `https://discord.gg/fUEG3h2ED`.
- Frase: “Eu vim pela gameplay. Fiquei pelo desastre.”

### Parcerias

- Área comercial para marcas e patrocinadores.
- Chamadas para Media Kit e contato.
- Categorias: integrações, conteúdo, eventos e branded games.

### Thenees Lab

- Área de experimentos.
- Conceitos: bots, encurtador de links, integrações e projetos secretos.
- Terminal visual com estados simulados.
- O subtítulo `EXPERIMENTOS EM ANDAMENTO` mantém 34 px de respiro abaixo do marcador da seção para não ficar colado ao título técnico.

### Thenees Control

- Teaser do futuro painel administrativo.
- Painel para controlar site, live, game, bot, links e conteúdo.
- Deve permanecer apresentado como acesso restrito e “em breve”.

### Rodapé

- Composição institucional com CTA `A LIVE TERMINA. A COMUNIDADE CONTINUA.`.
- Botão comercial de contato com cantos retos.
- Marca, descrição profissional e status separado de site/live.
- Navegação interna, canais oficiais e contato comercial organizados em colunas.
- Links oficiais: Twitch `https://www.twitch.tv/thenees`, Kick `https://kick.com/thenees`, YouTube `https://www.youtube.com/@theneesr` e Discord `https://discord.gg/fUEG3h2ED`.
- E-mail oficial: `contato@theneees.com.br`.
- Informações de Brasil/fuso BRT, direitos autorais e retorno ao topo. O crédito visual da BoldPixels foi removido do footer; a atribuição exigida permanece nos arquivos de licença e na documentação interna do projeto.
- Layout responsivo em quatro, três, duas ou uma coluna conforme a largura.
- As três faixas principais do footer sobrescrevem explicitamente regras legadas: CTA, grade de conteúdo e barra legal usam toda a largura horizontal disponível no desktop.

## 6. Interações existentes

- Navegação suave por âncoras.
- Header fixo.
- Menu mobile expansível.
- Itens da navegação usam peso regular, sem bold.
- Um cursor pixelado inspirado em menus 16-bit aparece no hover e permanece fixo na seção ativa.
- A seção ativa do menu acompanha cliques e rolagem.
- Relógio local atualizado em tempo real.
- Alternância interativa entre os modos Live e Perfil na seção Game.
- Microinterações de hover em botões e cards.
- Movimento da Hero controlado pela rolagem.
- Respeito à configuração `prefers-reduced-motion`.

## 7. Responsividade

O protótipo possui adaptações para:

- desktop amplo;
- telas intermediárias;
- celulares.

Na Hero mobile:

- o título continua em exatamente três linhas;
- o canvas ASCII é reposicionado e perde opacidade para preservar a leitura;
- indicadores fotográficos secundários são removidos;
- os dois botões permanecem visíveis;
- o título reduz de tamanho sem quebrar `VOCÊS INTERAGEM.`.

## 8. Arquivos principais

- `app/page.tsx`: conteúdo, estrutura e interações.
- `app/globals.css`: identidade visual, responsividade e animações.
- `app/layout.tsx`: metadados, idioma e estrutura global.
- `public/thenees-ascii-source.jpg`: fonte invisível usada para formar o retrato ASCII da Hero.
- `public/fonts/`: fontes locais e licença da BoldPixels.
- `.openai/hosting.json`: configuração do Sites; sem persistência configurada no momento.

## 9. Estado técnico

- Projeto em React/Vinext.
- Landing page em uma rota principal.
- Sem banco de dados ou autenticação nesta fase.
- Sem integrações reais com Twitch, Kick, Discord, Supabase ou bot nesta fase.
- Build validado com sucesso após as alterações atuais.
- Prévia local: `http://localhost:3001`.

## 10. Conteúdo ainda provisório

Os seguintes dados devem ser substituídos antes da publicação:

- horários reais das transmissões;
- números reais da comunidade;
- Media Kit real;
- textos finais de parcerias;
- regras definitivas do game;
- dados do personagem e ranking;
- status real de live e viewers.

## 11. Regras para próximas alterações

1. Consultar este documento antes de editar.
2. Não modificar outras seções quando o pedido mencionar uma seção específica.
3. Preservar o título da Hero exatamente como registrado.
4. Manter BoldPixels nos títulos e Silkscreen na interface.
5. Não reintroduzir Chakra Petch sem solicitação explícita.
6. Evitar excesso de HUD ou decoração gamer na Hero.
7. Manter o retrato ASCII como elemento central da Hero; a fotografia-fonte nunca deve aparecer diretamente.
8. Validar o carregamento real das fontes no navegador quando houver mudanças tipográficas.
9. Validar o build após cada rodada de alterações.
10. Tratar links, estatísticas e integrações atuais como placeholders.
11. Nenhum botão do projeto deve usar formato de cápsula ou bordas excessivamente arredondadas; priorizar cantos retos/pixelados.
12. Nenhum texto informativo pode ficar ilegível: fonte pixel significativa usa mínimo de 9 px no desktop e 10 px em celulares, entrelinha mínima aproximada de 1.55 e contraste adequado. Textos corridos pequenos usam preferencialmente 10 px ou mais.

## 12. Próximos passos possíveis

- refinar espaçamento e movimento da Hero;
- inserir links oficiais;
- revisar conteúdo de cada seção;
- projetar a página individual do Game;
- projetar a área do personagem;
- estruturar o painel Thenees Control;
- integrar Supabase;
- integrar Twitch e Kick;
- preparar publicação com domínio próprio.

## 13. Checkpoint técnico da Hero ASCII

Este bloco registra os detalhes necessários para reproduzir o estado atualmente aprovado sem depender do histórico da conversa.

- Fonte de imagem: `public/thenees-ascii-source.jpg` (1280 × 720).
- A imagem é carregada apenas por `new Image()` dentro de `app/page.tsx`; não existe elemento `<img>` visível na Hero.
- Renderização final: `<canvas class="ascii-canvas">` transparente.
- Caracteres utilizados: ` .,:;i1tfLCG08@`.
- Célula: 8 px no desktop e 9 px em larguras menores.
- Tipografia dos caracteres: Silkscreen.
- Cor padrão: branco quente; caracteres próximos ao ponteiro mudam para `#C5FF00`.
- Interação: repulsão e ondulação local dentro de um raio aproximado de 118 px.
- A animação interativa é desativada quando `prefers-reduced-motion` estiver ativo.
- Encaixe da fonte: equivalente a `cover`, sempre preservando sua proporção original.
- Foco horizontal do recorte: aproximadamente 58% da largura da fotografia, mantendo o streamer à direita.
- Campo ASCII no desktop: até 78vw ou 1180 px, alinhado à direita e ocupando a altura útil da Hero.
- Degradê esquerdo: começa com opacidade zero e faz uma transição suave nos primeiros 34% do canvas.
- A intensidade total permanece no lado direito; a borda inicial do canvas não pode ficar perceptível.
- Fundo definitivo da Hero: `#1D1D21`, uniforme, sem noise, granulado, moldura, círculo ou diagonal decorativa.
- O scroll aplica somente profundidade vertical sutil; não deve separar os elementos lateralmente.
- Qualquer troca futura da fotografia-fonte deve conservar: proporção, preenchimento vertical, foco no streamer, transparência inicial e ausência da foto real na interface.

### Estado validado

- Build de produção concluído com sucesso após a reformulação profissional do footer e centralização dos links oficiais.
- Prévia local mantida em `http://localhost:3001/#home`.
- `PROJECT_STATE.md` é a especificação vigente; `CHECKPOINT-2026-08-09.md` registra a evolução consolidada desta rodada.

## 14. Dashboard de jogadores e presença

- O Thenees Control exibe total de jogadores cadastrados e jogadores ativos nos últimos cinco minutos.
- A tabela `game_players` guarda identidade do jogador, plataforma, categoria, nível, aniversário e estado da conta.
- A tabela `game_presence` guarda estado `online`, `playing`, `away` ou `offline`, plataforma, sessão e última atividade.
- Dados pessoais dos jogadores não possuem leitura pública direta; o acesso administrativo é protegido pelas políticas do Supabase.
- As duas estruturas foram instaladas no projeto Supabase em 10/08/2026.
- Até o cadastro e o ChatBattle começarem a alimentar essas tabelas, os indicadores aparecem zerados.
- A ordem oficial das próximas etapas está registrada em `NEXT_STEPS.md`.

## 15. Área do jogador — ChatBattle

- Nova rota pública `/jogar`, acessível pelo botão principal da seção O Game.
- Cadastro e login por e-mail e senha através do Supabase Auth.
- Perfil inicial com nome de jogador, nome exibido, classe, plataforma principal e aniversário opcional.
- A data de aniversário fica preparada para o futuro modo festa e anúncios do NeesBot.
- Cada jogador pode ler e alterar somente seu próprio cadastro e presença.
- O acesso ao Control continua separado e depende da tabela administrativa.
- A presença muda para `online` ao carregar o perfil e para `offline` ao sair da conta.
- Twitch e Kick aparecem como conexões futuras; nenhuma integração fictícia foi ativada.

## 16. Agenda e vídeos administráveis

- O módulo `01.03 / Agenda e Vídeos` do Control permite adicionar, editar, publicar e remover transmissões.
- Cada evento possui data e horário, título, jogo, plataforma, descrição e estado de publicação.
- O mesmo módulo controla título, URL, capa e publicação do vídeo editorial em destaque.
- A landing page lê apenas eventos e vídeos publicados, ordenados pelo banco.
- Datas e horários são apresentados no fuso `America/Sao_Paulo`.
- A agenda preserva o modo festa em 12/08.
- O vídeo usa URL e capa administráveis, com extração automática do identificador do YouTube.
- Conteúdo inicial instalado no Supabase: três eventos e um vídeo em destaque.
- Build de produção validado após a integração.

## 17. Textos e links oficiais administráveis

- `01.02 / Páginas e Textos` controla as apresentações de Sobre, Game, Comunidade, Parcerias, Thenees Lab e os textos do rodapé.
- O inventário pessoal continua editável no mesmo módulo, separado dos textos institucionais.
- `01.04 / Links Oficiais` controla Twitch, Kick, YouTube, Discord, e-mail e URL pública da comunidade.
- Botões, rodapé, Media Kit, vídeo e mensagem de confirmação de quote utilizam a fonte central de links.
- A landing page mantém valores padrão seguros durante carregamento ou ausência temporária de dados.
- As configurações `site_content` e `official_links` foram publicadas e verificadas no Supabase.
- Build de produção validado após a integração.

## 18. Equipe, convites e permissões

- O módulo `06.01 / Equipe & Acessos` permite convidar pessoas por e-mail, escolher sua função e suspender ou reativar integrantes.
- O convidado cria a conta pelo próprio Control; no primeiro acesso, o convite válido é reivindicado automaticamente e gera o registro administrativo correspondente.
- Papéis disponíveis: `owner`, `admin`, `editor` e `moderator`.
- `owner` e `admin` visualizam e administram todas as categorias do painel.
- `editor` visualiza Dashboard, Conteúdo do Site, Comunidade e Comercial.
- `moderator` visualiza Dashboard, ChatBattle, NeesBot e Comunidade.
- A navegação lateral mostra somente as categorias autorizadas para cada função, reduzindo ruído e evitando acesso acidental.
- As políticas do Supabase aplicam os mesmos limites diretamente no banco; esconder um item no menu não é usado como mecanismo de segurança.
- Somente owner/admin administram equipe e convites.
- Uma proteção adicional impede que usuários que não sejam owner alterem ou removam a conta owner, ou concedam esse papel a outra conta.
- Migrações desta etapa: `202608100006_team_roles_and_invites.sql` e `202608100007_protect_owner_role.sql`.
- A aplicação da proteção final foi confirmada no Supabase em 10/08/2026.
- Build de produção validado após a criação da interface de equipe e permissões.

## 19. Etapa ativa — Comunidade

- Próximo foco: métricas, quotes e aniversários da área 04.
- As quatro métricas devem aceitar origem automática das plataformas e valor manual de segurança no Control.
- Quotes devem guardar mensagem, autor, data, plataforma, responsável pela aprovação e estado de publicação.
- Aniversários dos jogadores devem alimentar o modo festa e preparar anúncios futuros do NeesBot.
- Esta etapa será concluída antes da arquitetura definitiva do NeesBot e das integrações Twitch/Kick.

## 20. Comunidade administrável

- `04.01 / Métricas` controla os quatro blocos públicos: rótulo, valor, texto auxiliar, origem e visibilidade.
- Cada métrica conserva valor manual como fallback; as opções Twitch, Kick, Twitch + Kick e Sistema já identificam sua futura fonte automática.
- A landing page consulta somente métricas públicas no Supabase e mantém valores padrão seguros se a consulta estiver indisponível.
- `03.02 / Quotes` permite cadastrar frases, autor, plataforma, data e estado de publicação.
- Quotes podem ficar pendentes, publicadas, rejeitadas ou arquivadas; somente registros aprovados aparecem no arquivo rotativo do site.
- A estrutura registra quem submeteu a quote, identificador futuro da mensagem de origem e quando o bot anunciou sua publicação.
- `04.02 / Aniversários` lista jogadores com aniversário cadastrado e permite editar a mensagem do bot e ativar/desativar o modo festa.
- A visão `community_birthdays_today` identifica aniversariantes do dia usando o fuso `America/Sao_Paulo`.
- Dados confirmados no Supabase em 10/08/2026: 4 métricas, 3 quotes aprovadas e 3 colunas novas de aniversário.
- Migração: `202608100008_community_hub.sql`.
- Build de produção validado após a integração.

## 21. Etapa ativa — Comercial

- Próximo foco: Media Kit, parcerias e mensagens recebidas pelo formulário.
- O conteúdo comercial deverá ser editável sem alterar o layout aprovado.
- Mensagens deverão ter estados de nova, lida, respondida, arquivada e spam.

## 22. Media Kit, parcerias e mensagens

- `05.01 / Media Kit` e `05.02 / Parcerias` editam a apresentação comercial centralizada em `commercial_content`.
- Capa, título, descrição, apresentação do Thenees, diferencial e quatro formatos comerciais são administráveis.
- O Media Kit público usa as mesmas quatro métricas da comunidade, evitando números divergentes entre o site e a apresentação comercial.
- O formulário de contato grava mensagens reais no Supabase através da função protegida `submit_contact_message`.
- Proteções atuais: soma de verificação humana, campo honeypot, validação de tamanhos e limite de três mensagens pelo mesmo e-mail a cada hora.
- O formulário coleta nome, e-mail, empresa/projeto, tipo de contato, assunto e mensagem.
- `05.03 / Mensagens` oferece caixa de entrada, notas internas, resposta por e-mail e estados `new`, `read`, `replied`, `archived` e `spam`.
- A função pública não libera inserção direta na tabela; somente a chamada validada executa a gravação.
- Estrutura confirmada no Supabase em 10/08/2026: 1 configuração comercial, 4 colunas adicionais de atendimento e 1 função pública protegida.
- Migração: `202608100009_commercial_and_messages.sql`.
- Build de produção validado após a integração.

## 23. Etapa ativa — NeesBot

- Próximo foco: arquitetura, comandos, eventos, automações e fila de entrega do bot.
- Credenciais privadas das plataformas jamais serão armazenadas ou exibidas na aplicação do navegador.
- Twitch e Kick terão adaptadores independentes sobre a mesma fila de eventos do ecossistema.

## 24. Núcleo do NeesBot

- `03.01 / Canais & Comandos` controla os canais Twitch/Kick e os comandos compartilhados.
- Configurações de comando: descrição, template de resposta, permissão, cooldown e estado ativo.
- Comandos iniciais: `!quote`, `!perfil`, `!rank`, `!aniversario`, `!atacar` e `!defender`.
- `03.03 / Automações & Fila` controla templates, plataforma de destino, inclusão de link e ativação.
- Automações iniciais: novo jogador, aniversário, quote publicada, início da live e evento do ChatBattle.
- `bot_outbox` mantém fila deduplicada com estados pendente, processando, enviado, falha e cancelado.
- `bot_delivery_logs` registra plataforma, identificador externo, sucesso, falha ou descarte.
- Novos jogadores geram automaticamente `player_registered`.
- Quotes aprovadas geram automaticamente `quote_published` e não são enfileiradas duas vezes.
- `queue_today_birthdays` cria os eventos do dia com chave única por jogador e data no fuso brasileiro.
- Falhas podem ser reprocessadas pelo Control por owner/admin.
- Tokens e segredos não existem nas tabelas públicas nem na interface administrativa.
- Estrutura confirmada no Supabase em 10/08/2026: 2 canais, 6 comandos, 5 automações, 2 funções principais e gatilhos instalados.
- Migração: `202608100010_neesbot_core.sql`.
- Build de produção validado após a integração.

## 25. Etapa concluída — Twitch

- Autenticação segura, recebimento de eventos e entrega das mensagens da fila na Twitch foram ativados em 10/08/2026.
- O adaptador Twitch deverá ser independente do núcleo e dos futuros processos da Kick.

## 26. Integração Twitch — implementação preparada

- OAuth Authorization Code implementado com estado descartável e expiração de dez minutos.
- Tokens e refresh tokens ficam no schema `private`, sem acesso por anon ou authenticated.
- Renovação automática do token ocorre cinco minutos antes da expiração.
- EventSub valida assinatura HMAC-SHA256 usando ID, timestamp e corpo bruto da requisição.
- Eventos duplicados são descartados por identificador externo único.
- Eventos preparados: mensagens de chat, follows, subs, mensagens de sub, bits, live online e live offline.
- `!quote` respeita permissão de moderador/broadcaster e grava a mensagem original.
- Outros comandos do NeesBot são transformados em eventos deduplicados da fila.
- Worker Twitch consome itens `TWITCH` e `BOTH`, envia pela API Helix, registra entrega e aplica espera exponencial em falhas.
- Mensagens são limitadas a 500 caracteres, conforme a API Twitch.
- O Control possui conexão OAuth, ativação EventSub, teste da fila e desconexão segura em `06.02 / Integrações`.
- Estrutura instalada e confirmada no Supabase: 2 integrações, 2 tabelas privadas, 5 funções SQL protegidas e 3 políticas administrativas.
- Migração: `202608100011_twitch_adapter.sql`.
- Funções locais: `twitch-oauth-start`, `twitch-oauth-callback`, `twitch-eventsub`, `twitch-subscribe`, `twitch-worker` e `platform-disconnect`.
- Build da aplicação validado.
- As seis Edge Functions foram publicadas diretamente no projeto Thenees pelo painel autenticado do Supabase.

## 27. Twitch ativa — 10/08/2026

- Aplicativo confidencial `Thenees Control` conectado à conta oficial `Thenees` por OAuth.
- Tokens e refresh tokens permanecem no schema privado; segredos ficam somente nas Edge Functions.
- Escopos ativos: `user:read:chat`, `user:write:chat`, `user:bot`, `channel:bot`, `moderator:read:followers`, `channel:read:subscriptions`, `bits:read` e `channel:read:redemptions`.
- EventSub usa App Access Token para webhooks e o token autorizado do usuário permanece reservado ao chat e às ações do canal.
- Webhooks de live online/offline, follows, inscrições, mensagens de inscrição, bits e mensagens do chat foram aceitos; estado final no Control: `ACTIVE`.
- O callback valida assinatura HMAC, responde ao challenge com corpo e tamanho corretos e registra revogações.
- A sincronização reconhece inscrições já existentes e consulta o estado real na Twitch, evitando falso erro por duplicidade.
- Worker validado com fila vazia: `0 EVENTOS PROCESSADOS`, sem publicar mensagem de teste no chat oficial.
- O Control possui ações para ativar EventSub, testar fila, reautorizar e desconectar a Twitch.
- Próxima etapa oficial depois da validação dos comandos: integração Kick.
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` e demais segredos necessários já estão configurados no ambiente privado do Supabase.
- Instruções completas em `TWITCH_SETUP.md`.
# 28. Integridade de textos UTF-8

- Migração `202608100012_utf8_text_repair.sql` aplicada para reparar textos legados com acentos corrompidos em comandos, automações, fila e integrações.
- O Thenees Control normaliza textos do NeesBot ao carregar e antes de salvar.
- O worker da Twitch normaliza cada mensagem em UTF-8/NFC antes do envio ao chat.
- Validação concluída no painel com `parabéns`, `aniversário` e `ANIVERSÁRIO` exibidos corretamente.

# 29. Gestão de comandos do NeesBot

- Owner, admin e moderador podem criar e editar comandos pelo Thenees Control.
- Criação pelo chat usa `!addcom !nome resposta` e exige moderador ou broadcaster.
- Novos comandos do chat nascem ativos, disponíveis para todos e com cooldown inicial de 10 segundos.
- O NeesBot confirma criação, duplicidade, erro ou sintaxe inválida no próprio chat.
- A tela `03.01` usa tabela compacta com busca, status, prévia da resposta, cooldown, nível de acesso e accordion de edição.
- O Control oferece criação de comandos e lista as variáveis disponíveis para templates.
- Migrações aplicadas: `202608100013_bot_command_responses.sql` e `202608100014_chat_command_management.sql`.
- A Edge Function `twitch-eventsub` foi republicada sem imports relativos; o Supabase confirmou a atualização com sucesso.
- Validação pendente: enviar novamente `!addcom !discord Entre no servidor: https://discord.gg/fUEG3h2ED` no chat depois da publicação e confirmar a resposta do bot.
