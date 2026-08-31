# Modo de mensagens com IA — especificação futura

## Estado atual

Não implementado e desativado. O projeto não faz chamadas a modelos de IA, não exige chave de API e não gera custo financeiro relacionado a IA.

O recurso ativo é a seleção aleatória gratuita: cada linha preenchida em um campo de mensagem representa uma resposta possível, e o bot escolhe uma linha a cada envio.

## Proposta para uma implementação futura

Cada comando, timer ou automação poderá escolher um modo de resposta:

- `fixed`: uma única mensagem configurada;
- `random_lines`: uma opção aleatória entre as linhas configuradas;
- `ai`: uma resposta gerada a partir de instruções e do contexto permitido.

O modo `ai` deverá nascer desligado e depender de ativação explícita no Control. Se ele falhar, exceder limites ou ficar indisponível, o bot deverá usar uma resposta configurada em `random_lines`, sem interromper comandos ou automações.

## Requisitos obrigatórios antes de ativar IA

- chave armazenada apenas como segredo no servidor;
- orçamento diário e mensal configurável;
- limite de respostas, tamanho e frequência por usuário e por canal;
- indicação clara de custo estimado e consumo no Control;
- filtro de segurança e proteção contra instruções maliciosas do chat;
- contexto mínimo, sem envio desnecessário de dados pessoais;
- registro auditável da origem, custo, tempo e resultado de cada geração;
- botão global para desligar IA imediatamente;
- testes separados para Twitch e Kick;
- consentimento explícito do administrador antes da primeira chamada paga.

## Regra de produto

Nenhuma integração de IA deve ser ativada apenas por uma atualização de código. A ativação futura exige escolha do provedor, confirmação de preços vigentes, definição de orçamento e autorização expressa do responsável pelo projeto.
