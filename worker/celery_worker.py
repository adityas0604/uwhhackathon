import os
import json
import mimetypes
import requests
from celery import Celery
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Celery app setup
app = Celery('worker', broker='redis://localhost:6379/0')

# Read Unstract API config
UNSTRUCT_API_URL = os.getenv("UNSTRACT_API_URL")
UNSTRUCT_API_KEY = os.getenv("UNSTRACT_API_KEY")

# Validate presence
if not UNSTRUCT_API_URL or not UNSTRUCT_API_KEY:
    raise ValueError("Missing UNSTRACT_API_URL or UNSTRACT_API_KEY in .env file")

# Define key paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_NEW_DIR = os.path.join(BASE_DIR, 'backend', 'uploads', 'new')
UPLOAD_PROCESSED_DIR = os.path.join(BASE_DIR, 'backend', 'uploads', 'processed')
STRUCTURED_OUTPUTS_PATH = os.path.join(BASE_DIR, 'backend', 'uploads', 'structuredOutputs.json')

@app.task
def process_file(filename):
    try:
        file_path = os.path.join(UPLOAD_NEW_DIR, filename)

        # Ensure file exists
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return

        # Step 1: Prepare form data
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        with open(file_path, 'rb') as f:
            files = {
                'files': (filename, f, mime_type)
            }
            data = {
                'timeout': '300',
                'include_metadata': 'false'
            }
            headers = {
                'Authorization': f"Bearer {UNSTRUCT_API_KEY}"
            }

            response = requests.post(UNSTRUCT_API_URL, headers=headers, files=files, data=data)

        # Step 2: Parse response
        try:
            extracted = response.json()
        except Exception as e:
            print(f"❌ Failed to parse JSON response: {e}")
            extracted = {
                "error": "Invalid JSON from Unstract",
                "raw": response.text
            }

        if response.status_code != 200:
            print(f"❌ Unstract API error {response.status_code}: {response.text}")

        # Step 3: Move file to processed
        processed_path = os.path.join(UPLOAD_PROCESSED_DIR, filename)
        with open(file_path, 'rb') as f_in, open(processed_path, 'wb') as f_out:
            f_out.write(f_in.read())

        # Step 4: Load structuredOutputs.json
        if os.path.exists(STRUCTURED_OUTPUTS_PATH):
            with open(STRUCTURED_OUTPUTS_PATH) as f:
                data = json.load(f)
        else:
            data = []

        # Step 5: Append result
        data.append({
            "backendFilename": filename,
            "originalFilename": filename,
            "extractedData": extracted
        })

        with open(STRUCTURED_OUTPUTS_PATH, 'w') as f:
            json.dump(data, f, indent=2)

        # Step 6: Cleanup
        os.remove(file_path)

        print(f"✅ Processed and saved output for {filename}")

    except Exception as e:
        print(f"❌ Exception while processing {filename}: {e}")
