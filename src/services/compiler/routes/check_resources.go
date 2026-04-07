package routes

import (
	"backend/utilites"
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

// Checking resources functions
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

	// Gets the current amount of processes iirc
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

	defer func() {
		if err := ln1.Close(); err != nil {
			log.Printf("Failed to close the TCP port: %v", err)
		}
	}()

	return true
}

// Remember that this is a sanity check.
func GetResources(w http.ResponseWriter, r *http.Request) {
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

	filePath := utilites.GetEnv("FILES_PATH", "")
	if filePath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "Interval server error. Please try again", http.StatusInternalServerError)
		return
	}

	if !hasEnoughProcesses() || !hasEnoughSpace(filePath, ttlBytes) || !hasFreePort() {
		w.WriteHeader(http.StatusInsufficientStorage)
		return
	}

	id := uuid.New().String()

	err = os.Mkdir(fmt.Sprintf("%s/%s", filePath, id), 0774)
	if err != nil {
		log.Printf("Failed to make temp directory: %v", err)
		http.Error(w, "Interval server error. Please try again", http.StatusInternalServerError)
		return
	}

	data := map[string]string{
		"id": id,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}

}
