# Astro Security Implementation Plan

> Execute inline with superpowers:executing-plans; final independent review.

**Goal:** entregar site local de apresentação Astro Security completo e responsivo.
**Architecture:** página estática com experiência3D isolada, interações em app.js, composição matemática e briefing puros em experience.js.
**Tech Stack:** Node20, HTML/CSS, Three0.170 e Manrope locais.
**Spec:** ../../design.md

## Constraints
- Projeto novo Desktop/astro-security; Astro banco preservado.
- Não instalar dependências, publicar ou anunciar provas sociais inventadas.
- Contato baixa briefing local; nenhum envio simulado.
- Preferência de movimento, pausa fora de tela e fallback acessível.

## Tasks
- [x] Testar primeiro narrativa contínua e briefing; implementar funções puras.
- [x] Construir conteúdo, navegação, serviços, processo, FAQ, contato e estilos responsivos.
- [x] Implementar esfera Three segmentada, abertura controlada por scroll, pausa e fallback.
- [x] Rodar servidor local4180, testes e capturas desktop/mobile; refinar visual.
- [x] Revisão independente: sem falhas importantes confirmadas; ajustar ordem do método, overflow de título mobile e foco após menu. Entregar link local.

## Verification ledger
- npm test:2/2; npm run check:pass.
- Browser:1440x900,1920x1080,390x844,320x568,640x360 passaram WebGL, scroll, pausa, download real, acordeão, teclado/menu e preferência de movimento.
- Fallback com módulo3D bloqueado:pass; zero page errors.
- Screenshots reviewed:artifacts/*; integração comercial de contato segue pendente do canal da equipe, por decisão explícita do usuário.

## Review focus
- Telas320px e celulares baixos: texto e objeto não se sobrepõem.
- WebGL indisponível: texto, navegação e formulário funcionam.
- Contato incompleto: briefing é baixado, jamais enviado silenciosamente.
- Movimento reduzido/aba oculta: sem loop de animação contínuo.
- Solicitação com dados inválidos: validação nativa e sem coleta remota.
