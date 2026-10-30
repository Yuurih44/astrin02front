# PostgreSQL local

`await createAssessmentStore({connectionString})` usa o driver `pg`. A opção aceita URL `postgresql://` ou `postgres://` e tem default em `DATABASE_URL`; ausência de configuração falha explicitamente. O store não possui fallback SQLite. `await store.create({name,company,email,service,scope})` retorna `{id,status:'new',created_at}` somente após COMMIT. `await store.close()` aguarda conexões ativas e fecha o pool.

Consultas de dados usam parâmetros `$1...$6`. Migrações SQL versionadas são executadas em transação protegida por advisory lock; versões futuras são recusadas. A migração e cada inserção usam `synchronous_commit=on`. A persistência depende do servidor PostgreSQL e da configuração/disco dele. Falhas na resposta de COMMIT podem deixar resultado incerto para o cliente; não há idempotência de reenvio nesta versão.

Os cinco campos de entrada são validados e aparados pela API; o esquema também exige limites, campos obrigatórios e serviços/estados conhecidos. A aplicação precisa de conexão privada a um banco existente e permissão para criar tabelas. Credenciais, TLS quando necessário, backups, retenção e operação pública ficam na configuração do ambiente. Nenhuma credencial deve entrar em logs, docs ou versionamento.

## Servidor portátil de desenvolvimento Windows

Os binários oficiais EDB são extraídos fora do projeto, em `%LOCALAPPDATA%/AstroSecurity/postgresql/pgsql`. Fonte: https://www.enterprisedb.com/download-postgresql-binaries ; arquivo Windows x86-64 18.6: https://sbp.enterprisedb.com/getfile.jsp?fileid=1260609 . Não há instalação global ou serviço do Windows.

`node db/local-postgres.mjs start` inicializa uma vez, com SCRAM, e inicia somente `127.0.0.1:55432`. Cria usuário de aplicação sem superuser e bancos `astro_security` e `astro_security_test`. Senhas aleatórias e URLs ficam exclusivamente em `%LOCALAPPDATA%/AstroSecurity/postgresql/local-config.json`. O helper nunca imprime credenciais. `node db/local-postgres.mjs stop` encerra esse cluster com pg_ctl. Uma inicialização interrompida antes da criação do config exige recuperação manual; o helper não apaga diretórios ou reinicializa clusters existentes.

No PowerShell, carregar sem imprimir:

```powershell
$localConfig = Get-Content "$env:LOCALAPPDATA/AstroSecurity/postgresql/local-config.json" | ConvertFrom-Json
$env:DATABASE_URL = $localConfig.databaseUrl
$env:ASTRO_TEST_DATABASE_URL = $localConfig.testDatabaseUrl
node --test tests/store.test.mjs
```

Os testes reais criam schemas `astro_test_<UUID>` exclusivos no banco de testes e removem somente esses schemas ao finalizar. Sem `ASTRO_TEST_DATABASE_URL`, eles são marcados explicitamente como ignorados; os testes de configuração continuam ativos. Não use banco de produção para testes. O runtime não importa nem carrega SQL.js; arquivos SQLite existentes não são migrados nem apagados. Artefatos vendor anteriores podem permanecer apenas como histórico até sua remoção do repositório.

O helper restringe a ACL do diretório ao usuário atual antes de criar segredos. Novas inicializações salvam também `bootstrap-admin.json` no diretório privado antes de iniciar o servidor, permitindo recuperação manual do administrador. O cluster usa a subpasta `cluster`; uma tentativa inicial vazia na subpasta `data` foi encerrada e preservada, sem serviço ativo.
