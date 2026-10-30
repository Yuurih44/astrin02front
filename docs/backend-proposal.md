# Proposta de backend — pedidos de avaliação

> Registro da proposta inicial. O ciclo seguinte implementou a demonstração local autorizada; veja README.md e docs/security-review.md para o estado atual. As descrições de ausência de backend abaixo retratam o inventário anterior.

## Estado e autorização

Inventário baseado em README.md, docs/design.md, docs/wordmark.md, docs/immersive-preview.md, server.mjs, public/index.html, public/app.js e public/experience.js.

Hoje o projeto é um site institucional estático servido por Node, sem dependências de backend, banco, autenticação ou endpoint de envio. O servidor lê arquivos de public; não processa o corpo de pedidos nem persiste briefings. O formulário valida os campos no navegador e gera astro-briefing-seguranca.txt com Blob. Não há transmissão dos campos ou persistência pela aplicação. O arquivo baixado fica sob controle do visitante.

O escopo autorizado desta entrega é inventário e proposta documental. Tudo abaixo é uma proposta futura: não cria banco, serviços, contas, coleta real, scanner ou autorização para pentest. Formulário, servidor e experiência visual permanecem com o comportamento atual. A equipe ainda precisa definir seu canal de contato.

## Modelo mínimo proposto

Uma entidade `assessment_requests`, independente de fornecedor:

| Campo | Tipo e regra proposta |
| --- | --- |
| id | UUID gerado pelo servidor; chave primária |
| name | Texto obrigatório, após trim, 1–100 caracteres |
| company | Texto obrigatório, após trim, 1–150 caracteres |
| email | Texto obrigatório, formato de e-mail, máximo 200 caracteres |
| service | Enum: complete, web_api, infrastructure_cloud, code_architecture, remediation_retest |
| scope | Texto obrigatório, após trim, 10–3000 caracteres; orientar a não incluir credenciais ou informação confidencial |
| status | Enum interno: new, reviewing, closed; padrão new |
| created_at / updated_at | Instantes UTC definidos pelo servidor |
| privacy_notice_version | Versão do aviso apresentado no envio; formato e necessidade a confirmar |

Os campos de contato reproduzem o formulário atual. Os identificadores de serviço substituiriam os rótulos em português apenas no contrato de integração. Campos novos, anexos, resultados técnicos, credenciais, IP do visitante, agente do navegador e telemetria não integram esse modelo mínimo. Um pedido comercial não representa permissão para testar sistemas.

## Contrato de API proposto

`POST /api/assessment-requests`, mesma origem, `Content-Type: application/json`, corpo com somente `name`, `company`, `email`, `service`, `scope` e `privacy_notice_version`. Exemplo ilustrativo:

```json
{
  "name": "Contato de exemplo",
  "company": "Empresa de exemplo",
  "email": "contato@example.com",
  "service": "web_api",
  "scope": "Entender o escopo de uma avaliação da aplicação.",
  "privacy_notice_version": "a-definir"
}
```

Validar no servidor antes de gravar, rejeitar campos desconhecidos e limitar o corpo a 32 KiB. Retornar `201 {"id":"<uuid>","status":"received"}` somente após confirmação da gravação. Essa resposta confirma recebimento, sem prometer contato ou início de avaliação.

Falhas propostas: `400` JSON inválido; `413` corpo excessivo; `415` formato não suportado; `422` campos inválidos; `429` limite de tentativas; `503` indisponibilidade. Erros usam `{"error":{"code":"validation_failed","fields":{"email":"invalid"}}}`, sem ecoar valores, detalhes de infraestrutura ou exceções. Limitação de tentativas, proteção contra automação e tratamento de reenvio precisam ser definidos antes de ativar a rota. Não disponibilizar consulta pública de pedidos. Acesso interno exige autenticação e autorização a definir.

## Decisões antes de implementar

- Escolher hospedagem, banco, região, orçamento e responsável operacional; não há fornecedor selecionado nem contas conectadas.
- Confirmar os campos realmente necessários, quem pode consultar pedidos e como a equipe receberá notificações. Não adicionar marketing ao envio de avaliação.
- Definir finalidade, aviso de privacidade, fundamento aplicável e canal de atendimento com o responsável da empresa. Esta proposta não determina essas decisões.
- Definir prazo de retenção para pedidos abertos e encerrados, procedimento de exclusão e expiração de backups. Nenhum prazo foi aprovado; evitar retenção indefinida como padrão implícito.
- Definir controle de acesso, gestão de segredos, backups/restauração, registros operacionais sem conteúdo dos briefings e retenção desses registros. Dados eventualmente tratados para proteção contra abuso também precisam de finalidade e prazo próprios.
- Aprovar a mudança da interface de download para envio real, com estados claros de envio, erro e recebimento, e validar o contrato antes de ativar coleta.

Uma futura implementação deve verificar validação, falha de gravação sem falso sucesso, limites de abuso e ausência de exposição pública dos pedidos. Nenhuma migração ou integração é necessária para manter a versão atual funcionando.
