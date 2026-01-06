import socket
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
            print(f"Connected to {client_socket.getpeername()} from {addr}")
    
    
    
    except Exception as e:
        print(f"{e}\n")
    finally:
        server_socket.close()
    
    print("Hello from compiler!")


if __name__ == "__main__":
    main()
