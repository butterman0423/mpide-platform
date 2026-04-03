package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func requestCompiler(w http.ResponseWriter, r *http.Request) {
	// Make sure its a GET request
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	resp, err := http.Get("localhost:3001/v1/request")

	if err != nil {
		log.Printf("Request failure: %v", err)
		http.Error(w, "Failed to request compiler", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		log.Printf("Failed to read response body: %v", err)
		http.Error(w, "Failed to read data from compiler", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/compiler/request", requestCompiler)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := getEnv("PORT", "3000")

	mux := handleRequests()

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
