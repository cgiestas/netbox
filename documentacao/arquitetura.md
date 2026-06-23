# Arquitetura e Modelagem do Sistema: NetBox

## Descrição da Arquitetura (Padrão MTV / MVC)

O NetBox é desenvolvido sobre o framework web Django (Python), adotando a arquitetura **MTV (Model-Template-View)**. O padrão MTV é a nomenclatura idiomática do Django para a arquitetura **MVC (Model-View-Controller)**, estruturada da seguinte forma:

* **Model (Camada de Dados):** Classes em Python (`models.py`) que representam o esquema do banco de dados relacional utilizando ORM (Object-Relational Mapping). O sistema é altamente modularizado em grandes pacotes (ex: `DCIM` para infraestrutura física e `IPAM` para redes).
* **View (Controlador / Lógica de Negócio):** Atua como o "Controller" do MVC. Processa requisições HTTP, aplica filtros dinâmicos de dados (como anotações em QuerySets baseadas nas colunas ativas) e orquestra a comunicação entre os Models e os Templates.
* **Template (Camada de Apresentação):** Páginas HTML renderizadas no lado do servidor. O NetBox utiliza fortemente o pacote `django-tables2` para a geração e controle dinâmico de exibição de tabelas no *frontend*.

## Justificativa

A escolha da arquitetura MTV do Django e da sua estrutura baseada em pacotes modulares (Apps) é a mais adequada para o NetBox devido à complexidade e alta densidade de relacionamentos presentes em um sistema de gerenciamento de data centers (DCIM) e gerenciamento de endereços IP (IPAM).

A separação estrita dessas camadas promove **alta coesão e baixo acoplamento**. Isso permite que o sistema escale de forma segura, garantindo que alterações na lógica de negócio e validações de equipamentos não quebrem a interface visual. Além disso, essa estrutura em componentes facilita a exposição imediata do banco de dados relacional (PostgreSQL) por meio de APIs (REST e GraphQL), um requisito fundamental, já que o NetBox opera como "Fonte da Verdade" (Source of Truth) para scripts de automação de rede e infraestrutura via código.

## Diagrama de Pacotes e Componentes

O diagrama abaixo ilustra a macroarquitetura de componentes do NetBox, demonstrando como os principais pacotes (`Core`, `DCIM`, `IPAM`) interagem com a camada de visualização e com a infraestrutura de persistência de dados.

```mermaid
flowchart TB
    subgraph Frontend["Camada de Apresentação (Frontend)"]
        UI[Interface de Usuário\nHTML / django-tables2]
        EXT[Sistemas de Automação\nScripts Python/Ansible]
    end

    subgraph Core["NetBox Core (Arquitetura MTV)"]
        subgraph Controllers["Controladores (Views)"]
            WEB_VIEW[Web Views\nFiltros e Lógica]
            API_VIEW[API REST / GraphQL\nDRF / Graphene]
        end

        subgraph Apps["Componentes e Pacotes de Negócio (Models)"]
            subgraph DCIM["Módulo DCIM (Data Center)"]
                MOD_DEV[Devices & Components]
                MOD_SITE[Sites & Racks]
            end
            
            subgraph IPAM["Módulo IPAM (Redes)"]
                MOD_IP[IP Addresses]
                MOD_VLAN[VLANs & VRFs]
            end
        end
    end

    subgraph Infra["Infraestrutura de Dados"]
        DB[(Banco de Dados\nPostgreSQL)]
        CACHE[(Cache\nRedis)]
    end

    %% Relacionamentos e Fluxos
    UI <--> WEB_VIEW
    EXT <--> API_VIEW

    WEB_VIEW --> DCIM
    WEB_VIEW --> IPAM
    API_VIEW --> DCIM
    API_VIEW --> IPAM

    DCIM --> DB
    IPAM --> DB
    
    WEB_VIEW -. "Query caching" .-> CACHE
    API_VIEW -. "Query caching" .-> CACHE