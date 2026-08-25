FROM python:3.12-slim
WORKDIR /app
COPY services/common/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/common/app.py .
ENV SERVICE_NAME=recommendation-service SERVICE_VERSION=v1 PORT=8000
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
