#!/bin/sh
# Generar configuración de runtime con variables de entorno
cat <<EOF > /usr/share/nginx/html/config.js
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3001}"
};
EOF

# Iniciar nginx
exec nginx -g "daemon off;"
