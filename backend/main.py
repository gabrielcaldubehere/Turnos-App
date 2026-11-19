from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    AdminLogin,
    Appointment,
    AppointmentCreate,
    AppointmentStatusUpdate,
    AuthResponse,
    ClientLogin,
    ServiceOption,
)
from services import (
    create_appointment,
    init_db,
    list_appointments,
    list_services,
    login_admin,
    login_client,
    update_appointment_status,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Turnos AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


@app.post("/api/auth/admin/login", response_model=AuthResponse)
def post_admin_login(payload: AdminLogin) -> AuthResponse:
    return login_admin(payload)


@app.post("/api/auth/client/login", response_model=AuthResponse)
def post_client_login(payload: ClientLogin) -> AuthResponse:
    return login_client(payload)


@app.get("/api/services", response_model=list[ServiceOption])
def get_services(db: Session = Depends(get_db)) -> list[ServiceOption]:
    return list_services(db)


@app.get("/api/appointments", response_model=list[Appointment])
def get_appointments(
    email: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Appointment]:
    return list_appointments(db, email)


@app.post(
    "/api/appointments",
    response_model=Appointment,
    status_code=status.HTTP_201_CREATED,
)
def post_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db)
) -> Appointment:
    return create_appointment(db, payload)


@app.patch("/api/appointments/{appointment_id}/status", response_model=Appointment)
def patch_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
) -> Appointment:
    return update_appointment_status(db, appointment_id, payload)
