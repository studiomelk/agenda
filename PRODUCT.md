# Studio Melk — Manager Next

## Produto

Painel operacional para o Studio Melk, um estúdio de foto e vídeo. Esta é uma versão de desenvolvimento independente do site atual: não substitui a produção e não escreve no banco existente nesta fase.

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

## Restrições confirmadas

- Dados atuais permanecem preservados; há backup diário e exportação imediata no Google Cloud.
- O app atual em `studio-melk.vercel.app` não será sobrescrito.
- Alterações desta fase entram em uma branch de desenvolvimento e geram somente preview.

## Decisões desta fase

- Web: Next.js + TypeScript.
- Hospedagem: preview da Vercel; produção somente após aprovação explícita.
- Dados: exemplos locais nesta primeira tela. A leitura/migração do Firestore será uma etapa posterior, com regras de acesso revisadas.
