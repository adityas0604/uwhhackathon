# worker/run_task.py

import sys
from celery_worker import process_file

if len(sys.argv) != 2:
    print("Usage: python3 run_task.py <filename>")
    sys.exit(1)

filename = sys.argv[1]
process_file.delay(filename)
print(f"✅ Celery task queued for: {filename}")
