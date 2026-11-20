from datetime import date as Date
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, inspect, select, text, update
from sqlalchemy.orm import Session, selectinload

from config import settings
from database import Base, SessionLocal, engine
from models import Appointment as AppointmentModel
from models import AppointmentService as AppointmentServiceModel
from models import Professional as ProfessionalModel
from models import Service as ServiceModel
from models import User as UserModel
from security import (
    create_token,
    hash_password,
    is_valid_username,
    normalize_username,
    verify_password,
)
from schemas import (
    AdminLogin,
    Appointment,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentServiceRead,
    AppointmentStatus,
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

SEED_PROFESSIONALS = (
    ("pro-maria", "María López", "Estética facial", 0),
    ("pro-juan", "Juan Pérez", "Corte y estilo", 1),
    ("pro-ana", "Ana Ruiz", "Manicura y bienestar", 2),
)


def _ensure_columns() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "users" in tables:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        with engine.begin() as connection:
            if "full_name" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN full_name VARCHAR(120)")
                )
            if "phone" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN phone VARCHAR(40)")
                )
            if "email" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN email VARCHAR(120)")
                )
            if "age" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))

    if "appointments" not in tables:
        return

    existing = {column["name"] for column in inspector.get_columns("appointments")}
    with engine.begin() as connection:
        if "email" not in existing:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN email VARCHAR(120)"))
        if "age" not in existing:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN age INTEGER"))
        if "username" not in existing:
            connection.execute(
                text("ALTER TABLE appointments ADD COLUMN username VARCHAR(64)")
            )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_appointments_username "
                "ON appointments (username)"
            )
        )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_columns()

    with SessionLocal() as db:
        service_count = db.scalar(select(func.count()).select_from(ServiceModel))
        if not service_count:
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

        professional_count = db.scalar(
            select(func.count()).select_from(ProfessionalModel)
        )
        if not professional_count:
            db.add_all(
                ProfessionalModel(
                    id=professional_id,
                    name=name,
                    specialty=specialty,
                    active=True,
                    position=position,
                )
                for professional_id, name, specialty, position in SEED_PROFESSIONALS
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
        username=appointment.username,
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


def _sync_client_profile(db: Session, username: str, payload: AppointmentCreate) -> None:
    user = db.get(UserModel, username)
    if user is None or user.role != "client":
        return
    user.full_name = payload.client_name
    user.phone = payload.client_phone
    user.email = payload.email
    user.age = payload.age


def list_services(db: Session) -> list[ServiceOption]:
    services = db.scalars(
        select(ServiceModel).order_by(ServiceModel.position, ServiceModel.id)
    ).all()
    return [ServiceOption.model_validate(service) for service in services]


def create_service(db: Session, payload: ServiceInput) -> ServiceOption:
    next_position = (
        db.scalar(select(func.coalesce(func.max(ServiceModel.position), -1) + 1)) or 0
    )
    service = ServiceModel(
        id=f"srv-{uuid4().hex[:12]}",
        name=payload.name.strip(),
        duration_minutes=payload.duration_minutes,
        price=payload.price,
        description=payload.description.strip(),
        position=next_position,
    )
    db.add(service)
    db.commit()
    return ServiceOption.model_validate(service)


def update_service(db: Session, service_id: str, payload: ServiceInput) -> ServiceOption:
    service = db.get(ServiceModel, service_id)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado."
        )
    service.name = payload.name.strip()
    service.duration_minutes = payload.duration_minutes
    service.price = payload.price
    service.description = payload.description.strip()
    db.commit()
    return ServiceOption.model_validate(service)


def list_professionals(db: Session) -> list[ProfessionalOption]:
    professionals = db.scalars(
        select(ProfessionalModel).order_by(
            ProfessionalModel.position, ProfessionalModel.id
        )
    ).all()
    return [ProfessionalOption.model_validate(item) for item in professionals]


def create_professional(db: Session, payload: ProfessionalInput) -> ProfessionalOption:
    next_position = (
        db.scalar(select(func.coalesce(func.max(ProfessionalModel.position), -1) + 1))
        or 0
    )
    professional = ProfessionalModel(
        id=f"pro-{uuid4().hex[:12]}",
        name=payload.name.strip(),
        specialty=payload.specialty.strip() if payload.specialty else None,
        active=payload.active,
        position=next_position,
    )
    db.add(professional)
    db.commit()
    return ProfessionalOption.model_validate(professional)


def update_professional(
    db: Session, professional_id: str, payload: ProfessionalInput
) -> ProfessionalOption:
    professional = db.get(ProfessionalModel, professional_id)
    if professional is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profesional no encontrado."
        )
    professional.name = payload.name.strip()
    professional.specialty = payload.specialty.strip() if payload.specialty else None
    professional.active = payload.active
    db.commit()
    return ProfessionalOption.model_validate(professional)


def list_appointments(db: Session, email: str | None = None) -> list[Appointment]:
    query = _appointment_query()
    if email:
        query = query.where(func.lower(AppointmentModel.email) == email.lower())
    appointments = db.scalars(
        query.order_by(AppointmentModel.date, AppointmentModel.time)
    ).all()
    return [_to_schema(appointment) for appointment in appointments]


def list_client_appointments(db: Session, username: str) -> list[Appointment]:
    appointments = db.scalars(
        _appointment_query()
        .where(AppointmentModel.username == username)
        .order_by(AppointmentModel.date, AppointmentModel.time)
    ).all()
    return [_to_schema(appointment) for appointment in appointments]


def _to_minutes(value: str) -> int:
    hour, minute = (int(part) for part in value.split(":"))
    return hour * 60 + minute


def _ensure_available(
    db: Session,
    appointment_date: Date,
    time: str,
    total_duration: int,
    exclude_appointment_id: str | None = None,
) -> None:
    start = _to_minutes(time)
    end = start + total_duration

    query = select(AppointmentModel).where(
        AppointmentModel.date == appointment_date,
        AppointmentModel.status != "cancelled",
    )
    if exclude_appointment_id is not None:
        query = query.where(AppointmentModel.id != exclude_appointment_id)

    for existing in db.scalars(query).all():
        existing_start = _to_minutes(existing.time)
        existing_end = existing_start + existing.total_duration_minutes
        if start < existing_end and end > existing_start:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"El horario {time} se solapa con el turno activo "
                    f"de {existing.time} para la fecha {appointment_date}."
                ),
            )


def create_appointment(
    db: Session,
    payload: AppointmentCreate,
    auth_username: str | None = None,
) -> Appointment:
    username = auth_username
    if payload.username:
        requested_username = normalize_username(payload.username)
        if not auth_username or requested_username != auth_username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No podés reservar turnos para otro usuario.",
            )

    if username:
        user_exists = db.scalar(
            select(UserModel.username).where(UserModel.username == username)
        )
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tu sesión no es válida. Ingresá nuevamente.",
            )

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

    professional_name = payload.professional_name.strip()
    if not professional_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Debe seleccionar un profesional.",
        )
    if professional_name != "Por asignar":
        professional_exists = db.scalar(
            select(ProfessionalModel.id).where(
                ProfessionalModel.name == professional_name,
                ProfessionalModel.active.is_(True),
            )
        )
        if not professional_exists:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="El profesional elegido no está disponible.",
            )

    ordered = [found[service_id] for service_id in service_ids]
    total_price = sum(service.price for service in ordered)
    total_duration = sum(service.duration_minutes for service in ordered)

    if _to_minutes(payload.time) + total_duration > 20 * 60:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La duración de los servicios supera el cierre de 20:00.",
        )

    _ensure_available(db, payload.date, payload.time, total_duration)

    appointment = AppointmentModel(
        id=f"apt-{uuid4().hex[:12]}",
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        email=payload.email,
        age=payload.age,
        username=username,
        professional_name=professional_name,
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
    if username:
        _sync_client_profile(db, username, payload)
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


def reschedule_appointment(
    db: Session, appointment_id: str, payload: AppointmentReschedule
) -> Appointment:
    appointment = db.scalar(
        _appointment_query().where(AppointmentModel.id == appointment_id)
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el turno con id '{appointment_id}'",
        )

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

    _ensure_available(
        db,
        payload.date,
        payload.time,
        total_duration,
        exclude_appointment_id=appointment_id,
    )

    appointment.date = payload.date
    appointment.time = payload.time
    appointment.total_price = total_price
    appointment.total_duration_minutes = total_duration

    existing_links = {link.service_id: link for link in appointment.service_links}
    for link in list(appointment.service_links):
        if link.service_id not in service_ids:
            appointment.service_links.remove(link)

    for index, service in enumerate(ordered):
        link = existing_links.get(service.id)
        if link is None:
            link = AppointmentServiceModel(service_id=service.id)
            appointment.service_links.append(link)
        link.unit_price = service.price
        link.unit_duration_minutes = service.duration_minutes
        link.position = index

    db.commit()
    stored = db.scalar(
        _appointment_query().where(AppointmentModel.id == appointment_id)
    )
    return _to_schema(stored)


def register_client(db: Session, payload: ClientRegister) -> AuthResponse:
    username = normalize_username(payload.username)
    if not is_valid_username(username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El usuario debe tener entre 3 y 64 letras, números, guiones o guiones bajos.",
        )
    if username == normalize_username(settings.admin_username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese nombre de usuario está reservado.",
        )
    if db.scalar(select(UserModel.username).where(UserModel.username == username)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese nombre de usuario ya está registrado.",
        )

    db.add(
        UserModel(
            username=username,
            password_hash=hash_password(payload.password),
            role="client",
        )
    )
    db.commit()
    return AuthResponse(
        role="client", username=username, token=create_token(username, "client")
    )


def _client_to_schema(db: Session, user: UserModel) -> ClientRead:
    count = db.scalar(
        select(func.count())
        .select_from(AppointmentModel)
        .where(AppointmentModel.username == user.username)
    )
    return ClientRead(
        username=user.username,
        name=user.full_name,
        phone=user.phone,
        email=user.email,
        age=user.age,
        appointments_count=count or 0,
    )


def list_clients(db: Session) -> list[ClientRead]:
    users = db.scalars(
        select(UserModel).where(UserModel.role == "client").order_by(UserModel.username)
    ).all()

    rows = db.execute(
        select(
            AppointmentModel.username,
            AppointmentModel.client_name,
            AppointmentModel.client_phone,
            AppointmentModel.email,
            AppointmentModel.age,
        ).order_by(AppointmentModel.date.desc(), AppointmentModel.time.desc())
    ).all()
    latest: dict[str, object] = {}
    for row in rows:
        if row.username and row.username not in latest:
            latest[row.username] = row

    backfilled = False
    for user in users:
        snapshot = latest.get(user.username)
        if snapshot is None or user.full_name:
            continue
        user.full_name = snapshot.client_name
        user.phone = snapshot.client_phone
        user.email = snapshot.email
        user.age = snapshot.age
        backfilled = True
    if backfilled:
        db.commit()

    return [_client_to_schema(db, user) for user in users]


def update_client(db: Session, username: str, payload: ClientUpdate) -> ClientRead:
    user = db.get(UserModel, username)
    if user is None or user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el cliente con usuario '{username}'",
        )

    changes = payload.model_dump(exclude_unset=True)
    next_username = changes.get("username")
    if next_username and next_username != username:
        next_username = normalize_username(next_username)
        if not is_valid_username(next_username):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="El usuario debe tener entre 3 y 64 letras, números, guiones o guiones bajos.",
            )
        if next_username == normalize_username(settings.admin_username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ese nombre de usuario está reservado.",
            )
        if db.scalar(
            select(UserModel.username).where(UserModel.username == next_username)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ese nombre de usuario ya está registrado.",
            )
        db.execute(
            update(AppointmentModel)
            .where(AppointmentModel.username == username)
            .values(username=next_username),
            synchronize_session=False,
        )
        user.username = next_username

    field_map = {
        "name": "full_name",
        "phone": "phone",
        "email": "email",
        "age": "age",
    }
    for field, column in field_map.items():
        if field in changes:
            setattr(user, column, changes[field])

    db.commit()
    stored = db.get(UserModel, user.username)
    return _client_to_schema(db, stored)


def authenticate(db: Session, payload: LoginRequest) -> AuthResponse:
    username = normalize_username(payload.username)

    if (
        username == normalize_username(settings.admin_username)
        and payload.password == settings.admin_password
    ):
        return AuthResponse(
            role="admin", username=username, token=create_token(username, "admin")
        )

    user = db.scalar(select(UserModel).where(UserModel.username == username))
    if (
        user is None
        or user.role != "client"
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
        )

    return AuthResponse(
        role="client", username=username, token=create_token(username, "client")
    )


def login_admin(db: Session, payload: AdminLogin) -> AuthResponse:
    response = authenticate(db, payload)
    if response.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las credenciales no corresponden a un administrador.",
        )
    return response


def login_client(db: Session, payload: ClientLogin) -> AuthResponse:
    response = authenticate(db, payload)
    if response.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las credenciales no corresponden a un cliente.",
        )
    return response
