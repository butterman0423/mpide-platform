import socket
import tempfile
import json
import os




def load_config(config_path='config.json'):
    with open(config_path,'r') as f:
        return json(f)

def read_files(conn):
    #TODO: Read the files from the client socket
    pass

def make_object_files(file = None):
    #TODO: run avr-gcc on all of the .c files, and save them to the tmp directory
    if not file:
        return
    pass

def link_files():
    #TODO: run avr-gcc -mmcu {chip archieture} {all of the .o files} {.elf file}
    pass


def compile_code():
    pass

def main():
    #Assuming we're using IPv4
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    host = socket.gethostname()
    port = 3000
    try:
        server_socket.bind((host, port))
        print(f"Server is listening {host}:{port}")
        server_socket.listen(5)
        
        while True:
            client_socket, addr = server_socket.accept()
            print(f"Connected to {addr}")
            
            
    
    
    
    except Exception as e:
        print(f"{e}\n")
    finally:
        server_socket.close()
    
    print("Hello from compiler!")


if __name__ == "__main__":
    main()
