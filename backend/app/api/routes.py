from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import compare_digest, new
from json import dumps, loads
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class AdmissionInquiry(BaseModel):
    student_name: str
    class_applied: str
    parent_name: str
    phone: str
    address: str = ""


SCHOOL_PROFILE = {
    "name": "British Academy",
    "location": "Rafiganj, Aurangabad, Bihar",
    "address": "Raja Bagicha, Rafiganj, Aurangabad, Bihar",
    "udise_code": "10340625304",
    "academic_year": "2026-27",
    "status": "Operational",
    "director": "Dr. A.R Khan",
    "established": "Since 1997",
    "phones": ["7667769016", "9122967446"],
}

USERS = {
    "BA2026001": {
        "password": "student123",
        "role": "student",
        "name": "Aman Kumar",
        "class": "8",
        "section": "A",
        "admission_number": "BA2026001",
    },
    "TCH001": {
        "password": "teacher123",
        "role": "teacher",
        "name": "Uday Kumar",
        "employee_id": "TCH001",
        "subjects": ["Mathematics", "Science"],
    },
    "admin": {
        "password": "admin123",
        "role": "admin",
        "name": "British Academy Admin",
        "employee_id": "ADM001",
    },
}

NOTICES = [
    {"date": "30 Jun 2026", "title": "Admissions Open", "body": "Admissions open for session 2026-27.", "status": "Pinned"},
    {"date": "28 Jun 2026", "title": "Transport Facility", "body": "Transport facilities available for nearby routes.", "status": "Active"},
    {"date": "25 Jun 2026", "title": "Class 10 Result", "body": "Outstanding Class 10 results celebrated by the school.", "status": "Active"},
]

GALLERY = [
    {"title": "Annual Function", "category": "events", "image": "/assets/annual-function-dance.png"},
    {"title": "Prize Distribution", "category": "awards", "image": "/assets/awards-trophies.png"},
    {"title": "Guest Felicitation", "category": "events", "image": "/assets/chief-guest-event.png"},
    {"title": "Project Work", "category": "learning", "image": "/assets/student-project.png"},
]

STUDENTS = [
    {"admission_number": "BA2026001", "name": "Aman Kumar", "class": "8", "section": "A", "father": "Ramesh Kumar", "phone": "9000000001", "fees_due": 2400},
    {"admission_number": "BA2026002", "name": "Rishu Kumari", "class": "10", "section": "A", "father": "Sanjay Kumar", "phone": "9000000002", "fees_due": 0},
    {"admission_number": "BA2026003", "name": "Sadiya Abid", "class": "6", "section": "B", "father": "Nadeem Alam", "phone": "9000000003", "fees_due": 1200},
]

ADMISSION_INQUIRIES: list[dict] = []


def _b64(data: bytes) -> str:
    return urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(data: str) -> bytes:
    return urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=8)).timestamp()),
    }
    encoded_payload = _b64(dumps(payload, separators=(",", ":")).encode())
    signature = _b64(new(settings.jwt_secret_key.encode(), encoded_payload.encode(), sha256).digest())
    return f"{encoded_payload}.{signature}"


def verify_token(token: str) -> dict:
    try:
        encoded_payload, signature = token.split(".", 1)
        expected = _b64(new(settings.jwt_secret_key.encode(), encoded_payload.encode(), sha256).digest())
        if not compare_digest(signature, expected):
            raise ValueError("Invalid token signature")
        payload = loads(_unb64(encoded_payload))
        if payload["exp"] < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    payload = verify_token(authorization.removeprefix("Bearer ").strip())
    user = USERS.get(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return {"username": payload["sub"], **user}


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/login")
def login(credentials: LoginRequest) -> dict:
    user = USERS.get(credentials.username)
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    public_user = {key: value for key, value in user.items() if key != "password"}
    return {
        "access_token": create_token(credentials.username, user["role"]),
        "token_type": "bearer",
        "user": {"username": credentials.username, **public_user},
    }


@router.get("/auth/me")
def me(user: dict = Depends(current_user)) -> dict:
    return {key: value for key, value in user.items() if key != "password"}


@router.get("/school-profile")
def school_profile() -> dict:
    return SCHOOL_PROFILE


@router.get("/notices")
def list_notices() -> list[dict[str, str]]:
    return NOTICES


@router.get("/gallery")
def list_gallery() -> list[dict[str, str]]:
    return GALLERY


@router.get("/admissions")
def admissions() -> dict:
    return {
        "session": "2026-27",
        "classes": "Pre-Nursery to Class 10",
        "status": "Open",
        "contacts": SCHOOL_PROFILE["phones"],
        "steps": [
            "Visit school office or call admission helpline.",
            "Collect admission form and document checklist.",
            "Student interaction and class-level confirmation.",
            "Fee submission and admission number generation.",
        ],
    }


@router.post("/admission-inquiries")
def create_admission_inquiry(inquiry: AdmissionInquiry) -> dict:
    reference_no = f"BA-ADM-{len(ADMISSION_INQUIRIES) + 1:04d}"
    record = {
        "reference_no": reference_no,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **inquiry.dict(),
        "status": "New",
    }
    ADMISSION_INQUIRIES.append(record)
    return {"message": "Admission inquiry submitted", "reference_no": reference_no, "record": record}


@router.get("/admission-inquiries")
def list_admission_inquiries(user: dict = Depends(current_user)) -> list[dict]:
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can view inquiries")
    return ADMISSION_INQUIRIES


@router.get("/erp/dashboard")
def dashboard(user: dict = Depends(current_user)) -> dict:
    role = user["role"]
    if role == "student":
        return {
            "summary": [
                {"label": "Attendance", "value": "92%"},
                {"label": "Fees Due", "value": "Rs 2,400"},
                {"label": "Assignments", "value": "3 Pending"},
                {"label": "Latest Result", "value": "A Grade"},
            ],
            "profile": user,
            "attendance": [
                {"month": "June", "present": 22, "absent": 2, "percentage": "91.6%"},
                {"month": "July", "present": 24, "absent": 1, "percentage": "96%"},
            ],
            "fees": [
                {"receipt": "BA-R-1001", "month": "June", "amount": 1800, "status": "Paid"},
                {"receipt": "BA-R-1002", "month": "July", "amount": 2400, "status": "Pending"},
            ],
            "results": [
                {"exam": "Unit Test 1", "marks": "421/500", "grade": "A"},
                {"exam": "Half Yearly", "marks": "438/500", "grade": "A"},
            ],
        }
    if role == "teacher":
        return {
            "summary": [
                {"label": "Assigned Classes", "value": "4"},
                {"label": "Subjects", "value": "2"},
                {"label": "Homework Posted", "value": "12"},
                {"label": "Marks Pending", "value": "1 Class"},
            ],
            "classes": [
                {"class": "8-A", "subject": "Mathematics", "students": 38},
                {"class": "10-A", "subject": "Science", "students": 31},
            ],
            "today": ["Mark attendance for Class 8-A", "Upload homework for Class 10-A", "Review unit test marks"],
        }
    return {
        "summary": [
            {"label": "Students", "value": str(len(STUDENTS))},
            {"label": "Teachers", "value": "18"},
            {"label": "Pending Fees", "value": "Rs 3,600"},
            {"label": "Active Notices", "value": str(len(NOTICES))},
        ],
        "students": STUDENTS,
        "modules": ["Admissions", "Students", "Teachers", "Fees", "Attendance", "Results", "Gallery", "Notices", "Downloads", "Reports"],
        "activity": ["Admission BA2026003 updated", "Notice pinned: Admissions Open", "Fee receipt BA-R-1002 pending"],
    }
