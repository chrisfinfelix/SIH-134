"""
Builds the seed skill taxonomy and occupation code list used across the
prototype. Run once (or import) to regenerate skills.json / occupations.json.

Kept intentionally small (~200 skills, ~40 occupations) but broad enough
across 4 sectors (IT, Manufacturing, Healthcare, Retail) to exercise every
downstream module (NER gazetteer, bi-encoder matcher, forecasting series,
BERTopic corpus, curriculum ranking, career graph).
"""
import json
import os
import random

random.seed(42)

SECTORS = ["IT", "Manufacturing", "Healthcare", "Retail"]

# canonical_skill -> (sector, [noisy synonym variants])
SKILLS = {
    # ---- IT ----
    "Python": ("IT", ["python3", "Python programming", "py"]),
    "JavaScript": ("IT", ["JS", "javascript programming", "ECMAScript"]),
    "TypeScript": ("IT", ["TS", "typescript"]),
    "React": ("IT", ["React.js", "ReactJS"]),
    "Node.js": ("IT", ["NodeJS", "node"]),
    "Java": ("IT", ["core java", "java se"]),
    "SQL": ("IT", ["structured query language", "sql queries"]),
    "MongoDB": ("IT", ["mongo db", "mongo"]),
    "PostgreSQL": ("IT", ["postgres", "psql"]),
    "AWS": ("IT", ["amazon web services", "aws cloud"]),
    "Azure": ("IT", ["microsoft azure", "azure cloud"]),
    "Docker": ("IT", ["containerization with docker", "docker containers"]),
    "Kubernetes": ("IT", ["k8s", "kube"]),
    "Machine Learning": ("IT", ["ML", "machine-learning", "applied ml"]),
    "Deep Learning": ("IT", ["DL", "neural networks"]),
    "Natural Language Processing": ("IT", ["NLP", "text processing"]),
    "Data Analysis": ("IT", ["data analytics", "analyzing data"]),
    "Data Engineering": ("IT", ["data pipelines", "etl engineering"]),
    "DevOps": ("IT", ["dev ops", "development operations"]),
    "CI/CD": ("IT", ["continuous integration", "continuous deployment"]),
    "Git": ("IT", ["git version control", "github"]),
    "REST API Development": ("IT", ["rest apis", "restful services"]),
    "GraphQL": ("IT", ["graph ql"]),
    "Cybersecurity": ("IT", ["cyber security", "infosec"]),
    "Network Administration": ("IT", ["networking", "network admin"]),
    "Linux Administration": ("IT", ["linux sysadmin", "unix admin"]),
    "C++": ("IT", ["cpp", "c plus plus"]),
    "C#": ("IT", ["c sharp", "dotnet"]),
    "Django": ("IT", ["django framework"]),
    "Flask": ("IT", ["flask framework"]),
    "FastAPI": ("IT", ["fast api"]),
    "Spring Boot": ("IT", ["springboot", "spring framework"]),
    "Data Visualization": ("IT", ["dataviz", "visualizing data"]),
    "Power BI": ("IT", ["powerbi"]),
    "Tableau": ("IT", ["tableau software"]),
    "Excel": ("IT", ["ms excel", "microsoft excel"]),
    "Cloud Computing": ("IT", ["cloud infra", "cloud platforms"]),
    "Agile Methodology": ("IT", ["agile", "scrum"]),
    "Testing & QA": ("IT", ["software testing", "quality assurance"]),
    "Android Development": ("IT", ["android dev", "android apps"]),
    "iOS Development": ("IT", ["ios dev", "swift development"]),
    "Blockchain": ("IT", ["distributed ledger", "web3"]),
    "Computer Vision": ("IT", ["cv", "image processing"]),
    "Big Data": ("IT", ["hadoop", "spark ecosystem"]),
    "UI/UX Design": ("IT", ["ui design", "ux design"]),
    # ---- Manufacturing ----
    "CNC Machining": ("Manufacturing", ["cnc operation", "computer numerical control"]),
    "Welding": ("Manufacturing", ["arc welding", "welding techniques"]),
    "AutoCAD": ("Manufacturing", ["auto cad", "computer aided design"]),
    "SolidWorks": ("Manufacturing", ["solid works"]),
    "Quality Control": ("Manufacturing", ["qc", "quality assurance manufacturing"]),
    "Lean Manufacturing": ("Manufacturing", ["lean production", "lean six sigma"]),
    "Six Sigma": ("Manufacturing", ["6 sigma", "six-sigma"]),
    "Industrial Robotics": ("Manufacturing", ["robotics", "robotic automation"]),
    "PLC Programming": ("Manufacturing", ["programmable logic controllers", "plc"]),
    "Supply Chain Management": ("Manufacturing", ["scm", "supply chain"]),
    "Inventory Management": ("Manufacturing", ["stock management"]),
    "Hydraulics": ("Manufacturing", ["hydraulic systems"]),
    "Pneumatics": ("Manufacturing", ["pneumatic systems"]),
    "Electrical Wiring": ("Manufacturing", ["wiring", "electrical installation"]),
    "Machine Maintenance": ("Manufacturing", ["equipment maintenance", "preventive maintenance"]),
    "3D Printing": ("Manufacturing", ["additive manufacturing"]),
    "Sheet Metal Fabrication": ("Manufacturing", ["metal fabrication"]),
    "Forklift Operation": ("Manufacturing", ["forklift driving"]),
    "Health & Safety Compliance": ("Manufacturing", ["safety compliance", "ehs"]),
    "Injection Molding": ("Manufacturing", ["plastic molding"]),
    "Assembly Line Operations": ("Manufacturing", ["assembly line work"]),
    "ERP Systems (SAP)": ("Manufacturing", ["sap", "erp software"]),
    "Tool & Die Making": ("Manufacturing", ["tool and die"]),
    "Metallurgy": ("Manufacturing", ["metallurgical analysis"]),
    "Production Planning": ("Manufacturing", ["production scheduling"]),
    # ---- Healthcare ----
    "Patient Care": ("Healthcare", ["patient management", "bedside care"]),
    "Nursing": ("Healthcare", ["clinical nursing", "registered nursing"]),
    "Medical Coding": ("Healthcare", ["icd coding", "clinical coding"]),
    "Phlebotomy": ("Healthcare", ["blood draw", "venipuncture"]),
    "Pharmacology": ("Healthcare", ["pharmacy knowledge"]),
    "Electronic Health Records (EHR)": ("Healthcare", ["ehr systems", "emr"]),
    "Medical Billing": ("Healthcare", ["healthcare billing"]),
    "First Aid & CPR": ("Healthcare", ["cpr certification", "first aid"]),
    "Radiology": ("Healthcare", ["radiologic technology", "x-ray imaging"]),
    "Physiotherapy": ("Healthcare", ["physical therapy"]),
    "Clinical Research": ("Healthcare", ["clinical trials"]),
    "Medical Laboratory Technology": ("Healthcare", ["lab technology", "medical lab tech"]),
    "Infection Control": ("Healthcare", ["infection prevention"]),
    "Surgical Assistance": ("Healthcare", ["operating room assistance"]),
    "Anatomy & Physiology": ("Healthcare", ["human anatomy"]),
    "Telemedicine": ("Healthcare", ["telehealth"]),
    "Healthcare Management": ("Healthcare", ["hospital administration"]),
    "Mental Health Counseling": ("Healthcare", ["psychological counseling"]),
    "Dietetics & Nutrition": ("Healthcare", ["nutrition counseling"]),
    "Emergency Medical Services": ("Healthcare", ["ems", "paramedic skills"]),
    # ---- Retail ----
    "Point of Sale (POS) Systems": ("Retail", ["pos systems", "billing software"]),
    "Customer Service": ("Retail", ["customer support", "client service"]),
    "Visual Merchandising": ("Retail", ["merchandising", "store display"]),
    "Inventory Auditing": ("Retail", ["stock auditing"]),
    "Retail Sales": ("Retail", ["sales associate skills"]),
    "E-commerce Management": ("Retail", ["ecommerce", "online retail"]),
    "Digital Marketing": ("Retail", ["online marketing"]),
    "Social Media Marketing": ("Retail", ["smm", "social media management"]),
    "CRM Software": ("Retail", ["customer relationship management"]),
    "Cash Handling": ("Retail", ["cash management"]),
    "Loss Prevention": ("Retail", ["shrinkage control"]),
    "Warehouse Operations": ("Retail", ["warehousing"]),
    "Negotiation Skills": ("Retail", ["vendor negotiation"]),
    "Team Leadership": ("Retail", ["team management", "people management"]),
    "Order Fulfillment": ("Retail", ["order processing"]),
    "Product Merchandising": ("Retail", ["product placement"]),
    "SEO": ("Retail", ["search engine optimization"]),
    "Email Marketing": ("Retail", ["email campaigns"]),
    "Bookkeeping": ("Retail", ["basic accounting"]),
    "Communication Skills": ("Retail", ["verbal communication", "written communication"]),
}

OCCUPATIONS = [
    # (code, title, sector, [typical skill names])
    ("NCO-2131.01", "Software Developer", "IT", ["Python", "JavaScript", "React", "Node.js", "Git", "REST API Development"]),
    ("NCO-2131.02", "Data Scientist", "IT", ["Python", "Machine Learning", "Data Analysis", "SQL", "Deep Learning"]),
    ("NCO-2131.03", "DevOps Engineer", "IT", ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux Administration"]),
    ("NCO-2131.04", "Full Stack Developer", "IT", ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB"]),
    ("NCO-2131.05", "Cloud Engineer", "IT", ["AWS", "Azure", "Cloud Computing", "Docker", "Kubernetes"]),
    ("NCO-2131.06", "Cybersecurity Analyst", "IT", ["Cybersecurity", "Network Administration", "Linux Administration"]),
    ("NCO-2131.07", "QA Engineer", "IT", ["Testing & QA", "Agile Methodology", "SQL"]),
    ("NCO-2131.08", "Mobile App Developer", "IT", ["Android Development", "iOS Development", "Git"]),
    ("NCO-2131.09", "Data Engineer", "IT", ["Data Engineering", "SQL", "Big Data", "Python"]),
    ("NCO-2131.10", "UI/UX Designer", "IT", ["UI/UX Design", "Data Visualization", "Communication Skills"]),
    ("NCO-7223.01", "CNC Machine Operator", "Manufacturing", ["CNC Machining", "Quality Control", "Machine Maintenance"]),
    ("NCO-7212.01", "Welder", "Manufacturing", ["Welding", "Health & Safety Compliance", "Sheet Metal Fabrication"]),
    ("NCO-3115.01", "Mechanical Design Engineer", "Manufacturing", ["AutoCAD", "SolidWorks", "Production Planning"]),
    ("NCO-8121.01", "Industrial Robotics Technician", "Manufacturing", ["Industrial Robotics", "PLC Programming", "Electrical Wiring"]),
    ("NCO-3118.01", "Quality Control Inspector", "Manufacturing", ["Quality Control", "Six Sigma", "Lean Manufacturing"]),
    ("NCO-4321.01", "Supply Chain Coordinator", "Manufacturing", ["Supply Chain Management", "Inventory Management", "ERP Systems (SAP)"]),
    ("NCO-7233.01", "Maintenance Technician", "Manufacturing", ["Machine Maintenance", "Hydraulics", "Pneumatics"]),
    ("NCO-8211.01", "Assembly Line Operator", "Manufacturing", ["Assembly Line Operations", "Quality Control"]),
    ("NCO-7222.01", "Tool & Die Maker", "Manufacturing", ["Tool & Die Making", "Metallurgy", "CNC Machining"]),
    ("NCO-8332.01", "Forklift Operator", "Manufacturing", ["Forklift Operation", "Warehouse Operations"]),
    ("NCO-2221.01", "Registered Nurse", "Healthcare", ["Nursing", "Patient Care", "First Aid & CPR"]),
    ("NCO-3253.01", "Medical Coder", "Healthcare", ["Medical Coding", "Medical Billing", "Electronic Health Records (EHR)"]),
    ("NCO-3254.01", "Pharmacy Technician", "Healthcare", ["Pharmacology", "Medical Billing", "Customer Service"]),
    ("NCO-3212.01", "Medical Lab Technician", "Healthcare", ["Medical Laboratory Technology", "Phlebotomy", "Infection Control"]),
    ("NCO-2264.01", "Physiotherapist", "Healthcare", ["Physiotherapy", "Anatomy & Physiology", "Patient Care"]),
    ("NCO-3211.01", "Radiology Technician", "Healthcare", ["Radiology", "Patient Care", "Anatomy & Physiology"]),
    ("NCO-3256.01", "EMT / Paramedic", "Healthcare", ["Emergency Medical Services", "First Aid & CPR", "Patient Care"]),
    ("NCO-2263.01", "Nutritionist", "Healthcare", ["Dietetics & Nutrition", "Patient Care", "Communication Skills"]),
    ("NCO-2634.01", "Mental Health Counselor", "Healthcare", ["Mental Health Counseling", "Communication Skills"]),
    ("NCO-1342.01", "Healthcare Administrator", "Healthcare", ["Healthcare Management", "Electronic Health Records (EHR)"]),
    ("NCO-5223.01", "Retail Sales Associate", "Retail", ["Retail Sales", "Customer Service", "Point of Sale (POS) Systems"]),
    ("NCO-3339.01", "E-commerce Manager", "Retail", ["E-commerce Management", "Digital Marketing", "SEO"]),
    ("NCO-3339.02", "Digital Marketing Executive", "Retail", ["Digital Marketing", "Social Media Marketing", "SEO", "Email Marketing"]),
    ("NCO-4321.02", "Warehouse Supervisor", "Retail", ["Warehouse Operations", "Inventory Auditing", "Team Leadership"]),
    ("NCO-5222.01", "Visual Merchandiser", "Retail", ["Visual Merchandising", "Product Merchandising"]),
    ("NCO-3323.01", "Store Manager", "Retail", ["Team Leadership", "Inventory Auditing", "Customer Service", "Bookkeeping"]),
    ("NCO-3322.01", "Sales Executive", "Retail", ["Negotiation Skills", "CRM Software", "Communication Skills"]),
    ("NCO-4222.01", "Customer Support Representative", "Retail", ["Customer Service", "CRM Software", "Communication Skills"]),
    ("NCO-4311.01", "Bookkeeper", "Retail", ["Bookkeeping", "Excel", "Inventory Auditing"]),
    ("NCO-3312.01", "Loss Prevention Officer", "Retail", ["Loss Prevention", "Inventory Auditing", "Cash Handling"]),
]


def build(out_dir=None):
    out_dir = out_dir or os.path.dirname(__file__)
    skills_out = []
    for canon, (sector, variants) in SKILLS.items():
        skills_out.append({"canonical_name": canon, "sector": sector, "synonyms": variants})

    occ_out = []
    for code, title, sector, skills in OCCUPATIONS:
        occ_out.append({"code": code, "title": title, "sector": sector, "typical_skills": skills})

    with open(os.path.join(out_dir, "skills.json"), "w", encoding="utf-8") as f:
        json.dump(skills_out, f, indent=2)
    with open(os.path.join(out_dir, "occupations.json"), "w", encoding="utf-8") as f:
        json.dump(occ_out, f, indent=2)

    return skills_out, occ_out


if __name__ == "__main__":
    skills, occs = build()
    print(f"Wrote {len(skills)} skills and {len(occs)} occupations")
