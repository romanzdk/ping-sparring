# Ping Sparring Marketplace

Systém pro párování stolně-tenisových tréninků - automatizovaná platforma pro domlouvání sparing tréninků mezi hráči a kluby.

## Funkce

- **Automatické párování** - ELO-based matching s regionálním filtrováním
- **Správa tréninků** - Pravidelné a jednorázové tréninky s kapacitou
- **Systém přihlášek** - Automatické nebo manuální schvalování
- **Čekací listina** - Automatické doplnění při uvolnění místa
- **Reputační systém** - Sledování spolehlivosti hráčů
- **Notifikace** - Email a in-app notifikace
- **Regionální filtrování** - Okresy a kraje ČR

## Technologie

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0 (async), PostgreSQL
- **Frontend**: React 18, TypeScript, Vite
- **Autentizace**: JWT tokens
- **Email**: Resend (SMTP fallback)

## Požadavky

- Docker a Docker Compose
- Python 3.11+ (pro lokální vývoj backendu)
- Node.js 20+ (pro lokální vývoj frontendu)
- Poetry (pro správu Python závislostí)

## Instalace

### 1. Klonování repozitáře

```bash
git clone <repository-url>
cd ping-sparring
```

### 2. Konfigurace

Zkopírujte `.env.example` na `.env` a upravte hodnoty:

```bash
cp .env.example .env
```

Upravte následující hodnoty v `.env`:
- `DATABASE_URL` - URL PostgreSQL databáze
- `SECRET_KEY` - Tajný klíč pro JWT (vygenerujte náhodný řetězec)
- `SMTP_*` - Nastavení email serveru (pro notifikace a verifikaci emailu)

**Důležité pro Docker**: Docker Compose automaticky načítá hodnoty z `.env` souboru. Pokud `.env` neexistuje nebo proměnné chybí, použijí se default hodnoty z `docker-compose.yml`.

### Nastavení emailů

Pro fungování emailů (notifikace, reset hesla, verifikace emailu) podporuje aplikace tyto providery:

**Resend (doporučeno):**
1. Vytvořte účet na https://resend.com
2. V `.env` nastavte:
   ```
   EMAIL_PROVIDER=resend
   EMAIL_FROM="Ping Sparring <noreply@pingsparring.cz>"
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

**SMTP (fallback):**
1. Pro Gmail: Vytvořte "App Password" v Google Account: https://myaccount.google.com/apppasswords
2. V `.env` nastavte:
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=vase-email@gmail.com
   SMTP_PASSWORD=app-password-z-google
   SMTP_FROM_EMAIL=noreply@pingsparring.cz
   ```
3. Port 587 používá STARTTLS (automaticky detekováno)
4. Port 465 používá přímé TLS spojení

**Development (console):**
- V development módu nastavte `EMAIL_PROVIDER=console`
- Emaily se pouze vypisují do konzole backend kontejneru

### 3. Spuštění s Docker Compose

```bash
docker-compose up -d
```

Tím se spustí:
- PostgreSQL databáze na portu 5432
- Backend API na portu 8000
- Frontend na portu 5173

### 4. Databázové migrace

Po prvním spuštění spusťte migrace:

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Seed data (okresy a kraje ČR)

```bash
docker-compose exec backend python -m app.core.seed
```

## Lokální vývoj

### Backend

```bash
cd backend

# Instalace závislostí
poetry install

# Aktivace virtual environment
poetry shell

# Spuštění migrací
alembic upgrade head

# Seed data
python -m app.core.seed

# Spuštění vývojového serveru
uvicorn app.main:app --reload
```

Backend běží na `http://localhost:8000`
API dokumentace: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev
```

Frontend běží na `http://localhost:5173`

## Struktura projektu

```
ping-sparring/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpointy
│   │   ├── core/             # Konfigurace, databáze, security
│   │   ├── models/           # SQLAlchemy modely
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logika
│   │   └── main.py           # FastAPI aplikace
│   ├── alembic/              # Databázové migrace
│   └── pyproject.toml        # Poetry konfigurace
├── frontend/
│   ├── src/
│   │   ├── components/       # React komponenty
│   │   ├── pages/            # Stránky
│   │   ├── services/         # API služby
│   │   ├── hooks/            # React hooks
│   │   └── types/            # TypeScript typy
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Autentizace
- `POST /api/v1/auth/register` - Registrace (odesílá verifikační email)
- `POST /api/v1/auth/login` - Přihlášení (vrací `email_verified` status)
- `POST /api/v1/auth/verify-email` - Ověření emailu pomocí tokenu
- `POST /api/v1/auth/resend-verification` - Znovu odeslat verifikační email
- `POST /api/v1/auth/forgot-password` - Požádat o reset hesla
- `POST /api/v1/auth/reset-password` - Nastavit nové heslo pomocí tokenu
- `GET /api/v1/auth/me` - Aktuální uživatel

### Tréninky
- `GET /api/v1/trainings` - Seznam tréninků (s filtry)
- `GET /api/v1/trainings/{id}` - Detail tréninku
- `POST /api/v1/trainings` - Vytvoření tréninku (organizátor)
- `PUT /api/v1/trainings/{id}` - Úprava tréninku
- `DELETE /api/v1/trainings/{id}` - Zrušení tréninku

### Přihlášky
- `POST /api/v1/registrations` - Přihlášení na trénink
- `DELETE /api/v1/registrations/{id}` - Zrušení přihlášky
- `POST /api/v1/registrations/{id}/approve` - Schválení (trenér)
- `POST /api/v1/registrations/{id}/reject` - Zamítnutí (trenér)
- `POST /api/v1/registrations/waitlist` - Přihlášení na čekací listinu

### Matching
- `GET /api/v1/matching/recommendations` - Doporučené tréninky pro hráče
- `GET /api/v1/matching/trainings/{id}/suitable-players` - Vhodní hráči pro trénink

### Notifikace
- `GET /api/v1/notifications` - Seznam notifikací
- `PUT /api/v1/notifications/{id}/read` - Označit jako přečtené

Kompletní API dokumentace: `http://localhost:8000/docs`

## Použití

### Registrace hráče

1. Přejděte na `/register`
2. Vyplňte email, heslo a vyberte roli "Hráč"
3. Po registraci obdržíte email s odkazem pro ověření
4. Klikněte na odkaz v emailu pro ověření vaší emailové adresy
5. Po ověření se můžete přihlásit na `/login`

**Poznámka**: Přihlášení je možné i bez ověření emailu, ale aplikace zobrazí varování a některé funkce mohou být omezené.

### Vytvoření tréninku (organizátor)

1. Přihlaste se jako organizátor
2. Přejděte na dashboard
3. Vytvořte nový trénink s parametry:
   - ELO rozsah
   - Den a čas
   - Místo a okres
   - Kapacita
   - Režim schvalování

### Přihlášení na trénink (hráč)

1. Prohlédněte si doporučené tréninky na dashboardu
2. Klikněte na trénink pro zobrazení detailu
3. Vyberte termín a přihlaste se
4. U manuálního schvalování čekejte na schválení trenérem

## Testování

### Backend

```bash
cd backend
poetry run pytest
```

### Frontend

```bash
cd frontend
npm run lint
```

## Produkční nasazení (Render.com)

Aplikace je nasazena na Render.com:

| Služba | URL |
|--------|-----|
| Frontend | https://muj-trenink.onrender.com |
| Backend API | https://muj-trenink-api.onrender.com |
| API Docs | https://muj-trenink-api.onrender.com/docs |

### Automatické nasazení

- Push do `main` větve automaticky spustí deploy obou služeb
- Render CLI lze použít pro manuální operace

### Render CLI

```bash
# Instalace
brew install render

# Přihlášení
render login

# Seznam služeb
render services list -o json

# Logy backendu
render logs --service <backend-service-id> -o text

# Manuální deploy
render deploys create --service <backend-service-id> -o json --confirm

# SSH do backendu
render ssh <backend-service-id>

# Databázová konzole
render psql <database-id>
```

### Environment Variables

Nastavují se přes Render Dashboard:
- Backend: https://dashboard.render.com/web/<backend-service-id>/env
- Frontend: https://dashboard.render.com/web/<frontend-service-id>/env

### Databázové migrace v produkci

```bash
# SSH do backendu
render ssh <backend-service-id>

# V kontejneru
cd /app && alembic upgrade head
```

### Lokální produkční build

Pro testování produkčního buildu lokálně:

```bash
# Nastavte proměnné prostředí
cp .env.example .env
# Upravte .env pro produkci

# Spusťte produkční compose
docker-compose -f docker-compose.prod.yml up -d

# Migrace
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Licence

MIT

## Kontakt

Pro dotazy a podporu kontaktujte vývojový tým.
