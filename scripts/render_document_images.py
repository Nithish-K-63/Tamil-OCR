# -*- coding: utf-8 -*-
"""
TamilOCR - Historical Archival Document Image Generator
Renders authentic, high-resolution historical Tamil archival documents
using Microsoft Edge headless browser for 100% accurate Tamil font ligatures,
government stamps, official seals, and aged parchment aesthetics.
"""
import os
import subprocess
import shutil
import tempfile
import time

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
UPLOADS_DIR = os.path.join(ROOT_DIR, "backend", "data", "uploads")
DIST_DIR = os.path.join(ROOT_DIR, "dist")

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe"
]

EDGE_EXE = None
for p in EDGE_PATHS:
    if os.path.exists(p):
        EDGE_EXE = p
        break

if not EDGE_EXE:
    raise FileNotFoundError("Microsoft Edge or Chrome browser executable not found.")

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
if os.path.exists(DIST_DIR):
    os.makedirs(DIST_DIR, exist_ok=True)

DOCUMENTS = [
    {
        "filename": "land_record_1978.jpg",
        "doc_id": "TNOCR-0248",
        "title": "நிலப் பதிவு ஆவணம்",
        "header": "தமிழ்நாடு அரசு — வருவாய்த்துறை",
        "sub_header": "நிலப் பதிவு ஆவணம் - 1978",
        "dept_badge": "வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை",
        "meta_table": [
            ("பதிவு எண்", "452 / 1978"),
            ("நாள்", "12 செப்டம்பர் 1978"),
            ("மாவட்டம்", "தஞ்சாவூர்"),
            ("வட்டம் / தாலுகா", "கும்பகோணம்"),
            ("கிராமம்", "சுந்தரபெருமாள் கோவில்"),
            ("நில வகைப்பாடு", "நன்செய் விவசாய நிலம்")
        ],
        "grid_columns": [
            ("சர்வே எண்", "108 / 3"),
            ("பரப்பளவு", "2 ஏக்கர் 43 சென்ட்"),
            ("பட்டா எண்", "TR-78/914"),
            ("தீர்வை", "ரூ. 28.50")
        ],
        "body_paragraphs": [
            "இவ்வாவணத்தின்படி, தஞ்சாவூர் மாவட்டம், கும்பகோணம் வட்டம், சுந்தரபெருமாள் கோவில் கிராமத்தில் அமைந்துள்ள மேற்கண்ட விபரமுடைய நன்செய் விவசாய நிலத்தின் உரிமை திரு. சுப்பிரமணியன் த/பெ. இராமசாமி என்பவருக்கு உறுதி செய்யப்பட்டு, தமிழ்நாடு நில வருவாய் சட்ட விதிகளின்படி புதிய பட்டா பதிவு செய்யப்படுகிறது.",
            "மேற்படி நிலத்தின் எல்லைகள்: வடக்கு — வாய்க்கால், தெற்கு — பொதுப்பாதை, கிழக்கு — முத்துசாமி பிள்ளை நிலம், மேற்கு — சுந்தரம் பிள்ளை நிலம். இந்நிலத்தின் மீதான வருவாய் தீர்வை ஆண்டுதோறும் அரசுக்கு முறையாக செலுத்தப்பட வேண்டும்."
        ],
        "stamp_title": "துணைப் பதிவாளர் அலுவலகம்",
        "stamp_subtitle": "கும்பகோணம்",
        "stamp_date": "12 SEP 1978",
        "stamp_color": "#2c1c6d",
        "seal_type": "tamilnadu",
        "signatory_title": "வட்டாட்சியர் / துணைப் பதிவாளர்",
        "signatory_location": "கும்பகோணம், தஞ்சாவூர் மாவட்டம்",
        "signatory_name": "R. Subramaniam"
    },
    {
        "filename": "temple_grant_1959.jpg",
        "doc_id": "TNOCR-0244",
        "title": "கோவில் மானியப் பட்டா",
        "header": "திருவாவடுதுறை ஆதீனம் — அருள்மிகு பிரகதீஸ்வரர் திருக்கோவில்",
        "sub_header": "கோவில் மான்ய தான சாசனம் - 1959",
        "dept_badge": "இந்து சமய அறநிலையத் துறை — தஞ்சாவூர் தேவஸ்தானம்",
        "meta_table": [
            ("ஆவண எண்", "142 / 1959"),
            ("நாள்", "அக்டோபர் 12, 1959 (தை 15)"),
            ("மாவட்டம்", "தஞ்சாவூர்"),
            ("ஊர்", "திருநாகேஸ்வரம்"),
            ("தானம் வழங்கியவர்", "விஸ்வநாத அய்யர் த/பெ. சோமசுந்தரம் அய்யர்"),
            ("உரிமைப் பயன்", "திருக்கோவில் நித்திய பூஜை கட்டளை")
        ],
        "grid_columns": [
            ("நில உரிமை", "ஐந்து மா நன்செய்"),
            ("பாசன வசதி", "காவிரி பாசன வாய்க்கால்"),
            ("மகசூல் பங்கு", "அரசு அங்கீகாரம்"),
            ("பதிவு நிலை", "நிரந்தர அறக்கட்டளை")
        ],
        "body_paragraphs": [
            "இதன் மூலம் திருவாவடுதுறை ஆதீனம் அருள்மிகு பிரகதீஸ்வரர் திருக்கோவிலுக்கு தஞ்சாவூர் மாவட்டம், திருநாகேஸ்வரம் கிராமத்தில் அமைந்துள்ள ஐந்து மா நன்செய் விவசாய நிலம், சிவசுந்தரம் பிள்ளை அவர்களின் நற்பணி அறக்கட்டளை சார்பாக திரு. விஸ்வநாத அய்யர் அவர்களால் மனமுவந்து தானமாக வழங்கப்படுகிறது.",
            "இவ்வாவணத்தில் குறிப்பிடப்பட்டுள்ள நன்செய் நிலம் திருக்கோவில் திருப்பணி மற்றும் தினசரி நித்திய பூசைகளுக்கு உரிய வருவாயாக மட்டுமே பயன்படுத்தப்பட வேண்டும் என தீர்மானிக்கப்படுகிறது. இந்நிலம் பரம்பரை அறங்காவலர் கண்காணிப்பில் பாதுகாக்கப்படும்."
        ],
        "stamp_title": "DISTRICT COLLECTOR'S OFFICE",
        "stamp_subtitle": "THANJAVUR",
        "stamp_date": "OCT 14 1959",
        "stamp_color": "#7a1a1a",
        "seal_type": "temple",
        "signatory_title": "District Collector & District Magistrate",
        "signatory_location": "Thanjavur District",
        "signatory_name": "V.R. Ramaswamy"
    },
    {
        "filename": "birth_cert_1984.png",
        "doc_id": "TNOCR-0247",
        "title": "பிறப்புச் சான்றிதழ்",
        "header": "மதுரை மாநகராட்சி — MADURAI MUNICIPAL CORPORATION",
        "sub_header": "பிறப்பு பதிவு ஆவணம் — படிவம் எண். 5",
        "dept_badge": "பொது சுகாதார மற்றும் பிறப்பு-இறப்பு பதிவுத் துறை",
        "meta_table": [
            ("பதிவு எண்", "1984 / MAD / 0491"),
            ("பதிவு நாள்", "1984 ஆவணி 12 (18.06.1984)"),
            ("குழந்தையின் பெயர்", "மருதுபாண்டி"),
            ("பாலினம்", "ஆண்"),
            ("பிறந்த தேதி", "04.06.1984"),
            ("பிறந்த இடம்", "மாநகராட்சி மகப்பேறு மருத்துவமனை, மதுரை")
        ],
        "grid_columns": [
            ("தந்தை பெயர்", "சொக்கலிங்கம்"),
            ("தாய் பெயர்", "மீனாட்சி அம்மாள்"),
            ("வசிப்பிடம்", "14, வடக்கு மாசி வீதி, மதுரை"),
            ("சான்றிதழ் எண்", "B-84/4521")
        ],
        "body_paragraphs": [
            "மதுரை மாநகராட்சி பிறப்பு மற்றும் இறப்பு பதிவு சட்ட விதிகளின்படி, 1984-ம் ஆண்டு ஜூன் மாதம் 4-ம் தேதி பிறந்த ஆண் குழந்தை மருதுபாண்டி, தந்தை சொக்கலிங்கம், தாய் மீனாட்சி அம்மாள் ஆகியோரின் பிறப்பு விவரங்கள் மாநகராட்சி முதன்மை பதிவேட்டில் பதிவு செய்யப்பட்டுள்ளது என சான்றளிக்கப்படுகிறது."
        ],
        "stamp_title": "MADURAI MUNICIPAL CORPORATION",
        "stamp_subtitle": "BIRTHS & DEATHS REGISTER",
        "stamp_date": "18 JUN 1984",
        "stamp_color": "#1b3a6b",
        "seal_type": "ashoka",
        "signatory_title": "கடைசிப் பதிவாளர் (ஆவணக் காப்பாளர்)",
        "signatory_location": "பிறப்பு-இறப்பு துறை, மதுரை மாநகராட்சி",
        "signatory_name": "S. Balakrishnan"
    },
    {
        "filename": "tax_assessment_1966.jpg",
        "doc_id": "TNOCR-0246",
        "title": "வரி மதிப்பீட்டுப் பதிவு",
        "header": "தமிழ்நாடு அரசு — வருவாய்த்துறை",
        "sub_header": "திருச்சிராப்பள்ளி மாவட்ட வருவாய் தீர்வாயப் பதிவு",
        "dept_badge": "நில வருவாய் மற்றும் ஆயத்தீர்வை மதிப்பீட்டு பிரிவு (1966-1967)",
        "meta_table": [
            ("வருட கணக்கு", "1966"),
            ("செலுத்தப்பட்ட நாள்", "1966 கார்த்திகை 20 (14-10-1966)"),
            ("மாவட்டம்", "திருச்சிராப்பள்ளி"),
            ("தாலுகா", "திருச்சிராப்பள்ளி"),
            ("கிராமம் / கதவு", "2/45, உறையூர்"),
            ("நில உரிமையாளர்", "நடராஜ பிள்ளை த/பெ. முத்துசாமி")
        ],
        "grid_columns": [
            ("வரிசை எண்", "28"),
            ("நில வகை", "விவசாய நன்செய்"),
            ("பரப்பு", "0.75 ஏக்கர்"),
            ("வரித் தொகை", "ரூ. 42 அணா 6 (செலுத்தப்பட்டது)")
        ],
        "body_paragraphs": [
            "திருச்சிராப்பள்ளி மாவட்டம், உறையூர் கிராமத்தில் அமைந்துள்ள நன்செய் விவசாய நிலத்திற்குரிய 1966-ம் ஆண்டுக்கான பசலி வருவாய் தீர்வை மதிப்பீடு செய்யப்பட்டு, நடராஜ பிள்ளை அவர்களிடமிருந்து அரசுக்குரிய வரித் தொகை ரூ. 42 அணா 6 முழுமையாக பெறப்பட்டு கருவூலத்தில் செலுத்தப்பட்டது."
        ],
        "stamp_title": "REVENUE PAID — TRICHY",
        "stamp_subtitle": "வட்டாட்சியர் அலுவலகம்",
        "stamp_date": "14 OCT 1966",
        "stamp_color": "#3b2354",
        "seal_type": "tamilnadu",
        "signatory_title": "வட்டாட்சியர் / கலெக்டர் ஒப்புதல்",
        "signatory_location": "திருச்சிராப்பள்ளி மாவட்டம்",
        "signatory_name": "M.R. Subramaniam"
    },
    {
        "filename": "irrigation_record_1972.png",
        "doc_id": "TNOCR-0245",
        "title": "நீர்ப்பாசன நில அளவை",
        "header": "தமிழ்நாடு அரசு — பொதுப்பணித் துறை",
        "sub_header": "காவிரி டெல்டா பாசன நில அளவைப் பதிவு — 1972",
        "dept_badge": "நீர்ப்பாசனக் கிளை — வெண்ணாறு கோட்டம், தஞ்சாவூர்",
        "meta_table": [
            ("ஆண்டு", "1972"),
            ("ஆவணம் எண்", "142 / 1972"),
            ("நாள்", "24 மே 1972"),
            ("பாசனக் கால்வாய்", "வெண்ணாறு கிளைக் கால்வாய்"),
            ("மாவட்டம் / வட்டம்", "தஞ்சாவூர் மாவட்டம், நாகப்பட்டினம் வட்டம்"),
            ("கிராமம்", "வடக்குப் பூதனூர்")
        ],
        "grid_columns": [
            ("ஆயக்கட்டு பரப்பு", "12 ஏக்கர்"),
            ("புல எண்", "78, 79, 81"),
            ("பாசன வகை", "நேரடி கால்வாய் பாசனம்"),
            ("ஆய்வாளர் குறிப்பு", "கால்வாய் சீரமைப்பு நிறைவுற்றது")
        ],
        "body_paragraphs": [
            "காவிரி டெல்டா பாசன அமைப்பின் கீழ் வெண்ணாறு கிளைக் கால்வாயின் மூலம் வடக்குப் பூதனூர் கிராமத்தில் உள்ள 12 ஏக்கர் நன்செய் விவசாய நிலங்களுக்கு பாசன நீர் வழங்கும் முறைமை ஆய்வு செய்யப்பட்டு, புல எண்கள் 78, 79, 81 நில எல்லைகள் உறுதி செய்யப்பட்டு பாசன நில அளவை நிறைவு செய்யப்பட்டுள்ளது."
        ],
        "stamp_title": "PUBLIC WORKS DEPT - VENNARU DIV",
        "stamp_subtitle": "THANJAVUR DISTRICT",
        "stamp_date": "24 MAY 1972",
        "stamp_color": "#174352",
        "seal_type": "tamilnadu",
        "signatory_title": "உதவிப் பொறியாளர் — நில அளவை",
        "signatory_location": "P.W.D., Vennaru Division, Thanjavur",
        "signatory_name": "K. Subramaniam"
    }
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ta">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;600;700;800&family=Noto+Sans+Tamil:wght@400;600;700&display=swap');
  
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    background: #1b130c;
    background-image: 
      repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 32px),
      radial-gradient(circle at 50% 50%, rgba(35, 25, 16, 0.4) 0%, rgba(12, 8, 4, 0.95) 100%),
      repeating-linear-gradient(0deg, #241a10, #241a10 2px, #1a120a 2px, #1a120a 6px);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 36px 20px;
    font-family: 'Noto Serif Tamil', 'Nirmala UI', 'Latha', serif;
    color: #1f1710;
    -webkit-font-smoothing: antialiased;
  }}

  .parchment {{
    width: 880px;
    min-height: 1240px;
    background: #f5eedb;
    background-image: 
      radial-gradient(circle at 10% 8%, rgba(170, 130, 80, 0.28) 0%, transparent 45%),
      radial-gradient(circle at 92% 92%, rgba(160, 115, 65, 0.32) 0%, transparent 50%),
      radial-gradient(circle at 45% 48%, rgba(255, 252, 245, 0.85) 0%, rgba(235, 218, 185, 0.92) 100%),
      repeating-linear-gradient(45deg, rgba(140, 100, 50, 0.02) 0px, rgba(140, 100, 50, 0.02) 2px, transparent 2px, transparent 6px);
    border: 1px solid #7c5c38;
    box-shadow: 
      0 20px 50px rgba(0,0,0,0.85),
      0 4px 12px rgba(0,0,0,0.5),
      inset 0 0 90px rgba(130, 90, 45, 0.35),
      inset 0 0 15px rgba(110, 75, 35, 0.5);
    padding: 42px 48px;
    position: relative;
    border-radius: 3px;
  }}

  /* Aging fold crease across horizontal middle */
  .crease-line {{
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(95, 65, 30, 0.4) 15%, rgba(65, 42, 18, 0.55) 50%, rgba(95, 65, 30, 0.4) 85%, transparent 100%);
    box-shadow: 0 1px 1px rgba(255, 255, 255, 0.35);
    pointer-events: none;
  }}

  .inner-border {{
    border: 2px double #755535;
    padding: 26px 30px;
    min-height: 1140px;
    position: relative;
    background: rgba(255, 255, 255, 0.15);
  }}

  /* Antique Revenue Stamp */
  .revenue-stamp-box {{
    position: absolute;
    top: 24px;
    left: 28px;
    width: 68px;
    height: 84px;
    border: 2px dashed #1a4d2e;
    background: #e5f0e8;
    color: #1a4d2e;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 4px 2px;
    text-align: center;
    box-shadow: 2px 3px 6px rgba(0,0,0,0.25);
    transform: rotate(-3deg);
  }}

  .stamp-head-text {{
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1a4d2e;
    width: 100%;
    padding-bottom: 2px;
  }}

  .stamp-val-text {{
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    margin: 4px 0;
  }}

  .stamp-foot-text {{
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border-top: 1px solid #1a4d2e;
    width: 100%;
    padding-top: 2px;
  }}

  .stamp-cancel-line {{
    position: absolute;
    top: 50%;
    left: -6px;
    right: -6px;
    height: 2px;
    background: #4a154b;
    transform: rotate(-35deg);
    opacity: 0.85;
  }}

  /* Top Emblem Header */
  .header-section {{
    text-align: center;
    border-bottom: 2px solid #755535;
    padding-bottom: 14px;
    margin-bottom: 18px;
    margin-top: 6px;
    padding-left: 80px;
    padding-right: 80px;
  }}

  .emblem-icon {{
    width: 64px;
    height: 64px;
    margin: 0 auto 8px auto;
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
  }}

  .govt-title {{
    font-size: 23px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #150f0a;
    margin-bottom: 4px;
    text-shadow: 0 0 1px rgba(0,0,0,0.3);
  }}

  .dept-badge {{
    font-size: 12.5px;
    font-weight: 700;
    color: #4f361c;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }}

  .doc-main-title {{
    font-size: 21px;
    font-weight: 800;
    color: #781912;
    background: rgba(120, 25, 18, 0.07);
    display: inline-block;
    padding: 5px 22px;
    border-radius: 3px;
    border: 1px solid rgba(120, 25, 18, 0.25);
    margin-top: 4px;
    letter-spacing: 0.5px;
  }}

  /* Metadata Key-Value List */
  .meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 20px;
    margin: 16px 0;
    background: rgba(255, 255, 255, 0.55);
    padding: 12px 16px;
    border-radius: 3px;
    border: 1px dashed #ad9473;
  }}

  .meta-item {{
    font-size: 13px;
    line-height: 1.45;
  }}

  .meta-key {{
    font-weight: 700;
    color: #3b2817;
  }}

  .meta-val {{
    color: #110c08;
    font-weight: 600;
  }}

  /* Highlight Columns */
  .stats-strip {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 14px 0;
    text-align: center;
  }}

  .stat-box {{
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid #bba383;
    padding: 7px 8px;
    border-radius: 3px;
  }}

  .stat-label {{
    font-size: 11px;
    color: #573e26;
    font-weight: 600;
    margin-bottom: 2px;
  }}

  .stat-value {{
    font-size: 13.5px;
    font-weight: 800;
    color: #140d07;
  }}

  /* Body Paragraphs */
  .body-content {{
    font-size: 14px;
    line-height: 1.8;
    color: #18120c;
    text-align: justify;
    margin: 18px 0;
  }}

  .body-p {{
    margin-bottom: 12px;
    text-indent: 26px;
    text-shadow: 0 0 0.5px rgba(0,0,0,0.25);
  }}

  /* Bottom Signatures & Rubber Stamp */
  .footer-section {{
    margin-top: 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 12px;
    position: relative;
  }}

  .rubber-stamp {{
    width: 145px;
    height: 145px;
    border-radius: 50%;
    border: 3.5px solid {stamp_color};
    color: {stamp_color};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 8px;
    transform: rotate(-8deg);
    opacity: 0.90;
    background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 75%);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
  }}

  .stamp-inner {{
    border: 1.5px dashed {stamp_color};
    border-radius: 50%;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 6px;
  }}

  .stamp-title-text {{
    font-size: 9.5px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.15;
  }}

  .stamp-date-text {{
    font-size: 13px;
    font-weight: 900;
    margin: 4px 0;
    letter-spacing: 0.5px;
    border-top: 1px solid {stamp_color};
    border-bottom: 1px solid {stamp_color};
    padding: 2px 8px;
  }}

  .stamp-sub-text {{
    font-size: 9px;
    font-weight: 800;
  }}

  .signature-box {{
    text-align: center;
    min-width: 230px;
  }}

  .signature-img {{
    font-family: 'Brush Script MT', cursive, sans-serif;
    font-size: 30px;
    color: #0b2260;
    font-weight: bold;
    margin-bottom: 2px;
    transform: rotate(-2deg);
    text-shadow: 0 0 1px rgba(11, 34, 96, 0.4);
  }}

  .sign-title {{
    font-size: 13px;
    font-weight: 700;
    color: #150d07;
    border-top: 1px solid #6b4d2e;
    padding-top: 5px;
    margin-top: 4px;
  }}

  .sign-dept {{
    font-size: 11px;
    color: #4d3620;
    font-weight: 600;
  }}

  /* Watermark in background */
  .watermark {{
    position: absolute;
    top: 48%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 78px;
    font-weight: 800;
    color: rgba(110, 80, 40, 0.05);
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: 8px;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
  <div class="parchment">
    <div class="crease-line"></div>
    <div class="inner-border">
      <div class="watermark">ARCHIVAL RECORD</div>

      <div class="revenue-stamp-box">
        <span class="stamp-head-text">TAMIL NADU</span>
        <span class="stamp-val-text">₹ 5</span>
        <span class="stamp-foot-text">REVENUE</span>
        <div class="stamp-cancel-line"></div>
      </div>

      <div class="header-section">
        {emblem_svg}
        <h1 class="govt-title">{header}</h1>
        <div class="dept-badge">{dept_badge}</div>
        <div class="doc-main-title">{sub_header}</div>
      </div>

      <div class="meta-grid">
        {meta_items_html}
      </div>

      <div class="stats-strip">
        {stats_strip_html}
      </div>

      <div class="body-content">
        {body_paragraphs_html}
      </div>

      <div class="footer-section">
        <div class="rubber-stamp">
          <div class="stamp-inner">
            <span class="stamp-title-text">{stamp_title}</span>
            <span class="stamp-date-text">{stamp_date}</span>
            <span class="stamp-sub-text">{stamp_subtitle}</span>
          </div>
        </div>

        <div class="signature-box">
          <div class="signature-img">{signatory_name}</div>
          <div class="sign-title">{signatory_title}</div>
          <div class="sign-dept">{signatory_location}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

def get_emblem_svg(seal_type):
    if seal_type == "temple":
        return '''<svg class="emblem-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" stroke="#684724" stroke-width="3"/>
  <circle cx="50" cy="50" r="41" stroke="#8c683b" stroke-width="1.5" stroke-dasharray="3,2"/>
  <path d="M50 14 L34 82 L66 82 Z" stroke="#684724" stroke-width="2.5" fill="none"/>
  <line x1="38" y1="36" x2="62" y2="36" stroke="#684724" stroke-width="2"/>
  <line x1="36" y1="52" x2="64" y2="52" stroke="#684724" stroke-width="2"/>
  <line x1="34" y1="68" x2="66" y2="68" stroke="#684724" stroke-width="2"/>
  <circle cx="50" cy="22" r="3" fill="#684724"/>
</svg>'''
    elif seal_type == "ashoka":
        return '''<svg class="emblem-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" stroke="#1b3a6b" stroke-width="3"/>
  <circle cx="50" cy="50" r="41" stroke="#1b3a6b" stroke-width="1.5"/>
  <path d="M42 22 C42 16 58 16 58 22 C58 28 42 28 42 22 Z" fill="#1b3a6b"/>
  <rect x="36" y="30" width="28" height="34" rx="4" stroke="#1b3a6b" stroke-width="2.5"/>
  <circle cx="50" cy="74" r="8" stroke="#1b3a6b" stroke-width="2"/>
  <line x1="50" y1="66" x2="50" y2="82" stroke="#1b3a6b" stroke-width="1.5"/>
  <line x1="42" y1="74" x2="58" y2="74" stroke="#1b3a6b" stroke-width="1.5"/>
</svg>'''
    else:
        # Tamil Nadu State Emblem / Gopuram
        return '''<svg class="emblem-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" stroke="#8b2500" stroke-width="3"/>
  <circle cx="50" cy="50" r="41" stroke="#684724" stroke-width="1.5" stroke-dasharray="4,2"/>
  <path d="M50 14 L32 80 L68 80 Z" stroke="#8b2500" stroke-width="2.5" fill="rgba(139,37,0,0.06)"/>
  <line x1="36" y1="38" x2="64" y2="38" stroke="#8b2500" stroke-width="2"/>
  <line x1="34" y1="54" x2="66" y2="54" stroke="#8b2500" stroke-width="2"/>
  <line x1="32" y1="70" x2="68" y2="70" stroke="#8b2500" stroke-width="2"/>
  <circle cx="50" cy="22" r="3.5" fill="#8b2500"/>
</svg>'''


def render_single_document(doc):
    filename = doc["filename"]
    meta_html = "".join([f'<div class="meta-item"><span class="meta-key">{k}:</span> <span class="meta-val">{v}</span></div>' for k, v in doc["meta_table"]])
    stats_html = "".join([f'<div class="stat-box"><div class="stat-label">{k}</div><div class="stat-value">{v}</div></div>' for k, v in doc["grid_columns"]])
    body_html = "".join([f'<p class="body-p">{p}</p>' for p in doc["body_paragraphs"]])
    emblem_svg = get_emblem_svg(doc.get("seal_type", "tamilnadu"))

    html_content = HTML_TEMPLATE.format(
        header=doc["header"],
        dept_badge=doc["dept_badge"],
        sub_header=doc["sub_header"],
        meta_items_html=meta_html,
        stats_strip_html=stats_html,
        body_paragraphs_html=body_html,
        stamp_title=doc["stamp_title"],
        stamp_subtitle=doc["stamp_subtitle"],
        stamp_date=doc["stamp_date"],
        stamp_color=doc["stamp_color"],
        signatory_name=doc["signatory_name"],
        signatory_title=doc["signatory_title"],
        signatory_location=doc["signatory_location"],
        emblem_svg=emblem_svg
    )

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as temp_html:
        temp_html.write(html_content)
        temp_html_path = temp_html.name

    temp_img_path = temp_html_path.replace(".html", ".png")

    try:
        cmd = [
            EDGE_EXE,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--screenshot={temp_img_path}",
            "--window-size=980,1350",
            f"file:///{os.path.abspath(temp_html_path).replace(os.sep, '/')}"
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=30)
        
        if not os.path.exists(temp_img_path) or os.path.getsize(temp_img_path) == 0:
            # Try legacy headless flag if headless=new is not supported
            cmd[1] = "--headless"
            subprocess.run(cmd, capture_output=True, timeout=30)

        if os.path.exists(temp_img_path) and os.path.getsize(temp_img_path) > 0:
            target_public = os.path.join(PUBLIC_DIR, filename)
            target_uploads = os.path.join(UPLOADS_DIR, filename)
            target_dist = os.path.join(DIST_DIR, filename) if os.path.exists(DIST_DIR) else None

            shutil.copy2(temp_img_path, target_public)
            shutil.copy2(temp_img_path, target_uploads)
            if target_dist:
                shutil.copy2(temp_img_path, target_dist)
            
            print(f"[OK] Rendered: {filename} ({os.path.getsize(target_public)} bytes)")
            return True
        else:
            print(f"[ERROR] Failed rendering {filename}")
            return False
    finally:
        if os.path.exists(temp_html_path):
            os.remove(temp_html_path)
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)


def main():
    print("=" * 60)
    print(" TamilOCR: Rendering 5 Authentic Archival Document Images ")
    print("=" * 60)
    for doc in DOCUMENTS:
        render_single_document(doc)
    print("\nAll 5 documents successfully generated and deployed!")

if __name__ == "__main__":
    main()
