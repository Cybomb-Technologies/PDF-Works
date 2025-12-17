FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for OpenCV and PaddlePaddle
RUN apt-get update && apt-get install -y \
    libgl1 \
    libgomp1 \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Create directory for model downloads (optional but good for caching)
RUN mkdir -p /root/.paddleocr

# Expose port
EXPOSE 8000

# Start the server
CMD ["python", "app.py"]
