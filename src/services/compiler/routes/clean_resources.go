package routes

import (
	"backend/utilites"
	"errors"
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

	id := r.PathValue("id")
	if id == "" || strings.Contains(id, "..") || strings.Contains(id, "/") || strings.Contains(id, "\\") {
		http.Error(w, "invalid or missing id", http.StatusBadRequest)
		return
	}

	if v, ok := compileJobs.Load(id); ok {
		compileJobs.Delete(id)
		j := v.(*compileJob)
		j.mu.Lock()
		if j.cmd != nil && j.cmd.Process != nil {
			if err := j.cmd.Process.Kill(); err != nil && !errors.Is(err, os.ErrProcessDone) {
				log.Printf("clean %s: kill compile process: %v", id, err)
			}
		}
		j.mu.Unlock()
	}

	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	dirPath := filepath.Join(filesPath, id)
	if err := os.RemoveAll(dirPath); err != nil {
		log.Printf("Failed to delete directory: %v", err)
		http.Error(w, fmt.Sprintf("Failed to delete directory for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	stdoutPath := filepath.Join(filesPath, ".log", fmt.Sprintf("%s-out.txt", id))
	if err := os.Remove(stdoutPath); err != nil && !os.IsNotExist(err) {
		log.Printf("Failed to delete stdout file: %v", err)
		http.Error(w, fmt.Sprintf("Failed to delete stdout file for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	stderrPath := filepath.Join(filesPath, ".log", fmt.Sprintf("%s-err.txt", id))
	if err := os.Remove(stderrPath); err != nil && !os.IsNotExist(err) {
		log.Printf("Failed to delete stderr file: %v", err)
		http.Error(w, fmt.Sprintf("Failed to delete stderr file for %s: %v", id, err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
