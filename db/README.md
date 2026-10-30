# Persistência local

`await createAssessmentStore({filePath})` abre o SQLite e aplica a migração 001 em arquivo novo. Arquivos existentes inválidos, sem esquema conhecido ou de versão futura são rejeitados sem sobrescrita. `await store.create({name,company,email,service,scope})` grava e retorna `{id,status:'new',created_at}`; `await store.close()` aguarda a fila e fecha. Validação de formato, trim e autorização pertencem à API; restrições básicas de integridade também existem no esquema.

Cada criação trabalha em uma cópia do banco, usa statement preparado, exporta para arquivo temporário exclusivo no mesmo diretório, executa fsync do arquivo e só troca o destino por rename após a escrita. Apenas depois disso a cópia passa a ser o estado em memória. Falha de escrita preserva o estado anterior e não interrompe a fila. Arquivos temporários de uma falha normal são removidos; uma interrupção abrupta pode deixar temporários órfãos.

Limites: uma única instância de processo deve possuir o arquivo. O módulo impede aberturas duplicadas no próprio processo, mas não implementa bloqueio entre processos. SQL.js mantém o banco completo em memória e reexporta a cada criação; é adequado à demonstração pequena. Não há WAL, criptografia, retenção automática ou ferramenta de administração. O fsync cobre o conteúdo do arquivo; a persistência do rename após queda de energia depende do sistema operacional e do sistema de arquivos, pois não se promete sincronização de diretório portável no Windows. O diretório privado e sua contenção fora de public são responsabilidade da configuração do servidor.

Teste isolado: `node --test tests/store.test.mjs`. Os dados são exemplos fictícios em diretórios temporários do sistema; importar este módulo não cria banco.
