# Astro Security

Site de segurança ofensiva com apresentação 3D, serviços, método, exemplo de relatório e formulário de briefing.

## Executar

Requer Node.js 20 ou superior.

```sh
npm ci
npm run dev
```

Acesse http://localhost:4180. O formulário permite baixar o briefing em TXT sem enviar os dados ao servidor.

## Persistência opcional

Para salvar solicitações em PostgreSQL, configure `DATABASE_URL` e `ASTRO_ENABLE_INTAKE=1`. A coleta local exige escuta em loopback. `ASTRO_HOST` e `ASTRO_PORT` configuram o endereço e a porta.

No Windows, `npm run dev:local` utiliza o PostgreSQL portátil configurado em `%LOCALAPPDATA%/AstroSecurity/postgresql`. Detalhes em [db/README.md](db/README.md).

## Verificar

```sh
npm run check
npm test
```

Os testes de integração com PostgreSQL exigem `ASTRO_TEST_DATABASE_URL` apontando para um banco de testes.

## Estrutura

- `public/`: HTML, estilos, scripts, imagens e bibliotecas do front-end.
- `backend/` e `server.mjs`: servidor HTTP e API opcional.
- `db/`: persistência e migrações PostgreSQL.
- `tests/`: testes automatizados.

As licenças de Three.js e Manrope estão em `public/vendor/`.
