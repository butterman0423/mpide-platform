package routes

import (
	"backend/utilites"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
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
		http.Error(w, "Interval server error. Please try again", http.StatusInternalServerError)
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
