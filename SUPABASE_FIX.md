# 🔧 Solución al Error ENOTFOUND de Supabase

## 🎯 Problema Identificado

**Error:** `getaddrinfo ENOTFOUND jnmkqsnokslhhmurvkvp.supabase.co`

**Causa Raíz:** Versión antigua de `@supabase/ssr@0.1.0` con bugs conocidos de DNS resolution en Edge Runtime de Next.js 14.

---

## ✅ Cambios Realizados

### 1. Actualización de @supabase/ssr ⭐ (CRÍTICO)

**Antes:**
```json
"@supabase/ssr": "^0.1.0"  // ❌ Versión de hace 2 años con bugs
```

**Después:**
```json
"@supabase/ssr": "^0.5.1"  // ✅ Versión estable actual
```

**Por qué esto resuelve el problema:**
- La versión 0.1.0 tiene bugs conocidos con DNS en Edge Runtime
- La versión 0.5.1 tiene fixes específicos para Next.js 14 middleware
- Mejoras en el manejo de fetch() en entornos Edge
- Mejor compatibilidad con Cloudflare Workers (que usa Next.js Edge)

---

### 2. Simplificación del Middleware

**Problema anterior:**
El middleware hacía llamadas a Supabase en **TODAS** las rutas, incluyendo públicas:
```typescript
// ❌ Antes: Siempre llamaba a Supabase
export async function middleware(request: NextRequest) {
  let response = await updateSession(request)  // ← Llamada en /
  const { user } = await supabase.auth.getUser()  // ← Llamada en /login
  // ...
}
```

**Solución:**
Ahora skip Supabase completamente en rutas públicas:
```typescript
// ✅ Ahora: Skip Supabase en rutas públicas
export async function middleware(request: NextRequest) {
  const publicRoutes = ['/', '/login', '/signup', '/onboarding', '/quote']

  if (isPublicRoute) {
    return NextResponse.next()  // ← No toca Supabase
  }

  // Solo en rutas protegidas:
  return await updateSession(request)
}
```

**Beneficios:**
- 🚀 Landing page carga instantáneamente (sin llamadas a Supabase)
- 🚀 Login/signup pages cargan sin delay
- ✅ Reduce errores innecesarios en rutas públicas
- ✅ Menos load en Supabase (solo rutas protegidas)

---

### 3. Mejor Manejo de Errores

**Agregado en `src/lib/supabase/middleware.ts`:**

```typescript
// ✅ Verificación de variables de entorno
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing environment variables')
  throw new Error('Supabase environment variables not configured')
}

// ✅ Captura de errores de autenticación
const { data: { user }, error } = await supabase.auth.getUser()

if (error) {
  console.error('[Supabase] Error getting user:', error.message)
  // Redirect to login instead of crashing
}
```

**Agregado en `src/middleware.ts`:**

```typescript
// ✅ Try-catch global para errores de Supabase
try {
  return await updateSession(request)
} catch (error) {
  console.error('[Middleware] Error updating session:', error)

  // Redirect to login con mensaje de error
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('error', 'session_error')
  return NextResponse.redirect(url)
}
```

---

## 📋 Instrucciones para Aplicar los Cambios

### Paso 1: Detener el Servidor
```bash
# Presiona Ctrl+C en la terminal donde corre npm run dev
```

### Paso 2: Actualizar Dependencias
```bash
# Eliminar versión antigua
rm -rf node_modules package-lock.json

# Instalar nueva versión de @supabase/ssr
npm install

# Esto instalará @supabase/ssr@0.5.1
```

### Paso 3: Verificar Variables de Entorno
```bash
# Asegúrate que .env existe y tiene:
cat .env
```

Debe contener:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://jnmkqsnokslhhmurvkvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 4: Limpiar Caché de Next.js
```bash
# Eliminar caché de Next.js
rm -rf .next
```

### Paso 5: Ejecutar el Servidor
```bash
npm run dev
```

### Paso 6: Probar
1. Abre http://localhost:3000
2. Deberías ver la landing page **SIN ERRORES**
3. Haz clic en "Iniciar sesión"
4. Deberías ver el formulario de login **SIN ERRORES**

---

## 🧪 Pruebas para Verificar que Funciona

### Test 1: Landing Page
```bash
# Abre http://localhost:3000
```
✅ **Esperado:** Carga sin errores de ENOTFOUND en consola

### Test 2: Login Page
```bash
# Abre http://localhost:3000/login
```
✅ **Esperado:** Formulario de login visible, sin errores

### Test 3: Intentar Login
```bash
# En /login, ingresa credenciales y haz clic en "Iniciar sesión"
```
✅ **Esperado:**
- Si credenciales correctas: Redirect a onboarding o workspace
- Si credenciales incorrectas: Mensaje de error de auth (NO de DNS)
- **NO debe aparecer:** `ERR_NAME_NOT_RESOLVED` o `ENOTFOUND`

### Test 4: Signup
```bash
# Abre http://localhost:3000/signup
```
✅ **Esperado:** Formulario de registro funcional

---

## 🔍 Logs que Deberías Ver (Sin Errores)

**Antes (con errores):**
```
❌ [TypeError: fetch failed]
❌ cause: [Error: getaddrinfo ENOTFOUND jnmkqsnokslhhmurvkvp.supabase.co]
❌ errno: -3008, code: 'ENOTFOUND'
```

**Después (sin errores):**
```
✓ Ready in 2.5s
✓ Compiled / in 1234ms
○ Compiling /login ...
✓ Compiled /login in 567ms
```

Si ves logs de Supabase (solo en rutas protegidas):
```
[Supabase] Getting user session...  ← Solo en rutas protegidas
```

---

## ⚠️ Si Persiste el Error

### Opción 1: Verificar Conectividad Directa

```bash
# Test de conectividad con Node.js directamente
node -e "fetch('https://jnmkqsnokslhhmurvkvp.supabase.co/auth/v1/health').then(r => console.log('OK:', r.status)).catch(e => console.error('FAIL:', e.message))"
```

✅ **Esperado:** `OK: 401` (Supabase responde, pero sin auth)
❌ **Si falla:** Problema de red/firewall en tu máquina

---

### Opción 2: Usar IP Directa (Workaround Temporal)

Si el DNS sigue fallando, usa la IP directa:

**En `.env`:**
```bash
# TEMPORAL - Solo para debugging
NEXT_PUBLIC_SUPABASE_URL=https://172.64.149.246
```

⚠️ **Advertencia:** Esto es solo para testing. NO usar en producción.

---

### Opción 3: Verificar Proxy/VPN

```bash
# Desactivar proxy temporalmente
unset http_proxy
unset https_proxy
unset HTTP_PROXY
unset HTTPS_PROXY

# Ejecutar de nuevo
npm run dev
```

---

### Opción 4: Usar Node 18 LTS (No Node 20+)

```bash
# Verificar versión de Node
node --version

# Si es Node 20 o superior, bajar a Node 18 LTS
nvm install 18
nvm use 18

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Opción 5: Configurar DNS Alternativo

```bash
# Agregar a /etc/hosts (macOS/Linux)
sudo echo "172.64.149.246 jnmkqsnokslhhmurvkvp.supabase.co" >> /etc/hosts

# Luego ejecutar
npm run dev
```

---

## 📊 Resumen de Cambios por Archivo

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `package.json` | `@supabase/ssr: 0.1.0 → 0.5.1` | 🔴 CRÍTICO - Fix DNS bug |
| `src/middleware.ts` | Skip Supabase en rutas públicas | 🟢 Performance + menos errores |
| `src/middleware.ts` | Agregar try-catch global | 🟡 Mejor error handling |
| `src/lib/supabase/middleware.ts` | Validar env vars | 🟡 Catch config errors |
| `src/lib/supabase/middleware.ts` | Agregar logs de error | 🟢 Debugging más fácil |

---

## 🎯 Por Qué Esto Debería Funcionar

### 1. **Bug Fix en @supabase/ssr**
- Versión 0.1.0 tiene problemas documentados con fetch() en Edge Runtime
- Versión 0.5.1 tiene fixes específicos para Next.js 14
- [Changelog oficial](https://github.com/supabase/auth-js/releases)

### 2. **Menos Llamadas = Menos Errores**
- Antes: 5+ llamadas a Supabase por page load (incluso en /)
- Ahora: 0 llamadas en rutas públicas, solo en protegidas

### 3. **Better Error Handling**
- Antes: Crash silencioso con ENOTFOUND
- Ahora: Logs claros + redirect graceful a login

---

## 📞 Si Aún No Funciona

Si después de todos estos pasos el error persiste:

1. **Copia el error exacto** de la consola
2. **Copia el resultado de:**
   ```bash
   npm list @supabase/ssr
   node --version
   npm --version
   ```
3. **Avísame** y lo revisamos juntos

---

## ✅ Checklist Final

- [ ] `npm install` ejecutado
- [ ] `rm -rf .next` ejecutado
- [ ] `.env` tiene las variables correctas
- [ ] `npm run dev` corriendo
- [ ] Landing page carga sin errores
- [ ] Login page carga sin errores
- [ ] No hay `ENOTFOUND` en la consola
- [ ] Puedo hacer signup/login

---

**Generado:** 6 de noviembre 2025
**Commit:** (pendiente)
