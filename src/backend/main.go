package main

import (
	"backend/routes"
	testroutes "backend/test/routes"
	"backend/utilites"
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()

	// Testing routes
	mux.HandleFunc("GET /test/led", testroutes.SendTest_LED)

	// Sanity Check
	mux.HandleFunc("POST /compiler/request", routes.RequestCompiler)
	mux.HandleFunc("POST /compiler/j/{id}", routes.SubmitCompile)
	mux.HandleFunc("GET /compiler/j/{id}", routes.RetrieveExecutable)
	mux.HandleFunc("GET /compiler/poll", routes.ListenToCompiler)
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
