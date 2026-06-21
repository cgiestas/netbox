# Arquitetura do Sistema: NetBox (Padrão MTV)

O NetBox é desenvolvido utilizando o framework web Django (Python). A arquitetura base do Django segue o padrão **MTV (Model-Template-View)**, que é uma variação arquitetural diretamente equivalente ao clássico **MVC (Model-View-Controller)**. 

Para este projeto, é fundamental compreender como essas camadas interagem, especialmente no contexto da renderização dinâmica de tabelas, que é o alvo principal da nossa contribuição (Caminho A).

## Mapeamento da Arquitetura (MTV vs MVC)

1. **Model (Modelo):** É a camada de acesso e estruturação de dados. Representa as tabelas do banco de dados (PostgreSQL). No contexto da nossa issue, interagimos com os modelos `DeviceType` e `ModuleType`, que armazenam os metadados dos equipamentos físicos e seus respectivos anexos (imagens).
2. **View (Visão - O equivalente ao *Controller* no MVC):** Contém a lógica de negócio e o controle de fluxo. As *Views* do NetBox recebem as requisições HTTP, processam os filtros do usuário e constroem as consultas ao banco de dados (QuerySets). É aqui que ocorre a otimização exigida pelos mantenedores: a *View* intercepta as colunas selecionadas pelo usuário na interface e injeta anotações dinâmicas (`.annotate()`) no banco de dados **apenas** para as colunas visíveis, evitando degradação de performance.
3. **Template (Gabarito - O equivalente à *View* no MVC):** É a camada de apresentação. O NetBox utiliza a biblioteca `django-tables2` para renderizar o HTML a partir dos dados fornecidos pela *View*. As novas colunas (ex: `Front Image (Y/N)`) são definidas nesta camada, aguardando os dados processados dinamicamente.

## Diagrama de Fluxo de Dados (Mermaid)

O diagrama abaixo ilustra o ciclo de vida de uma requisição no NetBox, focando na otimização dinâmica das tabelas que será implementada nesta manutenção evolutiva.

```mermaid
flowchart TD
    A[Usuário/Browser] -->|Requisição HTTP GET\n(com colunas visíveis selecionadas)| B(URL Router)
    B --> C{View \n Lógica de Negócio}
    C -->|Identifica colunas ativas| D[Construção do QuerySet Dinâmico]
    
    subgraph Camada de Dados (Model)
        D -->|Se a coluna 'Images' estiver visível| E[(Database PostgreSQL\nQuery com JOIN/Annotate)]
        D -->|Se a coluna 'Images' estiver oculta| F[(Database PostgreSQL\nQuery Simples)]
    end
    
    E --> G[Retorno dos Dados Otimizados]
    F --> G
    
    G --> H{Template \n django-tables2}
    H -->|Renderiza Tabela HTML| A

```

Justificativa Arquitetural
A escolha desse padrão estrutural pelo NetBox justifica-se pela necessidade de gerenciar uma infraestrutura de dados extremamente relacional e densa (DCIM/IPAM). A separação clara entre a definição do dado (Model) e a lógica de exibição dinâmica (Template/django-tables2) permite que o sistema escale sem onerar o banco de dados.

Ao aplicar a regra de anotação condicional na View — exigência fundamental do mantenedor da nossa issue —, respeitamos o princípio de que o banco de dados só deve processar contagens de relações (como verificar imagens anexadas a centenas de dispositivos) quando o usuário explicitamente necessitar dessa informação na camada de visualização.