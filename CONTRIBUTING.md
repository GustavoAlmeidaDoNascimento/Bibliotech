# 🤝 Guia de Contribuição - Bibliotech

Obrigado por considerar contribuir com o Bibliotech! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 **Índice**

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Issues](#reportando-issues)

---

## 📜 **Código de Conduta**

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

### Comportamentos Esperados:
- ✅ Uso de linguagem acolhedora e inclusiva
- ✅ Respeito por diferentes pontos de vista
- ✅ Aceitar críticas construtivas
- ✅ Focar no que é melhor para a comunidade

### Comportamentos Inaceitáveis:
- ❌ Linguagem ou imagens sexualizadas
- ❌ Ataques pessoais ou políticos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas sem permissão

---

## 🚀 **Como Contribuir**

### **Tipos de Contribuição**

1. **🐛 Correção de Bugs**
   - Identifique issues marcadas com `bug`
   - Reproduza o problema
   - Implemente a correção
   - Adicione testes se necessário

2. **✨ Novas Funcionalidades**
   - Verifique issues marcadas com `enhancement`
   - Discuta a implementação antes de começar
   - Siga os padrões de design existentes

3. **📚 Documentação**
   - Melhore documentações existentes
   - Adicione exemplos de uso
   - Traduza documentos

4. **🧪 Testes**
   - Adicione testes para funcionalidades sem cobertura
   - Melhore testes existentes
   - Implemente testes E2E

---

## 🛠️ **Padrões de Desenvolvimento**

### **Estrutura de Código**

```typescript
// ✅ Bom exemplo
interface BookProps {
  id: string;
  title: string;
  authors: string[];
  onEdit?: (bookId: string) => void;
}

const BookCard: React.FC<BookProps> = ({ id, title, authors, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit?.(id);
  }, [id, onEdit]);

  return (
    <div className={styles.bookCard}>
      <h3>{title}</h3>
      <p>{authors.join(', ')}</p>
      {onEdit && (
        <button onClick={handleEdit}>
          Editar
        </button>
      )}
    </div>
  );
};
```

### **Convenções de Nomenclatura**

- **Componentes**: `PascalCase` (ex: `BookCard`, `StudentList`)
- **Hooks**: `camelCase` com prefixo `use` (ex: `useBooks`, `useAuth`)
- **Funções**: `camelCase` (ex: `fetchBooks`, `handleSubmit`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `API_ENDPOINTS`, `DEFAULT_PAGE_SIZE`)
- **Arquivos**: `PascalCase` para componentes, `camelCase` para utilitários

### **Estrutura de Commits**

Use commits semânticos seguindo o padrão:

```
tipo(escopo): descrição

Corpo opcional explicando o que e por que vs como.

Closes #123
```

**Tipos permitidos:**
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: documentação
- `style`: formatação, missing semi colons, etc
- `refactor`: refatoração de código
- `test`: adição ou correção de testes
- `chore`: atualização de dependências, configs, etc

**Exemplos:**
```
feat(books): adiciona filtro por gênero na listagem
fix(auth): corrige redirecionamento após login
docs(readme): atualiza instruções de instalação
test(books): adiciona testes para BookCard component
```

### **TypeScript**

- ✅ Use interfaces em vez de types quando possível
- ✅ Evite `any`, use `unknown` quando necessário
- ✅ Documente props complexas com JSDoc
- ✅ Use enums para valores fixos

```typescript
// ✅ Bom
interface SearchFilters {
  query: string;
  genre?: BookGenre;
  author?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

enum BookGenre {
  FICTION = 'fiction',
  NON_FICTION = 'non-fiction',
  SCIENCE = 'science',
  HISTORY = 'history'
}

// ❌ Evite
const filters: any = {...};
```

---

## ⚙️ **Configuração do Ambiente**

### **1. Fork e Clone**
```bash
# Fork no GitHub primeiro
git clone https://github.com/SEU_USUARIO/bibliotech.git
cd bibliotech
```

### **2. Configuração**
```bash
# Instalar dependências
npm install

# Configurar upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/bibliotech.git

# Criar branch para sua feature
git checkout -b feature/minha-feature
```

### **3. Configuração do Firebase**
1. Crie um projeto no Firebase Console
2. Configure Authentication (Email/Password)
3. Configure Firestore Database
4. Copie as credenciais para `.env.local`

### **4. Executar Testes**
```bash
# Testes unitários
npm run test

# Build para verificar erros de TypeScript
npm run build
```

**Nota**: Este projeto usa Create React App, que inclui TypeScript checking durante o build. Para verificar tipos sem fazer build completo, você pode usar:
```bash
npx tsc --noEmit
```

---

## 📤 **Processo de Pull Request**

### **Antes de Submeter**
- [ ] Testes passando (`npm run test`)
- [ ] TypeScript sem erros (verificado durante `npm run build`)
- [ ] Build funcionando (`npm run build`)
- [ ] Documentação atualizada se necessário
- [ ] Código segue os padrões do projeto

### **Template de PR**

```markdown
## Descrição
Breve descrição das mudanças realizadas.

## Tipo de Mudança
- [ ] Bug fix (correção que resolve uma issue)
- [ ] Nova feature (funcionalidade que adiciona algo novo)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação

## Como Testar
1. Execute `npm install`
2. Configure as variáveis de ambiente
3. Execute `npm start`
4. Navegue para [página específica]
5. Teste [funcionalidade específica]

## Screenshots (se aplicável)
![Antes](link-para-imagem)
![Depois](link-para-imagem)

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Eu realizei uma auto-review do código
- [ ] Adicionei comentários em áreas complexas
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes unitários passam localmente
- [ ] Documentação atualizada
```

---

## 🐛 **Reportando Issues**

### **Template de Bug Report**

```markdown
**Descreva o bug**
Uma descrição clara e concisa do problema.

**Para Reproduzir**
Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado**
O que você esperava que acontecesse.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [ex: Windows 10]
 - Browser: [ex: Chrome 118]
 - Versão: [ex: 1.0.0]

**Contexto Adicional**
Qualquer outra informação sobre o problema.
```

### **Template de Feature Request**

```markdown
**Sua feature request está relacionada a um problema?**
Uma descrição clara e concisa do problema.

**Descreva a solução que você gostaria**
Uma descrição clara e concisa do que você quer que aconteça.

**Descreva alternativas consideradas**
Uma descrição de soluções ou features alternativas que você considerou.

**Contexto Adicional**
Qualquer outra informação ou screenshots sobre a feature request.
```

---

## 🎯 **Próximos Passos**

Após contribuir:

1. **Entre em contato**
   - Email: proton.hello.world@gmail.com
   - Website: [protonsoftware.tech](https://protonsoftware.tech)

2. **Ajude outros**
   - Revise PRs de outros contribuidores
   - Responda questions nas issues
   - Compartilhe o projeto

3. **Continue aprendendo**
   - Leia sobre novas tecnologias usadas
   - Sugira melhorias de arquitetura
   - Implemente features avançadas

---

## 📞 **Contato**

- **Desenvolvedor Principal**: Gustavo Almeida
- **Empresa**: Proton Software
- **Email**: proton.hello.world@gmail.com
- **Website**: [protonsoftware.tech](https://protonsoftware.tech)

---

**Obrigado por contribuir! 🚀** 