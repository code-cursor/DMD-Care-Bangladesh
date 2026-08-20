import json
import urllib.error
import urllib.request

from sqlalchemy.orm import Session

from .config import settings
from .models import Registration, SmsLog


def send_sms(
    db: Session,
    *,
    registration: Registration | None,
    recipient_type: str,
    recipient_phone: str,
    message: str,
) -> SmsLog:
    log = SmsLog(
        registration_id=registration.id if registration else None,
        recipient_type=recipient_type,
        recipient_phone=recipient_phone,
        message=message,
    )
    db.add(log)
    db.flush()

    if not settings.sms_api_url:
        log.status = "skipped"
        log.response = "SMS_API_URL is not configured"
        db.commit()
        db.refresh(log)
        return log

    payload = json.dumps(
        {
            "to": recipient_phone,
            "message": message,
            "sender_id": settings.sms_sender_id,
        }
    ).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if settings.sms_api_key:
        headers["Authorization"] = f"Bearer {settings.sms_api_key}"

    request = urllib.request.Request(
        settings.sms_api_url,
        data=payload,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            log.status = "sent" if response.status < 300 else "failed"
            log.response = response.read().decode("utf-8", errors="replace")[:2000]
    except (urllib.error.URLError, TimeoutError) as exc:
        log.status = "failed"
        log.response = str(exc)

    db.commit()
    db.refresh(log)
    return log


def update_sms_ip(ip_address: str) -> tuple[bool, str]:
    if not settings.sms_ip_update_url:
        return False, "SMS_IP_UPDATE_URL is not configured"

    payload = json.dumps({"ip": ip_address}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if settings.sms_api_key:
        headers["Authorization"] = f"Bearer {settings.sms_api_key}"

    request = urllib.request.Request(
        settings.sms_ip_update_url,
        data=payload,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read().decode("utf-8", errors="replace")[:2000]
            return response.status < 300, body
    except (urllib.error.URLError, TimeoutError) as exc:
        return False, str(exc)
