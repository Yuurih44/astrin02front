# Astro Security

Site de apresentação da Astro Security, separado do projeto Astro banco. Inclui uma prévia imersiva independente em `/imersivo.html?motion=full`.

## Rodar

Node 20 ou superior. Não é necessário instalar dependências.

```sh
npm run dev
```

Abra http://localhost:4180/?motion=full ou execute `Abrir Astro Security.cmd`. Por padrão, o formulário baixa um briefing TXT e não armazena os campos no servidor.

## Demonstração com banco local

Execute `Abrir Demo Local.cmd` e abra http://localhost:4182/?motion=full#contato. O formulário oferece uma ação separada para salvar localmente, após confirmar a capacidade da API. O download continua disponível. Nada é enviado por e-mail ou WhatsApp.

Configuração por variáveis de ambiente:

- `ASTRO_PORT`: porta, padrão 4180.
- `ASTRO_HOST`: endereço, padrão 127.0.0.1.
- `ASTRO_ENABLE_INTAKE=1`: habilita armazenamento, restrito a loopback.
- `ASTRO_DATA_DIR`: diretório opcional dos dados. O padrão é `%LOCALAPPDATA%\AstroSecurity\data`, fora do OneDrive e dos arquivos públicos.

SQLite real via SQL.js 1.13.0, incluído em `db/vendor` com licença e procedência. A demonstração usa um processo gravador por arquivo e exporta o banco em memória a cada gravação. Não é uma configuração de produção. Detalhes de persistência em `db/README.md` e revisão em `docs/security-review.md`.

A API valida os campos, limita corpo e frequência, verifica a origem e responde sucesso após persistir. Não existe endpoint público de consulta dos pedidos. O site não executa testes de vulnerabilidade.

## Verificar

```sh
npm test
npm run check
npm run test:intake
```

Os testes unitários e de integração usam dados sintéticos e arquivos temporários. O teste de navegador inicia servidores temporários nos modos com e sem armazenamento, em larguras 320 e 390. Ele usa Playwright já disponível no projeto vizinho `astro-bank` e Edge instalado; essa dependência é apenas de desenvolvimento. `verify-browser.mjs` e `verify-immersive.mjs` verificam as experiências visuais com o servidor 4180 ativo.

Three.js 0.170 e Manrope são servidos localmente, com licenças em `public/vendor`. Logo Astro fornecida pelo projeto do usuário. A cena 3D é procedural. Canais reais de contato, hospedagem e publicação continuam pendentes de definição pela equipe.
