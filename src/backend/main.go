package main

import (
	"backend/routes"
	"backend/utilites"
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	// Sanity Check
	mux.HandleFunc("/compiler/request", routes.RequestCompiler)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := utilites.GetEnv("PORT", "3000")

	mux := handleRequests()

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
