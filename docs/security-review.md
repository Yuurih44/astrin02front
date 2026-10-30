# Revisão local de segurança

> A revisão vigente é a seção PostgreSQL abaixo. As seções anteriores ao final registram o inventário e a primeira entrega SQLite, substituída no runtime por decisão do usuário.

Data: 2026-10-30. Escopo inicial: `server.mjs`, `public/app.js`, `public/experience.js`, `public/immersive.js` e `docs/backend-proposal.md`. Revisão estática; sem exploração, acesso a domínios externos ou alteração da implementação. Esta revisão inicial antecede a integração da API e não certifica uma implantação pública.

## Estado existente

- O formulário gera um TXT com Blob; não envia os campos. A mensagem usa `textContent`, e `composeBrief` produz texto simples. Não foi identificado caminho de injeção HTML dos campos nos arquivos examinados.
- O servidor serve `public`, usa loopback por padrão e verifica que o caminho resolvido continua dentro dessa pasta. Exceções devolvem erro genérico, sem pilha ou caminho do arquivo. Não há banco, API ou consulta pública no código inicial.
- **Limitação concreta da contenção de arquivos:** `resolve` verifica o caminho lexical, mas `readFile` segue links simbólicos/junctions. Um link de `public` para uma área privada poderia tornar seus arquivos acessíveis. Não foi identificado destino de link desse tipo no levantamento; atributos ReparsePoint de arquivos sincronizados pelo OneDrive, isoladamente, não demonstram esse problema. Para a API, manter banco e arquivos SQLite auxiliares fora de `public`, rejeitar configuração de armazenamento dentro da árvore pública e não criar links públicos para a área de dados. A contenção real deve ser revisada na implementação.
- O servidor inicial serve o mesmo arquivo independentemente do método e não fornece CSP ou proteção contra enquadramento. São limitações de endurecimento do servidor estático, sem exploração demonstrada neste escopo. Elas não equivalem a uma falha de coleta de dados, pois a coleta ainda não existe.

## Contrato da entrega local

API de desenvolvimento, desativada por padrão, sem e-mail, WhatsApp, consulta pública, administração ou execução de scanners. Um pedido comercial não autoriza testes. Texto contendo URL no contexto pode ser armazenado como texto; jamais deve disparar acesso de rede, shell, resolução DNS ou scanner. Não é necessário proibir URLs em texto para assegurar esse comportamento.

Manter uma única lista de campos entre formulário, documentação, servidor e testes. A proposta inicial usa `name`, `company`, `email`, `service`, `scope`, `privacy_notice_version`; se a integração retirar a versão do aviso ou mudar `scope`, atualizar o contrato explicitamente. IDs, estado e datas são exclusivamente gerados pelo servidor.

## Matriz específica de revisão da API

| Controle | Comportamento a exigir | Evidência esperada nos testes locais |
| --- | --- | --- |
| Ativação | Intake desligado por padrão; ativação exige configuração explícita de desenvolvimento; configuração pública não deve ativá-lo acidentalmente. | Iniciar sem flag e verificar que POST não grava; ativar modo dev e verificar recebimento. |
| Limite de corpo | Contar bytes efetivamente recebidos, com teto de 32 KiB inclusive sem Content-Length; não confiar somente no cabeçalho; encerrar leitura ao exceder. | Corpo excessivo com comprimento declarado e em chunks retorna 413 e não grava. |
| Formato | Apenas JSON suportado; JSON malformado, null, array e valores primitivos não passam como objeto válido. | 415 para outro formato, 400 para JSON inválido e erro de validação coerente para forma inválida. |
| Campos | Tipos string; trim; limites da proposta; serviço em enum; campos desconhecidos rejeitados; validação de e-mail no servidor sem regex de custo explosivo. | Ausência, limites, tipo objeto/array, serviço arbitrário, campos internos e desconhecidos falham sem gravação. |
| Mesma origem | Comparar Origin por esquema, host e porta com origem configurada confiável; não derivar confiança de Host arbitrário ou forwarded headers. Definir explicitamente política para Origin ausente em clientes locais. | Origem estrangeira e `null` recusadas; origem esperada aceita; Host adulterado não torna origem estrangeira válida; sem CORS permissivo. |
| Abuso | Limiter por endereço do socket, sem confiar em X-Forwarded-For; cardinalidade e expiração limitadas; limite global de capacidade para evitar crescimento indefinido. | Excesso retorna 429; mudar X-Forwarded-For não contorna limite; entradas antigas expiram; mapa não cresce sem teto. |
| Persistência | SQLite privado, prepared statements, confirmação após commit; erros de abertura/gravação não retornam 201. Não inicializar arquivo público como fallback. | 201 corresponde a registro reaberto no banco; erro de escrita retorna erro genérico; conteúdo com aspas permanece texto. |
| Não exposição | Sem GET/listagem de pedidos; resposta de sucesso só ID e status; nenhuma resposta ecoa nome, e-mail, contexto ou exceção. | GET e caminhos de banco, WAL e SHM não entregam registros; respostas de validação e falha não contêm os valores enviados. |
| Logs | Registrar eventos operacionais limitados, sem corpo, e-mail, contexto, IP persistido ou dumps de exceções com dados. | Captura de stdout/stderr durante sucesso e falhas não contém valores sentinela enviados. |
| Conteúdo inerte | Nenhuma chamada a scanner, shell ou URL derivada dos campos; frontend exibe mensagens com APIs de texto. | Revisão de chamadas de rede/processo e persistência literal de contexto com URL e marcação HTML. |

Same-origin reduz abuso por navegadores, mas não autentica clientes nem substitui limiter. Limiter em memória é adequado ao escopo dev de processo único e reinicia com o processo; não deve ser descrito como proteção distribuída. SQLite local fora da pasta pública não fornece, por si só, criptografia ou controle de acesso do sistema operacional.

## Histórico — revisão da integração SQLite

Revisados `backend/server.mjs`, `server.mjs`, `db/store.mjs`, migração 001, `db/README.md`, formulário e frontend integrados, contrato do primeiro ciclo e testes de API, persistência e integração. **Nenhum achado Critical ou Important confirmado no escopo local definido.** Isso não certifica implantação pública nem protege contra usuários com acesso de escrita aos arquivos do processo.

- A contenção estática agora verifica `realpath` antes de ler; o teste de junction escapando de public é recusado. A limitação identificada no servidor inicial foi corrigida.
- O intake fica desligado por padrão e não inicializa banco. Ativação exige loopback na configuração e no `listen`. O diretório padrão resolve para `%LOCALAPPDATA%/AstroSecurity/data`, com fallback em diretório do usuário; a configuração e o destino real não podem ficar dentro de public. No Windows desta estação, LOCALAPPDATA fica fora de OneDrive. Um caminho fornecido explicitamente por `ASTRO_DATA_DIR` é configuração do operador, não entrada da requisição.
- A origem é comparada com uma lista fixa de origens HTTP loopback da porta efetiva, sem usar Host ou forwarded headers. Origin ausente, estrangeiro e `null` falham. O limiter usa o endereço do socket, TTL e mapa limitado a 256 entradas por padrão. Os aliases loopback aceitos são uma política explícita do contrato, não autenticação.
- O limite conta bytes em streaming antes do parse. Validação recusa campos desconhecidos, estruturas indevidas e controles. JSON com chaves duplicadas segue a regra de `JSON.parse`: prevalece a última ocorrência e o objeto resultante é validado. Sonda local independente confirmou e-mail inválido na última ocorrência → 422; válido na última ocorrência → 201. Não há segundo parser ou decisão baseada no valor descartado que produza bypass.
- Sonda local independente de upload interrompido confirmou nenhuma gravação parcial e servidor ainda apto a aceitar pedido válido. Os testes cobrem 32768 bytes aceitos, 32769 recusados e excesso em chunks.
- INSERT usa statement preparado; dados de URL/SQL/HTML permanecem texto inerte. Cada gravação exporta cópia, sincroniza arquivo temporário exclusivo e só confirma após rename; falha não contamina a cópia ativa. A API aguarda a Promise antes de 201. O arquivo reabre com registros após reinício. SQL.js não usa WAL/SHM nesta implementação.
- Não há consulta/listagem pública, execução de scanner, shell ou navegação derivada do contexto. Respostas retornam somente campos operacionais; falhas não ecoam PII, caminhos nem exceções. Não há logging de conteúdo de pedidos no fluxo integrado. A interface só envia após ação explícita de salvar, separada do download, e usa `textContent` para mensagens.

Evidência executada nesta revisão: `node --test tests/api.test.mjs tests/store.test.mjs tests/integration.test.mjs` — 19 testes passaram, zero falhas. Além disso, a sonda de duplicatas e aborto retornou `{duplicateInvalidLast:422,duplicateValidLast:201,healthyAfterAbort:201,records:2}`; os dois registros são apenas os dois envios válidos, sem registro do corpo interrompido.

Limites documentados e compatíveis com a demonstração: único processo gravador (a trava é somente intraprocesso); banco inteiro em memória/exportação a cada criação; limiter reinicia com processo; sincronização do arquivo não promete persistência do rename após queda de energia no Windows. Não descrevê-los como garantias de operação pública. Retenção e implantação pública continuam decisões futuras, sem bloquear a entrega local desativada por padrão.

## Revisão vigente — PostgreSQL e site imersivo principal

Escopo em 2026-10-30: `db/store.mjs`, migração 001 PostgreSQL, `db/local-postgres.mjs`, `backend/server.mjs`, `server.mjs` e `public/app.js`. O site imersivo na raiz mantém o mesmo formulário; a abertura WebGL não deriva URLs ou comandos dos campos. A implementação ativa não importa SQL.js nem usa arquivos SQLite.

Revisão estática: nenhum achado Critical ou Important confirmado no escopo local. A configuração ativa continua desabilitada por padrão e exige loopback e DATABASE_URL quando habilitada. Falha de conexão impede inicialização e não expõe URL ou credenciais; sucesso depende da Promise de persistência. Origem fixa da porta efetiva, validação de campos, limite de bytes e limiter pelo socket foram preservados. Não há consulta pública de pedidos.

O driver pg usa parâmetros para todos os valores recebidos. Migrações são transacionais, serializadas por advisory lock e recusam versões desconhecidas. Inserções usam transação com synchronous_commit=on e retornam somente depois de COMMIT. Erros executam ROLLBACK e não ecoam dados pela API. Indisponibilidade durante COMMIT pode deixar confirmação incerta para o cliente; não há promessa de idempotência e um reenvio pode duplicar um pedido.

O helper portátil é restrito a Windows e ao diretório privado LOCALAPPDATA. Aplica ACL antes de criar segredos, usa senha aleatória de 256 bits, SCRAM e loopback 127.0.0.1:55432; astro_app não recebe superuser, criação de bancos ou criação de roles. Binários vêm da distribuição EDB. O administrador inicial tem senha temporária não preservada; recuperação administrativa e inicialização interrompida são manuais. Não há modificação de serviço global nem exclusão de clusters. A configuração secreta fica fora do projeto e da pasta pública.

Evidência executada pela revisão: `node --test tests/api.test.mjs tests/store.test.mjs tests/integration.test.mjs` com ASTRO_TEST_DATABASE_URL da instância local — 22 testes passaram, zero falhas e zero skips. Cobrem configuração, erros sanitizados, bytes reais, origem, contenção de junction, migração concorrente, persistência após reabertura, SQL literal, rollback e resposta 503 por restrição real sem registros fantasmas. Inspeção do sistema confirmou escuta PostgreSQL somente em 127.0.0.1:55432, pg_hba com SCRAM para todas as regras ativas e ACL do arquivo secreto herdada somente pelo usuário atual. Consulta pg_roles confirmou astro_app com rolsuper=false, rolcreatedb=false, rolcreaterole=false. Nenhum valor de senha ou URL secreta foi impresso.

Limites atuais: banco local e role dona das tabelas para migrações; isso não é separação de privilégios de produção. TLS externo, backups, retenção, autenticação administrativa e proteção distribuída não foram implantados. Não há scanner nem publicação; o envio de briefing não autoriza testes ofensivos.
