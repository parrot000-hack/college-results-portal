from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
from database import SessionLocal, StudentResult

app = FastAPI(title="College Results Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_USERNAME = "examcell"
ADMIN_PASSWORD = "securepassword123"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/admin/login")
def admin_login(credentials: dict):
    if credentials.get("username") == ADMIN_USERNAME and credentials.get("password") == ADMIN_PASSWORD:
        return {"token": "valid_exam_cell_token_xyz"}
    raise HTTPException(status_code=401, detail="Invalid username or password.")

@app.post("/api/admin/upload")
async def upload_results(
    file: UploadFile = File(...), 
    authorization: str = Header(None), 
    db: Session = Depends(get_db)
):
    if authorization != "Bearer valid_exam_cell_token_xyz":
        raise HTTPException(status_code=403, detail="Unauthorized access. Please log in as Admin.")
        
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed.")
    
    df = pd.read_excel(file.file)
    required_cols = {"roll_number", "name", "semester", "sgpa", "status"}
    if not required_cols.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"Missing columns. Required: {required_cols}")

    for _, row in df.iterrows():
        existing = db.query(StudentResult).filter(StudentResult.roll_number == str(row["roll_number"])).first()
        if existing:
            existing.name = str(row["name"])
            existing.semester = str(row["semester"])
            existing.sgpa = float(row["sgpa"])
            existing.status = str(row["status"])
        else:
            new_record = StudentResult(
                roll_number=str(row["roll_number"]),
                name=str(row["name"]),
                semester=str(row["semester"]),
                sgpa=float(row["sgpa"]),
                status=str(row["status"])
            )
            db.add(new_record)
    
    db.commit()
    return {"message": f"Successfully processed {len(df)} student records."}

@app.get("/api/results/{roll_number}")
def get_student_result(roll_number: str, db: Session = Depends(get_db)):
    result = db.query(StudentResult).filter(StudentResult.roll_number == roll_number.strip()).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found for this roll number.")
    return {
        "roll_number": result.roll_number,
        "name": result.name,
        "semester": result.semester,
        "sgpa": result.sgpa,
        "status": result.status
    }

