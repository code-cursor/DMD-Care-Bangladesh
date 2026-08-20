from typing import Literal

from pydantic import BaseModel, EmailStr, Field


Role = Literal["super_admin", "admin", "editor", "viewer"]
RegistrationStatus = Literal["pending", "accepted", "rejected"]
ContentType = Literal["health_team", "gallery", "patient_story"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Role = "editor"
    is_active: bool = True


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    role: Role | None = None
    is_active: bool | None = None


class RegistrationCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=180)
    guardian_phone: str = Field(min_length=8, max_length=40)
    guardian_email: EmailStr | None = None
    source: Literal["admin", "public"] = "admin"
    status: RegistrationStatus = "pending"
    notes: str | None = None
    payload: dict = Field(default_factory=dict)


class RegistrationUpdate(BaseModel):
    patient_name: str | None = Field(default=None, min_length=2, max_length=180)
    guardian_phone: str | None = Field(default=None, min_length=8, max_length=40)
    guardian_email: EmailStr | None = None
    status: RegistrationStatus | None = None
    notes: str | None = None
    payload: dict | None = None


class RegistrationDecision(BaseModel):
    status: Literal["accepted", "rejected"]
    notes: str | None = None


class ContentCreate(BaseModel):
    type: ContentType
    title: str = Field(min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    summary: str | None = None
    body: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    position: int = 0
    is_published: bool = True
    extra: dict = Field(default_factory=dict)


class ContentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    summary: str | None = None
    body: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    position: int | None = None
    is_published: bool | None = None
    extra: dict | None = None


class SmsSendRequest(BaseModel):
    recipient_type: Literal["admin", "guardian", "custom"] = "guardian"
    recipient_phone: str | None = None
    message: str = Field(min_length=5, max_length=320)


class SmsBulkSendRequest(BaseModel):
    recipient_type: Literal["guardian", "custom"]
    registration_id: int | None = Field(default=None, gt=0)
    recipient_phones: str | None = Field(default=None, max_length=10000)
    message: str = Field(min_length=1, max_length=320)


class SmsIpUpdateRequest(BaseModel):
    ip_address: str = Field(min_length=3, max_length=45)
