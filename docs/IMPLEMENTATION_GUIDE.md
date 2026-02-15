# Implementation Documentation: Session Handling, Error Handling & Security

## Overview

This document explains the comprehensive implementation of three critical backend systems: **Session Handling**, **Error Handling**, and **Backend Security**. All code follows senior-level best practices, the DRY (Don't Repeat Yourself) principle, and OWASP security standards.

---

## 1. ARCHITECTURE OVERVIEW

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────┐
│         Client Application                       │
└────────────────────┬────────────────────────────┘
                     │
┌─────────────────────┴────────────────────────────┐
│  Express Middleware Stack (Security Layer)      │
│  ├─ Request ID (Audit Trail)                   │
│  ├─ HTTPS Enforcement                          │
│  ├─ Security Headers (Helmet)                  │
│  ├─ CORS Protection                            │
│  ├─ Input Sanitization (NoSQL Injection)       │
│  ├─ HPP Protection                             │
│  ├─ Rate Limiting                              │
│  ├─ Request Timeout                            │
│  └─ Session Management                         │
└────────────────────┬────────────────────────────┘
                     │
┌─────────────────────┴────────────────────────────┐
│  Route Handlers (Business Logic)                 │
│  ├─ Input Validation                            │
│  ├─ Authentication Check                        │
│  ├─ Authorization Check                         │
│  ├─ Data Processing                             │
│  └─ Response Formatting                         │
└────────────────────┬────────────────────────────┘
                     │
┌─────────────────────┴────────────────────────────┐
│  Error Handler (Bottom of Stack)                 │
│  ├─ Error Classification                        │
│  ├─ Structured Logging                          │
│  ├─ Safe Response Generation                    │
│  └─ Error ID for Tracking                       │
└─────────────────────────────────────────────────┘
```

---

## 2. SESSION HANDLING SYSTEM

### Architecture

Sessions use a **dual-token strategy**:
- **Access Token** (JWT, short-lived, 15 minutes)
  - Used for API requests
  - Contains user ID, username, session ID
  - Stateless verification
  - Fast, no DB lookup required

- **Refresh Token** (JWT, long-lived, 7 days)
  - Used to obtain new access tokens
  - Stored in HTTP-only cookies
  - Single refresh per token for security
  - Prevents XSS attacks (never in localStorage)

- **Session Store** (MongoDB)
  - Persistent session storage
  - Device fingerprinting (IP, User-Agent)
  - Session metadata tracking
  - Enables server-side session management

### How It Works

**1. Registration/Login Flow:**
```javascript
User → POST /api/registration
       ↓
   Validation → Hash Password → Create User
       ↓
Generate Token Pair (Access + Refresh)
       ↓
Return both tokens + session metadata
       ↓
Client stores Access Token (memory)
Client stores Refresh Token (HTTP-only cookie)
```

**2. Protected API Call Flow:**
```javascript
Client → GET /api/topics
Header: "Authorization: Bearer <accessToken>"
       ↓
Middleware: Verify Access Token
       ↓
Extract User ID from Token
       ↓
Attach req.user object
       ↓
Call Route Handler
```

**3. Token Refresh Flow:**
```javascript
Client → POST /api/refresh
Body: { refreshToken: "..." }
       ↓
Verify Refresh Token
       ↓
Generate new Access Token (same session ID)
       ↓
Return new Access Token
       ↓
Client updates memory with new token
```

### Key Features

**Why this approach?**

| Feature | Benefit |
|---------|---------|
| Short Access Token | If token is stolen, damage is limited to 15 minutes |
| Long Refresh Token | User doesn't have to re-login every 15 minutes |
| HTTP-only Cookie | Refresh token safe from XSS attacks (JS can't access) |
| Session Store | Can invalidate sessions server-side (logout) |
| Device Fingerprinting | Detects suspicious logins from different devices |

---

## 3. ERROR HANDLING SYSTEM

### Error Class Hierarchy

```
Error (JavaScript native)
  └─ AppError (custom base class)
      ├─ ValidationError (400) - Input validation failed
      ├─ AuthenticationError (401) - User not logged in
      ├─ AuthorizationError (403) - User lacks permissions
      ├─ NotFoundError (404) - Resource doesn't exist
      ├─ ConflictError (409) - Resource already exists
      ├─ TooManyRequestsError (429) - Rate limit exceeded
      ├─ SessionError (401) - Session expired/invalid
      └─ InternalServerError (500) - Server error
```

**Why custom classes?**

1. **Type Safety** - Know exactly what error occurred
2. **Consistent Status Codes** - Each error type has correct HTTP code
3. **Structured Logging** - Log errorType, not just message
4. **Client Messaging** - Different messages for different errors
5. **Flexibility** - Can add error-specific data (e.g., validation details)

### Example Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validierungsfehler",
  "errorCode": "ValidationError",
  "errorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "details": [
    {
      "field": "password",
      "message": "Passwort muss mindestens einen Großbuchstaben enthalten"
    }
  ],
  "timestamp": "2026-02-15T10:30:00.000Z",
  "requestId": "e47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Note:** `details` only shown in development mode, never in production (prevents information leakage).

### Error Logging

Errors logged to **both console and files**:

```
logs/
├─ combined.log     (all logs, rotated at 5MB)
├─ error.log        (error logs only, rotated at 5MB)
└─ (max 5 files per type for size management)
```

**Log Entry Example:**
```
2026-02-15 10:30:45 [ERROR]: Error: Authentifizierung erforderlich, Token nicht vorhanden
{
  "name": "AuthenticationError",
  "statusCode": 401,
  "stack": "...",
  "context": {
    "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "path": "/api/topics",
    "method": "GET",
    "userId": null,
    "ip": "192.168.1.100"
  }
}
```

### Async Error Handling

**Problem:** Express doesn't catch async errors automatically.

**Solution:** `asyncHandler` wrapper function:

```javascript
// Without asyncHandler (ERROR - crashes server)
app.post('/api/test', async (req, res) => {
    const user = await User.findOne({}); // If this throws, no error handler catches it
});

// With asyncHandler (CORRECT - passes to error handler)
app.post('/api/test', asyncHandler(async (req, res) => {
    const user = await User.findOne({});
}));
```

---

## 4. BACKEND SECURITY

### Multi-Layer Security Stack

#### Layer 1: HTTP Security Headers (Helmet.js)

Automatically adds security headers to every response:

```
X-Content-Type-Options: nosniff           // Prevent MIME sniffing
X-Frame-Options: DENY                     // Prevent clickjacking
X-XSS-Protection: 1; mode=block          // Enable XSS filter
Strict-Transport-Security: ...            // HTTPS only
Content-Security-Policy: ...              // Control script execution
Referrer-Policy: strict-origin-when-cross-origin
```

#### Layer 2: Input Validation & Sanitization

**Validation (express-validator):**
```javascript
// Check type, length, format
username must be 3-20 chars
password must contain uppercase, lowercase, number
course must be one of: TIA, TIS, TIK
```

**Sanitization (mongoose-sanitize):**
```javascript
// Prevent NoSQL injection
Input: { "$gt": "" }  →  Sanitized: { "_gt": "" }
Input: { ".hl": "..." }  →  Sanitized: { "_hl": "..." }
```

**Result:**
```javascript
// Attacker input
POST /api/registration
{
  "username": {"$ne": null},
  "password": {"$gt": ""}
}

// After sanitization
{
  "username": {"_ne": null},
  "password": {"_gt": ""}
}
// → No longer a valid MongoDB operator!
```

#### Layer 3: Rate Limiting

**Purpose:** Prevent brute force attacks and DOS

**Three tiers:**
1. **General** (100 requests/15 min per IP)
   - Applied to all endpoints
   - Protects against DOS

2. **Auth** (5 failed attempts/15 min per IP)
   - Applied to /login and /registration
   - Prevents password brute forcing
   - Only counts FAILED attempts

3. **Refresh** (10 attempts/15 min per IP)
   - Applied to /refresh endpoint
   - Prevents refresh token abuse

#### Layer 4: Account Lockout Mechanism

**After 5 failed login attempts:**
1. Account locked for 15 minutes
2. No further login attempts accepted
3. Failure counter resets after 1 hour of no failed attempts

```javascript
User clicks "Login" 5 times with wrong password
  ↓
Account locked until [now + 15 minutes]
  ↓
6th attempt: "Konto ist gesperrt, bitte später versuchen"
  ↓
After 15 minutes: Account automatically unlocked
```

#### Layer 5: Request Timeout

**Prevents slowloris attacks:**
- Each request has max 30 seconds to complete
- Slow clients disconnected to free up resources
- Server can't be exhausted by slow connections

#### Layer 6: HTTPS Enforcement (Production)

```javascript
if (NODE_ENV === 'production' && !https) {
    redirect to https
}
```

#### Layer 7: CORS Configuration

**Development:**
```javascript
Allow all origins (easier testing)
```

**Production:**
```javascript
Allow only specified origins from ALLOWED_ORIGINS env var
Credentials enabled for cookies
Preflight cache: 24 hours
```

#### Layer 8: HTTP Parameter Pollution Prevention

**Problem:**
```javascript
GET /api/topics?kurs=TIA&kurs=TIS
// Could cause ambiguous behavior
```

**Solution:**
```javascript
// HPP removes duplicates, keeps last value
GET /api/topics?kurs=TIA&kurs=TIS
// Becomes: kurs = "TIS"
```

---

## 5. DRY PRINCIPLE IMPLEMENTATION

### Problem: Code Duplication

**Before:** Validation rules scattered across routes
```javascript
// authRoutes.js
router.post('/registration', [
    body('username').trim().isLength({ min: 3, max: 20 })...
]);

// Different file, same rule
// And again in another file...
```

**Solution:** Centralized validation (`utils/validationRules.js`)

```javascript
// Define once
const registrationValidation = [
    firstNameValidation,
    lastNameValidation,
    usernameValidation,
    passwordValidation,
    courseValidation
];

// Use everywhere
router.post('/registration', registrationValidation, asyncHandler(registerUser));
```

### Other DRY Implementations

| Concept | Before | After |
|---------|--------|-------|
| Error classes | Strings everywhere | `new ValidationError(...)` |
| Response format | Different per endpoint | `successResponse()` & `errorResponse()` |
| Security config | Hardcoded values | `securityConfig.js` |
| Logging | `console.log` everywhere | `logger.info/warn/error()` |
| Session logic | Duplicated in multiple files | `sessionUtils.js` |

---

## 6. FILE STRUCTURE

```
middleware/
├─ authMiddleware.js          # JWT verification
├─ errorMiddleware.js         # Centralized error handling
├─ rateLimitMiddleware.js     # Rate limiting (3 tiers)
├─ securityMiddleware.js      # Security headers, sanitization, etc.
├─ sessionMiddleware.js       # Express-session initialization
└─ validationMiddleware.js    # Async error wrapper

utils/
├─ errorClasses.js           # Custom error definitions
├─ errorLogger.js            # Winston logger setup
├─ responseHandler.js        # Standardized response formatting
├─ securityConfig.js         # All security configuration
├─ sessionUtils.js           # Token generation & verification
├─ tokenUtils.js             # Token pair generation
└─ validationRules.js        # Validation schemas (DRY)

controllers/
├─ authController.js         # Auth logic (register, login, refresh, logout)
└─ topicController.js        # Topic CRUD operations

routes/
├─ authRoutes.js            # Auth endpoints with rate limiting & validation
└─ topicRoutes.js           # Topic endpoints with validation
```

---

## 7. ENVIRONMENT VARIABLES

Create `.env` file (copy from `.env.example`):

```bash
# Critical - Must change in production!
ACCESS_TOKEN_SECRET=your-secret-key-production-value
REFRESH_TOKEN_SECRET=your-secret-key-production-value
SESSION_SECRET=your-secret-key-production-value

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/mongo-app

# Environment
NODE_ENV=development  # or "production"

# CORS (production)
ALLOWED_ORIGINS=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

**Security Note:** Never commit `.env` to git! Only commit `.env.example`.

---

## 8. TESTING THE IMPLEMENTATION

### 1. Registration
```bash
POST /api/registration
{
  "firstname": "Max",
  "lastname": "Mustermann",
  "username": "max123",
  "password": "SecurePass123",
  "course": "TIA"
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "sessionId": "uuid-here",
    "expiresIn": "15m"
  }
}
```

### 2. Login
```bash
POST /api/login
{
  "username": "max123",
  "password": "SecurePass123"
}

Response: (same structure as registration)
```

### 3. Protected Endpoint
```bash
GET /api/topics
Header: "Authorization: Bearer <accessToken>"

Response:
{
  "success": true,
  "data": [topics...],
  "pagination": {...}
}
```

### 4. Token Refresh
```bash
POST /api/refresh
{
  "refreshToken": "<refreshToken>"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "expiresIn": "15m"
  }
}
```

### 5. Logout
```bash
POST /api/logout
Header: "Authorization: Bearer <accessToken>"

Response:
{
  "success": true,
  "message": "Logout erfolgreich"
}
```

### 6. Rate Limiting
```bash
# Try 6 logins in quick succession
POST /api/login (attempt 1-5) → Success
POST /api/login (attempt 6) → 429 Too Many Requests

Response:
{
  "success": false,
  "message": "Zu viele Anfragen von dieser IP, bitte später versuchen",
  "statusCode": 429,
  "retryAfter": "2026-02-15T10:45:00.000Z"
}
```

---

## 9. PRODUCTION CHECKLIST

Before deploying to production, ensure:

- [ ] Set `NODE_ENV=production`
- [ ] Set strong random values for all `*_SECRET` variables
- [ ] Configure `ALLOWED_ORIGINS` for your domain(s)
- [ ] Enable HTTPS on your server
- [ ] Set `ENFORCE_HTTPS=true`
- [ ] Use strong database password
- [ ] Monitor `logs/error.log` for issues
- [ ] Set up log rotation (handled by Winston)
- [ ] Use environment variable encryption if possible
- [ ] Test rate limiting is working
- [ ] Verify error messages don't leak sensitive info

---

## 10. SECURITY BEST PRACTICES IMPLEMENTED

✅ **OWASP Top 10 Coverage:**
- A01: Broken Access Control → Authorization checks
- A02: Cryptographic Failures → Password hashing, HTTPS
- A03: Injection → Input sanitization
- A05: Authentication → Session handling, account lockout
- A06: Vulnerable & Outdated Components → Keep npm packages updated
- A07: Identification & Auth Failures → Rate limiting, account lockout

✅ **Additional Best Practices:**
- Never expose stack traces to clients (prod mode)
- Never log sensitive data (passwords, tokens)
- Always use HTTPS in production
- Implement CORS properly (not `origin: true`)
- Use HTTP-only cookies for sensitive tokens
- Implement request timeouts (prevent DOS)
- Validate and sanitize all inputs
- Use strong password requirements
- Implement rate limiting
- Log all security events
- Use UUID for request tracking

---

## 11. FUTURE ENHANCEMENTS

Potential improvements for later:

- [ ] CSRF protection tokens
- [ ] Two-factor authentication (2FA)
- [ ] OAuth 2.0 / Google Login integration
- [ ] Email verification for registration
- [ ] Password reset flow
- [ ] Admin dashboard for user management
- [ ] API key authentication (for third-party apps)
- [ ] WebSocket support with session sharing
- [ ] Database query caching (Redis)
- [ ] Request signature verification
- [ ] IP whitelisting for admin endpoints

---

## CONCLUSION

This implementation provides a **production-grade backend** with:

1. **Secure Session Management** - Dual-token system with device fingerprinting
2. **Comprehensive Error Handling** - Structured, logged, and safe
3. **Multi-Layer Security** - Headers, validation, rate limiting, injection prevention
4. **Clean Code (DRY)** - Centralized configuration and reusable utilities
5. **Audit Trail** - Request IDs and detailed logging for troubleshooting

The code is ready for a professional production environment with proper environment configuration.


