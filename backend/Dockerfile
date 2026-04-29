FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD python manage.py migrate && gunicorn spotter_log.wsgi --bind 0.0.0.0:$PORT
