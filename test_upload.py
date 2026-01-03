from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

pdf_path = r"backend\uploads\3e009323-5998-41c1-ae05-849cec928950_dataset_building_synap_sense.pdf"

with open(pdf_path, "rb") as f:
    files = {"file": ("test.pdf", f, "application/pdf")}
    resp = client.post("/upload", files=files)
    print("status_code:", resp.status_code)
    try:
        print(resp.json())
    except Exception as e:
        print("Response text:", resp.text)
