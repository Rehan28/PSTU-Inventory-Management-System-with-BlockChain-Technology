# Deployment on Shared cPanel (No Terminal Access)

Frontend Domain: `https://stock.pstu.ac.bd/`  
Backend Options:
- **Option 1 (Recommended for cPanel):** `https://api.stock.pstu.ac.bd/`
- **Option 2 (Subdirectory):** `https://stock.pstu.ac.bd/api/v1/`

---

## Which Backend URL Should You Choose?

### Option 1: `https://api.stock.pstu.ac.bd` (Strongly Recommended for Shared cPanel)
* **Zero Rewrite/Proxy Hassles**: On shared cPanel without SSH/terminal access, you create a subdomain `api.stock.pstu.ac.bd` in cPanel and assign it directly to the Node.js application in **"Setup Node.js App"**.
* **Direct Match**: Express routes are already mounted at `/api/...` (e.g. `https://api.stock.pstu.ac.bd/api/users`), and static uploads are at `https://api.stock.pstu.ac.bd/uploads/...`.
* **No Apache mod_proxy Dependency**: Avoids Apache `.htaccess` reverse proxy rules (`[P]` flag), which most shared hosting providers disable for security.

### Option 2: `https://stock.pstu.ac.bd/api/v1`
* **Same-Domain (No CORS preflights)**: All requests share `stock.pstu.ac.bd`.
* **Requirement**: Requires either:
  1. Setting the Node.js Application URL in cPanel to `stock.pstu.ac.bd/api/v1` (if your cPanel CloudLinux Node manager supports sub-URI routing), or
  2. Apache `.htaccess` reverse proxy enabled by the host to proxy requests from `/api/v1/(.*)` to the local Node.js port.
* Set `NEXT_PUBLIC_API_URL=https://stock.pstu.ac.bd/api/v1` in `frontend/.env.production` before building.

---

## 1. Environment Variables

### Frontend Variables (`frontend/.env.production` or `.env.local`)
Set before running the build:

```env
# If using Option 1 (Subdomain):
NEXT_PUBLIC_API_URL=https://api.stock.pstu.ac.bd

# If using Option 2 (Subdirectory):
# NEXT_PUBLIC_API_URL=https://stock.pstu.ac.bd/api/v1
```

### Backend Variables (Configured in cPanel GUI under "Setup Node.js App")
Set these in the cPanel GUI under **Setup Node.js App > Environment variables**:

```env
PORT=5000
CORS_ORIGIN=https://stock.pstu.ac.bd
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pstu_inventory?retryWrites=true&w=majority
JWT_SECRET=<your-secure-jwt-secret>
BLOCKCHAIN_SIGNING_KEY=<your-secure-blockchain-key>
EMAIL_USER=<your-email@pstu.ac.bd>
EMAIL_PASS=<your-email-app-password>
ALERT_EMAIL=admin@pstu.ac.bd
```

---

## 2. Deploying Backend via cPanel "Setup Node.js App" (GUI, No Terminal)

1. **Create the Backend Subdomain (for Option 1)**:
   - In cPanel, navigate to **Domains** > **Create A New Domain**.
   - Enter `api.stock.pstu.ac.bd`.
   - Set Document Root to `api.stock.pstu.ac.bd` (outside `public_html`).

2. **Configure Node.js Application**:
   - In cPanel, open **Setup Node.js App** > click **Create Application**.
   - **Node.js version**: Choose `20.x` (or nearest available).
   - **Application mode**: `Production`.
   - **Application root**: `backend` (or your chosen directory).
   - **Application URL**: `api.stock.pstu.ac.bd` (or `stock.pstu.ac.bd/api/v1` for Option 2).
   - **Application startup file**: `server.js`.
   - Click **Create**.

3. **Upload Backend Files**:
   - Open cPanel **File Manager**.
   - Navigate to the application root directory created above.
   - Upload backend files:
     - `config/`
     - `middleware/`
     - `routes/`
     - `block_page.js`
     - `models.js`
     - `package.json`
     - `package-lock.json`
     - `server.js`
     - *(Do NOT upload `node_modules` or `.git`)*.

4. **Install Dependencies & Set Variables**:
   - In **Setup Node.js App**, open your application.
   - Click the **Run NPM Install** button directly in the cPanel GUI.
   - Scroll down to **Environment variables** and click **Add Variable** for each backend variable (`MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, etc.).
   - Click **Save** and then click **Restart**.

5. **Verify Backend**:
   - Visit `https://api.stock.pstu.ac.bd/api/health` in your browser.
   - Expected response: `{"status":"ok","db":"connected"}`.

---

## 3. Building and Uploading Frontend

Because the frontend is a static export, build it on your machine or inside the provided **DevContainer** (Node 20.20.2):

### Step A: Build
```bash
cd frontend
# Set your chosen backend URL
export NEXT_PUBLIC_API_URL="https://api.stock.pstu.ac.bd"
npm ci --legacy-peer-deps
npm run build
```
*(On Windows PowerShell: `$env:NEXT_PUBLIC_API_URL="https://api.stock.pstu.ac.bd"; npm.cmd run build`)*

This generates the `frontend/out/` directory containing all pre-rendered HTML, JS, and CSS files.

### Step B: Upload to cPanel
1. Compress the contents of `frontend/out/` into a ZIP archive.
2. In cPanel > **File Manager**, open the document root for `stock.pstu.ac.bd` (usually `public_html`).
3. Back up and clear existing files in that folder.
4. Upload the zip file and click **Extract**.
5. Verify that `index.html`, `.htaccess`, `_next/`, `login/`, `admin/`, etc., reside directly at the root.
6. Delete the uploaded zip file.

---

## 4. Verification & Troubleshooting

- **Check Frontend**: Open `https://stock.pstu.ac.bd/` and `https://stock.pstu.ac.bd/login/`.
- **Direct Route Refresh**: Refresh on `/login/`. If you get a 404, verify that `.htaccess` exists in the document root (toggle "Show Hidden Files" in cPanel File Manager).
- **CORS Issues**: If login or API requests fail in browser DevTools Network tab:
  - Verify `CORS_ORIGIN=https://stock.pstu.ac.bd` in backend environment variables.
  - Verify `https://api.stock.pstu.ac.bd/api/health` responds with HTTP 200.
- **SSL**: Ensure SSL certificates are active for both `stock.pstu.ac.bd` and `api.stock.pstu.ac.bd` in cPanel **SSL/TLS Status** (run AutoSSL if needed).
