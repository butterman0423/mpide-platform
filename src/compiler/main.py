import socket
import tempfile
import json
import os
import struct
import threading


def load_config(config_path='config.json'):
    with open(config_path,'r') as f:
        return json(f)

def read_files(conn, tmp_directory):
    chunk_size = 4096
    with conn:
        #Number of files
        #Get the bytes
        files_count_data = conn.recv(4)
        if not files_count_data:
            return []
        
        #Convert byte data to usable python data
        #I for unsigned integer
        files_count = struct.unpack(">I", files_count_data)[0]
        if files_count == 0:
            return []

        for _ in range(files_count):
            filename_length = struct.unpack(">I", conn.recv(4))[0]
            filename = conn.recv(filename_length).decode("utf-8")
            
            #Q for unsigned long
            file_size = struct.unpack(">Q", conn.recv(8))[0]
            
            file_path = os.path.join(tmp_directory, filename)
            
            #Read the file in chunks
            with open(file_path, "wb") as f:
                remaining_size = file_size
                while remaining_size > 0:
                    
                    if remaining_size < chunk_size:
                        chunk_size = remaining_size
                    
                    chunk_data = conn.recv(chunk_size)
                    
                    if not chunk_data:
                        break
                    
                    f.write(chunk_data)
                    remaining_size -= len(chunk_data)
            
            print(f"Read {filename}. Size: {file_size}")
        
        
def make_object_files(tmp):
    #TODO: run avr-gcc on all of the .c files, and save them to the tmp directory
    pass

def link_files():
    #TODO: run avr-gcc -mmcu {chip archieture} {all of the .o files} {.elf file}
    pass


def compile_code():
    pass


def handle_client(conn, tmp):
    try:
        read_files(conn, tmp)
    except Exception as e:
        print(f"{e}\n")
        
def main():
    #Assuming we're using IPv4
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    host = socket.gethostname()
    port = 3000
    config = load_config()
    tmp_directory = config["temp_directory"]
    try:
        server_socket.bind((host, port))
        print(f"Server is listening {host}:{port}")
        
        
        #Right now listen for 5 clients
        server_socket.listen(5)
        
        while True:
            client_socket, addr = server_socket.accept()
            print(f"Connected to {addr}")
            #Probably needs to be more secure
            tmp_directory = os.path.join(tmp_directory, f"{addr}")
            
            thread = threading.Thread(target=handle_client, args=(client_socket, tmp_directory))
            thread.start()
            
    except Exception as e:
        print(f"{e}\n")
    finally:
        server_socket.close()


if __name__ == "__main__":
    main()
