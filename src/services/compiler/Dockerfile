
ARG GO_VERSION
# Stage 1: Build
FROM golang:${GO_VERSION}-alpine AS builder

ARG USERNAME=ubuntu
ARG CWD=/home/${USERNAME}/app
WORKDIR ${CWD}

COPY go.mod ./
RUN go mod download

COPY . .

RUN go build -ldflags="-s -w" -o compiler .


# Stage 2: Runtime
FROM ubuntu:22.04

ARG GO_VERSION
ARG USER_GID
ARG GRP_PERMS
ARG FS_PATH
ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG CWD=/home/${USERNAME}/app

WORKDIR ${CWD}
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME


ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y \
    golang-${GO_VERSION} \
    gcc-avr \
    avr-libc \
    avrdude
ENV PATH=$PATH:/usr/lib/go-${GO_VERSION}/bin

# Expose Important ENV fields for Program
ENV FILES_PATH=${FS_PATH}


RUN mkdir -p ${FS_PATH} \
    && chmod ${GRP_PERMS} ${FS_PATH} \
    && chgrp ${USER_GID} ${FS_PATH} 

USER $USERNAME

COPY --from=builder --chown=${USER_UID}:${USER_GID} ${CWD}/compiler ./compiler

EXPOSE 3001
ENTRYPOINT [ "./compiler" ]
