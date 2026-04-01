FROM ubuntu:22.04

ARG USER_GID
ARG GRP_PERMS
ARG GO_VERSION
ARG FS_PATH

ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG CWD=/home/${USERNAME}/app

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \ 
    apt-get install -y golang-${GO_VERSION}

ENV PATH=$PATH:/usr/lib/go-${GO_VERSION}/bin

RUN mkdir -p ${FS_PATH}
RUN chmod ${GRP_PERMS} ${FS_PATH}
RUN chgrp ${USER_GID} ${FS_PATH}

USER $USERNAME

WORKDIR ${CWD}
COPY . ${CWD}

# Expose Important ENV fields for Program
ENV FILES_PATH=${FS_PATH}

EXPOSE 3000
ENTRYPOINT [ "go", "run", "." ]
