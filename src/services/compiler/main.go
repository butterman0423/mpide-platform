package main

import (
	"backend/routes"
	"backend/utilites"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/request", routes.GetResources)
	mux.HandleFunc("POST /v1/start/{id}", routes.StartCompile)
	mux.HandleFunc("GET /v1/start/{id}", routes.StreamCompileLogs)
	mux.HandleFunc("DELETE /v1/clean/{id}", routes.CleanUpResource)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := utilites.GetEnv("PORT", "3001")

	// Create .log file here
	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Fatalf("Missing FILES_PATH environment variable")
	}
	logDir := filepath.Join(filesPath, ".log")
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		err := os.MkdirAll(logDir, 0755)
		if err != nil {
			log.Fatalf("Critical: Cannot create log directory. Check volume permissions: %v", err)
		}
	}

	mux := handleRequests()

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
