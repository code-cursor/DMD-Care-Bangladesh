from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(191), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(40), default="editor", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Registration(TimestampMixin, Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(180), index=True, nullable=False)
    guardian_phone: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    guardian_email: Mapped[str | None] = mapped_column(String(191), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(30), default="public", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    sms_logs = relationship("SmsLog", back_populates="registration", cascade="all, delete-orphan")


class ContentItem(TimestampMixin, Base):
    __tablename__ = "content_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    extra: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_by = relationship("User")

class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    visitor_key: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True, nullable=False)


class SmsLog(Base):
    __tablename__ = "sms_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    registration_id: Mapped[int | None] = mapped_column(ForeignKey("registrations.id"), nullable=True)
    recipient_type: Mapped[str] = mapped_column(String(40), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(String(80), default="configured-http", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True, nullable=False)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    registration = relationship("Registration", back_populates="sms_logs")

