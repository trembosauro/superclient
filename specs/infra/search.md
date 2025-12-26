# Search Infrastructure

## 1. Contexto

A busca é um comportamento transversal presente em múltiplas telas do sistema: Contacts, Pipeline, Finanças e Notes. Cada tela implementava sua própria lógica de busca, resultando em:

- **Duplicação de código** - Mesma lógica de debounce replicada em 4+ lugares
- **Inconsistência** - Comportamentos ligeiramente diferentes entre telas
- **Dificuldade de manutenção** - Correções precisavam ser aplicadas em múltiplos locais
- **Acoplamento com UI** - Lógica de negócio misturada com componentes visuais

A padronização da infraestrutura de busca permite:

- Comportamento previsível e consistente
- Testabilidade isolada
- Reutilização entre domínios
- Evolução centralizada

## 2. Objetivo

Definir um mecanismo único de busca que possa ser usado por múltiplas telas sem duplicação de lógica. O mecanismo deve:

- Ser agnóstico de framework e UI
- Suportar debounce configurável
- Sincronizar com URL para deep-linking
- Isolar estado entre domínios
- Permitir extensão para casos específicos

## 3. Fluxo do Usuário (Abstrato)

### 3.1 Iniciar Busca

```
1. Usuário inicia entrada de texto
2. Sistema atualiza estado local (query) imediatamente
3. Sistema inicia timer de debounce
4. Sistema marca estado como "debouncing"
```

### 3.2 Aplicar Busca

```
1. Timer de debounce expira
2. Sistema atualiza debouncedQuery
3. Sistema reflete query no URL
4. Sistema marca estado como "applied"
5. Sistema dispara evento de busca aplicada
6. Consumidores (stores de domínio) reagem à mudança
```

### 3.3 Limpar Busca

```
1. Usuário aciona limpeza (tecla ESC, ação programática, etc.)
2. Sistema reseta query para string vazia
3. Sistema cancela debounce pendente
4. Sistema remove query do URL
5. Sistema marca estado como "cleared"
6. Sistema reseta dependentes (paginação, seleção)
7. Sistema dispara evento de busca limpa
```

### 3.4 Restaurar Busca (Deep-link)

```
1. Usuário navega para URL com query param
2. Sistema extrai query do URL
3. Sistema inicializa estado com query
4. Sistema marca estado como "applied" (sem debounce)
5. Consumidores reagem à query inicial
```

### 3.5 Navegar Entre Domínios

```
1. Usuário navega de /contacts?q=joao para /pipeline
2. Sistema detecta mudança de domínio
3. Sistema preserva estado de /contacts isoladamente
4. Sistema inicializa /pipeline com estado limpo ou próprio
5. Estados não vazam entre domínios
```

## 4. Regras de Negócio

| ID | Regra | Descrição |
|----|-------|-----------|
| RN01 | Case-insensitive | Busca deve ignorar maiúsculas/minúsculas na comparação |
| RN02 | String vazia | Query vazia significa "sem filtro de busca" |
| RN03 | Debounce obrigatório | Busca só é aplicada após período de debounce |
| RN04 | Debounce configurável | Cada domínio pode definir seu tempo de debounce |
| RN05 | Debounce padrão | Tempo padrão de debounce é 300ms |
| RN06 | Reset cascata | Limpar busca reseta paginação e filtros dependentes |
| RN07 | Isolamento de domínio | Estado de busca não vaza entre domínios diferentes |
| RN08 | URL como fonte | URL é fonte de verdade para estado inicial |
| RN09 | Trim automático | Espaços no início/fim da query são removidos |
| RN10 | Normalização | Query é normalizada (trim, lowercase para comparação) |

## 5. Estados Possíveis

```typescript
type SearchStatus = 
  | 'idle'       // Estado inicial, sem interação
  | 'typing'     // Usuário está digitando
  | 'debouncing' // Aguardando debounce
  | 'applied'    // Busca aplicada
  | 'cleared';   // Busca foi limpa
```

### Diagrama de Estados

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌──────┐  input  ┌────────┐  input  ┌───────────┐       │
│ idle │────────▶│ typing │────────▶│ debouncing│───────┤
└──────┘         └────────┘         └───────────┘       │
    ▲                │                    │              │
    │                │ clear              │ timeout      │
    │                ▼                    ▼              │
    │           ┌─────────┐         ┌─────────┐         │
    └───────────│ cleared │◀────────│ applied │─────────┘
                └─────────┘  clear  └─────────┘
                     │                   │
                     │                   │ input
                     │                   ▼
                     │              ┌────────┐
                     └─────────────▶│ typing │
                                    └────────┘
```

## 6. Modelo de Dados

### 6.1 Estado de Busca

```typescript
interface SearchState {
  /** Query atual (atualiza a cada keystroke) */
  query: string;
  
  /** Query após debounce (usada para filtrar dados) */
  debouncedQuery: string;
  
  /** Status atual da busca */
  status: SearchStatus;
  
  /** Busca está ativa (debouncedQuery não vazia) */
  isActive: boolean;
  
  /** Domínio de origem (para isolamento) */
  source: SearchSource;
  
  /** Timestamp da última aplicação */
  appliedAt: number | null;
}

type SearchSource = 
  | 'contacts'
  | 'pipeline'
  | 'finances'
  | 'notes';
```

### 6.2 Configuração de Busca

```typescript
interface SearchConfig {
  /** Tempo de debounce em ms */
  debounceMs: number;
  
  /** Tamanho mínimo da query para aplicar */
  minLength: number;
  
  /** Tamanho máximo da query */
  maxLength: number;
  
  /** Nome do query param no URL */
  urlParam: string;
  
  /** Campos pesquisáveis (para documentação) */
  searchableFields: string[];
}

const DEFAULT_CONFIG: SearchConfig = {
  debounceMs: 300,
  minLength: 0,
  maxLength: 200,
  urlParam: 'q',
  searchableFields: [],
};
```

### 6.3 Ações de Busca

```typescript
interface SearchActions {
  /** Atualiza query (dispara debounce) */
  setQuery: (query: string) => void;
  
  /** Limpa busca completamente */
  clear: () => void;
  
  /** Aplica busca imediatamente (bypass debounce) */
  applyNow: () => void;
  
  /** Inicializa a partir do URL */
  initFromUrl: () => void;
  
  /** Sincroniza estado com URL */
  syncToUrl: () => void;
}
```

### 6.4 Eventos de Busca

```typescript
interface SearchAppliedEvent {
  type: 'search_applied';
  source: SearchSource;
  query: string;
  timestamp: number;
  debounceTime: number;
}

interface SearchClearedEvent {
  type: 'search_cleared';
  source: SearchSource;
  previousQuery: string;
  timestamp: number;
}
```

## 7. Sincronização com URL

### 7.1 Estrutura do URL

```
/contacts?q=joao
/pipeline?q=tarefa
/financas?q=mercado
/notas?q=reuniao
```

### 7.2 Regras de Sincronização

| Cenário | Comportamento |
|---------|---------------|
| Busca aplicada | URL atualizado com `?q=valor` |
| Busca limpa | Query param removido do URL |
| Query vazia | Query param removido do URL |
| Navegação para URL com query | Estado inicializado com valor do URL |
| Browser back/forward | Estado atualizado conforme URL |
| Múltiplos params | Query param preservado junto com outros |

### 7.3 Prioridade de Inicialização

```
1. URL query param (se presente)
2. Estado persistido (se implementado)
3. Estado inicial vazio
```

### 7.4 Encoding

```typescript
// Escrita no URL
const encoded = encodeURIComponent(query.trim());
url.searchParams.set('q', encoded);

// Leitura do URL
const decoded = decodeURIComponent(url.searchParams.get('q') || '');
```

## 8. Erros e Edge Cases

### 8.1 Query Muito Curta

| Condição | Comportamento |
|----------|---------------|
| `minLength = 0` | Qualquer query é válida |
| `minLength = 2` e query.length < 2 | Busca não aplicada, estado em "typing" |
| Query fica abaixo do minLength | Busca anterior mantida até novo input válido |

### 8.2 Query Muito Longa

| Condição | Comportamento |
|----------|---------------|
| query.length > maxLength | Query truncada no maxLength |
| Truncamento | Usuário notificado via estado (não via UI) |

### 8.3 Caracteres Especiais

```typescript
// Caracteres permitidos
const ALLOWED_PATTERN = /^[\p{L}\p{N}\s@._\-+()]+$/u;

// Sanitização
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .slice(0, MAX_LENGTH)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos para busca
}
```

### 8.4 Navegação Back/Forward

```
1. Usuário busca "joao"
2. URL: /contacts?q=joao
3. Usuário navega para /pipeline
4. Usuário clica "voltar"
5. URL: /contacts?q=joao
6. Estado restaurado: query = "joao", status = "applied"
```

### 8.5 Múltiplas Buscas Rápidas

```
1. Usuário digita "j" -> debounce inicia
2. Usuário digita "jo" -> debounce reinicia
3. Usuário digita "joa" -> debounce reinicia
4. Usuário digita "joao" -> debounce reinicia
5. 300ms sem input -> busca "joao" aplicada
```

### 8.6 Race Conditions

```typescript
// Proteção contra race conditions
let currentSearchId = 0;

async function executeSearch(query: string) {
  const searchId = ++currentSearchId;
  
  // ... busca assíncrona ...
  
  // Ignorar se nova busca foi iniciada
  if (searchId !== currentSearchId) {
    return;
  }
  
  // Aplicar resultado
}
```

## 9. Observabilidade

### 9.1 Eventos

| Evento | Payload | Quando |
|--------|---------|--------|
| `search_started` | `{ source, query }` | Usuário inicia digitação |
| `search_debouncing` | `{ source, query, debounceMs }` | Debounce iniciado |
| `search_applied` | `{ source, query, debounceTime }` | Busca aplicada |
| `search_cleared` | `{ source, previousQuery }` | Busca limpa |
| `search_restored` | `{ source, query, fromUrl }` | Estado restaurado |

### 9.2 Métricas

```typescript
interface SearchMetrics {
  /** Tempo entre primeiro keystroke e aplicação */
  timeToApply: number;
  
  /** Número de keystrokes antes de aplicar */
  keystrokeCount: number;
  
  /** Query foi limpa antes de aplicar? */
  abandoned: boolean;
  
  /** Resultado da busca teve matches? */
  hasResults: boolean;
}
```

### 9.3 Logging

```typescript
// Formato de log estruturado
{
  level: 'info',
  event: 'search_applied',
  source: 'contacts',
  query: 'joao',
  queryLength: 4,
  debounceTime: 300,
  timestamp: 1735228800000
}
```

## 10. Critérios de Aceitação Testáveis

### 10.1 Debounce

- [ ] `GIVEN` debounce=300ms `WHEN` digitar "abc" em 100ms `THEN` busca aplica após 300ms do último keystroke
- [ ] `GIVEN` debounce ativo `WHEN` novo input `THEN` timer reinicia
- [ ] `GIVEN` debounce ativo `WHEN` limpar busca `THEN` timer cancela

### 10.2 Estado

- [ ] `GIVEN` estado idle `WHEN` primeiro input `THEN` estado = typing
- [ ] `GIVEN` estado typing `WHEN` debounce expira `THEN` estado = applied
- [ ] `GIVEN` estado applied `WHEN` limpar `THEN` estado = cleared
- [ ] `GIVEN` query "abc" `WHEN` acessar debouncedQuery antes do debounce `THEN` retorna ""

### 10.3 URL

- [ ] `GIVEN` busca aplicada "joao" `WHEN` verificar URL `THEN` URL contém ?q=joao
- [ ] `GIVEN` busca limpa `WHEN` verificar URL `THEN` URL não contém ?q
- [ ] `GIVEN` URL /contacts?q=maria `WHEN` carregar página `THEN` query = "maria"
- [ ] `GIVEN` navegação back `WHEN` URL anterior tinha query `THEN` estado restaura

### 10.4 Isolamento

- [ ] `GIVEN` busca "joao" em contacts `WHEN` navegar para pipeline `THEN` pipeline não tem busca
- [ ] `GIVEN` busca em contacts e pipeline `WHEN` verificar estados `THEN` estados independentes
- [ ] `GIVEN` limpar busca em contacts `WHEN` verificar pipeline `THEN` pipeline não afetado

### 10.5 Limpeza

- [ ] `GIVEN` busca ativa `WHEN` executar clear() `THEN` query = ""
- [ ] `GIVEN` busca ativa `WHEN` executar clear() `THEN` debouncedQuery = ""
- [ ] `GIVEN` busca ativa `WHEN` executar clear() `THEN` isActive = false
- [ ] `GIVEN` paginação na página 3 `WHEN` limpar busca `THEN` paginação reseta para 1

### 10.6 Edge Cases

- [ ] `GIVEN` query "  abc  " `WHEN` aplicar `THEN` debouncedQuery = "abc"
- [ ] `GIVEN` maxLength=10 `WHEN` digitar 15 chars `THEN` query truncada em 10
- [ ] `GIVEN` busca assíncrona lenta `WHEN` nova busca rápida `THEN` primeira ignorada

## 11. Integração com Domínios

### 11.1 Contrato de Uso

Cada domínio que usa busca deve:

```typescript
// 1. Criar instância de search para seu domínio
const contactsSearch = createSearch({
  source: 'contacts',
  debounceMs: 300,
  searchableFields: ['name', 'email', 'phone'],
});

// 2. Reagir a mudanças no debouncedQuery
effect(() => {
  if (contactsSearch.isActive) {
    filterContacts(contactsSearch.debouncedQuery);
  } else {
    showAllContacts();
  }
});

// 3. Conectar ações ao domínio
function onSearchInput(value: string) {
  contactsSearch.setQuery(value);
}

function onSearchClear() {
  contactsSearch.clear();
}
```

### 11.2 Função de Filtro

Cada domínio implementa sua própria lógica de filtro:

```typescript
// contacts
function matchesSearch(contact: Contact, query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    contact.name.toLowerCase().includes(normalized) ||
    contact.emails.some(e => e.toLowerCase().includes(normalized)) ||
    contact.phones.some(p => p.includes(normalized))
  );
}

// notes
function matchesSearch(note: Note, query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    note.title.toLowerCase().includes(normalized) ||
    note.contentHtml.toLowerCase().includes(normalized)
  );
}
```

## 12. Não Incluído Nesta Spec

Esta especificação **não cobre**:

- Implementação visual de campos de entrada
- Componentes de UI (TextField, Input, etc.)
- Estilos, layout ou espaçamento
- Ícones ou indicadores visuais
- Animações ou transições
- Acessibilidade de componentes visuais
- Framework específico (React, Vue, etc.)

Esses aspectos são responsabilidade da camada de UI, que consome esta infraestrutura através das interfaces definidas.
