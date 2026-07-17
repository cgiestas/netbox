# NetBox — Trabalho Prático CSI410 (Engenharia de Software II)

Este repositório é um fork do [NetBox](https://github.com/netbox-community/netbox), utilizado como base para o trabalho prático da disciplina **CSI410 — Engenharia de Software II** (UFOP, semestre 2026/1), sob orientação do professor Igor Muzetti Pereira.

O trabalho consistiu em analisar, melhorar e contribuir ativamente com um projeto open source real, aplicando conceitos de arquitetura de software, padrões de projeto, princípios SOLID, refatoração, testes automatizados e práticas de DevOps.

## Issue Resolvida (Caminho A)

Implementação de colunas opcionais para exibição de imagens (**Front Image**, **Rear Image** e **Images**) na listagem de *Device Types*, permitindo ao usuário identificar rapidamente quais tipos de dispositivo possuem imagens associadas via configuração dinâmica de tabela.

Mais detalhes em [`documentacao/contribuicoes.md`](documentacao/contribuicoes.md).

## Estrutura da Documentação

```
/documentacao
 ├── arquitetura.md          # Descrição e diagrama da arquitetura do sistema
 ├── padroes_e_smells.md     # Code smells identificados e padrões de projeto aplicados
 ├── contribuicoes.md        # Issue resolvida, refatoração, PRs e papel de cada integrante
 ├── testes_devops.md        # Testes automatizados (Cypress) e pipeline de CI/CD
```

## Como rodar os testes automatizados

Pré-requisitos: instância do NetBox rodando em `http://localhost:8000` (via `netbox-docker` ou `manage.py runserver`), com um superusuário `admin`/`admin`.

```bash
cd netbox/project-static
npm install --legacy-peer-deps
npx cypress run --spec cypress/e2e/netbox_feature_tests.cy.js
```

Instruções completas, incluindo execução via CI (GitHub Actions), estão em [`documentacao/testes_devops.md`](documentacao/testes_devops.md).

## Dupla

- **Talles** — Caminho B: arquitetura, padrões de projeto e refatoração
- **Christiane** — Caminho A: issue resolvida, testes automatizados (Cypress) e DevOps/CI (GitHub Actions)