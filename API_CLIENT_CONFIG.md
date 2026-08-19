# API-Driven Client Configuration

DentiChair can fetch client configuration dynamically from your backend API. This enables multi-tenant configuration without redeploying the frontend.

## 📋 Overview

Instead of hardcoding client details in `.env` files, client branding and configuration is fetched from your backend API at runtime.

**Benefits:**
- ✅ Update client branding without redeploying
- ✅ Support unlimited clients with single deployment
- ✅ Dynamic theme colors per client
- ✅ Per-client support contact info
- ✅ True multi-tenant architecture

---

## 🔄 How It Works

```
1. App loads
    ↓
2. ClientConfigProvider fetches config from API
    ↓
3. GET /client-config sent to backend
    ↓
4. Backend determines client from request context
    ↓
5. Backend returns client config JSON
    ↓
6. Config cached in memory (5+ min)
    ↓
7. App displays client-specific branding
```

---

## 📁 Frontend Implementation

### 1. Fetch Configuration

**Using Hook (Recommended):**
```typescript
import { useClientConfig } from '@/hooks/useClientConfig';

export function MyComponent() {
  const { config, loading, error } = useClientConfig();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading config</div>;

  return <h1>{config?.appName}</h1>;
}
```

**Using Context:**
```typescript
import { useClientConfigContext } from '@/providers/ClientConfigProvider';

export function MyComponent() {
  const { config, loading, error } = useClientConfigContext();

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ color: config?.theme?.primaryColor }}>
      {config?.appName}
    </div>
  );
}
```

**Direct API Call:**
```typescript
import { fetchClientConfig } from '@/lib/client-config-api';

const config = await fetchClientConfig();
console.log(config.appName); // "DentiChair - Dentist A"
```

### 2. Update Root Layout

```typescript
// src/app/layout.tsx
import { ClientConfigProvider } from '@/providers/ClientConfigProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ClientConfigProvider>
          {children}
        </ClientConfigProvider>
      </body>
    </html>
  );
}
```

### 3. Use in Components

```typescript
// src/components/Header.tsx
'use client';

import { useClientConfigContext } from '@/providers/ClientConfigProvider';

export function Header() {
  const { config, loading } = useClientConfigContext();

  if (loading) return <div>Loading...</div>;

  return (
    <header style={{ backgroundColor: config?.theme?.primaryColor }}>
      <h1>{config?.appName}</h1>
      <p>Support: {config?.supportEmail}</p>
    </header>
  );
}
```

---

## 🔌 Backend API Endpoint

### Endpoint Specification

**Request:**
```
GET /client-config
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token} (optional)
```

**Response (Success - 200):**
```json
{
  "id": "client-a",
  "name": "Dentist A Practice",
  "displayName": "Dentist A",
  "appName": "DentiChair - Dentist A",
  "backendUrl": "https://api-a.example.com/api",
  "supportEmail": "support@dentist-a.com",
  "supportPhone": "+1-555-0100",
  "theme": {
    "primaryColor": "#0070f3",
    "brandColor": "#0070f3"
  },
  "logo": "https://cdn.example.com/logo-a.png",
  "favicon": "https://cdn.example.com/favicon-a.ico",
  "features": {
    "desktop": true,
    "pwa": true,
    "offlineSupport": true
  }
}
```

**Response (Error - 500/503):**
```json
{
  "error": "Failed to load client config"
}
```

---

## 📝 Laravel Backend Implementation

### 1. Create Controller

```php
<?php
// app/Http/Controllers/ClientConfigController.php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientConfigController extends Controller
{
    /**
     * Get client configuration
     * Determines client from request context and returns configuration
     */
    public function show(Request $request): JsonResponse
    {
        try {
            // Method 1: Get client from subdomain
            $clientSubdomain = $this->getSubdomain($request->getHost());

            // Method 2: Get client from header
            $clientId = $request->header('X-Client-ID') ?? $clientSubdomain;

            // Method 3: Get client from auth token
            if (!$clientId && $request->user()) {
                $clientId = $request->user()->client_id;
            }

            if (!$clientId) {
                return response()->json(
                    ['error' => 'Unable to determine client'],
                    400
                );
            }

            // Fetch client configuration from database
            $client = Client::where('id', $clientId)
                ->orWhere('subdomain', $clientId)
                ->firstOrFail();

            // Return configuration
            return response()->json([
                'id' => $client->id,
                'name' => $client->name,
                'displayName' => $client->display_name,
                'appName' => $client->app_name,
                'backendUrl' => $client->backend_url,
                'supportEmail' => $client->support_email,
                'supportPhone' => $client->support_phone,
                'theme' => [
                    'primaryColor' => $client->primary_color ?? '#0070f3',
                    'brandColor' => $client->brand_color ?? '#0070f3',
                ],
                'logo' => $client->logo_url,
                'favicon' => $client->favicon_url,
                'features' => [
                    'desktop' => $client->desktop_enabled ?? true,
                    'pwa' => $client->pwa_enabled ?? true,
                    'offlineSupport' => $client->offline_support ?? true,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Client config error: ' . $e->getMessage());

            return response()->json(
                ['error' => 'Failed to load client config'],
                500
            );
        }
    }

    /**
     * Extract subdomain from hostname
     */
    private function getSubdomain(string $host): ?string
    {
        $parts = explode('.', $host);

        // Handle localhost and IP addresses
        if (count($parts) < 2 || filter_var($host, FILTER_VALIDATE_IP)) {
            return null;
        }

        // Get first part as subdomain
        return $parts[0] !== 'www' ? $parts[0] : null;
    }
}
```

### 2. Create Client Model

```php
<?php
// app/Models/Client.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'id',
        'name',
        'display_name',
        'app_name',
        'subdomain',
        'domain',
        'backend_url',
        'support_email',
        'support_phone',
        'primary_color',
        'brand_color',
        'logo_url',
        'favicon_url',
        'desktop_enabled',
        'pwa_enabled',
        'offline_support',
    ];
}
```

### 3. Create Migration

```php
<?php
// database/migrations/YYYY_MM_DD_create_clients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // "Dentist A Practice"
            $table->string('display_name'); // "Dentist A"
            $table->string('app_name'); // "DentiChair - Dentist A"
            $table->string('subdomain')->unique(); // "dentist-a"
            $table->string('domain')->nullable(); // "dentist-a.com"
            $table->string('backend_url');
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('primary_color')->default('#0070f3');
            $table->string('brand_color')->default('#0070f3');
            $table->string('logo_url')->nullable();
            $table->string('favicon_url')->nullable();
            $table->boolean('desktop_enabled')->default(true);
            $table->boolean('pwa_enabled')->default(true);
            $table->boolean('offline_support')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
```

### 4. Register Route

```php
<?php
// routes/api.php

use App\Http\Controllers\ClientConfigController;

Route::get('/client-config', [ClientConfigController::class, 'show']);
```

---

## 🎯 Client Detection Methods

### Method 1: Subdomain-Based
```
dentist-a.dentichair.com → client_id: dentist-a
dentist-b.dentichair.com → client_id: dentist-b
```

**Pros:** Clean URLs, scalable  
**Cons:** Requires wildcard DNS and SSL

### Method 2: Header-Based
```
Header: X-Client-ID: client-a
```

**Pros:** Simple, no DNS needed  
**Cons:** Requires client to send header

### Method 3: Auth Token-Based
```
User login → Token contains client_id → Fetch config
```

**Pros:** Secure, per-user client  
**Cons:** Requires auth first

### Method 4: Query Parameter
```
GET /client-config?client_id=client-a
```

**Pros:** Simple  
**Cons:** Less secure

---

## 🔄 Caching Strategy

### Frontend Caching
- Config cached in memory for entire session
- Call `clearClientConfigCache()` to refresh
- Call `refreshClientConfig()` to re-fetch

### Backend Caching
```php
// Cache for 1 hour
return Cache::remember("client_config_{$clientId}", 3600, function () {
    return Client::find($clientId);
});
```

### Cache Invalidation
```php
// When updating client config
Cache::forget("client_config_{$clientId}");
```

---

## 📊 Database Schema Example

```
clients table:
- id: bigint (primary key)
- name: varchar "Dentist A Practice"
- display_name: varchar "Dentist A"
- app_name: varchar "DentiChair - Dentist A"
- subdomain: varchar "dentist-a"
- domain: varchar "dentist-a.com"
- backend_url: varchar "https://api-a.example.com/api"
- support_email: varchar "support@dentist-a.com"
- support_phone: varchar "+1-555-0100"
- primary_color: varchar "#0070f3"
- brand_color: varchar "#0070f3"
- logo_url: varchar
- favicon_url: varchar
- desktop_enabled: boolean true
- pwa_enabled: boolean true
- offline_support: boolean true
- created_at: timestamp
- updated_at: timestamp
```

---

## 🧪 Testing

### Test Frontend Fetch
```typescript
import { fetchClientConfig } from '@/lib/client-config-api';

const config = await fetchClientConfig();
console.log(config.appName); // Should print client name
```

### Test API Endpoint
```bash
# Test with subdomain
curl https://dentist-a.dentichair.com/api/client-config

# Test with header
curl -H "X-Client-ID: client-a" https://dentichair.com/api/client-config

# Test with query param
curl https://dentichair.com/api/client-config?client_id=client-a
```

---

## 🚀 Deployment

### 1. Create Clients Table
```bash
php artisan migrate
```

### 2. Seed Sample Data
```php
// database/seeders/ClientSeeder.php
Client::create([
    'name' => 'Dentist A Practice',
    'display_name' => 'Dentist A',
    'app_name' => 'DentiChair - Dentist A',
    'subdomain' => 'dentist-a',
    'domain' => 'dentist-a.com',
    'backend_url' => 'https://api-a.example.com/api',
    'support_email' => 'support@dentist-a.com',
    'support_phone' => '+1-555-0100',
    'primary_color' => '#0070f3',
]);
```

### 3. Deploy Frontend
Update `.env`:
```
NEXT_PUBLIC_BACKEND_URL=https://stagingapi.poslycloud.com/api
```

Frontend will automatically fetch config from API on load.

---

## 📋 Fallback Behavior

If API is down or returns error:
1. Frontend falls back to environment variables
2. Uses hardcoded defaults
3. App still works with minimal branding
4. Shows console warning

---

## 🔐 Security Considerations

### Public Data
- Client name, branding, colors
- Support contact information
- Public configuration

### Sensitive Data
- DO NOT include credentials in API response
- DO NOT include database passwords
- DO NOT include JWT secrets
- DO NOT include API keys in response

### Authentication
- Optional: Require auth token for sensitive clients
- Optional: Rate limit the endpoint
- Validate and sanitize all data

---

## 📚 Files Created

| File | Purpose |
|------|---------|
| `src/lib/client-config-api.ts` | API fetch logic |
| `src/hooks/useClientConfig.ts` | React hook |
| `src/providers/ClientConfigProvider.tsx` | Context provider |
| `API_CLIENT_CONFIG.md` | This guide |

---

## ✅ Next Steps

1. Create `clients` table in database
2. Implement `ClientConfigController` in Laravel
3. Register API route `/client-config`
4. Update frontend to use `ClientConfigProvider`
5. Test client configuration fetching
6. Deploy to production

All set for dynamic API-driven client configuration! 🚀
