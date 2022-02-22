# Backend build
FROM golang:1.17 as backend-build

ARG NEBRASKA_VERSION=""

ENV GOPATH=/go \
    GOPROXY=https://proxy.golang.org \
	GO111MODULE=on\
	CGO_ENABLED=0\ 
	GOOS=linux 

# We optionally allow to set the version to display for the image.
# This is mainly used because when copying the source dir, docker will
# ignore the files we requested it to, and thus produce a "dirty" build
# as git status returns changes (when effectively for the built source
# there's none).
ENV VERSION=${NEBRASKA_VERSION}

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./

RUN go mod download

COPY backend .

RUN make build

# Frontend build
FROM docker.io/library/node:15 as frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install 

COPY frontend ./

RUN make build

# Final Docker image 
FROM alpine:3.15.0

RUN apk update && \
	apk add ca-certificates tzdata

WORKDIR /nebraska

COPY --from=backend-build /app/backend/bin/nebraska ./
COPY --from=frontend-build /app/frontend/build/ ./static/

ENV NEBRASKA_DB_URL "postgres://postgres@postgres:5432/nebraska?sslmode=disable&connect_timeout=10"
EXPOSE 8000

USER nobody

CMD ["/nebraska/nebraska", "-http-static-dir=/nebraska/static"]
