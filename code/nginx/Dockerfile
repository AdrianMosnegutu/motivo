FROM nginx:alpine

RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out  /etc/nginx/ssl/cert.pem \
        -subj "/CN=motivo-studio.local/O=Motivo Studio/C=US" \
        -addext "subjectAltName=DNS:motivo-studio.local,DNS:localhost,IP:127.0.0.1"

COPY nginx.conf /etc/nginx/nginx.conf
