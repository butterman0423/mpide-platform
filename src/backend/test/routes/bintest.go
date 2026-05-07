package routes

import (
	"net/http"
	"os"
	"path"
)

func SendTest_LED(res http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(res, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cwd, err := os.Getwd()
	if err != nil {
		http.Error(res, "Failed to get working directory.", http.StatusInternalServerError)
		return
	}

	execPath := path.Join(cwd, "test", "binaries", "sketch_may5a.ino.hex")
	http.ServeFile(res, req, execPath)
}
