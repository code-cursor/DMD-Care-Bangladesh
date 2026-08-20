import html
import ipaddress
import json
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .models import ContentItem, Registration, SmsLog, User, VisitorLog
from .schemas import (
    ContentCreate,
    ContentUpdate,
    LoginRequest,
    RegistrationCreate,
    RegistrationDecision,
    RegistrationUpdate,
    SmsBulkSendRequest,
    SmsIpUpdateRequest,
    SmsSendRequest,
    UserCreate,
    UserUpdate,
)
from .security import create_access_token, hash_password, require_any_admin, require_roles, verify_password
from .sms import send_sms, update_sms_ip


CONTENT_TYPES = {"health_team", "gallery", "patient_story"}
MUTATION_ROLES = ("super_admin", "admin", "editor")
USER_ADMIN_ROLES = ("super_admin", "admin")

app = FastAPI(title=settings.api_title)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"item-{int(datetime.utcnow().timestamp())}"


def valid_phone(value: str) -> bool:
    return bool(re.fullmatch(r"\+?[0-9]{8,15}", value.replace(" ", "")))


def user_to_dict(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


def registration_to_dict(registration: Registration) -> dict[str, Any]:
    return {
        "id": registration.id,
        "patient_name": registration.patient_name,
        "guardian_phone": registration.guardian_phone,
        "guardian_email": registration.guardian_email,
        "status": registration.status,
        "source": registration.source,
        "notes": registration.notes,
        "payload": registration.payload or {},
        "created_by_id": registration.created_by_id,
        "reviewed_by_id": registration.reviewed_by_id,
        "created_at": registration.created_at.isoformat(),
        "updated_at": registration.updated_at.isoformat(),
    }


def content_to_dict(item: ContentItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "type": item.type,
        "title": item.title,
        "slug": item.slug,
        "summary": item.summary,
        "body": item.body,
        "image_url": item.image_url,
        "position": item.position,
        "is_published": item.is_published,
        "extra": item.extra or {},
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


def sms_to_dict(log: SmsLog) -> dict[str, Any]:
    return {
        "id": log.id,
        "registration_id": log.registration_id,
        "recipient_type": log.recipient_type,
        "recipient_phone": log.recipient_phone,
        "message": log.message,
        "provider": log.provider,
        "status": log.status,
        "response": log.response,
        "created_at": log.created_at.isoformat(),
    }


def seed_default_content(db: Session, admin: User) -> None:
    if db.query(ContentItem).count():
        return

    seed_items = [
        {
            "type": "health_team",
            "title": "Dr. Husnea Ara Khan",
            "summary": "Paediatric Neurologist",
            "body": "MBBS, FCPS (Paediatrics), FCPS (Paediatric Neurology & Development)\nAssistant Professor, Department of Paediatric Neurology National Institute of Neurosciences & Hospital (NINS&H), Dhaka",
            "image_url": "assets/src/img/Dr. Husnea Ara Khan.webp",
            "position": 1,
        },
        {
            "type": "health_team",
            "title": "Dr. Jobaida Parvin",
            "summary": "Paediatric Neurologist",
            "body": "MBBS, FCPS (Child Neurology)\nAssistant Professor, Department of Paediatric Neurology National Institute of Neurosciences & Hospital (NINS&H), Dhaka",
            "image_url": "assets/src/img/Dr. Jobaida Parvin.webp",
            "position": 2,
        },
        {
            "type": "health_team",
            "title": "Dr. Shaoli Sarker",
            "summary": "Paediatric Neurologist",
            "body": "MBBS (SSMC), FCPS (Paediatrics)\nAssociate Professor, Department of Paediatric Neuroscience, Bangladesh Shishu (Children) Hospital & Institute, Dhaka",
            "image_url": "assets/src/img/Dr. Shaoli Sarker.webp",
            "position": 3,
        },
        {
            "type": "gallery",
            "title": "DMD clinic opening",
            "summary": "Neuro muscular clinic opening",
            "image_url": "assets/src/img/photo_1.webp",
            "position": 1,
        },
        {
            "type": "gallery",
            "title": "Patients with doctors",
            "summary": "DMD patients and doctors together",
            "image_url": "assets/src/img/photo_2.webp",
            "position": 2,
        },
        {
            "type": "patient_story",
            "title": "Muntasir Billah",
            "summary": "Wheelchair user",
            "body": "Muntasir Billah is living with Duchenne Muscular Dystrophy and continues treatment, care, and family-supported rehabilitation.",
            "image_url": "assets/src/img/p_muntasir_billah.jpg",
            "position": 1,
            "extra": {"diagnosis_year": "2022", "age": "Diagnosed at 12 years", "link": "muntasir_billah_story.html", "author": "Muntasir Billah", "home_text": "Muntasir Billah is living with Duchenne Muscular Dystrophy and continues treatment, care, and family-supported rehabilitation.", "home_link_text": "Click for more stories about me", "status": "Wheelchair user", "detail_title": "Muntasir Billah", "detail_body": "Muntasir Billah is living with Duchenne Muscular Dystrophy and continues treatment, care, and family-supported rehabilitation.", "detail_video_url": "https://www.youtube.com/embed/Fw0CBMw0ios?si=eD_WTwZmkJFW2A7k", "phone": "+8801914191919", "whatsapp": "https://wa.me/8801914191919", "facebook": "https://facebook.com/YourPageName"},
        },
    ]

    for item in seed_items:
        db.add(
            ContentItem(
                type=item["type"],
                title=item["title"],
                slug=slugify(item["title"]),
                summary=item.get("summary"),
                body=item.get("body"),
                image_url=item.get("image_url"),
                position=item.get("position", 0),
                extra=item.get("extra", {}),
                created_by_id=admin.id,
            )
        )
    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.admin_bootstrap_email).first()
        if not admin:
            admin = User(
                name=settings.admin_bootstrap_name,
                email=settings.admin_bootstrap_email,
                password_hash=hash_password(settings.admin_bootstrap_password),
                role="super_admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        seed_default_content(db, admin)
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/visits", status_code=status.HTTP_201_CREATED)
async def track_visit(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        payload = await request.json()
    except json.JSONDecodeError:
        payload = {}

    visitor_key = str(payload.get("visitor_key") or "").strip()[:80]
    if not visitor_key:
        raise HTTPException(status_code=422, detail="Visitor key is required")

    path = str(payload.get("path") or "").strip()[:500] or None
    forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip_address = forwarded_for or (request.client.host if request.client else None)
    user_agent = request.headers.get("user-agent", "")[:500] or None

    db.add(VisitorLog(visitor_key=visitor_key, path=path, user_agent=user_agent, ip_address=ip_address))
    db.commit()
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


@app.get("/api/admin/me")
def me(current_user: User = Depends(require_any_admin)) -> dict[str, Any]:
    return user_to_dict(current_user)


async def save_upload_file(file_obj: Any) -> dict[str, str]:
    safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", Path(file_obj.filename).name)
    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{safe_name}"
    target = settings.upload_dir / filename
    content = await file_obj.read()
    target.write_bytes(content)
    return {
        "filename": file_obj.filename,
        "url": f"/uploads/{filename}",
        "content_type": getattr(file_obj, "content_type", "") or "",
    }


def normalize_registration_value(value: Any) -> str:
    normalized = unicodedata.normalize("NFKC", str(value or "")).casefold()
    return " ".join(normalized.split())


def normalized_identifier(value: Any) -> str:
    return "".join(character for character in normalize_registration_value(value) if character.isalnum())


def same_registration_patient(new_data: dict[str, Any], existing: Registration) -> bool:
    new_payload = new_data["payload"]
    old_payload = existing.payload or {}
    identifier_pairs = [
        (normalized_identifier(new_payload.get(key)), normalized_identifier(old_payload.get(key)))
        for key in ("birth_certificate_no", "nid")
        if new_payload.get(key) and old_payload.get(key)
    ]
    if identifier_pairs:
        return any(new_value == old_value for new_value, old_value in identifier_pairs)

    if normalized_identifier(new_data["patient_name"]) != normalized_identifier(existing.patient_name):
        return False
    new_birth_date = normalize_registration_value(new_payload.get("date_of_birth"))
    old_birth_date = normalize_registration_value(old_payload.get("date_of_birth"))
    if new_birth_date and old_birth_date:
        return new_birth_date == old_birth_date
    return normalized_identifier(new_data["guardian_phone"]) == normalized_identifier(existing.guardian_phone)


def registration_health_issues(payload: dict[str, Any]) -> set[str]:
    return {
        value
        for value in (
            normalized_identifier(payload.get("diagnosis_type")),
            normalized_identifier(payload.get("other_health_issues")),
        )
        if value
    }


def ensure_registration_is_not_duplicate(db: Session, parsed: dict[str, Any]) -> None:
    new_issues = registration_health_issues(parsed["payload"])
    if not new_issues:
        raise HTTPException(status_code=422, detail="Diagnosis type or health issue is required")

    registrations = db.query(Registration).filter(Registration.status.in_(("pending", "accepted"))).all()
    for existing in registrations:
        if same_registration_patient(parsed, existing) and new_issues.intersection(registration_health_issues(existing.payload or {})):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "duplicate_patient_health_issue",
                    "message": "This patient is already registered with this disease or health issue.",
                },
            )


async def parse_public_registration(request: Request) -> dict[str, Any]:
    content_type = request.headers.get("content-type", "")
    data: dict[str, Any] = {}
    uploads: dict[str, Any] = {}

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        for key, value in form.multi_items():
            if getattr(value, "filename", None):
                uploads[key] = value
            else:
                data[key] = str(value)
    else:
        try:
            data = await request.json()
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Invalid request body")

    raw_payload = data.get("payload", {})
    if isinstance(raw_payload, str):
        try:
            payload = json.loads(raw_payload) if raw_payload else {}
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Payload must be valid JSON")
    elif isinstance(raw_payload, dict):
        payload = raw_payload
    else:
        payload = {}

    payload.update({k: v for k, v in data.items() if k != "payload"})
    patient_name = data.get("patient_name") or payload.get("patient_full_name") or payload.get("full_name")
    guardian_phone = data.get("guardian_phone") or payload.get("contact_no") or payload.get("emergency_contact_no")
    guardian_email = data.get("guardian_email") or payload.get("email_address") or payload.get("email")

    if not patient_name:
        raise HTTPException(status_code=422, detail="Patient full name is required")
    if not guardian_phone or not valid_phone(str(guardian_phone)):
        raise HTTPException(status_code=422, detail="A valid guardian/contact phone is required")

    return {
        "patient_name": str(patient_name).strip(),
        "guardian_phone": str(guardian_phone).strip(),
        "guardian_email": str(guardian_email).strip() if guardian_email else None,
        "payload": payload,
        "uploads": uploads,
    }


def send_registration_notifications(db: Session, registration: Registration) -> None:
    admin_message = f"New DMD registration #{registration.id}: {registration.patient_name}, {registration.guardian_phone}"
    guardian_message = f"DMD Care Bangladesh received registration #{registration.id}. Status: {registration.status}."

    if settings.sms_admin_phone:
        send_sms(
            db,
            registration=registration,
            recipient_type="admin",
            recipient_phone=settings.sms_admin_phone,
            message=admin_message,
        )
    send_sms(
        db,
        registration=registration,
        recipient_type="guardian",
        recipient_phone=registration.guardian_phone,
        message=guardian_message,
    )


@app.post("/api/registrations", status_code=status.HTTP_201_CREATED)
async def create_public_registration(request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    parsed = await parse_public_registration(request)
    ensure_registration_is_not_duplicate(db, parsed)
    if parsed["uploads"]:
        parsed["payload"]["attachments"] = {
            key: await save_upload_file(upload)
            for key, upload in parsed["uploads"].items()
        }
    registration = Registration(
        patient_name=parsed["patient_name"],
        guardian_phone=parsed["guardian_phone"],
        guardian_email=parsed["guardian_email"],
        source="public",
        status="pending",
        payload=parsed["payload"],
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    send_registration_notifications(db, registration)
    return {
        "id": registration.id,
        "status": registration.status,
        "message": "Registration submitted successfully",
    }


@app.get("/api/admin/registrations")
def list_registrations(
    status_filter: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> list[dict[str, Any]]:
    query = db.query(Registration)
    if status_filter:
        query = query.filter(Registration.status == status_filter)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Registration.patient_name.ilike(like)) | (Registration.guardian_phone.ilike(like))
        )
    return [
        registration_to_dict(item)
        for item in query.order_by(Registration.created_at.desc()).limit(500).all()
    ]


@app.post("/api/admin/registrations", status_code=status.HTTP_201_CREATED)
def create_admin_registration(
    payload: RegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    if not valid_phone(payload.guardian_phone):
        raise HTTPException(status_code=422, detail="A valid guardian/contact phone is required")

    registration = Registration(
        patient_name=payload.patient_name,
        guardian_phone=payload.guardian_phone,
        guardian_email=str(payload.guardian_email) if payload.guardian_email else None,
        source="admin",
        status=payload.status,
        notes=payload.notes,
        payload=payload.payload,
        created_by_id=current_user.id,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    send_registration_notifications(db, registration)
    return registration_to_dict(registration)


@app.get("/api/admin/registrations/{registration_id}")
def get_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> dict[str, Any]:
    registration = db.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration_to_dict(registration)


@app.patch("/api/admin/registrations/{registration_id}")
def update_registration(
    registration_id: int,
    payload: RegistrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    registration = db.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    updates = payload.model_dump(exclude_unset=True)
    if "guardian_phone" in updates and updates["guardian_phone"] and not valid_phone(updates["guardian_phone"]):
        raise HTTPException(status_code=422, detail="A valid guardian/contact phone is required")
    for field, value in updates.items():
        if field == "guardian_email" and value is not None:
            value = str(value)
        setattr(registration, field, value)
    if "status" in updates and updates["status"] != "pending":
        registration.reviewed_by_id = current_user.id

    db.commit()
    db.refresh(registration)
    return registration_to_dict(registration)


@app.post("/api/admin/registrations/{registration_id}/decision")
def decide_registration(
    registration_id: int,
    payload: RegistrationDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    registration = db.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    registration.status = payload.status
    registration.notes = payload.notes if payload.notes is not None else registration.notes
    registration.reviewed_by_id = current_user.id
    db.commit()
    db.refresh(registration)
    return registration_to_dict(registration)


@app.delete("/api/admin/registrations/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
) -> Response:
    registration = db.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    db.delete(registration)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/content/{content_type}")
def public_content(content_type: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    if content_type not in CONTENT_TYPES:
        raise HTTPException(status_code=404, detail="Unknown content type")
    items = (
        db.query(ContentItem)
        .filter(ContentItem.type == content_type, ContentItem.is_published.is_(True))
        .order_by(ContentItem.position.asc(), ContentItem.created_at.desc())
        .all()
    )
    return [content_to_dict(item) for item in items]


@app.get("/api/admin/content")
def list_content(
    type_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> list[dict[str, Any]]:
    query = db.query(ContentItem)
    if type_filter:
        if type_filter not in CONTENT_TYPES:
            raise HTTPException(status_code=404, detail="Unknown content type")
        query = query.filter(ContentItem.type == type_filter)
    items = query.order_by(ContentItem.type.asc(), ContentItem.position.asc()).all()
    return [content_to_dict(item) for item in items]


@app.post("/api/admin/uploads", status_code=status.HTTP_201_CREATED)
async def upload_admin_file(
    request: Request,
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, str]:
    form = await request.form()
    upload = form.get("file")
    if not upload or not getattr(upload, "filename", None):
        raise HTTPException(status_code=422, detail="Image file is required")

    content_type = getattr(upload, "content_type", "") or ""
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=422, detail="Please upload a JPG, PNG, or WEBP image")

    content = await upload.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 2MB or smaller")
    await upload.seek(0)

    saved = await save_upload_file(upload)
    return {"url": saved["url"], "filename": saved["filename"], "content_type": saved["content_type"]}


@app.post("/api/admin/registration-attachments", status_code=status.HTTP_201_CREATED)
async def upload_registration_attachment(
    request: Request,
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, str]:
    form = await request.form()
    upload = form.get("file")
    attachment_type = str(form.get("attachment_type") or "")
    if attachment_type not in {"photo", "genetic_report"}:
        raise HTTPException(status_code=422, detail="Unknown attachment type")
    if not upload or not getattr(upload, "filename", None):
        raise HTTPException(status_code=422, detail="Attachment file is required")

    content_type = getattr(upload, "content_type", "") or ""
    image_types = {"image/jpeg", "image/png", "image/webp"}
    allowed_types = image_types if attachment_type == "photo" else image_types | {"application/pdf"}
    if content_type not in allowed_types:
        detail = "Please upload a JPG, PNG, or WEBP image" if attachment_type == "photo" else "Please upload a PDF, JPG, PNG, or WEBP report"
        raise HTTPException(status_code=422, detail=detail)

    content = await upload.read()
    max_size = 2 * 1024 * 1024 if content_type in image_types else 5 * 1024 * 1024
    if len(content) > max_size:
        size_label = "2MB" if content_type in image_types else "5MB"
        raise HTTPException(status_code=413, detail=f"Attachment must be {size_label} or smaller")
    await upload.seek(0)

    saved = await save_upload_file(upload)
    return {"url": saved["url"], "filename": saved["filename"], "content_type": saved["content_type"]}


@app.post("/api/admin/content", status_code=status.HTTP_201_CREATED)
def create_content(
    payload: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    last_position = (
        db.query(func.max(ContentItem.position))
        .filter(ContentItem.type == payload.type)
        .scalar()
        or 0
    )
    item = ContentItem(
        type=payload.type,
        title=payload.title,
        slug=payload.slug or slugify(payload.title),
        summary=payload.summary,
        body=payload.body,
        image_url=payload.image_url,
        position=last_position + 1,
        is_published=payload.is_published,
        extra=payload.extra,
        created_by_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return content_to_dict(item)


@app.patch("/api/admin/content/{content_id}")
def update_content(
    content_id: int,
    payload: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    item = db.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("slug") == "":
        updates["slug"] = slugify(updates.get("title") or item.title)
    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return content_to_dict(item)


@app.delete("/api/admin/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> Response:
    item = db.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/admin/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*USER_ADMIN_ROLES)),
) -> list[dict[str, Any]]:
    return [user_to_dict(user) for user in db.query(User).order_by(User.created_at.desc()).all()]


@app.post("/api/admin/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*USER_ADMIN_ROLES)),
) -> dict[str, Any]:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    user = User(
        name=payload.name,
        email=str(payload.email),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


@app.patch("/api/admin/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*USER_ADMIN_ROLES)),
) -> dict[str, Any]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        updates["email"] = str(updates["email"])
    if "password" in updates and updates["password"]:
        user.password_hash = hash_password(updates.pop("password"))
    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin")),
) -> Response:
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/admin/sms-logs")
def list_sms_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> list[dict[str, Any]]:
    logs = db.query(SmsLog).order_by(SmsLog.created_at.desc()).limit(500).all()
    return [sms_to_dict(log) for log in logs]


@app.post("/api/admin/sms/send")
def send_sms_from_admin(
    payload: SmsBulkSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    recipients: list[tuple[Registration | None, str]] = []

    if payload.recipient_type == "guardian":
        if not payload.registration_id:
            raise HTTPException(status_code=422, detail="Select a published patient")
        registration = db.get(Registration, payload.registration_id)
        if not registration or registration.status != "accepted":
            raise HTTPException(status_code=404, detail="Published patient not found")
        recipients.append((registration, registration.guardian_phone))
    else:
        phones = [phone.strip().replace(" ", "") for phone in (payload.recipient_phones or "").split(",")]
        phones = list(dict.fromkeys(phone for phone in phones if phone))
        if not phones:
            raise HTTPException(status_code=422, detail="Enter at least one phone number")
        if len(phones) > 200:
            raise HTTPException(status_code=422, detail="A maximum of 200 phone numbers is allowed")
        invalid = [phone for phone in phones if not valid_phone(phone)]
        if invalid:
            raise HTTPException(status_code=422, detail=f"Invalid phone number: {invalid[0]}")
        recipients.extend((None, phone) for phone in phones)

    logs = [
        send_sms(
            db,
            registration=registration,
            recipient_type=payload.recipient_type,
            recipient_phone=phone,
            message=payload.message,
        )
        for registration, phone in recipients
    ]
    counts = {status_name: sum(log.status == status_name for log in logs) for status_name in ("sent", "failed", "skipped")}
    return {"total": len(logs), **counts, "logs": [sms_to_dict(log) for log in logs]}


@app.post("/api/admin/sms/ip-update")
def update_sms_gateway_ip(
    payload: SmsIpUpdateRequest,
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    try:
        normalized_ip = str(ipaddress.ip_address(payload.ip_address.strip()))
    except ValueError:
        raise HTTPException(status_code=422, detail="Enter a valid IPv4 or IPv6 address")

    updated, provider_response = update_sms_ip(normalized_ip)
    if not updated:
        raise HTTPException(status_code=502, detail=f"IP update denied: {provider_response}")
    return {"status": "updated", "ip_address": normalized_ip, "response": provider_response}


@app.post("/api/admin/registrations/{registration_id}/send-sms")
def send_manual_sms(
    registration_id: int,
    payload: SmsSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*MUTATION_ROLES)),
) -> dict[str, Any]:
    registration = db.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    phone = payload.recipient_phone
    if payload.recipient_type == "guardian":
        phone = registration.guardian_phone
    elif payload.recipient_type == "admin":
        phone = settings.sms_admin_phone
    if not phone or not valid_phone(phone):
        raise HTTPException(status_code=422, detail="A valid recipient phone is required")
    log = send_sms(
        db,
        registration=registration,
        recipient_type=payload.recipient_type,
        recipient_phone=phone,
        message=payload.message,
    )
    return sms_to_dict(log)


def parse_report_date(value: str | None, end_of_day: bool = False) -> datetime | None:
    if not value:
        return None
    try:
        date_value = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=422, detail="Dates must use YYYY-MM-DD format")
    bangladesh_tz = timezone(timedelta(hours=6))
    time_value = datetime.max.time() if end_of_day else datetime.min.time()
    return datetime.combine(date_value, time_value, bangladesh_tz).astimezone(timezone.utc).replace(tzinfo=None)


def patient_report_query(
    db: Session,
    start_date: str | None = None,
    end_date: str | None = None,
    status_filter: str | None = None,
    q: str | None = None,
):
    query = db.query(Registration)
    start_at = parse_report_date(start_date)
    end_at = parse_report_date(end_date, end_of_day=True)
    if start_at:
        query = query.filter(Registration.created_at >= start_at)
    if end_at:
        query = query.filter(Registration.created_at <= end_at)
    if status_filter:
        if status_filter not in {"pending", "accepted", "rejected"}:
            raise HTTPException(status_code=422, detail="Unknown status filter")
        query = query.filter(Registration.status == status_filter)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Registration.patient_name.ilike(like))
            | (Registration.guardian_phone.ilike(like))
            | (Registration.guardian_email.ilike(like))
        )
    return query


def flatten_patient_details(value: Any, prefix: str = "") -> list[tuple[str, str]]:
    details: list[tuple[str, str]] = []
    if isinstance(value, dict):
        for key, child_value in value.items():
            label = f"{prefix} / {humanize_payload_key(key)}" if prefix else humanize_payload_key(key)
            details.extend(flatten_patient_details(child_value, label))
    elif isinstance(value, list):
        details.append((prefix, ", ".join(str(item) for item in value)))
    else:
        details.append((prefix, "" if value is None else str(value)))
    return details


def humanize_payload_key(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value).replace("_", " ").strip()).title()


def excel_xml_text(value: Any) -> str:
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", str(value))
    return html.escape(cleaned)


@app.get("/api/admin/registrations/{registration_id}/export")
def export_single_patient(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> Response:
    patient = db.get(Registration, registration_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Registration not found")

    overview = [
        ("Registration ID", patient.id),
        ("Patient Name", patient.patient_name),
        ("Guardian Phone", patient.guardian_phone),
        ("Guardian Email", patient.guardian_email or ""),
        ("Status", patient.status),
        ("Source", patient.source),
        ("Notes", patient.notes or ""),
        ("Created By User ID", patient.created_by_id or ""),
        ("Reviewed By User ID", patient.reviewed_by_id or ""),
        ("Created At", patient.created_at.isoformat(sep=" ", timespec="seconds")),
        ("Updated At", patient.updated_at.isoformat(sep=" ", timespec="seconds")),
    ]
    submitted_details = flatten_patient_details(patient.payload or {})

    def detail_row(label: Any, value: Any) -> str:
        return (
            '<Row>'
            f'<Cell ss:StyleID="Label"><Data ss:Type="String">{excel_xml_text(label)}</Data></Cell>'
            f'<Cell ss:StyleID="Value"><Data ss:Type="String">{excel_xml_text(value)}</Data></Cell>'
            '</Row>'
        )

    rows = [
        f'<Row ss:Height="30"><Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">Patient Details — {excel_xml_text(patient.patient_name)}</Data></Cell></Row>',
        '<Row><Cell ss:MergeAcross="1" ss:StyleID="Section"><Data ss:Type="String">Registration Overview</Data></Cell></Row>',
        *[detail_row(label, value) for label, value in overview],
        '<Row><Cell ss:MergeAcross="1" ss:StyleID="Section"><Data ss:Type="String">Submitted Form Details</Data></Cell></Row>',
        *[detail_row(label, value) for label, value in submitted_details],
    ]
    workbook = f'''<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="Title"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#087F5B" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Section"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#344054" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Label"><Font ss:FontName="Calibri" ss:Bold="1"/><Interior ss:Color="#E8F5E9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D5DD"/></Borders></Style>
  <Style ss:ID="Value"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAECF0"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Patient Details">
  <Table>
   <Column ss:Width="180"/>
   <Column ss:Width="420"/>
   {"".join(rows)}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>
 </Worksheet>
</Workbook>'''
    filename = f"patient_{patient.id}_details_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xls"
    return Response(
        content=workbook,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/admin/reports/patients")
def patient_report(
    start_date: str | None = None,
    end_date: str | None = None,
    status_filter: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> dict[str, Any]:
    query = patient_report_query(db, start_date, end_date, status_filter, q)
    total = query.count()
    patients = query.order_by(Registration.created_at.desc()).limit(1000).all()
    return {"total": total, "patients": [registration_to_dict(item) for item in patients]}


@app.get("/api/admin/reports/patients/export")
def export_patient_report(
    start_date: str | None = None,
    end_date: str | None = None,
    status_filter: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> Response:
    patients = patient_report_query(db, start_date, end_date, status_filter, q).order_by(Registration.created_at.desc()).all()
    headers = ["ID", "Patient Name", "Guardian Phone", "Guardian Email", "Status", "Source", "Notes", "Created At", "Updated At"]
    rows = []
    for item in patients:
        rows.append([
            item.id,
            item.patient_name,
            item.guardian_phone,
            item.guardian_email or "",
            item.status,
            item.source,
            item.notes or "",
            item.created_at.isoformat(sep=" ", timespec="seconds"),
            item.updated_at.isoformat(sep=" ", timespec="seconds"),
        ])

    def cell(value: Any) -> str:
        return f"<Cell><Data ss:Type=\"String\">{html.escape(str(value))}</Data></Cell>"

    worksheet_rows = ["<Row>" + "".join(cell(value) for value in headers) + "</Row>"]
    worksheet_rows.extend("<Row>" + "".join(cell(value) for value in row) + "</Row>" for row in rows)
    body = "".join(worksheet_rows)
    workbook = f'''<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Patients"><Table>{body}</Table></Worksheet>
</Workbook>'''
    filename = f"patients_report_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xls"
    return Response(
        content=workbook,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@app.get("/api/admin/reports/summary")
def report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_admin),
) -> dict[str, Any]:
    status_counts = dict(db.query(Registration.status, func.count(Registration.id)).group_by(Registration.status).all())
    source_counts = dict(db.query(Registration.source, func.count(Registration.id)).group_by(Registration.source).all())
    content_counts = dict(db.query(ContentItem.type, func.count(ContentItem.id)).group_by(ContentItem.type).all())
    sms_counts = dict(db.query(SmsLog.status, func.count(SmsLog.id)).group_by(SmsLog.status).all())
    bangladesh_tz = timezone(timedelta(hours=6))
    today = datetime.now(bangladesh_tz).date()
    today_start = datetime.combine(today, datetime.min.time(), bangladesh_tz).astimezone(timezone.utc).replace(tzinfo=None)
    tomorrow_start = today_start + timedelta(days=1)
    todays_registrations = (
        db.query(func.count(Registration.id))
        .filter(Registration.created_at >= today_start, Registration.created_at < tomorrow_start)
        .scalar()
        or 0
    )
    total_visitors = db.query(func.count(func.distinct(VisitorLog.visitor_key))).scalar() or 0
    todays_visitors = (
        db.query(func.count(func.distinct(VisitorLog.visitor_key)))
        .filter(VisitorLog.created_at >= today_start, VisitorLog.created_at < tomorrow_start)
        .scalar()
        or 0
    )

    cutoff = datetime.utcnow() - timedelta(days=30)
    recent_rows = db.query(Registration.created_at).filter(Registration.created_at >= cutoff).all()
    daily: dict[str, int] = {}
    for row in recent_rows:
        key = row.created_at.date().isoformat()
        daily[key] = daily.get(key, 0) + 1

    return {
        "registrations": {
            "total": db.query(Registration).count(),
            "pending": status_counts.get("pending", 0),
            "today": todays_registrations,
            "accepted": status_counts.get("accepted", 0),
            "rejected": status_counts.get("rejected", 0),
            "by_source": source_counts,
            "last_30_days": [{"date": key, "count": daily[key]} for key in sorted(daily)],
        },
        "content": content_counts,
        "sms": sms_counts,
        "users": db.query(User).count(),
        "visitors": {"total": total_visitors, "today": todays_visitors},
    }




