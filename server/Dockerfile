# === STAGE 1: Build Stage (Handles dependencies and package installation) ===
# Use the slim image for efficiency and stability
FROM python:3.11-slim-bookworm AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install any necessary system dependencies for building packages (e.g., cryptography, numpy)
# In this case, we'll install one common build tool.
# If you don't use packages that require compiling, you can skip this block.
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/server

# Copy only the requirements file first to take advantage of Docker's caching
COPY requirements.txt .

# Install dependencies
# We use the --no-cache-dir flag to keep the image small
RUN pip install --no-cache-dir -r requirements.txt
# === STAGE 2: Production Stage (Minimal image for running the app) ===
# Start from a clean, even smaller image with Python installed
# This is called the 'runtime' image.
FROM python:3.11-slim-bookworm AS final

# Set the working directory again
WORKDIR /usr/src/server

# Copy the installed packages from the 'builder' stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy your application code
# The dot '.' refers to the current build context (your project root)
COPY . .

# Ensure our app package path is resolvable inside the container
ENV PYTHONPATH=/usr/src/app

# Expose the port that FastAPI will run on (default is 80)
EXPOSE 8000

# The command to run your FastAPI application using Uvicorn
# Replace 'main:app' with the correct entry point (e.g., 'your_main_file:your_FastAPI_object')
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
