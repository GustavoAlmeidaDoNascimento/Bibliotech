# Configuração do Firebase

Este projeto usa um arquivo de configuração separado para armazenar as credenciais do Firebase de forma segura.

## ⚠️ Importante

O arquivo `firebase.config.ts` **NÃO** é versionado no Git por questões de segurança. Cada desenvolvedor precisa criar seu próprio arquivo localmente.

## 📋 Como configurar

1. **Copie o arquivo de exemplo:**
   ```bash
   cp src/config/firebase.config.example.ts src/config/firebase.config.ts
   ```

2. **Edite o arquivo `firebase.config.ts`** com suas credenciais reais do Firebase:
   ```typescript
   export const firebaseConfig: FirebaseOptions = {
     apiKey: "sua_api_key_real",
     authDomain: "seu_projeto.firebaseapp.com",
     projectId: "seu_projeto_id",
     storageBucket: "seu_projeto.appspot.com",
     messagingSenderId: "seu_sender_id",
     appId: "seu_app_id",
     measurementId: "seu_measurement_id"
   };
   ```

3. **Onde encontrar suas credenciais do Firebase:**
   - Acesse o [Firebase Console](https://console.firebase.google.com)
   - Selecione seu projeto
   - Vá em **Configurações do Projeto** (ícone de engrenagem)
   - Role até **Seus apps** e clique no ícone de configurações
   - Copie as credenciais para o arquivo `firebase.config.ts`

## 🔒 Segurança

- ✅ O arquivo `firebase.config.ts` está no `.gitignore`
- ✅ Apenas o arquivo `firebase.config.example.ts` (template) é versionado
- ✅ Nunca commite credenciais reais no repositório

## ❌ Erro comum

Se você receber o erro:
```
Arquivo firebase.config.ts não encontrado
```

Certifique-se de que:
1. Você copiou `firebase.config.example.ts` para `firebase.config.ts`
2. O arquivo está em `src/config/firebase.config.ts`
3. Você preencheu todas as credenciais no arquivo

