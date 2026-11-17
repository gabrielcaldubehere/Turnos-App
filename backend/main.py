from datetime import date as Date, datetime, timedelta, timezone
from enum import Enum
from itertools import count

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ServiceOption(CamelModel):
    id: str
    name: str
    duration_minutes: int = Field(gt=0)
    price: int = Field(ge=0)
    description: str


class AppointmentCreate(CamelModel):
    client_name: str = Field(min_length=1, max_length=120)
    client_phone: str = Field(min_length=1, max_length=40)
    professional_name: str = Field(default="Por asignar", max_length=120)
    service_name: str = Field(min_length=1, max_length=120)
    date: Date
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    status: AppointmentStatus = AppointmentStatus.PENDING
    price: int = Field(ge=0)
    notes: str | None = Field(default=None, max_length=500)


class Appointment(AppointmentCreate):
    id: str
    created_at: datetime


class AppointmentStatusUpdate(CamelModel):
    status: AppointmentStatus


def date_from_today(offset_days: int) -> Date:
    return datetime.now().date() + timedelta(days=offset_days)


services: list[ServiceOption] = [
    ServiceOption(
        id="srv-limpieza-facial",
        name="Limpieza facial",
        duration_minutes=60,
        price=45000,
        description="Limpieza profunda, exfoliación e hidratación para una piel radiante.",
    ),
    ServiceOption(
        id="srv-corte-peinado",
        name="Corte y peinado",
        duration_minutes=45,
        price=38000,
        description="Corte a medida con asesoría de estilo y peinado final.",
    ),
    ServiceOption(
        id="srv-manicura",
        name="Manicura",
        duration_minutes=45,
        price=32000,
        description="Cuidado de uñas, cutículas y esmaltado de larga duración.",
    ),
    ServiceOption(
        id="srv-masaje-relajante",
        name="Masaje relajante",
        duration_minutes=90,
        price=62000,
        description="Masaje corporal integral con aceites esenciales para liberar tensión.",
    ),
]

appointments: list[Appointment] = [
    Appointment(
        id="apt-1001",
        created_at=datetime.now(timezone.utc),
        client_name="María González",
        client_phone="+54 9 11 5555-0101",
        professional_name="Ana Ruiz",
        service_name="Limpieza facial",
        date=date_from_today(0),
        time="09:00",
        status=AppointmentStatus.CONFIRMED,
        price=45000,
        notes="Prefiere atención en horario de mañana.",
    ),
    Appointment(
        id="apt-1002",
        created_at=datetime.now(timezone.utc),
        client_name="Carlos Rodríguez",
        client_phone="+54 9 11 5555-0102",
        professional_name="Lucía Torres",
        service_name="Corte y peinado",
        date=date_from_today(0),
        time="11:30",
        status=AppointmentStatus.PENDING,
        price=38000,
    ),
]

_id_counter = count(start=1009)

app = FastAPI(title="Turnos AI API", version="0.1.0")

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


@app.get("/api/services", response_model=list[ServiceOption])
def get_services() -> list[ServiceOption]:
    return services


@app.get("/api/appointments", response_model=list[Appointment])
def get_appointments() -> list[Appointment]:
    return appointments


@app.post(
    "/api/appointments",
    response_model=Appointment,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(payload: AppointmentCreate) -> Appointment:
    appointment = Appointment(
        id=f"apt-{next(_id_counter)}",
        created_at=datetime.now(timezone.utc),
        **payload.model_dump(),
    )
    appointments.append(appointment)
    return appointment


@app.patch("/api/appointments/{appointment_id}/status", response_model=Appointment)
def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
) -> Appointment:
    for index, appointment in enumerate(appointments):
        if appointment.id == appointment_id:
            updated = appointment.model_copy(update={"status": payload.status})
            appointments[index] = updated
            return updated

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No se encontró el turno con id '{appointment_id}'",
    )
