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
import time



def load_config(config_path='config.json'):
    with open(config_path,'r') as f:
        return json(f)

class ForkingServer(socketserver.ForkingMixIn, socketserver.TCPServer):
    pass

class ClientHandler(socketserver.StreamRequestHandler):

    def handle(self):
        prefix = CONFIG.get("PATHS","tmpDir")
        curr_time = time.time()
        
        #Probably make the path a better name
        temp_dir = os.path.join(tempfile.gettempdir(), prefix, f"{curr_time}")
        os.makedirs(temp_dir, exist_ok=True)
        try:
            files = self.read_files(temp_dir)
            elf_file_path = self.link_files(files,temp_dir)
            
            #Get the path
            hex_file_path = self.convert_file(elf_file_path, temp_dir)
            
            #Get the hex file name
            hex_file = os.path.basename(hex_file_path)
            
            output_dir = CONFIG.get("PATHS","outputDir")
            destination = os.path.join(output_dir, f"{curr_time}", hex_file)
            os.makedirs(destination, exist_ok=True)
            
            #Makes sure the hex file is in the destination
            shutil.copy(hex_file_path, destination)
            
            self.wfile.write(("Successfully compiled the arduino code").encode("utf-8")) 
        except Exception as ex:
            self.wfile.write((f"Error on compiling the arduino code: {ex}").encode("utf-8"))
            print(f"Failed: {ex}")
        finally:
            #Remove temporary file
            shutil.rmtree(temp_dir)
        
        
    def read_files(self, temp_dir):    
        #Getting the number of files
        count_data = self.rfile.read(4)
        if not count_data:
            return []
        
        count = struct.unpack(">I", count_data)[0]
        if count == 0:
            return []
        
        files = []
        for _ in range(count): 
            chunk_size = 4096
            #Getting the length of the file name
            filename_len_data = self.rfile.read(4)
            filename_len = struct.unpack(">I", filename_len_data)[0]
            
            
            filename = self.rfile.read(filename_len).decode("utf-8")
            
            #Getting the size of the file
            file_size_data = self.rfile.read(8)
            file_size = struct.unpack(">Q", file_size_data)[0]
            
            file_path = os.path.join(temp_dir, filename)
            
            #Read the file in chunks
            remaining_size = file_size
            with open(file_path, "wb") as f:
                while remaining_size > 0:
                    if remaining_size < chunk_size:
                        chunk_size = remaining_size
                    #Reading chunks of the file
                    chunk_data = self.rfile.read(chunk_size)
                    
                    if not chunk_data:
                        break
                    
                    f.write(chunk_data)
                    remaining_size -= len(chunk_data)
            
            files.append(file_path)
            
        return files
        
        
    def link_files(self, files, temp_dir):
        #Right now just keep it as output.elf
        output_elf = os.path.join(temp_dir, "output.elf")
        
        #Change this in the future to allow for custom -mmcu and -DF_CPU
        cmd = ["avr-gcc", "-mmcu=atmega328p", "-Os", "-DF_CPU=16000000UL", "-o", output_elf] + files
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir)

        if result.returncode != 0:
            raise Exception(f"GCC Failed:\n{result.stderr}")
        
        return output_elf

    def convert_file(self, elf_file_path, temp_dir):
        hex_file = elf_file_path.replace(".elf",".hex")
        
        cmd = ["avr-objcopy","-O","ihex","-R",".eeprom", elf_file_path, hex_file]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir)
        
        if result.returncode != 0:
            raise Exception(f"AVR Objcopy Failed:\n{result.stderr}")
        
        return hex_file
        
        
def main():
    #Fades the "Address already on use" issue
    ForkingServer.allow_reuse_address = True
    
    host = socket.gethostname()
    port = 3000
    
    print(f"Server is listening {host}:{port}")
    
    with ForkingServer((host, port), ClientHandler) as server:
        server.serve_forever()


if __name__ == "__main__":
    CONFIG = configparser.ConfigParser()
    CONFIG.read("config.ini")
    main()
