package main

import (
	"backend/routes"
	"backend/utilites"
	"fmt"
	"log"
	"net/http"
)

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/request", routes.GetResources)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := utilites.GetEnv("PORT", "3001")

	mux := handleRequests()

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
