# 🚀 Guia de Deploy - Bibliotech

## ✅ Problema Resolvido

O erro de deploy na Vercel foi causado por **arquivos de vídeo muito grandes** (450MB) que estavam sendo incluídos no build, causando **timeout** durante o processo de deploy.

### Arquivos Removidos
- `public/images/home/produto/vídeo show bibliotech.mp4` (365MB)
- `public/images/home/produto/video.mp4` (85MB)

### Resultado
- **Antes**: Build de 464MB
- **Depois**: Build de 16MB
- **Redução**: 97% 🎯

---

## 📋 Alterações Realizadas

### 1. Arquivo `vercel.json` (criado)
```json
{
  "version": 2,
  "buildCommand": "CI=false npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Benefícios**:
- `CI=false`: Previne que warnings sejam tratados como erros no build
- `rewrites`: Garante que o roteamento do React Router funcione corretamente
- `framework`: Otimizações automáticas da Vercel para CRA

### 2. Arquivo `.vercelignore` (criado)
Ignora arquivos desnecessários no deploy para reduzir o tamanho e tempo de upload.

### 3. Script de Build no `package.json`
Atualizado de:
```json
"build": "react-scripts build"
```

Para:
```json
"build": "CI=false react-scripts build"
```

Isso garante que warnings de ESLint não impeçam o build em produção.

---

## 🎬 Recomendação para Vídeos

Para incluir vídeos no site sem impactar o deploy, você tem 3 opções:

### Opção 1: YouTube (Recomendado)
```jsx
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/SEU_VIDEO_ID" 
  title="Bibliotech Demo"
  frameBorder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowFullScreen
/>
```

### Opção 2: Vimeo
```jsx
<iframe 
  src="https://player.vimeo.com/video/SEU_VIDEO_ID" 
  width="640" 
  height="360" 
  frameBorder="0" 
  allow="autoplay; fullscreen; picture-in-picture" 
  allowFullScreen
/>
```

### Opção 3: CDN/Cloud Storage
- Upload para Firebase Storage
- Google Cloud Storage
- AWS S3
- Cloudinary

Exemplo com Firebase Storage:
```jsx
<video controls width="100%">
  <source 
    src="https://firebasestorage.googleapis.com/v0/b/SEU-PROJETO/o/videos%2Fdemo.mp4?alt=media" 
    type="video/mp4" 
  />
</video>
```

---

## 🚀 Deploy na Vercel

### Passo a Passo

1. **Faça commit das alterações**:
```bash
git add .
git commit -m "0.1.X - fix: corrigir build para deploy removendo vídeos pesados"
git push origin main
```

2. **A Vercel detectará automaticamente** e iniciará o build

3. **Aguarde o deploy** (deve levar 2-3 minutos agora)

### Verificação Pós-Deploy

- ✅ Build deve completar sem timeout
- ✅ Site deve carregar corretamente
- ✅ Rotas do React Router devem funcionar
- ✅ Firebase deve conectar normalmente

---

## 📊 Estatísticas do Build

```
File sizes after gzip:

  586.8 kB  build/static/js/main.js
  45.97 kB  build/static/js/239.chunk.js
  37.59 kB  build/static/css/main.css
  33.56 kB  build/static/js/732.chunk.js
  8.46 kB   build/static/js/977.chunk.js

Total: ~16MB (build folder completa)
```

---

## 🔧 Troubleshooting

### Se o build ainda falhar:

1. **Verifique as variáveis de ambiente** na Vercel (se necessário)
2. **Limpe o cache do build**:
   - Vá em Deployments → ⋯ → Redeploy → Clear cache and redeploy
3. **Verifique os logs** na Vercel para mensagens de erro específicas

### Logs Úteis

Para testar localmente antes do deploy:
```bash
# Limpar e rebuildar
rm -rf build/ node_modules/
npm install
npm run build

# Verificar tamanho
du -sh build/

# Testar localmente
npx serve -s build
```

---

## 📝 Notas Importantes

- ⚠️ **Não commite arquivos de vídeo** no repositório Git
- ✅ Use `.gitignore` para prevenir isso (já configurado para `*.mp4`)
- 📹 Hospede vídeos externamente (YouTube, Vimeo, Firebase Storage, etc.)
- 🎯 Mantenha o build otimizado (< 50MB é ideal)

---

## ✅ Checklist de Deploy

- [x] Vídeos removidos do repositório
- [x] `vercel.json` configurado
- [x] `.vercelignore` criado
- [x] Script de build atualizado no `package.json`
- [x] Build local testado e funcionando (16MB)
- [ ] Commit e push das alterações
- [ ] Aguardar deploy automático na Vercel
- [ ] Testar site em produção
- [ ] (Opcional) Adicionar vídeos via YouTube/Vimeo

---

**Status**: ✅ Pronto para deploy!

