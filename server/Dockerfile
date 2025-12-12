# === STAGE 1 ===
FROM python:3.11-slim-bookworm AS builder

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


# === STAGE 2 ===
FROM python:3.11-slim-bookworm AS final

WORKDIR /usr/src

COPY --from=builder /usr/local/lib/python3.11/site-packages \
                    /usr/local/lib/python3.11/site-packages

# Copy your code into /usr/src/server
COPY . /usr/src/server

# Add server folder to PYTHONPATH
ENV PYTHONPATH=/usr/src/server

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
