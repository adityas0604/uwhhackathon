# 📁 Document Processing Platform (CDIS × Endeavor AI Hackathon)

This is a full-stack document processing app built for the CDIS × Endeavor AI Hackathon. It allows users to upload real-world documents (like purchase orders), extract structured data using Unstruct AI, and manually verify or edit the output.

Note: Since it is a private repo, I can directly used the keys instead of saving it in a .env file. This will save the time for the judges.

---

## 🚀 Features

- Upload PDFs, PNGs, DOCX, and other common document formats
- Process files using Unstract AI (`/extractdata/` endpoint)
- View and trigger processing from the Progress page
- Verify, edit, or reject extracted fields on the Verification page
- Re-send a document for reprocessing if needed
- One-time landing animation for a polished intro
- Fully local — all data is stored and handled on your machine

---

## 🧰 Tech Stack

| Layer        | Technology                  |
|--------------|-----------------------------|
| Frontend     | React, React-Bootstrap, Axios, React Router |
| Backend      | Node.js, Express, Multer, Axios |
| AI Service   | [Unstract AI] |
| Storage      | Local filesystem (`uploads/`, `structuredOutputs.json`) |

## Installation
```bash
cd backend
npm install
# Create uploads folder structure if it already doesn't exist
mkdir -p uploads/new uploads/processed
echo "[]" > uploads/structuredOutputs.json
echo "[]" > uploads/uploadedFiles.json

npm index.js

cd ../frontend
npm install

npm run dev
```





