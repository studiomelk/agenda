# Studio Melk — Flow + Gerador

## Produto

Ecossistema operacional do Studio Melk com dois aplicativos coordenados:

- `studio-melk.vercel.app`: Flow, painel principal de gestão.
- `gerador-studio-melk.vercel.app`: Gerador independente, também disponível como módulo incorporado no Flow.

## Usuários

Márcio e a equipe comercial/operacional do estúdio.

## Objetivo principal

Transformar uma proposta em um relacionamento rastreável: capturar o lead, acompanhar a negociação, formalizar contrato e conduzir o evento até a entrega.

## Fluxo essencial

1. Lead chega por formulário, WhatsApp ou proposta.
2. Lead entra no funil comercial com origem e dados do evento.
3. Proposta é enviada e sua seleção é registrada.
4. Proposta aceita cria/atualiza contrato.
5. Assinatura e sinal confirmado liberam o evento para agenda, equipe e financeiro.

## Capacidades da primeira versão

- Visão de pipeline comercial e lista pesquisável de leads.
- Etapas: Novo lead, Contato feito, Qualificado, Proposta em preparo, Proposta enviada, Negociação, Aceita, Contrato enviado, Contrato assinado, Sinal pago, Evento confirmado, Em produção, Entregue e Pós-venda.
- Detalhe de lead com dados de evento, origem, proposta e próximos passos.
- Contrato de integração para receber dados do Gerador de Propostas sem gravar em produção.
- Estrutura preparada para uma fonte única de dados no Firebase/Firestore.

## Arquitetura confirmada

- Dados atuais permanecem preservados; há backup diário e exportação imediata no Google Cloud.
- O Gerador continua utilizável sozinho, sem depender da interface do Flow.
- O Flow incorpora a URL canônica do Gerador; não mantém uma segunda cópia da interface.
- A sincronização Gerador → Flow passa pelo servidor do Gerador e usa segredo somente entre servidores.
- Páginas públicas recebem tokens assinados, temporários e limitados ao tipo de operação; o código de conexão não é incluído no HTML exportado.
- As rotas públicas usam os dois domínios canônicos, sem depender do projeto legado `studio-melk-next`.

## Decisões desta fase

- Web: Next.js + TypeScript.
- Hospedagem: projetos Vercel separados para Flow e Gerador, publicados de forma coordenada.
- Dados: exemplos locais nesta primeira tela. A leitura/migração do Firestore será uma etapa posterior, com regras de acesso revisadas.
