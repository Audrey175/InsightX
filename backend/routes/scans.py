from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.data.scan_database import get_db
from backend.models.scan import Scan
from backend.models.patient import Patient
from backend.models.user import User
from backend.routes.auth_router import get_current_user
from backend.modules.mri_service import analyze_dicom_zip as analyze_mri
from backend.modules.xray_service import analyze_xray

router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads" / "scans"


def _safe_slug(value: str, fallback: str = "unknown") -> str:
    cleaned = "".join(ch for ch in value if ch.isalnum() or ch in ("-", "_"))
    return cleaned or fallback


def _serialize_scan(scan: Scan) -> dict[str, Any]:
    def parse_json(raw: Optional[str]) -> Any:
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    return {
        "id": scan.id,
        "patient_id": scan.patient_id,
        "doctor_id": scan.doctor_id,
        "modality": scan.modality,
        "file_path": scan.file_path,
        "created_at": scan.created_at,
        "updated_at": scan.updated_at,
        "status": scan.status,
        "risk_level": scan.risk_level,
        "ai_result": parse_json(scan.ai_result_json),
        "summary": parse_json(scan.summary_json),
        "original_filename": scan.original_filename,
        "review_status": scan.review_status,
        "clinician_note": scan.clinician_note,
    }


def _ensure_scan_access(scan: Scan, current: User, db: Session) -> None:
    if current.role == "patient":
        if current.patient_id is None or scan.patient_id != current.patient_id:
            raise HTTPException(status_code=403, detail="Not authorized.")
        return

    if current.role == "doctor":
        if current.doctor_id is None:
            raise HTTPException(status_code=403, detail="Not authorized.")
        if scan.doctor_id == current.doctor_id:
            return
        patient = db.query(Patient).filter(Patient.id == scan.patient_id).first()
        if patient and patient.doctor_id == current.doctor_id:
            return
        raise HTTPException(status_code=403, detail="Not authorized.")

    raise HTTPException(status_code=403, detail="Not authorized.")


class ScanUpdate(BaseModel):
    review_status: Optional[str] = None
    clinician_note: Optional[str] = None
    risk_level: Optional[str] = None


def _severity_from_risk(risk_score: float) -> str:
    if risk_score < 0.33:
        return "low"
    if risk_score < 0.66:
        return "moderate"
    return "high"


def _build_mri_summary(result: dict) -> dict[str, Any]:
    risk_score = float(result.get("risk_score") or 0)
    tumor_detected = bool(result.get("tumor_detected"))
    severity = "low" if not tumor_detected else _severity_from_risk(risk_score)

    recommendation = (
        "Routine monitoring suggested."
        if severity == "low"
        else "Follow-up imaging suggested."
        if severity == "moderate"
        else "Recommend specialist review."
    )

    return {
        "severity": severity,
        "recommendation": recommendation,
        "key_findings": {
            "tumor_detected": tumor_detected,
            "tumor_size_pixels": result.get("tumor_size_pixels"),
            "tumor_location": result.get("tumor_location"),
            "risk_score": risk_score,
        },
    }


def _build_xray_summary(result: dict) -> dict[str, Any]:
    prediction = result.get("prediction") or {}
    label = prediction.get("label")
    confidence = float(prediction.get("confidence") or 0)

    if label != "PNEUMONIA":
        severity = "low"
    elif confidence >= 0.85:
        severity = "high"
    elif confidence >= 0.65:
        severity = "moderate"
    else:
        severity = "low"

    recommendation = (
        "Routine monitoring suggested."
        if severity == "low"
        else "Follow-up imaging suggested."
        if severity == "moderate"
        else "Recommend clinician review."
    )

    return {
        "severity": severity,
        "recommendation": recommendation,
        "key_findings": {
            "label": label,
            "confidence": confidence,
            "probabilities": prediction.get("probabilities"),
        },
    }


@router.post("/upload-and-predict")
async def upload_and_predict(
    file: UploadFile = File(...),
    patient_id: int = Form(...),
    modality: str = Form(...),
    doctor_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    if not file:
        raise HTTPException(status_code=400, detail="File is required.")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required.")

    modality_norm = modality.strip().lower()
    if modality_norm not in {"mri", "xray"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported modality. Use 'mri' or 'xray'.",
        )

    safe_patient = _safe_slug(str(patient_id))
    safe_name = Path(file.filename or "upload").name
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    token = uuid4().hex[:8]
    filename = f"{timestamp}_{token}_{safe_name}"

    target_dir = UPLOAD_ROOT / safe_patient
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename

    contents = await file.read()
    target_path.write_bytes(contents)

    relative_path = Path("uploads") / "scans" / safe_patient / filename

    scan = Scan(
        patient_id=patient_id,
        doctor_id=doctor_id,
        modality=modality_norm,
        file_path=relative_path.as_posix(),
        status="uploaded",
        original_filename=file.filename,
        review_status="draft",
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    try:
        if modality_norm == "mri":
            result = analyze_mri(str(target_path))
            summary = _build_mri_summary(result)
        else:
            result = analyze_xray(str(target_path))
            summary = _build_xray_summary(result)
    except FileNotFoundError as exc:
        scan.status = "failed"
        scan.summary_json = json.dumps({"error": str(exc)})
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        scan.status = "failed"
        scan.summary_json = json.dumps({"error": f"Prediction failed: {exc}"})
        db.commit()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    scan.status = "predicted"
    scan.ai_result_json = json.dumps(result)
    scan.summary_json = json.dumps(summary)
    db.commit()
    db.refresh(scan)

    return _serialize_scan(scan)


@router.get("")
def list_scans(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    modality: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Scan)
    if patient_id:
        query = query.filter(Scan.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Scan.doctor_id == doctor_id)
    if modality:
        query = query.filter(Scan.modality == modality.lower())

    scans = query.order_by(desc(Scan.created_at)).all()
    return [_serialize_scan(scan) for scan in scans]


@router.get("/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return _serialize_scan(scan)


@router.patch("/{scan_id}")
def update_scan(
    scan_id: int,
    payload: ScanUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    _ensure_scan_access(scan, current, db)

    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(scan, key, value)

    scan.updated_at = datetime.utcnow()

    db.add(scan)
    db.commit()
    db.refresh(scan)
    return _serialize_scan(scan)


@router.delete("/{scan_id}")
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    _ensure_scan_access(scan, current, db)

    file_path = Path(scan.file_path)
    if not file_path.is_absolute():
        file_path = Path(__file__).resolve().parents[1] / file_path
    if file_path.exists():
        try:
            file_path.unlink()
        except OSError:
            pass

    db.delete(scan)
    db.commit()
    return {"success": True}
