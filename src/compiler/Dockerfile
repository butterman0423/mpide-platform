
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

#Installing python and avrdude
RUN apt-get update && apt-get install -y avrdude gcc-avr avr-libc binutils-avr avrdude gdb-avr

WORKDIR /app

COPY main.py /usr/local/bin/main.py

RUN chmod +X /usr/local/bin/main.py

EXPOSE 3000

ENTRYPOINT ["python3", "main.py"]


