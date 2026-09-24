FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies required for LightGBM, UMAP, HDBSCAN, and C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (drastically reduces image size from ~3GB to ~300MB)
RUN pip install --no-cache-dir torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu

# Copy dependencies
COPY requirements.txt .

# Install dependencies excluding torch (already installed with CPU wheels)
RUN grep -v "^torch==" requirements.txt > reqs_no_torch.txt && \
    pip install --no-cache-dir -r reqs_no_torch.txt

# Copy application source code
COPY . .

# Generate synthetic datasets if needed
RUN python -c "from app.data.synthetic.generate_all import generate_all_datasets; generate_all_datasets()" || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
