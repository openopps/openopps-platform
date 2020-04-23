FROM node:6.11.1

RUN apt-get update && \
  apt-get install -y postgresql-client graphicsmagick

WORKDIR app

COPY package.json /app/package.json
COPY tools/docker/wait-for-migrate-db-container.sh /

RUN npm install

