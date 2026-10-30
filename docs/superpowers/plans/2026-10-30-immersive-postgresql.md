# Astro principal imersivo e PostgreSQL

Correção autorizada pelo usuário em 2026-10-30: a experiência imersiva será a abertura do site principal, seguida das seções institucionais existentes. A rota /imersivo.html será compatível com a mesma experiência, sem rótulos de prévia ou necessidade de voltar a outro site. Manter rolagem nativa, fallback, respeito a movimento reduzido e testes mobile.

Persistência será PostgreSQL com driver pg, consultas parametrizadas, migração transacional e sucesso apenas após COMMIT. DATABASE_URL define a conexão. Não manter implementação SQLite ativa nem apagar arquivos anteriores. Sem publicação; todo trabalho permanece local.

Execução: front integra a experiência; banco substitui adaptador e prepara servidor PostgreSQL local isolado; backend adapta configuração; testes migram fixtures para schemas únicos; segurança revisa a integração final. Coordenador integra documentação, comandos, execução, verificação e commit.

## Validação pendente

- [x] Abertura WebGL na raiz e seções/contato na mesma página.
- [x] Desktop/mobile, ida e volta pela cena, menu e formulário sem overflow/erro.
- [x] PostgreSQL local com autenticação, loopback, dados fora do OneDrive.
- [x] Persistência real, concorrência, rollback e reinício; testes sem skips no ambiente preparado.
- [x] Revisão de segurança, documentação e commit local.

## Evidência final

27 testes passaram com PostgreSQL18.6 real, zero falhas e zero skips. verify-intake passou nos modos ON/OFF320/390 com exatamente dois registros sintéticos em schema exclusivo, nenhum HTTP externo/erro de página. verify-browser passou1440/1920/390/320/640, incluindo formulário, menus, fallback e movimento reduzido. Verificação imersiva passou1440/390/320. Revisão independente de segurança: nenhum Critical/Important confirmado no escopo local; listener127.0.0.1, SCRAM, ACL privada e role sem superuser. Servidores4180 e4182 iniciados via dev-local.mjs; raiz confirmou cena imersiva, serviços e formulário e capabilities local-demo.

Arquivos vendor SQL.js sem uso preservados porque a revisão automática rejeitou a remoção; não houve tentativa de contornar o bloqueio. Dados SQLite anteriores também preservados.
