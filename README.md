# Turnos App

Aplicación web para reservar turnos online en un negocio de servicios de belleza y bienestar. Los clientes crean su usuario en el primer turno, gestionan sus reservas desde su panel y el administrador administra turnos, servicios y profesionales.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL/Supabase (SQLite también funciona para desarrollo local).
- **Autenticación:** contraseñas hasheadas con PBKDF2 y tokens firmados; sesiones separadas para clientes y administrador.

## Estructura

```
Turnos-App/
├── backend/                # API REST en FastAPI + SQLAlchemy
│   ├── config.py           # Configuración y normalización de DATABASE_URL
│   ├── database.py         # Conexión a Supabase (PostgreSQL) y sesiones DB
│   ├── models.py           # Modelos ORM (users, services, professionals, appointments, appointment_services)
│   ├── schemas.py          # Esquemas Pydantic con serialización camelCase
│   ├── security.py         # Hashing de contraseñas (PBKDF2) y tokens por rol
│   ├── services.py         # Reglas de negocio, cálculos, seed y validación anti-solape
│   ├── main.py             # Endpoints REST y ciclo de vida de la app
│   ├── .env.example        # Plantilla de variables de entorno
│   └── requirements.txt    # Dependencias Python
│
└── frontend/               # SPA en React + TypeScript + Tailwind v4
    └── src/
        ├── components/     # Logo SVG, rutas protegidas, modales y toggle Dark Mode
        ├── context/        # Estado global de autenticación y tema
        ├── pages/          # MainPage, ClientDashboard, AdminDashboard y vistas de gestión
        ├── services/       # Capa de comunicación HTTP tipada con FastAPI
        ├── types/          # Interfaces TypeScript
        └── utils/          # Generación de franjas horarias y disponibilidad
```

## Flujos principales

- **Reserva pública:** entrar en `/main`, elegir **Nuevo Turno** o **Ingresar**, seleccionar uno o más servicios, el profesional, la fecha/hora y completar los datos. En el modo _onboarding_ se crea el usuario y la contraseña.
- **Panel del cliente:** en `/client/:username` se listan los turnos propios con sus estados y se pueden reservar nuevos.
- **Panel de administrador:** en `/admin` se gestionan turnos (confirmar/cancelar/completar y reprogramar), clientes (edición inline), servicios y profesionales. Las altas y modificaciones de servicios y profesionales impactan en el formulario de reserva cuando este se recarga (o al volver a enfocar la pestaña).
- **Tema:** modo claro/oscuro con preferencia guardada en `localStorage`.

## Ejecución local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env: DATABASE_URL y SECRET_KEY (ADMIN_USERNAME/ADMIN_PASSWORD por defecto admin/admin)
uvicorn main:app --reload --port 8000
```

Para pruebas rápidas sin Supabase se puede usar `DATABASE_URL=sqlite:///./turnos.db` en `.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La API queda disponible en `http://localhost:8000/api` y la aplicación en `http://localhost:5173`.

## Endpoints destacados

- `POST /api/auth/register`, `POST /api/auth/client/login`, `POST /api/auth/admin/login`
- `GET /api/services`, `POST /api/services`, `PATCH /api/services/{id}`
- `GET /api/professionals`, `POST /api/professionals`, `PATCH /api/professionals/{id}`
- `GET /api/appointments`, `POST /api/appointments`, `PATCH /api/appointments/{id}/status`
- `GET /api/client/{username}/appointments`
- `GET /api/admin/clients`, `PATCH /api/admin/clients/{username}`
- `PATCH /api/appointments/{id}` para reprogramar fecha/horario y servicios

Los horarios disponibles se calculan en el frontend a partir de `GET /api/appointments`, respetando la duración total de los servicios seleccionados.

## Verificación

```bash
cd frontend && npm run lint && npm run build
cd ../backend && ./venv/bin/python -m compileall -q config.py database.py models.py schemas.py security.py services.py main.py
```
