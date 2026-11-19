from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session, selectinload

from config import settings
from database import Base, SessionLocal, engine
from models import Appointment as AppointmentModel
from models import AppointmentService as AppointmentServiceModel
from models import Service as ServiceModel
from schemas import (
    AdminLogin,
    Appointment,
    AppointmentCreate,
    AppointmentServiceRead,
    AppointmentStatus,
    AppointmentStatusUpdate,
    AuthResponse,
    ClientLogin,
    ServiceOption,
)

SEED_SERVICES = (
    (
        "srv-limpieza-facial",
        "Limpieza facial",
        60,
        45000,
        "Limpieza profunda, exfoliación e hidratación para una piel radiante.",
        0,
    ),
    (
        "srv-corte-peinado",
        "Corte y peinado",
        45,
        38000,
        "Corte a medida con asesoría de estilo y peinado final.",
        1,
    ),
    (
        "srv-manicura",
        "Manicura",
        45,
        32000,
        "Cuidado de uñas, cutículas y esmaltado de larga duración.",
        2,
    ),
    (
        "srv-masaje-relajante",
        "Masaje relajante",
        90,
        62000,
        "Masaje corporal integral con aceites esenciales para liberar tensión.",
        3,
    ),
)


def _ensure_columns() -> None:
    inspector = inspect(engine)
    if "appointments" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("appointments")}
    with engine.begin() as connection:
        if "email" not in existing:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN email VARCHAR(120)"))
        if "age" not in existing:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN age INTEGER"))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_columns()

    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(ServiceModel))
        if count:
            return

        db.add_all(
            ServiceModel(
                id=service_id,
                name=name,
                duration_minutes=duration,
                price=price,
                description=description,
                position=position,
            )
            for service_id, name, duration, price, description, position in SEED_SERVICES
        )
        db.commit()


def _appointment_query():
    return select(AppointmentModel).options(
        selectinload(AppointmentModel.service_links).joinedload(
            AppointmentServiceModel.service
        )
    )


def _to_schema(appointment: AppointmentModel) -> Appointment:
    return Appointment(
        id=appointment.id,
        created_at=appointment.created_at,
        client_name=appointment.client_name,
        client_phone=appointment.client_phone,
        email=appointment.email,
        age=appointment.age,
        professional_name=appointment.professional_name,
        services=[
            AppointmentServiceRead(
                id=link.service.id,
                name=link.service.name,
                duration_minutes=link.unit_duration_minutes,
                price=link.unit_price,
            )
            for link in appointment.service_links
        ],
        date=appointment.date,
        time=appointment.time,
        status=AppointmentStatus(appointment.status),
        total_price=appointment.total_price,
        total_duration_minutes=appointment.total_duration_minutes,
        notes=appointment.notes,
    )


def list_services(db: Session) -> list[ServiceOption]:
    services = db.scalars(
        select(ServiceModel).order_by(ServiceModel.position, ServiceModel.id)
    ).all()
    return [ServiceOption.model_validate(service) for service in services]


def list_appointments(db: Session, email: str | None = None) -> list[Appointment]:
    query = _appointment_query()
    if email:
        query = query.where(func.lower(AppointmentModel.email) == email.lower())
    appointments = db.scalars(
        query.order_by(AppointmentModel.date, AppointmentModel.time)
    ).all()
    return [_to_schema(appointment) for appointment in appointments]


def _to_minutes(value: str) -> int:
    hour, minute = (int(part) for part in value.split(":"))
    return hour * 60 + minute


def _ensure_available(
    db: Session, payload: AppointmentCreate, total_duration: int
) -> None:
    start = _to_minutes(payload.time)
    end = start + total_duration

    active = db.scalars(
        select(AppointmentModel).where(
            AppointmentModel.date == payload.date,
            AppointmentModel.status != "cancelled",
        )
    ).all()

    for existing in active:
        existing_start = _to_minutes(existing.time)
        existing_end = existing_start + existing.total_duration_minutes
        if start < existing_end and end > existing_start:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"El horario {payload.time} se solapa con el turno activo "
                    f"de {existing.time} para la fecha {payload.date}."
                ),
            )


def create_appointment(db: Session, payload: AppointmentCreate) -> Appointment:
    service_ids = list(dict.fromkeys(payload.service_ids))
    found = {
        service.id: service
        for service in db.scalars(
            select(ServiceModel).where(ServiceModel.id.in_(service_ids))
        ).all()
    }

    missing = [service_id for service_id in service_ids if service_id not in found]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Servicios no encontrados: {', '.join(missing)}",
        )

    ordered = [found[service_id] for service_id in service_ids]
    total_price = sum(service.price for service in ordered)
    total_duration = sum(service.duration_minutes for service in ordered)

    if _to_minutes(payload.time) + total_duration > 20 * 60:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La duración de los servicios supera el cierre de 20:00.",
        )

    _ensure_available(db, payload, total_duration)

    appointment = AppointmentModel(
        id=f"apt-{uuid4().hex[:12]}",
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        email=payload.email,
        age=payload.age,
        professional_name=payload.professional_name,
        date=payload.date,
        time=payload.time,
        status=payload.status.value,
        notes=payload.notes,
        total_price=total_price,
        total_duration_minutes=total_duration,
        service_links=[
            AppointmentServiceModel(
                service_id=service.id,
                unit_price=service.price,
                unit_duration_minutes=service.duration_minutes,
                position=index,
            )
            for index, service in enumerate(ordered)
        ],
    )

    appointment_id = appointment.id
    db.add(appointment)
    db.commit()

    stored = db.scalar(
        _appointment_query().where(AppointmentModel.id == appointment_id)
    )
    return _to_schema(stored)


def update_appointment_status(
    db: Session, appointment_id: str, payload: AppointmentStatusUpdate
) -> Appointment:
    appointment = db.scalar(
        _appointment_query().where(AppointmentModel.id == appointment_id)
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el turno con id '{appointment_id}'",
        )

    appointment.status = payload.status.value
    db.commit()
    return _to_schema(appointment)


def login_admin(payload: AdminLogin) -> AuthResponse:
    if (
        payload.username != settings.admin_username
        or payload.password != settings.admin_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
        )
    return AuthResponse(role="admin", token=f"admin-{uuid4().hex}")


def login_client(payload: ClientLogin) -> AuthResponse:
    return AuthResponse(
        role="client", email=payload.email, token=f"client-{uuid4().hex}"
    )
