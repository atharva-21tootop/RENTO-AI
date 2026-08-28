import io
import os
import sys
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.core.database import get_db, connect_db
from app.core.security import create_access_token
from app.core.rate_limiter import general_limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    connect_db()
    db = get_db()
    # in-memory sliding window is process-global; isolate per test
    general_limiter._requests.clear()
    db.patients.delete_many({})
    db.screenings.delete_many({})
    db.users.delete_many({})
    db.phcs.delete_many({})
    db.otps.delete_many({})
    db.counters.delete_many({})
    yield
    db.patients.delete_many({})
    db.screenings.delete_many({})
    db.users.delete_many({})
    db.phcs.delete_many({})
    db.otps.delete_many({})
    db.counters.delete_many({})


def _auth_headers(name="My PHC", code="PHC-A"):
    db = get_db()
    phc_id = db.phcs.insert_one({
        "name": name, "code": code, "state": "MH", "district": "Pune",
        "address": "Street 1", "contact_number": "9876543210",
        "healthcare_worker_name": "Worker",
    }).inserted_id
    user_id = db.users.insert_one({
        "name": "Test User", "email": "phc-test@example.com",
        "password_hash": "x", "provider": "credentials", "role": "phc_staff",
        "phc_id": phc_id, "is_verified": True,
    }).inserted_id
    token = create_access_token({
        "id": str(user_id), "email": "phc-test@example.com", "name": "Test User",
        "role": "phc_staff", "phcId": str(phc_id), "provider": "credentials",
    })
    return {"Authorization": f"Bearer {token}"}


def _make_test_image_bytes(width=600, height=600):
    img = np.random.RandomState(42).randint(50, 200, (height, width, 3), dtype=np.uint8)
    cv2.circle(img, (300, 300), 200, (0, 80, 160), -1)
    cv2.circle(img, (300, 300), 100, (0, 40, 120), -1)
    cv2.rectangle(img, (50, 50), (150, 150), (200, 100, 50), -1)
    cv2.putText(img, "FUNDUS", (200, 300), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def _make_blurry_image_bytes():
    img = np.zeros((600, 600, 3), dtype=np.uint8)
    img[100:500, 100:500] = [50, 50, 50]
    blur = cv2.GaussianBlur(img, (51, 51), 0)
    _, buf = cv2.imencode(".jpg", blur)
    return buf.tobytes()


def _make_dark_image_bytes():
    img = np.zeros((600, 600, 3), dtype=np.uint8)
    img[:] = [5, 5, 5]
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def _create_patient(name="Test Patient", headers=None):
    if headers is None:
        headers = _auth_headers()
    return client.post("/api/patients", json={"name": name, "age": 50, "gender": "male"}, headers=headers).json()


def _create_screening(patient_id, eye="left", headers=None):
    if headers is None:
        headers = _auth_headers()
    return client.post("/api/screenings", json={"patient_id": patient_id, "eye": eye}, headers=headers).json()


def _upload_image(screening_id, image_bytes=None, headers=None):
    if headers is None:
        headers = _auth_headers()
    if image_bytes is None:
        image_bytes = _make_test_image_bytes()
    return client.post(
        f"/api/screenings/{screening_id}/image",
        files={"file": ("test.jpg", image_bytes, "image/jpeg")},
        headers=headers,
    )


# ── Health ──

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Patients ──

def test_create_patient():
    headers = _auth_headers()
    r = client.post("/api/patients", json={"name": "John", "age": 50, "gender": "male"}, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["patient_id"].startswith("P-")
    assert data["name"] == "John"
    assert data["created_at"]


def test_list_patients_pagination():
    headers = _auth_headers()
    for i in range(5):
        client.post("/api/patients", json={"name": f"Patient {i}", "age": 40 + i, "gender": "male"}, headers=headers)
    r = client.get("/api/patients?page=1&limit=2")
    data = r.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["pages"] == 3


def test_list_patients_search():
    headers = _auth_headers()
    client.post("/api/patients", json={"name": "Alice Smith", "age": 45, "gender": "female"}, headers=headers)
    client.post("/api/patients", json={"name": "Bob Jones", "age": 55, "gender": "male"}, headers=headers)
    r = client.get("/api/patients?search=alice")
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Alice Smith"


def test_get_patient():
    p = _create_patient("Jane")
    r = client.get(f"/api/patients/{p['patient_id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "Jane"


def test_get_patient_not_found():
    r = client.get("/api/patients/P-9999")
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "PATIENT_NOT_FOUND"


def test_patient_screenings():
    p = _create_patient("Bob")
    _create_screening(p["patient_id"])
    _create_screening(p["patient_id"], "right")
    r = client.get(f"/api/patients/{p['patient_id']}/screenings")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_patient_screenings_not_found():
    r = client.get("/api/patients/P-9999/screenings")
    assert r.status_code == 404


# ── Screenings ──

def test_create_screening():
    p = _create_patient()
    r = client.post("/api/screenings", json={"patient_id": p["patient_id"], "eye": "right"}, headers=_auth_headers())
    assert r.status_code == 201
    assert r.json()["eye"] == "right"
    assert r.json()["status"] == "created"


def test_create_screening_invalid_eye():
    p = _create_patient()
    r = client.post("/api/screenings", json={"patient_id": p["patient_id"], "eye": "center"}, headers=_auth_headers())
    assert r.status_code == 422


def test_create_screening_patient_not_found():
    r = client.post("/api/screenings", json={"patient_id": "P-9999", "eye": "left"}, headers=_auth_headers())
    assert r.status_code == 404


def test_list_screenings_pagination():
    p = _create_patient()
    for _ in range(5):
        _create_screening(p["patient_id"])
    r = client.get("/api/screenings?page=1&limit=2")
    data = r.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["pages"] == 3


def test_list_screenings_filter_by_patient():
    p1 = _create_patient("A")
    p2 = _create_patient("B")
    _create_screening(p1["patient_id"])
    _create_screening(p1["patient_id"])
    _create_screening(p2["patient_id"])
    r = client.get(f"/api/screenings?patient_id={p1['patient_id']}")
    assert r.json()["total"] == 2


def test_list_screenings_filter_by_grade():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    r = client.get("/api/screenings?grade=0")
    assert r.status_code == 200


# ── Image Upload ──

def test_upload_valid_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    r = _upload_image(s["screening_id"])
    assert r.status_code == 200
    assert r.json()["image_uploaded"] is True
    assert r.json()["image_url"].startswith("/storage/uploads/")


def test_upload_rejects_text_file():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    r = client.post(
        f"/api/screenings/{s['screening_id']}/image",
        files={"file": ("test.txt", b"not an image", "text/plain")},
        headers=_auth_headers(),
    )
    assert r.status_code == 415
    assert r.json()["detail"]["code"] == "UNSUPPORTED_TYPE"


def test_upload_rejects_too_large():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    big = b"\xff" * (11 * 1024 * 1024)
    r = client.post(
        f"/api/screenings/{s['screening_id']}/image",
        files={"file": ("big.jpg", big, "image/jpeg")},
        headers=_auth_headers(),
    )
    assert r.status_code == 413


def test_upload_screening_not_found():
    r = client.post(
        "/api/screenings/SCR-9999/image",
        files={"file": ("t.jpg", _make_test_image_bytes(), "image/jpeg")},
        headers=_auth_headers(),
    )
    assert r.status_code == 404


# ── Quality ──

def test_quality_good_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    r = client.post(f"/api/screenings/{s['screening_id']}/quality", headers=_auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "good"
    assert data["score"] >= 0.75
    assert all(data["checks"].values())


def test_quality_blurry_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"], _make_blurry_image_bytes())
    r = client.post(f"/api/screenings/{s['screening_id']}/quality", headers=_auth_headers())
    data = r.json()
    assert data["checks"]["blur"] is False


def test_quality_screening_not_found():
    r = client.post("/api/screenings/SCR-9999/quality", headers=_auth_headers())
    assert r.status_code == 404


def test_quality_no_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    r = client.post(f"/api/screenings/{s['screening_id']}/quality", headers=_auth_headers())
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "NO_IMAGE"


# ── Analyze ──

def test_analyze_good_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    r = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "completed"
    assert data["prediction"]["grade"] in range(5)
    assert data["prediction"]["label"]
    assert 0.0 <= data["prediction"]["confidence"] <= 1.0
    assert data["explanation"]["heatmap_url"].startswith("/storage/heatmaps/")
    assert data["risk"]["level"] in ["low", "monitor", "high", "urgent"]
    assert data["risk"]["recommendation"]


def test_analyze_screening_not_found():
    r = client.post("/api/screenings/SCR-9999/analyze", headers=_auth_headers())
    assert r.status_code == 404


def test_analyze_no_image():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    r = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "NO_IMAGE"


def test_analyze_returns_quality_check_result():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    r = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    data = r.json()
    assert "image_quality" in data
    assert data["image_quality"]["status"] == "good"


# ── Get Result ──

def test_get_result():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    r = client.get(f"/api/screenings/{s['screening_id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "completed"
    assert data["screening_id"] == s["screening_id"]
    assert data["patient_id"] == p["patient_id"]
    assert data["eye"] == "left"
    assert data["prediction"]
    assert data["explanation"]
    assert data["risk"]


def test_get_screening_not_found():
    r = client.get("/api/screenings/SCR-9999")
    assert r.status_code == 404


def test_result_has_all_fields():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    r = client.get(f"/api/screenings/{s['screening_id']}")
    data = r.json()
    required = ["screening_id", "patient_id", "eye", "status", "image_url",
                 "image_quality", "prediction", "explanation", "risk"]
    for field in required:
        assert field in data, f"Missing field: {field}"


# ── Reports ──

def test_reports_summary():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers())
    r = client.get("/api/reports/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_patients"] == 1
    assert data["total_screenings"] == 1
    assert data["completed_screenings"] == 1
    assert isinstance(data["grade_distribution"], dict)
    assert isinstance(data["risk_distribution"], dict)


def test_reports_summary_empty():
    r = client.get("/api/reports/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_patients"] == 0
    assert data["total_screenings"] == 0
    assert data["completed_screenings"] == 0


# ── PHC ──

def test_phc_get_profile_scoped_to_user():
    headers = _auth_headers(name="My PHC", code="PHC-A")
    r = client.get("/api/phc/profile", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "My PHC"
    assert data["code"] == "PHC-A"
    assert data["contactNumber"] == "9876543210"


def test_phc_get_profile_requires_auth():
    assert client.get("/api/phc/profile").status_code == 401


def test_phc_update_profile():
    headers = _auth_headers(name="My PHC", code="PHC-A")
    r = client.put("/api/phc/profile", headers=headers,
                   json={"name": "Renamed PHC", "district": "Nagpur"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Renamed PHC"
    assert data["district"] == "Nagpur"
    assert data["code"] == "PHC-A"


# ── Static files ──

def test_uploaded_image_accessible():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    up = _upload_image(s["screening_id"]).json()
    r = client.get(up["image_url"], headers=_auth_headers())
    assert r.status_code == 200
    assert len(r.content) > 0


def test_heatmap_accessible():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    analyze = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers()).json()
    heatmap_url = analyze["explanation"]["heatmap_url"]
    r = client.get(heatmap_url, headers=_auth_headers())
    assert r.status_code == 200
    assert len(r.content) > 0


# ── Full Pipeline Integration ──

def test_full_pipeline_e2e():
    p = _create_patient("E2E Patient")
    s = _create_screening(p["patient_id"], "right")
    _upload_image(s["screening_id"])
    result = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers()).json()
    assert result["status"] == "completed"
    final = client.get(f"/api/screenings/{s['screening_id']}").json()
    assert final["status"] == "completed"
    assert final["prediction"]["grade"] in range(5)
    assert final["explanation"]["heatmap_url"]
    assert final["risk"]["level"]
    patient_screenings = client.get(f"/api/patients/{p['patient_id']}/screenings").json()
    assert len(patient_screenings) == 1
    summary = client.get("/api/reports/summary").json()
    assert summary["total_patients"] == 1
    assert summary["completed_screenings"] == 1


# ── Auth flow: backend is now the only DB writer ──

def _register_user(monkeypatch, email="staff@example.com", otp="246810"):
    monkeypatch.setattr("app.features.auth.otp.generate_otp", lambda: otp)
    payload = {
        "name": "Staff User",
        "email": email,
        "password": "password123",
        "phc_name": "Test PHC",
        "phc_code": "PHC-T1",
        "state": "MH",
        "district": "Pune",
        "address": "Street 5",
        "contact_number": "9876543210",
    }
    r = client.post("/api/auth/register", json=payload)
    return r, payload, otp


def test_auth_register_verify_login_me(monkeypatch):
    from datetime import datetime, timezone
    r, payload, otp = _register_user(monkeypatch, email="e2e-auth@example.com")
    assert r.status_code == 201

    db = get_db()
    user = db.users.find_one({"email": payload["email"]})
    assert user is not None and user["is_verified"] is False
    phc = db.phcs.find_one({"code": "PHC-T1"})
    assert phc is not None and user["phc_id"] == phc["_id"]

    # unverified users cannot log in
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert r.status_code == 403

    # wrong code rejected
    r = client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": "000000", "purpose": "email_verification"})
    assert r.status_code == 400

    # correct code verifies the account
    r = client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": otp, "purpose": "email_verification"})
    assert r.status_code == 200
    assert db.users.find_one({"email": payload["email"]})["is_verified"] is True

    # login returns a backend token accepted by /api/auth/me
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert r.status_code == 200
    data = r.json()
    assert data["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()["id"] == data["user"]["id"]
    assert me.json()["role"] == "phc_staff"


def test_register_duplicate_verified_user(monkeypatch):
    r, payload, otp = _register_user(monkeypatch, email="dup@example.com")
    client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": otp, "purpose": "email_verification"})
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400


def test_verify_otp_expired(monkeypatch):
    from datetime import datetime, timedelta, timezone
    r, payload, otp = _register_user(monkeypatch, email="expired@example.com")
    assert r.status_code == 201
    db = get_db()
    db.otps.update_many(
        {"email": payload["email"]},
        {"$set": {"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)}},
    )
    r = client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": otp, "purpose": "email_verification"})
    assert r.status_code == 400


def test_verify_otp_attempt_limit(monkeypatch):
    r, payload, otp = _register_user(monkeypatch, email="attempts@example.com")
    assert r.status_code == 201
    for _ in range(5):
        client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": "000000", "purpose": "email_verification"})
    # 6th failure deletes the record; even the correct code now fails
    r = client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": otp, "purpose": "email_verification"})
    assert r.status_code == 400


def test_password_reset_flow(monkeypatch):
    r, payload, otp = _register_user(monkeypatch, email="reset@example.com")
    client.post("/api/auth/verify-otp", json={"email": payload["email"], "otp": otp, "purpose": "email_verification"})

    assert client.post("/api/auth/forgot-password", json={"email": payload["email"]}).status_code == 200
    r = client.post("/api/auth/reset-password", json={"email": payload["email"], "otp": otp, "password": "newpassword123"})
    assert r.status_code == 200

    assert client.post("/api/auth/login", json={"email": payload["email"], "password": "newpassword123"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]}).status_code == 401


def test_google_oauth_upsert():
    body = {"google_id": "sub-1", "email": "google.user@example.com", "name": "Google User"}
    r1 = client.post("/api/auth/oauth/google", json=body)
    assert r1.status_code == 200 and r1.json()["access_token"]
    assert get_db().users.find_one({"email": body["email"]})["provider"] == "google"

    # second login upserts rather than duplicating
    r2 = client.post("/api/auth/oauth/google", json=body)
    assert get_db().users.count_documents({"email": body["email"]}) == 1
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {r2.json()['access_token']}"})
    assert me.status_code == 200


# ── Storage gate (Step 11): signed URL or token required ──

def test_storage_rejects_unauthenticated():
    assert client.get("/storage/uploads/whatever.jpg").status_code == 401
    assert client.get("/storage/heatmaps/whatever.png").status_code == 401


def test_storage_signed_url_serves_without_token():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    up = _upload_image(s["screening_id"]).json()
    assert up["image_url"].startswith("/storage/uploads/") and "sig=" in up["image_url"]
    assert client.get(up["image_url"]).status_code == 200


def test_heatmap_url_is_signed():
    p = _create_patient()
    s = _create_screening(p["patient_id"])
    _upload_image(s["screening_id"])
    analyze = client.post(f"/api/screenings/{s['screening_id']}/analyze", headers=_auth_headers()).json()
    url = analyze["explanation"]["heatmap_url"]
    assert url.startswith("/storage/heatmaps/") and "sig=" in url
    assert client.get(url).status_code == 200
