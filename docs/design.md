# Astro Security — primeira versão

Site de apresentação em português para a equipe Astro: pentest web/API, avaliação de infraestrutura e acompanhamento da correção. O usuário autorizou uma primeira versão criativa para avaliar e mudar depois. Não publicar, inventar resultados, clientes, certificações ou prometer segurança absoluta. A disponibilidade comercial dos serviços será validada antes de lançamento.

Identidade: logo oficial Astro, preto #0c0c0d, branco #f4f4f0, prata #c6c7c8, cinza de texto #a8a8ac, tinta #18181a. Manrope variável. Direção visual aprovada após pesquisa: o usuário gostou das órbitas do CyberCrest, especificamente sem o escudo, e aceitou a logo Astro no centro. A experiência WebGL agora usa logo vetorial com espessura real, dois anéis inclinados, pontos com rastros discretos e rótulos dos serviços. A rolagem muda suavemente a perspectiva; o tempo move os pontos apenas enquanto a cena está visível. Texto à esquerda, palco3D à direita; no celular, áreas separadas. Sem paisagem lunar, confete ou resultados inventados.

Revisão seguinte solicitada pelo usuário: variar também a composição. A abertura passa a ser clara, com título “Antecipe os riscos”, uma única órbita horizontal e o símbolo Eclipse oficial como escultura metálica escura. O restante das seções mantém a alternância clara/escura e as funcionalidades. Menu escuro recebe regra explícita para sobrepor o estado claro do cabeçalho.

Estrutura: abertura imersiva / serviços em acordeão sobre fundo claro / método e exemplo de relatório / perguntas frequentes / contato. O contraste entre seções usa faixa de transição discreta. Método informa autorização, escopo, validação, relatório, apoio e reteste. O exemplo de relatório é explicitamente ilustrativo.

Contato: equipe ainda não tem e-mail nem WhatsApp. Formulário gera arquivo de briefing local, sem envio, armazenamento ou coleta. O botão diz Baixar briefing e explica sua finalidade. Não construir scanner nem realizar testes de vulnerabilidade.

Arquitetura: HTML/CSS/JS nativos, Three.js já disponível localmente e servidor Node sem instalação. Movimento respeita preferência do sistema, pausa fora da tela e em aba oculta, mantém fallback estático quando WebGL falha. Breakpoints mobile projetados desde o início. Menu acessível, foco visível, acordeões nativos e campos com rótulos.

Avaliação: screenshots desktop1440/1920 e mobile390/320; verificar legibilidade, ausência de sobreposição e overflow, navegação, movimento reduzido, fallback3D e download real do briefing. Não reutilizar código do Astro banco além das dependências, fonte e logo.
