#!/usr/bin/env sh

until nc -z "${RABBITMQ_HOST:-rabbitmq}" "${RABBITMQ_PORT:-5672}"; do
  echo "$(date) - waiting for rabbitmq..."
  sleep 5
done

gradle run