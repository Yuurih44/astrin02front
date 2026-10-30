# Primeiro ciclo com cinco especialistas

**Objetivo:** validar a prévia e preparar pedidos de avaliação ponta a ponta apenas em ambiente local. O usuário autorizou começar com agentes de banco, front, testes, backend e segurança. O objetivo continua sendo o site de apresentação; não construir scanner, painel administrativo ou plataforma de pentest neste ciclo.

**Arquitetura:** site atual na4180 preserva download por padrão. Servidor pode habilitar intake com ASTRO_ENABLE_INTAKE=1, restrito a loopback, para demonstração na4182. SQLite real via SQL.js1.13.0 vendorado, sem npm install. Não configurar nuvem, contato externo ou publicar. Dados de demonstração fora de public e do diretório OneDrive por padrão.

## Contrato compartilhado
- GET /api/capabilities → {intake:{enabled:boolean,mode:'local-demo'|'download'}}.
- POST /api/assessment-requests, ativo somente no modo local: JSON {name,company,email,service,scope}. Campos desconhecidos rejeitados. Nenhuma URL é executada.
- service: complete | web_api | infrastructure_cloud | code_architecture | remediation_retest.
- Limites após trim: name1–100,company1–150,email<=200 válido,scope10–3000. Rejeitar JSON não objeto, controles indevidos e corpo>32KiB.
- Resposta201 somente depois de persistência confirmada: {id,status:'received'}. Sem eco de PII. Erros {error:{code,fields?}}:400,403,404(disabled),413,415,422,429,503.
- Origin precisa corresponder exatamente às origens loopback confiáveis da porta; nunca confiar no Host enviado. Sem consulta pública de pedidos nem CORS permissivo. Limiter pelo socket, memória limitada e TTL.
- Persistência db/store.mjs: async createAssessmentStore({filePath})→{create(input),close()}; create retorna {id,status:'new',created_at} após gravação atômica. SQL preparado; esquema migrado. Uma instância gravadora por arquivo nesta demonstração.
- DB padrão: %LOCALAPPDATA%/AstroSecurity/data/assessment-requests.sqlite (fallback pasta de usuário fora de public); modo desabilitado não cria banco. ASTRO_DATA_DIR permite diretório controlado pelo servidor, nunca pelo corpo da requisição.
- Formulário continua baixando por padrão. Só oferece salvar localmente quando capabilities confirma local-demo, com aviso explícito e ação separada. Não enviar campos automaticamente nem prometer contato/notificação.

## Propriedade dos arquivos
- Banco: db/** e tests/store.test.mjs; SQLite WASM, esquema, migração, concorrência local e durabilidade.
- Backend: server.mjs, backend/** e tests/api.test.mjs; validação, limites, Origin, capacidades e integração do store.
- Front: public/app.js,index.html,styles.css e ajustes pontuais em immersive.js se houver defeito concreto; nenhuma nova direção estética ou integração da prévia sem avaliação do usuário.
- Testes: testes adicionais em tests/integration.test.mjs,verify-intake.mjs e artifacts; reprodução real das entregas. Não editar implementação.
- Segurança: docs/security-review.md e revisão independente dos diffs integrados; não alterar implementação.
- Coordenador: package.json,README,plano, contratos e integração final; nenhum outro agente edita esses arquivos ou faz commit.

## Execução e verificações
- [x] Banco: testes antes de implementação, SQLite real com migração e create/close; reinício, concorrência, falha de gravação e corrupção não podem perder registros ou retornar falso sucesso.
- [x] Backend: testes com store injetado, código e integração real; rejeição de entradas e ausência de endpoint de listagem; conter caminhos reais do servidor estático.
- [x] Front: manter download, integrar salvar local explicitamente, estados de erro e botão durante envio; preservar todas as animações existentes.
- [x] Testes: rodar suites e navegadores, envio de exemplo deve sobreviver ao reinício do backend; validar modo padrão e limites.
- [x] Segurança: auditar implementação integrada e exigir correções dos achados concretos antes da entrega.
- [x] Coordenador: integrar scripts, documentação e demonstração em4182; manter4180 com modo padrão, confirmar estado e salvar commit local.

## Decisões
SQLite WASM evita instalar dependências na pasta OneDrive e mantém banco real, transações SQL e arquivo inspecionável. A execução é local, com um processo gravador. E-mail, WhatsApp, hospedagem e autenticação administrativa continuam fora deste ciclo porque não foram definidos. Os agentes executam em etapas conforme a capacidade de concorrência disponível; os cinco papéis permanecem designados.

## Evidência final

Em 2026-10-30: npm test passou com 24 testes e zero falhas; npm run check passou. verify-intake.mjs passou com API real em 320/390, modos ligado/desligado, exatamente dois envios explícitos persistidos em SQLite temporário e nenhuma requisição externa ou erro de página. Revisão independente de segurança sem achados Critical/Important no escopo local. Servidores 4180 (download) e 4182 (local-demo) responderam capacidades corretas; entrada inválida na demonstração retornou 422. Artefatos de execução ficam ignorados em artifacts/.
