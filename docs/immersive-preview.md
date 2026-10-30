# Prévia imersiva isolada

O usuário gostou no papel de uma abertura em tela inteira em que a câmera se aproxima do O, atravessa seu centro e encontra ASTRO do outro lado. Esta é uma prévia visual para avaliação, servida em /imersivo.html. A abertura principal não foi substituída.

Cena: O oficial extrudado na origem, órbita inclinada com pontos e campo discreto de partículas. A câmera segue uma curva Hermite contínua, cruza o plano do O em p=.5 e se aproxima de ASTRO em z=-8. Depois recua para enquadrar a marca inteira. As letras começam a revelar antes da travessia para evitar um trecho vazio prolongado. No celular, o O inicial sobe e centraliza para separar texto e objeto; o tamanho da marca final acompanha o aspecto da tela.

Movimento reduzido mostra a marca final estática. Há atalho para pular, retorno ao site, fallback SVG e pausa fora da tela e em aba oculta. A cena só renderiza depois da inicialização assíncrona; perda de contexto mantém fallback e não reativa a renderização após compileAsync.

Validação:5 testes node e sintaxe; navegador1440x900,390x844,320x568. Verificação da câmera cruzando z=0, retorno, revelação, overflow, pausa fora da tela, movimento reduzido, fallback e ausência de erros JavaScript. Capturas em artifacts/immersive-verified-*.png.

Esta prévia avalia direção e movimento. Integração ao restante do site depende da reação do usuário.
