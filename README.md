# Astro Security

Site institucional da Astro Security. A abertura imersiva em Three.js é a experiência principal em `/`, seguida de serviços, método, relatório demonstrativo, dúvidas e contato. `/imersivo.html` mantém acesso à mesma experiência. Projeto separado do Astro banco.

## Rodar

Node 20 ou superior. Instale as dependências quando necessário:

```sh
npm ci
npm run dev
```

Abra http://localhost:4180/?motion=full. `npm run dev` inicia sem coleta. Para usar o PostgreSQL local já configurado nesta máquina, execute `Abrir Astro Security.cmd` ou `node dev-local.mjs`: esse comando inicia o banco portátil e habilita o formulário na porta 4180. `Abrir Demo Local.cmd` oferece a mesma experiência na 4182. Sem `motion=full`, a página respeita a preferência de movimento reduzido do sistema. Por padrão, o formulário baixa um briefing TXT e não envia ou armazena os campos no servidor.

## PostgreSQL

A persistência usa PostgreSQL com o driver `pg`, migrações transacionais e consultas parametrizadas. Defina `DATABASE_URL` para uma instância PostgreSQL e `ASTRO_ENABLE_INTAKE=1` para habilitar a ação separada de salvar no formulário. A aplicação aguarda o COMMIT antes de responder sucesso. Não há envio por e-mail ou WhatsApp, scanner ou listagem pública dos pedidos.

- `DATABASE_URL`: conexão PostgreSQL; mantenha credenciais fora do Git.
- `ASTRO_ENABLE_INTAKE=1`: habilita armazenamento, restrito a loopback nesta configuração local.
- `ASTRO_PORT`: porta, padrão 4180.
- `ASTRO_HOST`: endereço, padrão 127.0.0.1.
- `ASTRO_TEST_DATABASE_URL`: conexão dedicada aos testes; cada fixture cria seu próprio schema aleatório.

O arquivo de conexão não é servido pelo site. Dados anteriores em SQLite não são apagados nem usados pela aplicação. Detalhes da implementação e da configuração local em `db/README.md`.

## Verificar

```sh
npm test
npm run check
npm run test:intake
node verify-browser.mjs
node verify-immersive.mjs
```

Testes reais de persistência exigem `ASTRO_TEST_DATABASE_URL`; sem ela, a suíte sinaliza explicitamente os casos não executados. A verificação de formulário exige o banco real e inicia seus próprios servidores. Os dois verificadores visuais usam o servidor 4180 ativo.

Os verificadores de navegador usam Playwright disponível no projeto vizinho `astro-bank` e Edge instalado; essa dependência é apenas de desenvolvimento. Artefatos ficam em `artifacts/`, fora do Git.

Three.js 0.170 e Manrope são servidos localmente, com licenças em `public/vendor`. Logo Astro fornecida pelo projeto do usuário. A cena 3D é procedural. Canais reais de contato, hospedagem e publicação continuam pendentes de definição pela equipe. Revisão local em `docs/security-review.md`.
