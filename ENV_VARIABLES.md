# 📋 Variáveis de Ambiente - Bibliotech

Este documento descreve todas as variáveis de ambiente utilizadas no projeto.

## 🔧 Como Configurar

1. **Crie um arquivo `.env.local`** na raiz do projeto
2. **Adicione as variáveis** conforme necessário
3. **Reinicie o servidor de desenvolvimento** após alterar variáveis

```bash
# Exemplo de .env.local

# Firebase (se não estiver usando firebase.config.ts)
# REACT_APP_FIREBASE_API_KEY=sua_api_key
# REACT_APP_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
# REACT_APP_FIREBASE_PROJECT_ID=seu_projeto_id
# REACT_APP_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
# REACT_APP_FIREBASE_APP_ID=sua_app_id

# Login de Convidado (Opcional)
REACT_APP_GUEST_LOGIN_ENABLED=true
REACT_APP_GUEST_EMAIL=bibliotech.convidado@gmail.com
REACT_APP_GUEST_PASSWORD=convidado123
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git
- ✅ O arquivo `.env.local` já está no `.gitignore`
- ✅ Use `.env.local` para desenvolvimento local
- ✅ Use variáveis de ambiente do servidor para produção

## 📝 Variáveis Disponíveis

### 🔐 Configuração do Firebase (Obrigatório)

> ⚠️ **Importante**: As credenciais do Firebase podem ser configuradas de duas formas:
> 1. **Via arquivo de configuração** (`src/config/firebase.config.ts`) - Recomendado
> 2. **Via variáveis de ambiente** (método alternativo)

Se você optar por usar variáveis de ambiente para o Firebase:

| Variável | Descrição | Tipo | Obrigatória | Padrão |
|----------|-----------|------|-------------|--------|
| `REACT_APP_FIREBASE_API_KEY` | Chave da API do Firebase | `string` | Sim* | - |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação | `string` | Sim* | - |
| `REACT_APP_FIREBASE_PROJECT_ID` | ID do projeto Firebase | `string` | Sim* | - |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento | `string` | Sim* | - |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens | `string` | Sim* | - |
| `REACT_APP_FIREBASE_APP_ID` | ID da aplicação | `string` | Sim* | - |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | ID de medição (Analytics) | `string` | Não | - |

\* Obrigatórias apenas se não estiver usando `firebase.config.ts`. Consulte [Firebase Setup Guide](./src/config/FIREBASE_SETUP.md) para mais informações.

### 👤 Login de Convidado (Opcional)

| Variável | Descrição | Tipo | Obrigatória | Padrão |
|----------|-----------|------|-------------|--------|
| `REACT_APP_GUEST_LOGIN_ENABLED` | Habilita/desabilita login de convidado | `string` ("true"/"false") | Não | `false` |
| `REACT_APP_GUEST_EMAIL` | Email do usuário convidado | `string` | Sim* | `""` |
| `REACT_APP_GUEST_PASSWORD` | Senha do usuário convidado | `string` | Sim* | `""` |

\* Obrigatória apenas se `REACT_APP_GUEST_LOGIN_ENABLED=true`

## 💡 Exemplos de Uso

### Desabilitar Login de Convidado

```env
REACT_APP_GUEST_LOGIN_ENABLED=false
```

Ou simplesmente não defina as variáveis de email e senha.

### Habilitar Login de Convidado

```env
REACT_APP_GUEST_LOGIN_ENABLED=true
REACT_APP_GUEST_EMAIL=seu.email.convidado@gmail.com
REACT_APP_GUEST_PASSWORD=sua_senha_segura
```

## 🚀 Produção

Para produção, defina as variáveis de ambiente diretamente no servidor/hosting:

- **Vercel**: Vá em Settings > Environment Variables
- **Netlify**: Vá em Site Settings > Environment Variables
- **Outros**: Consulte a documentação da plataforma

## ⚙️ Como Funciona

O sistema verifica as variáveis de ambiente no momento da compilação (build time). 

- Variáveis devem começar com `REACT_APP_` para serem expostas ao código React
- Após alterar variáveis, é necessário **reiniciar o servidor de desenvolvimento**
- Variáveis são inseridas no código durante o build

## 🔍 Verificação

Se o login de convidado não estiver aparecendo:

1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis estão escritas corretamente
3. Verifique se `REACT_APP_GUEST_LOGIN_ENABLED=true`
4. Verifique se `REACT_APP_GUEST_EMAIL` e `REACT_APP_GUEST_PASSWORD` estão definidas
5. Reinicie o servidor de desenvolvimento (`npm start`)

## 📚 Referências

- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Firebase Setup Guide](./src/config/FIREBASE_SETUP.md)

