# Órbitas Astro — direção aprovada

Referência visual: https://www.cybercrestcompliance.com/ (pesquisa em 30/10/2026). O usuário destacou os caminhos orbitais em volta do escudo e aprovou usar a logo Astro ao centro. Esta revisão substitui a cena anterior de aplicação em camadas.

Dois caminhos circulares em planos3D próximos, com traços em branco/prata. Seis pontos percorrem as órbitas com pequenos rastros; quatro rótulos representam aplicações, APIs, infraestrutura e código. A marca oficial é extrudada a partir do SVG original, com iluminação discreta e leitura frontal. A rolagem altera inclinação e orientação, sem recomeçar o movimento dos pontos.

O relógio é acumulado somente em frames visíveis; aba oculta e cena fora da tela interrompem o RAF. Movimento reduzido tem pose estática e relógio zero. Contexto WebGL perdido interrompe a animação e mantém o fallback SVG. Rótulos têm alinhamento central fixo, evitando saltos ao atravessar o centro.

Dependência adicional: SVGLoader do Three.js r170, mesma licença MIT do Three e mesma versão do módulo existente. Única alteração de fornecedor: importação aponta para ./three.module.js.

Verificações: testes de continuidade, rolagem reversa, movimento em repouso, limites dos rótulos e pausa. Verificação geral inclui formulário, menu, fallback e movimento reduzido. Capturas em artifacts/orbits-*.png.
