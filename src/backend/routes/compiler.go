package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type ReqCompiler struct {
	NumFiles   int `json:"num_files"`
	TotalBytes int `json:"total_bytes"`
}

func RequestCompiler(w http.ResponseWriter, r *http.Request) {
	// Make sure its a POST request
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var rc ReqCompiler

	err := json.NewDecoder(r.Body).Decode(&rc)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	numFiles := rc.NumFiles
	ttlBytes := rc.TotalBytes

	requestQuery := fmt.Sprintf("http://compiler-ms:3001/v1/request?n=%d&b=%d", numFiles, ttlBytes)
	resp, err := http.Get(requestQuery)

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
