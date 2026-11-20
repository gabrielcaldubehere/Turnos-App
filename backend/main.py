from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    AdminLogin,
    Appointment,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentStatusUpdate,
    AuthResponse,
    ClientLogin,
    ClientRead,
    ClientRegister,
    ClientUpdate,
    LoginRequest,
    ProfessionalInput,
    ProfessionalOption,
    ServiceInput,
    ServiceOption,
)
from security import client_username_from_request, normalize_username
from services import (
    authenticate,
    create_appointment,
    create_professional,
    create_service,
    init_db,
    list_appointments,
    list_client_appointments,
    list_professionals,
    list_services,
    list_clients,
    login_admin,
    login_client,
    register_client,
    reschedule_appointment,
    update_appointment_status,
    update_client,
    update_professional,
    update_service,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Turnos App API", version="0.1.0", lifespan=lifespan)

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


@app.post("/api/auth/register", response_model=AuthResponse)
def post_register(
    payload: ClientRegister, db=Depends(get_db)
) -> AuthResponse:
    return register_client(db, payload)


@app.post("/api/auth/login", response_model=AuthResponse)
def post_login(payload: LoginRequest, db=Depends(get_db)) -> AuthResponse:
    return authenticate(db, payload)


@app.post("/api/auth/admin/login", response_model=AuthResponse)
def post_admin_login(payload: AdminLogin, db=Depends(get_db)) -> AuthResponse:
    return login_admin(db, payload)


@app.post("/api/auth/client/login", response_model=AuthResponse)
def post_client_login(payload: ClientLogin, db=Depends(get_db)) -> AuthResponse:
    return login_client(db, payload)


@app.get("/api/services", response_model=list[ServiceOption])
def get_services(db: Session = Depends(get_db)) -> list[ServiceOption]:
    return list_services(db)


@app.post(
    "/api/services", response_model=ServiceOption, status_code=status.HTTP_201_CREATED
)
def post_service(payload: ServiceInput, db: Session = Depends(get_db)) -> ServiceOption:
    return create_service(db, payload)


@app.patch("/api/services/{service_id}", response_model=ServiceOption)
def patch_service(
    service_id: str, payload: ServiceInput, db: Session = Depends(get_db)
) -> ServiceOption:
    return update_service(db, service_id, payload)


@app.get("/api/professionals", response_model=list[ProfessionalOption])
def get_professionals(db: Session = Depends(get_db)) -> list[ProfessionalOption]:
    return list_professionals(db)


@app.post(
    "/api/professionals",
    response_model=ProfessionalOption,
    status_code=status.HTTP_201_CREATED,
)
def post_professional(
    payload: ProfessionalInput, db: Session = Depends(get_db)
) -> ProfessionalOption:
    return create_professional(db, payload)


@app.patch("/api/professionals/{professional_id}", response_model=ProfessionalOption)
def patch_professional(
    professional_id: str,
    payload: ProfessionalInput,
    db: Session = Depends(get_db),
) -> ProfessionalOption:
    return update_professional(db, professional_id, payload)


@app.get("/api/admin/clients", response_model=list[ClientRead])
def get_clients(db: Session = Depends(get_db)) -> list[ClientRead]:
    return list_clients(db)


@app.patch("/api/admin/clients/{username}", response_model=ClientRead)
def patch_client(
    username: str, payload: ClientUpdate, db: Session = Depends(get_db)
) -> ClientRead:
    return update_client(db, username, payload)


@app.get("/api/appointments", response_model=list[Appointment])
def get_appointments(
    email: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Appointment]:
    return list_appointments(db, email)


@app.get(
    "/api/client/{username}/appointments",
    response_model=list[Appointment],
)
def get_client_appointments(
    username: str,
    request: Request,
    db=Depends(get_db),
) -> list[Appointment]:
    session_username = client_username_from_request(request, required=True)
    normalized_username = normalize_username(username)
    if normalized_username != session_username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo podés consultar tus propios turnos.",
        )
    return list_client_appointments(db, normalized_username)


@app.post(
    "/api/appointments",
    response_model=Appointment,
    status_code=status.HTTP_201_CREATED,
)
def post_appointment(
    payload: AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> Appointment:
    auth_username = client_username_from_request(request)
    return create_appointment(db, payload, auth_username)


@app.patch("/api/appointments/{appointment_id}/status", response_model=Appointment)
def patch_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
) -> Appointment:
    return update_appointment_status(db, appointment_id, payload)


@app.patch("/api/appointments/{appointment_id}", response_model=Appointment)
def patch_appointment(
    appointment_id: str,
    payload: AppointmentReschedule,
    db: Session = Depends(get_db),
) -> Appointment:
    return reschedule_appointment(db, appointment_id, payload)
