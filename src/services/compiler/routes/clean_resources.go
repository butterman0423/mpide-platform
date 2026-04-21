package routes

import (
	"backend/utilites"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func CleanUpResource(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" || strings.Contains(id, "..") || strings.Contains(id, "/") || strings.Contains(id, "\\") {
		http.Error(w, "invalid or missing id", http.StatusBadRequest)
		return
	}

	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	dirPath := filepath.Join(filesPath, id)
	if err := os.RemoveAll(dirPath); err != nil {
		log.Print("Failed to delete directory")
		http.Error(w, fmt.Sprintf("Failed to delete directory for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	// Delete stdout and stderr files
	stdoutPath := filepath.Join(filesPath, ".log", fmt.Sprintf("%s-out.txt", id))
	if err := os.Remove(stdoutPath); err != nil {
		log.Print("Failed to delete stdout file")
		http.Error(w, fmt.Sprintf("Failed to delete stdout file for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	stderrPath := filepath.Join(filesPath, ".log", fmt.Sprintf("%s-err.txt", id))
	if err := os.Remove(stderrPath); err != nil {
		log.Print("Failed to delete stderr file")
		http.Error(w, fmt.Sprintf("Failed to delete stderr file for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)

}
