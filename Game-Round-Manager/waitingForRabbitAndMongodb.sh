#!/usr/bin/env sh

until nc -z "${RABBITMQ_HOST:-rabbitmq}" "${RABBITMQ_PORT:-5672}"; do
  echo "$(date) - waiting for rabbitmq..."
  sleep 5
done

until nc -z "${MONGO:-mongo-game}" "${MONGODB_PORT:-27017}"; do
  echo "$(date) - waiting for mongo..."
  sleep 5
done

gradle run -PclassToExecute=$1