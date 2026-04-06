package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"syscall"

	"github.com/google/uuid"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func hasEnoughProcesses() bool {
	var rlimit syscall.Rlimit
	var RLIMIT_NPROC int

	// syscall doesn't have RLIMIT_NPROC constant, so just hardcode it
	// depending on OS
	if runtime.GOOS == "darwin" {
		RLIMIT_NPROC = 0x8
	} else {
		RLIMIT_NPROC = 0x6
	}

	err := syscall.Getrlimit(RLIMIT_NPROC, &rlimit)
	if err != nil {
		return false
	}

	// Count the current number of processes
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return false
	}
	count := 0
	for _, en := range entries {
		if en.IsDir() {
			if _, err := fmt.Scanf(en.Name(), "%d", new(int)); err == nil {
				count++
			}
		}
	}

	return uint64(count) < rlimit.Cur
}

func hasEnoughSpace(dir string, bytes uint64) bool {
	var stat syscall.Statfs_t

	err := syscall.Statfs(dir, &stat)
	if err != nil {
		return false
	}
	// Check available space. blocks * block size
	available := stat.Bavail * uint64(stat.Bsize)
	return available >= bytes
}

func hasFreePort() bool {
	// Assigns a free port if there is 1. Throws an err if there isn't one
	ln1, err := net.Listen("tcp", ":0")
	if err != nil {
		return false
	}
	defer ln1.Close()

	return true
}

func getResources(w http.ResponseWriter, r *http.Request) {
	// Make sure its a GET request
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	numFiles, err := strconv.Atoi(r.URL.Query().Get("n"))

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read the number of files: %v", err), http.StatusInternalServerError)
		return
	}

	if numFiles <= 0 {
		http.Error(w, "The number of files needs to be greater than 0", http.StatusBadRequest)
		return
	}

	ttlBytes, err := strconv.ParseUint(r.URL.Query().Get("b"), 10, 64)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read the bytes: %v", err), http.StatusInternalServerError)
		return
	}

	if ttlBytes <= 0 {
		http.Error(w, "The total amount of bytes needs to be greater than 0", http.StatusBadRequest)
		return
	}

	if !hasEnoughProcesses() || !hasEnoughSpace("/", ttlBytes) || !hasFreePort() {
		w.WriteHeader(http.StatusInsufficientStorage)
		return
	}

	id := uuid.New().String()
	filePath := getEnv("FILES_PATH", "")

	if filePath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "Interval server error. Please try again", http.StatusInternalServerError)
		return
	}

	tmpDir, err := os.MkdirTemp(filePath, id)
	if err != nil {
		log.Printf("Failed to make temp directory: %v", err)
		http.Error(w, "Interval server error. Please try again", http.StatusInternalServerError)
		return
	}

	// Do something with tmpDir so no error
	fmt.Printf(tmpDir)

	data := map[string]string{
		"id": id,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)

}

func handleRequests() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/request", getResources)
	return mux
}

func main() {
	// url := getEnv("URL", "localhost")
	port := getEnv("PORT", "3001")

	mux := handleRequests()

	fmt.Printf("Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
