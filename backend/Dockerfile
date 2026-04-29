FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD gunicorn spotter_log.wsgi --bind 0.0.0.0:$PORT
