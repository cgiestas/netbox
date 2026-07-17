# Testes de Software e DevOps

## 1. Objetivo

Este documento cobre as duas frentes de DevOps/Qualidade do trabalho:
- Testes de aceitação automatizados (Cypress), validando o comportamento da feature implementada no Caminho A (colunas opcionais de imagem em Device Type / Module Type)
- Pipeline de CI/CD (GitHub Actions), que executa esses testes automaticamente a cada Pull Request

## 2. Histórico da abordagem de CI/CD

A definição do pipeline não foi direta — passou por várias tentativas até chegar numa arquitetura estável. Documentamos esse processo aqui porque ele é, em si, um exercício de engenharia de software (avaliação de trade-offs, iteração sobre falhas, decisão técnica justificada), não só o resultado final.

**Tentativa 1 — NetBox Docker:**
Como o ambiente de desenvolvimento local roda via `netbox-docker`, a primeira abordagem foi tentar importar essa mesma stack (Docker Compose com múltiplos containers) dentro do runner do GitHub Actions. Essa abordagem não funcionou de forma estável: orquestrar múltiplos containers Docker-in-Docker dentro do runner (subir Postgres, Redis e o próprio NetBox como containers aninhados) se mostrou frágil e lento para o contexto de CI.

**Tentativa 2 — Estrutura do `ci.yml` oficial do NetBox:**
Após a primeira tentativa falhar, analisamos o pipeline de CI real do repositório `netbox-community/netbox` no GitHub. O padrão observado lá não usa Docker: os serviços de banco de dados (PostgreSQL) e cache (Redis) são declarados como `services:` nativos do próprio GitHub Actions (containers leves gerenciados diretamente pelo runner, sem Docker Compose), e o NetBox roda direto via `python manage.py runserver`, sem containerização.

**Tentativa 3 — Retorno ao NetBox Docker:**
Uma segunda tentativa de usar Docker foi feita, buscando manter paridade maior com o ambiente de desenvolvimento local. Também não se mostrou viável no tempo disponível, pelos mesmos motivos de complexidade de orquestração.

**Decisão final — Padrão nativo do NetBox (sem Docker):**
Voltamos à estrutura observada no `ci.yml` oficial: serviços `postgres`/`redis` nativos do Actions, configuração gerada via `configuration_example.py` + `sed`, migrações rodadas diretamente, e o servidor de desenvolvimento (`runserver`) subindo em background. Essa abordagem eliminou a complexidade de Docker-in-Docker e permitiu isolar e depurar cada etapa do pipeline individualmente.

**Total de tentativas até o pipeline passar de ponta a ponta (build + testes Cypress): 41 execuções do workflow.**

## 3. Principais desafios técnicos encontrados

Ao longo das 41 tentativas, os problemas abaixo foram identificados e corrigidos, em ordem:

1. **Login do Cypress falhando silenciosamente** — causa raiz: `DEBUG = False` na configuração de teste (herdado do `configuration_example.py` padrão) impedia o `runserver` de servir os arquivos estáticos corretamente, quebrando a renderização da página. Corrigido setando `DEBUG = True` no ambiente de CI (apenas para testes).
2. **Django Debug Toolbar cobrindo elementos clicáveis** — habilitar `DEBUG = True` trouxe a Debug Toolbar como efeito colateral, que sobrepunha botões da interface (ex: "Configure Table"), quebrando interações do Cypress. Corrigido com `DEBUG_TOOLBAR_CONFIG = {'SHOW_TOOLBAR_CALLBACK': lambda request: False}` na configuração de teste, além de um comando customizado (`hideDebugToolbar`) no próprio teste como camada extra de segurança.
3. **Erro 403 (CSRF token from POST incorrect) em logins repetidos** — causado por uma condição de corrida: cada teste fazia login do zero, e a requisição de submit do formulário por vezes chegava ao servidor antes do token CSRF da sessão terminar de sincronizar. Corrigido substituindo login manual repetido por `cy.session()`, que autentica uma única vez por execução e reaproveita a sessão nos testes seguintes.
4. **Seletores incorretos no widget de configuração de colunas** — o seletor de "Available Columns" não é um único `<select>` compartilhado; o NetBox usa o padrão `FilteredSelectMultiple` do Django, com um `<select id="id_available_columns">` para as colunas disponíveis e botões de mover implementados como tags `<a id="add_columns">` / `<a id="remove_columns">` (não `<button>`). Corrigido após inspeção manual do DOM via DevTools.
5. **Idioma da interface divergente entre ambiente local e CI** — o navegador local exibia a interface em português (PT-BR), enquanto o Electron headless do CI, sem `Accept-Language` configurado, renderizava em inglês (`en-us`, valor de `DEFAULT_LANGUAGE`). As asserções de texto nos testes foram mantidas em inglês, alinhadas ao comportamento real do ambiente de CI.

## 4. Ferramentas utilizadas

- **Cypress** 15.18.1 — testes de aceitação end-to-end
- **GitHub Actions** — orquestração do pipeline de CI
- **PostgreSQL 15** e **Redis 7** — como `services` nativos do Actions
- **Python 3.12** / Django (NetBox 4.6.3)

## 5. Cenários de teste

Arquivo: `netbox/project-static/cypress/e2e/netbox_feature_tests.cy.js`

### Cenário 1 — Adicionar colunas opcionais de imagem na listagem de Device Types

```gherkin
Funcionalidade: Colunas opcionais de imagem em Device Type
  Como usuário administrador do NetBox
  Eu quero poder adicionar as colunas "Front Image", "Rear Image" e "Images"
  Para visualizar rapidamente quais tipos de dispositivo têm imagens associadas

  Cenário: Ativar as três colunas opcionais via configuração de tabela
    Dado que estou autenticado como administrador
    E estou na página de listagem de Device Types
    Quando eu abro o modal "Configure Table"
    E seleciono a coluna "front_image" e clico em "Add"
    E seleciono a coluna "rear_image" e clico em "Add"
    E seleciono a coluna "image_count" e clico em "Add"
    E clico em "Apply"
    Então a tabela deve exibir as colunas "Front Image", "Rear Image" e "Images"
```

**O que este teste cobre:** valida, do ponto de vista do usuário final, que a feature implementada na issue está de fato acessível e funcional na interface — não só que as colunas existem no código, mas que um usuário real consegue descobri-las, ativá-las e visualizá-las na tabela. Este é o teste central desta entrega, pois exercita diretamente o comportamento pedido na issue resolvida no Caminho A.

### Cenário 2 — Criar um novo Site com sucesso

```gherkin
Funcionalidade: Cadastro de Site
  Como usuário administrador do NetBox
  Eu quero poder cadastrar um novo Site
  Para organizar a infraestrutura de rede por localidade

  Cenário: Criar um Site preenchendo apenas o campo obrigatório
    Dado que estou autenticado como administrador
    E estou na página de cadastro de Site
    Quando eu preencho o campo "Name" com "Segundo Data Center ICEA"
    E clico em "Create"
    Então devo ser redirecionado para a página de detalhes do Site criado
    E o título da página deve conter "Segundo Data Center ICEA"
```

**O que este teste cobre:** um fluxo de CRUD básico e não relacionado à issue, usado como sanity check — garante que o pipeline de CI está de fato validando uma instância funcional do NetBox (autenticação, formulários, submissão, redirecionamento), servindo de controle de qualidade geral do ambiente de teste.

### Cenário 3 — Criar uma nova VLAN com sucesso

```gherkin
Funcionalidade: Cadastro de VLAN
  Como usuário administrador do NetBox
  Eu quero poder cadastrar uma nova VLAN
  Para segmentar a rede logicamente

  Cenário: Criar uma VLAN preenchendo VID e nome
    Dado que estou autenticado como administrador
    E estou na página de cadastro de VLAN
    Quando eu preencho o campo "VID" com "200"
    E preencho o campo "Name" com "VLAN-TESTE-NOVO"
    E clico em "Create"
    Então devo ser redirecionado para a página de detalhes da VLAN criada
    E o título da página deve conter "VLAN-TESTE-NOVO"
```

**O que este teste cobre:** mesmo propósito do Cenário 2 — sanity check de um fluxo de CRUD em outro módulo do NetBox (IPAM em vez de DCIM), reforçando que a sessão autenticada via `cy.session()` permanece válida ao longo de múltiplos testes na mesma execução.

## 6. Instruções de execução

### Localmente

Pré-requisitos: instância do NetBox rodando em `http://localhost:8000` (via `netbox-docker` ou `manage.py runserver`), com um superusuário `admin`/`admin` (ou variáveis de ambiente configuradas, ver abaixo).

```bash
cd netbox/project-static
npm install --legacy-peer-deps
npx cypress run --spec cypress/e2e/netbox_feature_tests.cy.js
```

Para rodar em modo interativo (com interface gráfica do Cypress):
```bash
npx cypress open
```

Credenciais customizadas (opcional — o padrão é `admin`/`admin`):
```bash
CYPRESS_NETBOX_USERNAME=meuusuario CYPRESS_NETBOX_PASSWORD=minhasenha npx cypress run
```

### Via CI (GitHub Actions)

O workflow `.github/workflows/cypress.yml` roda automaticamente em todo Pull Request direcionado à branch `main`. Ele:
1. Sobe PostgreSQL e Redis como `services`
2. Instala dependências Python e configura o NetBox para o ambiente de teste
3. Roda migrações e cria o superusuário de teste
4. Inicia o servidor NetBox em background
5. Instala dependências do Cypress
6. Executa os 3 cenários descritos acima
7. Em caso de falha, publica como artifact os screenshots gerados pelo Cypress e o log do Django, para facilitar o diagnóstico

Para visualizar os resultados: aba **Actions** do repositório → selecionar o workflow run → expandir o step "Run Cypress tests". Em caso de falha, os artifacts `cypress-screenshots` ficam disponíveis para download no rodapé da página do run.

## 7. Análise do Pipeline e Melhorias de DevOps

### 7.1. Análise do pipeline existente

O NetBox mantém um workflow de CI (`.github/workflows/ci.yml`) com os seguintes jobs, disparados a cada `push`/`pull_request`:

| Job | O que faz |
|---|---|
| `changes` | Detecta quais áreas do repositório mudaram (Python, frontend, docs), para pular jobs cujos inputs não mudaram |
| `lint` | Roda `ruff` sobre o código Python (lint e PEP8) |
| `test` | Roda a suíte de testes unitários/de integração do Django (`manage.py test`), com PostgreSQL e Redis como `services` |
| `frontend` | Valida TypeScript/ESLint e formatação do código frontend, e a integridade dos bundles estáticos — mas **sem subir um servidor NetBox real** |
| `docs` | Builda a documentação (`zensical build`) |

**Lacuna identificada:** nenhum desses jobs sobe uma instância funcional do NetBox e a exercita através de um navegador simulando um usuário real. O job `test` cobre lógica de backend (models, views, serializers) via requisições sintéticas do framework de testes do Django, e o job `frontend` cobre só lint/formatação — não existe nenhuma camada de teste de aceitação (E2E) que valide, do ponto de vista da interface, que uma funcionalidade está de fato utilizável por um usuário. Isso é especialmente relevante para mudanças como a implementada no Caminho A deste trabalho, que depende de comportamento dinâmico de UI (colunas configuráveis, JavaScript de configuração de tabela) — um cenário que testes unitários de backend não exercitam.

### 7.2. Melhorias propostas

1. **Suíte de testes E2E com Cypress** *(implementada nesta entrega)* — cobre fluxos de interface real (login, navegação, formulários, configuração dinâmica de colunas), preenchendo a lacuna identificada em 7.1.
2. **Upload de artifacts de diagnóstico em falhas** *(implementada nesta entrega)* — screenshots do Cypress e log do servidor Django são publicados automaticamente como artifacts do workflow quando um teste falha, reduzindo o tempo de diagnóstico (na prática, foi essa mudança que permitiu depurar os 5 problemas listados na seção 3, em vez de tentar adivinhar a causa às cegas a cada nova tentativa).
3. **Cache de dependências entre execuções** *(proposta, não implementada)* — o workflow atual reinstala `pip` e `npm`/dependências do zero a cada execução. Usar `actions/cache` (ou o cache nativo de `actions/setup-python`/`actions/setup-node`) reduziria o tempo de cada execução, especialmente relevante dado o número de iterações necessárias durante o desenvolvimento (41 execuções).
4. **Execução condicional do job E2E** *(proposta, não implementada)* — seguindo o padrão do próprio job `changes` do NetBox (que já existe no `ci.yml` oficial), o job de testes Cypress poderia rodar apenas quando arquivos relevantes (templates, views, JavaScript de frontend) forem alterados no PR, economizando minutos de CI em mudanças que não afetam a interface (ex: alterações isoladas de documentação).

### 7.3. Melhoria implementada — justificativa técnica

Escolhemos implementar a **suíte de testes E2E com Cypress** (item 1) como a melhoria principal, e o **upload de artifacts de diagnóstico** (item 2) como melhoria complementar, pelos seguintes motivos:

- A issue resolvida no Caminho A altera comportamento de interface (colunas configuráveis dinamicamente, dependentes de preferência do usuário) que não é exercitado pelos testes unitários já existentes no NetBox — um teste E2E é o tipo de teste que efetivamente teria capturado uma regressão nessa funcionalidade.
- O processo de depuração desta funcionalidade (documentado na seção 3) evidenciou, na prática, o valor do item 2: sem os artifacts de screenshot/log, cada uma das 41 tentativas exigiria reproduzir o ambiente de CI localmente para investigar a causa da falha — com os artifacts, cada falha pôde ser diagnosticada diretamente a partir da própria execução do workflow.