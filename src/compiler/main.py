import socket
import socketserver
import tempfile
import json
import os
import struct
import threading
import configparser
import subprocess
import shutil




def load_config(config_path='config.json'):
    with open(config_path,'r') as f:
        return json(f)

class ForkingServer(socketserver.ForkingMixIn, socketserver.TCPServer):
    pass

class ClientHandler(socketserver.StreamRequestHandler):

    def handle(self):
        prefix = CONFIG.get("PATHS","tmpDir")
        
        #Probably make the path a better name
        temp_dir = os.path.join(tempfile.gettempdir, prefix, f"{os.getpid()}")
        os.makedirs(temp_dir, exist_ok=True)
        try:
            files = self.read_files(temp_dir)
            elf_file = self.link_files(files,temp_dir)
            hex_file = self.convert_file(elf_file, temp_dir)
            
            output_dir = CONFIG.GET("PATHS","outputDir")
            destination = os.path.join(output_dir, f"{os.getpid()}", hex_file)
            shutil.copy(hex_file, destination)
            
            self.wfile.write(("Successfully compiled the arduino code").encode("utf-8"))
        except Exception as ex:
            self.wfile.write((f"{ex}").encode("utf-8"))
            print(f"Failed: {ex}")
        finally:
            shutil.rmtree(temp_dir)
        
        
    def read_files(self, temp_dir):
        chunk_size = 4096
        
        #Getting the number of files
        count_data = self.rfile(4)
        if not count_data:
            return []
        
        count = struct.unpack(">I", count_data)[0]
        if count == 0:
            return []
        
        files = []
        for _ in range(count): 
            filename_len_data = self.rfile(4)
            filename_len = struct.unpack(">I", filename_len_data)[0]
            
            filename = self.rfile(filename_len).decode("utf-8")
            
            file_size_data = self.rfile(8)
            file_size = struct.unpack(">Q", file_size_data)[0]
            
            file_path = os.path.join(temp_dir, filename)
            
            #Read the file in chunks
            remaining_size = file_size
            with open(file_path, "wb") as f:
                while remaining_size > 0:
                    if remaining_size < chunk_size:
                        chunk_size = remaining_size
                    
                    chunk_data = self.rfile(chunk_size)
                    
                    if not chunk_data:
                        break
                    
                    f.write(chunk_data)
                    remaining_size -= len(chunk_data)
            
            files.append(file_path)
            
        return files
        
        
    def link_files(self, files, temp_dir):
        #Right now just keep it as output.elf
        output_elf = os.path.join(temp_dir, "output.elf")
        
        cmd = ["avr-gcc", "-mmcu=atmega328p", "-Os", "-DF_CPU", "16000000UL", "-o", output_elf] + files
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir)

        if result.returncode != 0:
            raise Exception(f"GCC Failed:\n{result.stderr}")
        
        return output_elf

    def convert_file(self, elf_file, temp_dir):
        hex_file = elf_file.replace(".elf",".hex")
        
        cmd = ["avr-objcopy","-O","ihex","-R",".eeprom", elf_file, hex_file]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir)
        
        if result.returncode != 0:
            raise Exception(f"AVR Objcopy Failed:\n{result.stderr}")
        
        return hex_file
        
        
def main():
    #Fades the "Address already on use" issue
    ForkingServer.allow_reuse_address = True
    
    #Assuming we're using IPv4
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    host = socket.gethostname()
    port = 3000
    
    server_socket.bind((host, port))
    print(f"Server is listening {host}:{port}")
    
    with open(server_socket, None) as server:
        server.serve_forever(ClientHandler)


if __name__ == "__main__":
    CONFIG = configparser.ConfigParser()
    CONFIG.read("config.ini")
    main()
