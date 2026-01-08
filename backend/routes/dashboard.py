from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any

# Import your database session and models
from backend.data.scan_database import get_db
from backend.models.scan import Scan
from backend.models.patient import Patient 

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Fetch aggregated statistics for the General Dashboard.
    """
    try:
        # 1. Basic Counts
        total_patients = db.query(Patient).count()
        total_scans = db.query(Scan).count()
        
        # 2. Status Counts (Active/Processing vs Completed)
        active_scans = db.query(Scan).filter(Scan.status == "processing").count()
        
        # 3. Critical Cases (assuming 'High' risk level or specific diagnosis)
        # You might need to adjust "High" to match your exact database values
        critical_cases = db.query(Scan).filter(Scan.risk_level == "High").count()

        # 4. Risk Distribution for the Chart
        # Groups scans by risk level and counts them
        risk_query = db.query(
            Scan.risk_level, func.count(Scan.id)
        ).group_by(Scan.risk_level).all()
        
        risk_distribution = [
            {"name": level if level else "Unknown", "value": count}
            for level, count in risk_query
        ]

        # 5. Recent Scans (Limit 5)
        # We join with Patient to get the patient's name
        recent_scans_query = db.query(Scan, Patient).join(
            Patient, Scan.patient_id == Patient.id
        ).order_by(desc(Scan.created_at)).limit(5).all()

        recent_scans = []
        for scan, patient in recent_scans_query:
            recent_scans.append({
                "id": scan.id,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "type": scan.scan_type, # e.g., "MRI", "CT"
                "date": scan.created_at.strftime("%Y-%m-%d"),
                "status": scan.status,
                "risk": scan.risk_level
            })

        # 6. Scan Coverage (e.g., by Body Part or Date)
        # This example groups by scan type/body part
        coverage_query = db.query(
            Scan.scan_type, func.count(Scan.id)
        ).group_by(Scan.scan_type).all()
        
        scan_coverage = [
            {"subject": s_type if s_type else "Other", "A": count, "fullMark": 150}
            for s_type, count in coverage_query
        ]

        return {
            "stats": {
                "totalPatients": total_patients,
                "totalScans": total_scans,
                "activeScans": active_scans,
                "criticalCases": critical_cases,
            },
            "riskDistribution": risk_distribution,
            "scanCoverage": scan_coverage,
            "recentScans": recent_scans
        }

    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))