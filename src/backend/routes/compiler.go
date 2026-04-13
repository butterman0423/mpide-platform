package routes

import (
	"backend/utilites"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"encoding/json"
)

func RequestCompiler(w http.ResponseWriter, r *http.Request) {
	// Make sure its a POST request
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	CompilerUrl := utilites.GetEnv("COMPILER_URL", "")
	if CompilerUrl == "" {
		log.Print("Missing COMPILER_URL environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	requestQuery := fmt.Sprintf("%s/v1/request", CompilerUrl)
	resp, err := http.Post(requestQuery, "application/json", bytes.NewBuffer(payload))

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to request compiler: %v", err), http.StatusInternalServerError)
		return
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Failed to close compiler response body: %v", err)
		}
	}()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data from compiler: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)

	if _, err := w.Write(body); err != nil {
		http.Error(w, "Failed to make reponse body", http.StatusInternalServerError)
	}
}

type ProjectFile struct {
	FileName  string `json:"file_name"`
	Extension string `json:"extension"`
	Content   string `json:"content"`
}

func SubmitCompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "the method used is not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
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
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var files []ProjectFile
	if err := json.NewDecoder(r.Body).Decode(&files); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, f := range files {
		if f.FileName == "" || f.Extension == "" {
			http.Error(w, "the file must have a file_name and extension", http.StatusBadRequest)
			return
		}
		if f.Extension != ".c" && f.Extension != ".cpp" && f.Extension != ".h" {
			http.Error(w, fmt.Sprintf("invalid extension: %s", f.Extension), http.StatusBadRequest)
			return
		}
		content := strings.TrimSpace(f.Content)
		filePath := fmt.Sprintf("%s/%s%s", dirPath, f.FileName, f.Extension)
		if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
			log.Printf("failed to write file %s: %v", filePath, err)
			http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
			return
		}
	}

	compilerUrl := utilites.GetEnv("COMPILER_URL", "")
	if compilerUrl == "" {
		log.Print("Missing COMPILER_URL environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	startQuery := fmt.Sprintf("%s/v1/start/%s", compilerUrl, id)
	resp, err := http.Post(startQuery, "application/json", bytes.NewBuffer([]byte{}))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to start compile job: %v", err), http.StatusInternalServerError)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Failed to close compiler response body: %v", err)
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read compiler response: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	if _, err := w.Write(body); err != nil {
		log.Printf("Failed to write response body: %v", err)
	}
}