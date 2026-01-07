
FROM ubuntu:22.04

WORKDIR /app

#Installing python and avrdude
RUN apt-get update && apt-get install -y avrdude gcc-avr avr-libc binutils-avr avrdude gdb-avr

COPY . /app

EXPOSE 3000

ENTRYPOINT ["python3", "main.py"]


