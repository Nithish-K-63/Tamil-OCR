# -*- coding: utf-8 -*-
"""
Synchronizes the 5 archival seed records in SQLite database and database.py
so that recognized Tamil text matches the generated document images 100%.
"""
import os
import sqlite3
import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "backend", "tamil_ocr.db")

RECORDS = [
    {
        "id": "TNOCR-0248",
        "title": "நிலப் பதிவு ஆவணம்",
        "department": "Revenue Department",
        "year": "1978",
        "district": "Thanjavur",
        "category": "Land Record",
        "status": "Verified",
        "confidence": 97.68,
        "char_count": 580,
        "word_count": 78,
        "lines_count": 14,
        "tamil_text": """தமிழ்நாடு அரசு — வருவாய்த்துறை
வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை

நிலப் பதிவு ஆவணம் - 1978

பதிவு எண்: 452 / 1978
நாள்: 12 செப்டம்பர் 1978
மாவட்டம்: தஞ்சாவூர்
வட்டம் / தாலுகா: கும்பகோணம்
கிராமம்: சுந்தரபெருமாள் கோவில்
நில வகைப்பாடு: நன்செய் விவசாய நிலம்
சர்வே எண்: 108 / 3
பரப்பளவு: 2 ஏக்கர் 43 சென்ட்
பட்டா எண்: TR-78/914
தீர்வை: ரூ. 28.50

இவ்வாவணத்தின்படி, தஞ்சாவூர் மாவட்டம், கும்பகோணம் வட்டம், சுந்தரபெருமாள் கோவில் கிராமத்தில் அமைந்துள்ள மேற்கண்ட விபரமுடைய நன்செய் விவசாய நிலத்தின் உரிமை திரு. சுப்பிரமணியன் த/பெ. இராமசாமி என்பவருக்கு உறுதி செய்யப்பட்டு, தமிழ்நாடு நில வருவாய் சட்ட விதிகளின்படி புதிய பட்டா பதிவு செய்யப்படுகிறது.

வட்டாட்சியர் / துணைப் பதிவாளர்
கும்பகோணம், தஞ்சாவூர் மாவட்டம்""",
        "file_name": "land_record_1978.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')"
    },
    {
        "id": "TNOCR-0244",
        "title": "கோவில் மானியப் பட்டா",
        "department": "Endowments",
        "year": "1959",
        "district": "Thanjavur",
        "category": "Deed",
        "status": "Verified",
        "confidence": 96.90,
        "char_count": 520,
        "word_count": 68,
        "lines_count": 13,
        "tamil_text": """திருவாவடுதுறை ஆதீனம் — அருள்மிகு பிரகதீஸ்வரர் திருக்கோவில்
கோவில் மான்ய தான சாசனம் - 1959

ஆவண எண்: 142 / 1959
நாள்: அக்டோபர் 12, 1959 (தை 15)
மாவட்டம்: தஞ்சாவூர்
ஊர்: திருநாகேஸ்வரம்
தானம் வழங்கியவர்: விஸ்வநாத அய்யர் த/பெ. சோமசுந்தரம் அய்யர்
உரிமைப் பயன்: திருக்கோவில் நித்திய பூஜை கட்டளை
நில உரிமை: ஐந்து மா நன்செய்

இதன் மூலம் திருவாவடுதுறை ஆதீனம் அருள்மிகு பிரகதீஸ்வரர் திருக்கோவிலுக்கு தஞ்சாவூர் மாவட்டம், திருநாகேஸ்வரம் கிராமத்தில் அமைந்துள்ள ஐந்து மா நன்செய் விவசாய நிலம், சிவசுந்தரம் பிள்ளை அவர்களின் நற்பணி அறக்கட்டளை சார்பாக திரு. விஸ்வநாத அய்யர் அவர்களால் மனமுவந்து தானமாக வழங்கப்படுகிறது.

District Collector & District Magistrate
Thanjavur District""",
        "file_name": "temple_grant_1959.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')"
    },
    {
        "id": "TNOCR-0247",
        "title": "பிறப்புச் சான்றிதழ்",
        "department": "Municipal Department",
        "year": "1984",
        "district": "Madurai",
        "category": "Certificate",
        "status": "Verified",
        "confidence": 97.26,
        "char_count": 340,
        "word_count": 48,
        "lines_count": 10,
        "tamil_text": """மதுரை மாநகராட்சி — MADURAI MUNICIPAL CORPORATION
பிறப்பு பதிவு ஆவணம் — படிவம் எண். 5

பதிவு எண்: 1984 / MAD / 0491
பதிவு நாள்: 1984 ஆவணி 12 (18.06.1984)
குழந்தையின் பெயர்: மருதுபாண்டி
பாலினம்: ஆண்
பிறந்த தேதி: 04.06.1984
பிறந்த இடம்: மாநகராட்சி மகப்பேறு மருத்துவமனை, மதுரை
தந்தை பெயர்: சொக்கலிங்கம்
தாய் பெயர்: மீனாட்சி அம்மாள்
வசிப்பிடம்: 14, வடக்கு மாசி வீதி, மதுரை

கடைசிப் பதிவாளர் (ஆவணக் காப்பாளர்)
மதுரை மாநகராட்சி""",
        "file_name": "birth_cert_1984.png",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')"
    },
    {
        "id": "TNOCR-0246",
        "title": "வரி மதிப்பீட்டுப் பதிவு",
        "department": "Revenue Department",
        "year": "1966",
        "district": "Tiruchirappalli",
        "category": "Tax Record",
        "status": "Verified",
        "confidence": 97.15,
        "char_count": 420,
        "word_count": 58,
        "lines_count": 11,
        "tamil_text": """தமிழ்நாடு அரசு — வருவாய்த்துறை
திருச்சிராப்பள்ளி மாவட்ட வருவாய் தீர்வாயப் பதிவு

வருட கணக்கு: 1966
செலுத்தப்பட்ட நாள்: 1966 கார்த்திகை 20 (14-10-1966)
மாவட்டம்: திருச்சிராப்பள்ளி
தாலுகா: திருச்சிராப்பள்ளி
கிராமம் / கதவு: 2/45, உறையூர்
நில உரிமையாளர்: நடராஜ பிள்ளை த/பெ. முத்துசாமி
வரிசை எண்: 28
நில வகை: விவசாய நன்செய்
பரப்பு: 0.75 ஏக்கர்
வரித் தொகை: ரூ. 42 அணா 6 (செலுத்தப்பட்டது)

வட்டாட்சியர் / கலெக்டர் ஒப்புதல்
திருச்சிராப்பள்ளி மாவட்டம்""",
        "file_name": "tax_assessment_1966.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')"
    },
    {
        "id": "TNOCR-0245",
        "title": "நீர்ப்பாசன நில அளவை",
        "department": "Public Works",
        "year": "1972",
        "district": "Thanjavur",
        "category": "Land Record",
        "status": "Verified",
        "confidence": 97.40,
        "char_count": 450,
        "word_count": 62,
        "lines_count": 12,
        "tamil_text": """தமிழ்நாடு அரசு — பொதுப்பணித் துறை
காவிரி டெல்டா பாசன நில அளவைப் பதிவு — 1972

ஆண்டு: 1972
ஆவணம் எண்: 142 / 1972
நாள்: 24 மே 1972
பாசனக் கால்வாய்: வெண்ணாறு கிளைக் கால்வாய்
மாவட்டம் / வட்டம்: தஞ்சாவூர் மாவட்டம், நாகப்பட்டினம் வட்டம்
கிராமம்: வடக்குப் பூதனூர்
ஆயக்கட்டு பரப்பு: 12 ஏக்கர்
புல எண்: 78, 79, 81
பாசன வகை: நேரடி கால்வாய் பாசனம்

உதவிப் பொறியாளர் — நில அளவை
P.W.D., Vennaru Division, Thanjavur""",
        "file_name": "irrigation_record_1972.png",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')"
    }
]

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for r in RECORDS:
        now_iso = datetime.datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO records (
                id, title, department, year, district, category, status,
                confidence, char_count, word_count, lines_count,
                tamil_text, file_name, model_name, processing_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                department=excluded.department,
                year=excluded.year,
                district=excluded.district,
                category=excluded.category,
                status=excluded.status,
                confidence=excluded.confidence,
                char_count=excluded.char_count,
                word_count=excluded.word_count,
                lines_count=excluded.lines_count,
                tamil_text=excluded.tamil_text,
                file_name=excluded.file_name,
                model_name=excluded.model_name
        """, (
            r["id"], r["title"], r["department"], r["year"], r["district"],
            r["category"], r["status"], r["confidence"], r["char_count"],
            r["word_count"], r["lines_count"], r["tamil_text"], r["file_name"],
            r["model_name"], 145.0, now_iso
        ))
        print(f"[OK] Updated SQLite record: {r['id']} -> {r['file_name']}")

    conn.commit()
    conn.close()
    print("\nDatabase records synchronized successfully!")

if __name__ == "__main__":
    main()
