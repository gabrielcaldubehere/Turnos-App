import re
from datetime import date as Date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


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
    email: str = Field(
        min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )
    age: int = Field(ge=1, le=120)
    professional_name: str = Field(default="Por asignar", max_length=120)
    service_ids: list[str] = Field(min_length=1)
    date: Date
    time: str
    status: AppointmentStatus = AppointmentStatus.PENDING
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError("El horario debe tener formato HH:MM de 24 horas.")
        hour, minute = (int(part) for part in value.split(":"))
        if minute not in (0, 30):
            raise ValueError("Las franjas disponibles son de 30 minutos.")
        if not 8 * 60 <= hour * 60 + minute <= 20 * 60:
            raise ValueError("El horario debe estar entre 08:00 y 20:00.")
        return value


class AppointmentServiceRead(CamelModel):
    id: str
    name: str
    duration_minutes: int
    price: int


class Appointment(CamelModel):
    id: str
    created_at: datetime
    client_name: str
    client_phone: str
    email: str | None = None
    age: int | None = None
    professional_name: str
    services: list[AppointmentServiceRead]
    date: Date
    time: str
    status: AppointmentStatus
    total_price: int
    total_duration_minutes: int
    notes: str | None = None

    @computed_field(alias="price")
    @property
    def price(self) -> int:
        return self.total_price

    @computed_field(alias="serviceName")
    @property
    def service_name(self) -> str:
        return " + ".join(service.name for service in self.services)


class AppointmentStatusUpdate(CamelModel):
    status: AppointmentStatus


class AdminLogin(CamelModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=120)


class ClientLogin(CamelModel):
    email: str = Field(
        min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )


class AuthResponse(CamelModel):
    role: str
    token: str
    email: str | None = None
