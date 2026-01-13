
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
#Allow for printing in main.py
ENV PYTHONUNBUFFERED=1

#Installing python and avrdude
RUN apt-get update &&           \
    apt-get install -y          \
        python3                 \
        avrdude                 \
        gcc-avr                 \
        avr-libc                \
        binutils-avr            \
        avrdude                 \
        gdb-avr &&              \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

EXPOSE 3000

ENTRYPOINT ["python3", "main.py"]


