FROM ubuntu:22.04

ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG GO_VERSION=1.22
ARG CWD=/home/${USERNAME}/app

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \ 
    apt-get install -y golang-${GO_VERSION}

ENV PATH=$PATH:/usr/lib/go-${GO_VERSION}/bin

USER $USERNAME

WORKDIR ${CWD}
COPY . ${CWD}

EXPOSE 3001
ENTRYPOINT [ "go", "run", "." ]
