package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/rs/cors"
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

	numFiles := r.URL.Query().Get("n")
	ttlBytes := r.URL.Query().Get("b")

	requestQuery := fmt.Sprintf("http://compiler-ms:3001/v1/request?n=%s&b=%s", numFiles, ttlBytes)
	resp, err := http.Get(requestQuery)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to request compiler: %v", err), http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()

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

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/compiler/request", requestCompiler)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := getEnv("PORT", "3000")

	mux := handleRequests()

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
