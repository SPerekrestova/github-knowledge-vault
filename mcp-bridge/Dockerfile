# MCP Bridge Dockerfile
FROM python:3.10-slim

# Install Docker CLI (needed to spawn MCP Server containers)
RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 app && \
    chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 3001

# Set Python to unbuffered mode
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]
