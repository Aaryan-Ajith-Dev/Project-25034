# Git Ignore Guide - What's Excluded and Why

## 📋 Overview

This document explains what files are excluded from Git and why they shouldn't be committed to the repository.

---

## ✅ Files KEPT in Git (Should be committed)

### Documentation
- ✅ `README.md` - Main project documentation
- ✅ `README_PIPELINE.md` - CI/CD pipeline documentation
- ✅ `DOCUMENTATION_INDEX.md` - Documentation index
- ✅ `JENKINS_*.md` - All Jenkins setup guides
- ✅ `PIPELINE_*.md` - Pipeline architecture and summaries
- ✅ `tests/README.md` - Testing documentation
- ✅ `tests/QUICKSTART.md` - Quick start guide
- ✅ `tests/ELK_INTEGRATION_SUCCESS.md` - Success report

### Source Code
- ✅ All `.py` files (Python source)
- ✅ All `.js` / `.jsx` / `.ts` / `.tsx` files (JavaScript/TypeScript)
- ✅ All `.java` files (if any)

### Configuration Files
- ✅ `Jenkinsfile` - Jenkins pipeline definition
- ✅ `Dockerfile` - Docker image build instructions
- ✅ `docker-compose.yml` - Docker Compose configuration
- ✅ `.env.example` - Example environment variables (no secrets)
- ✅ `requirements.txt` - Python dependencies
- ✅ `package.json` - Node.js dependencies

### Kubernetes Manifests
- ✅ `k8s/*.yaml` - All Kubernetes manifest files
- ✅ `k8s/deployment.yaml`
- ✅ `k8s/service.yaml`
- ✅ `k8s/elasticsearch.yaml`
- ✅ `k8s/logstash.yaml`
- ✅ `k8s/kibana.yaml`
- ✅ `k8s/filebeat-configmap.yaml`
- ✅ `k8s/hpa.yaml`
- ✅ `k8s/ingress.yaml`
- ✅ `k8s/*.sh` - Deployment scripts

### Test Files
- ✅ `tests/*.py` - Test source code
- ✅ `tests/requirements.txt` - Test dependencies
- ✅ `tests/*.sh` - Test scripts

---

## ❌ Files EXCLUDED from Git (Automatically ignored)

### 1. 🔐 Secrets and Credentials
**Why**: Security - Never commit passwords, tokens, or API keys

- ❌ `.env` - Environment variables with secrets
- ❌ `**/.env` - Any .env files anywhere
- ❌ `*.pem`, `*.key`, `*.crt` - SSL certificates and private keys
- ❌ `server/datasetaker-ef809b99e512.json` - Service account keys
- ❌ `k8s/secrets.yaml` - Kubernetes secrets (if generated locally)

**Action**: Use `.env.example` as template, create `.env` locally

### 2. 📦 Dependencies and Packages
**Why**: Large, auto-generated, can be reinstalled

- ❌ `node_modules/` - Node.js packages (~100MB+)
- ❌ `venv/`, `.venv/` - Python virtual environments
- ❌ `__pycache__/` - Python bytecode cache
- ❌ `*.pyc`, `*.pyo` - Compiled Python files
- ❌ `dist/`, `build/` - Build artifacts

**Action**: Use `npm install` or `pip install -r requirements.txt`

### 3. 📝 Logs and Runtime Files
**Why**: Generated during runtime, not needed in Git

- ❌ `server/logs/*.log` - Application logs
- ❌ `tests/*.log` - Test output logs
- ❌ `*.log` - Any log files
- ❌ `*.pid` - Process ID files

**Action**: These are created when application runs

### 4. 💾 Local Data and Caches
**Why**: Large, local-only, regenerated automatically

- ❌ `elk/elasticsearch/data/` - Elasticsearch indexed data
- ❌ `elk/logstash/data/` - Logstash runtime data
- ❌ `elk/kibana/data/` - Kibana configuration
- ❌ `.cache/` - Various cache directories
- ❌ `.pytest_cache/` - Pytest cache
- ❌ `.mypy_cache/` - MyPy type checking cache

**Action**: Created automatically when ELK stack runs

### 5. 🧪 Test Results and Coverage
**Why**: Generated during testing, changes frequently

- ❌ `.coverage` - Coverage data
- ❌ `htmlcov/` - HTML coverage reports
- ❌ `.pytest_cache/` - Pytest cache
- ❌ `test_output.log` - Test logs

**Action**: Run tests to regenerate

### 6. 🖥️ IDE and Editor Files
**Why**: Personal preferences, not needed by others

- ❌ `.vscode/` - VS Code settings
- ❌ `.idea/` - IntelliJ IDEA settings
- ❌ `*.swp`, `*.swo` - Vim swap files
- ❌ `.DS_Store` - macOS folder settings
- ❌ `Thumbs.db` - Windows thumbnail cache

**Action**: Each developer has their own IDE settings

### 7. 🐳 Docker Overrides
**Why**: Local development customizations

- ❌ `docker-compose.override.yml` - Local Docker overrides

**Action**: Create locally for custom ports, volumes, etc.

### 8. 🗑️ Temporary and Backup Files
**Why**: Not needed, clutters repository

- ❌ `*.tmp`, `*.temp` - Temporary files
- ❌ `*.bak`, `*.backup` - Backup files
- ❌ `*~` - Editor backup files
- ❌ `*.orig` - Merge conflict originals

**Action**: These are automatically cleaned up

---

## 🔍 Verifying What's Ignored

### Check Git Status
```bash
# See what Git is tracking
git status

# See what would be added
git add --dry-run .
```

### List Ignored Files
```bash
# See all ignored files
git status --ignored

# Check if specific file is ignored
git check-ignore -v filename
```

### Test Before Commit
```bash
# Check what will be committed
git diff --cached

# Check file count
git ls-files | wc -l
```

---

## 📊 What Gets Committed (Summary)

| Category | Commit? | Examples |
|----------|---------|----------|
| **Source Code** | ✅ YES | `*.py`, `*.js`, `*.java` |
| **Documentation** | ✅ YES | `*.md` files |
| **Config Templates** | ✅ YES | `Jenkinsfile`, `Dockerfile`, `.env.example` |
| **K8s Manifests** | ✅ YES | `k8s/*.yaml` files |
| **Dependencies** | ❌ NO | `node_modules/`, `venv/` |
| **Logs** | ❌ NO | `*.log` files |
| **Secrets** | ❌ NO | `.env`, `*.key`, `secrets.yaml` |
| **IDE Settings** | ❌ NO | `.vscode/`, `.idea/` |
| **Build Artifacts** | ❌ NO | `dist/`, `build/`, `*.pyc` |
| **Test Results** | ❌ NO | `.coverage`, `htmlcov/` |
| **Local Data** | ❌ NO | `elk/*/data/` |

---

## ⚠️ Before Committing

### Checklist
- [ ] No `.env` files (only `.env.example`)
- [ ] No `secrets.yaml` or credentials
- [ ] No `node_modules/` or `venv/`
- [ ] No `*.log` files
- [ ] No large data files
- [ ] No IDE-specific settings
- [ ] Documentation is up to date
- [ ] All source code changes included

### Commands to Clean Before Push
```bash
# Remove untracked files (dry run first)
git clean -n

# Remove untracked files (careful!)
git clean -f

# Remove ignored files too (careful!)
git clean -fx

# Check what will be committed
git status
git diff --cached
```

---

## 🚨 Accidentally Committed Secrets?

If you accidentally committed secrets:

### 1. Remove from Git (File still exists locally)
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

### 2. Remove from Git History (More secure)
```bash
# Use BFG Repo-Cleaner or git-filter-branch
# See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
```

### 3. Rotate Secrets
- Change all passwords
- Regenerate API keys
- Update tokens
- Deploy new secrets to production

---

## 📝 Best Practices

### ✅ DO
- ✅ Commit source code and documentation
- ✅ Use `.env.example` for environment templates
- ✅ Keep `.gitignore` up to date
- ✅ Review files before committing (`git status`)
- ✅ Use meaningful commit messages
- ✅ Commit Kubernetes manifests (without secrets)
- ✅ Commit Jenkinsfile and Dockerfiles

### ❌ DON'T
- ❌ Commit `.env` files with secrets
- ❌ Commit `node_modules/` or `venv/`
- ❌ Commit log files or test outputs
- ❌ Commit IDE-specific settings
- ❌ Commit large data files or databases
- ❌ Commit generated files (bytecode, coverage)
- ❌ Commit Kubernetes secrets with actual values

---

## 🔧 Setup for New Developers

When a new developer clones the repo:

### 1. Install Dependencies
```bash
# Python
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Node.js (if applicable)
cd client
npm install
```

### 2. Setup Environment
```bash
# Copy example and fill in secrets
cp .env.example .env
nano .env  # Edit with actual values
```

### 3. Setup Kubernetes Secrets
```bash
# Create secrets from your values (not in Git)
kubectl create secret generic app-secrets \
  --from-literal=db-password=yourpassword \
  -n recsys
```

### 4. Run Application
```bash
# Everything else is in Git!
docker-compose up
# or
kubectl apply -f k8s/
```

---

## 📊 Repository Size

### Expected Sizes
- **Source Code**: ~10-50 MB
- **Documentation**: ~1-5 MB
- **Total Repo**: ~20-60 MB

### If Repo is Larger
- Check for accidentally committed:
  - `node_modules/` (~100-500 MB)
  - `venv/` (~50-200 MB)
  - Log files
  - Data files
  - Build artifacts

```bash
# Find large files
git ls-files | xargs du -h | sort -rh | head -20

# Check repo size
du -sh .git
```

---

## 🎓 Learn More

- **Git Ignore Patterns**: https://git-scm.com/docs/gitignore
- **GitHub Security**: https://docs.github.com/en/code-security
- **Removing Sensitive Data**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

**Last Updated**: December 11, 2025  
**Status**: Active and Maintained
