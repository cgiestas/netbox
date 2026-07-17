# Contribuições

## Issue Escolhida (Caminho A)

**Link da issue:** [https://github.com/netbox-community/netbox/issues/22030]

### Descrição da solução

A issue tratava da ausência de colunas opcionais para exibição de imagens associadas a *Device Types* e *Module Types* na interface do NetBox. Foi implementada a possibilidade de o usuário adicionar as colunas **Front Image**, **Rear Image** e **Images** (contador de imagens) via configuração dinâmica de tabela ("Configure Table"), permitindo identificar rapidamente quais tipos de dispositivo possuem imagens associadas sem precisar abrir cada registro individualmente.

A validação da solução foi feita tanto manualmente quanto via teste de aceitação automatizado com Cypress (ver `documentacao/testes_devops.md`, Cenário 1), que verifica que um usuário autenticado consegue ativar as três colunas e visualizá-las corretamente na tabela de Device Types.

**PR correspondente:** PR6 — Issue resolvida (`#3`, aberto por `cgiestas`)

---

## Refatoração (Caminho B)

A refatoração focou na classe `Device` do arquivo `netbox/dcim/models/devices.py`, especificamente no método `clean()`, onde foram identificados três code smells:

1. **Long Method / Violação do SRP** — o método `clean()` concentrava dezenas de validações de negócio distintas (rack, localização, IPs, chassi virtual etc.) em um único método com mais de 100 linhas. Resolvido com **Extract Method**, segmentando a lógica em métodos privados especialistas (ex: `_validate_rack_assignment()`, `_validate_ip_addresses()`), deixando `clean()` como um coordenador.
2. **Magic Numbers** — uso do valor literal `decimal.Decimal(0.5)` embutido na validação de posição de rack. Resolvido substituindo por uma constante nomeada (`RACK_UNIT_INCREMENT`).
3. **Deep Nesting** — condicionais aninhadas (`if` dentro de `if`) na validação de dispositivos 0U, aumentando a complexidade ciclomática. Resolvido com aglutinação lógica das condições em uma única checagem.

Os padrões de projeto/técnicas de refatoração aplicados foram **Extract Method** e **Replace Magic Number with Symbolic Constant**, detalhados com justificativa técnica em `documentacao/padroes_e_smells.md`.

**PRs correspondentes:** PR1 — Arquitetura e Modelagem do Sistema (`#1`), PR2 — Padrões e Code Smells (`#2`), PR3 — Refatoração de Código (`#3`), PR1.1 — Fix: Atualização do Diagrama de Arquitetura (`#4`), todos abertos por `TallesH13`

---

## Lista de Pull Requests

| PR | Conteúdo | Autor | Status |
|---|---|---|---|
| PR1 | Arquitetura e Modelagem do Sistema | TallesH13 | Mergeado |
| PR2 | Padrões e Code Smells | TallesH13 | Mergeado (Approved) |
| PR3 | Refatoração de Código | TallesH13 | Mergeado (Approved) |
| PR1.1 | Fix: Atualização do Diagrama de Arquitetura (Pacotes/Componentes) | TallesH13 | Mergeado (Approved) |
| PR4 | Testes de Aceitação Automatizados com Cypress | cgiestas | Mergeado (Approved) |
| PR5 | Configuração de Integração Contínua (CI) com GitHub Actions | cgiestas | Mergeado (Approved) |
| PR6 | Issue resolvida | cgiestas | Aberto |

*detalhe: o PR 6 não será mergeado para evitar conflitos ao abrir o PR contra o repositório oficial do Netbox. As mudanças implementadas (resolução da issue)
foram integradas juntamente do PR 5, visto que eram necessárias para que o teste Cypress fosse aprovado.*

---

## Papel de Cada Integrante

- **Talles** — Caminho B: análise de arquitetura, identificação de code smells, aplicação de padrões de projeto e refatoração do código.
- **Christiane** — Caminho A: resolução da issue, testes de aceitação automatizados com Cypress e configuração do pipeline de DevOps/CI com GitHub Actions.