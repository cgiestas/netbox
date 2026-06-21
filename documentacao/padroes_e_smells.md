# Padrões, Smells e Refatoração

## Code Smells Identificados

### 1. Long Method (Método Longo) e Violação do SRP
* **Localização:** Arquivo `netbox/dcim/models/devices.py` | Classe `Device` | Método `clean(self)`.
* **Trecho do código:**
  ```python
  def clean(self):
      super().clean()

      # Validate site/location/rack combination
      if self.rack and self.site != self.rack.site:
          raise ValidationError({
              'rack': _("Rack {rack} does not belong to site {site}.").format(rack=self.rack, site=self.site),
          })
      
      if self.location and self.site != self.location.site:
          raise ValidationError({
              'location': _("Location {location} does not belong to site {site}.").format(...)
          })
      
      # ... O método original segue com mais de 100 linhas de lógicas sequenciais e 
      # validações de IPs (IPv4/IPv6), Out-of-Band IPs, Virtual Chassis, etc.
  ```
* **Problema identificado:** O método concentra quase toda a validação de negócios de um equipamento físico na rede. Esse acúmulo de dezenas de validações fere diretamente o Princípio da Responsabilidade Única (SRP), tornando o método massivo, a manutenção difícil e a testabilidade complexa.
* **Solução proposta/aplicada:** Aplicação do padrão Extract Method. A lógica foi segmentada em métodos privados menores e especialistas (ex: `_validate_rack_assignment()` e `_validate_ip_addresses()`). O método `clean()` passa a atuar apenas como um coordenador das funções de validação.

### 2. Magic Numbers (Valores Mágicos)
* **Localização:** Arquivo `netbox/dcim/models/devices.py` | Classe `Device` | Método `clean(self)` (bloco de validação de rack).
* **Trecho do código:**
  ```python
  # Validate rack position and face
  if self.position and self.position % decimal.Decimal(0.5):
      raise ValidationError({
          'position': _("Position must be in increments of 0.5 rack units.")
      })
  ```
* **Problema identificado:** O código utiliza o valor numérico literal `decimal.Decimal(0.5)` embutido diretamente no meio da regra de negócio de unidades de rack. Valores mágicos soltos dificultam a leitura rápida e a manutenção, pois a intenção daquele número não fica declarada.
* **Solução proposta/aplicada:** Substituição do valor literal por uma constante com nome explícito e descritivo (`RACK_UNIT_INCREMENT = decimal.Decimal(0.5)`), deixando o fluxo condicional mais legível e padronizado.

### 3. Deep Nesting (Aninhamento Profundo)
* **Localização:** Arquivo `netbox/dcim/models/devices.py` | Classe `Device` | Método `clean(self)` (bloco de validação de dispositivos 0U).
* **Trecho do código:**
  ```python
  # Prevent 0U devices from being assigned to a specific position
  if hasattr(self, 'device_type'):
      if self.position and self.device_type.u_height == 0:
          raise ValidationError({
              'position': _(
                  "A 0U device type ({device_type}) cannot be assigned to a rack position."
              ).format(device_type=self.device_type)
          })
  ```
* **Problema identificado:** O trecho utiliza múltiplos blocos estruturais `if` aninhados (conhecido como "Arrow Anti-Pattern"). Esse excesso de níveis de indentação aumenta desnecessariamente a complexidade ciclomática e prejudica a leitura do código.
* **Solução proposta/aplicada:** Aplicação de Guard Clauses (Cláusulas de Guarda) ou aglutinação lógica. As condições foram unificadas em uma única checagem simples (`if hasattr(self, 'device_type') and self.position and self.device_type.u_height == 0:`), reduzindo a profundidade e simplificando o fluxo principal.

---

## Padrões de Projeto Aplicados

### 1. Extract Method (Refatoração Estrutural)
* **Nome:** Extract Method.
* **Onde foi aplicado ou sugerido:** Na classe `Device` do arquivo `netbox/dcim/models/devices.py` (método `clean`).
* **Justificativa:** O framework Django exige o uso do método `clean()` como gancho padrão para validações em nível de modelo antes de salvar no banco de dados. Ao delegar as múltiplas checagens de negócio para métodos privados especialistas, garantimos a aplicação do Princípio da Responsabilidade Única (SRP) e facilitamos a futura criação de testes unitários isolados para cada regra.

### 2. Replace Magic Number with Symbolic Constant
* **Nome:** Replace Magic Number with Symbolic Constant.
* **Onde foi aplicado ou sugerido:** Na lógica de validação de posições fracionadas de rack, na classe `Device` do arquivo `netbox/dcim/models/devices.py`.
* **Justificativa:** A extração transforma valores matemáticos literais em variáveis explícitas. Isso torna o código "autodocumentado" através da própria nomenclatura e garante segurança em manutenções futuras, permitindo alterar a regra base de incremento de racks do sistema inteiro mudando apenas o valor de uma única variável declarada.