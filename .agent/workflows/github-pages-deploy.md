---
description: Kako deployati GAMIFY na GitHub Pages
---

# Deploy na GitHub Pages

// turbo-all

## 1. Inicijaliziraj Git repo (ako nije)
```powershell
cd c:\Users\AdminNovi\Desktop\GAMIFY
git init
git add .
git commit -m "Initial commit - GAMIFY app"
```

## 2. Kreiraj GitHub repo
- Idi na https://github.com/new
- Nazovi repo: `gamify`
- **NE** čekiraj "Add a README file"
- Klikni "Create repository"

## 3. Poveži i pushaj
```powershell
git remote add origin https://github.com/TVOJUSERNAME/gamify.git
git branch -M main
git push -u origin main
```

## 4. Omogući GitHub Pages
- Idi na repo → Settings → Pages
- Source: "Deploy from a branch"
- Branch: `main`, folder: `/ (root)`
- Sačekaj 1-2 minute

## 5. Gotovo!
Tvoja app je na: `https://TVOJUSERNAME.github.io/gamify`
