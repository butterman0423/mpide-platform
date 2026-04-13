package routes

import (
	"backend/utilites"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

func StartCompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract :id from path e.g. /v1/start/some-uuid
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	dirPath := fmt.Sprintf("%s/%s", filesPath, id)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		log.Printf("Failed to read directory %s: %v", dirPath, err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	var sourceFiles []string
	for _, entry := range entries {
		ext := filepath.Ext(entry.Name())
		if ext == ".c" || ext == ".cpp" {
			sourceFiles = append(sourceFiles, entry.Name())
		}
	}

	if len(sourceFiles) == 0 {
		http.Error(w, "There is no source files found to compile", http.StatusBadRequest)
		return
	}

	args := append([]string{"-mmcu=atmega328p", "-Wall", "-I", "./", "-o", "main.elf"}, sourceFiles...)
	cmd := exec.Command("avr-gcc", args...)
	cmd.Dir = dirPath
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		log.Printf("Compilation failed for id %s: %v\nOutput: %s", id, err, string(output))
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Compilation failed:\n%s", string(output))
		return
	}
	
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Compilation successful!")
}