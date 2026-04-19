package routes

import (
	"backend/utilites"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fsnotify/fsnotify"
)

const (
	stageFile    = "FILE"
	stageCompile = "COMPILE"
	stageDone    = "DONE"
)

type compileJob struct {
	done     chan struct{}
	exitCode atomic.Int32
}

var compileJobs sync.Map

func StartCompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract :id from path e.g. /v1/start/some-uuid
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	dirPath := fmt.Sprintf("%s/%s", filesPath, id)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		log.Printf("Failed to read directory %s: %v", dirPath, err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	var sourceFiles []string
	for _, entry := range entries {
		ext := filepath.Ext(entry.Name())
		if ext == ".c" || ext == ".cpp" {
			sourceFiles = append(sourceFiles, entry.Name())
		}
	}

	if len(sourceFiles) == 0 {
		http.Error(w, "There is no source files found to compile", http.StatusBadRequest)
		return
	}

	outPath := fmt.Sprintf("%s/.log/%s-out.txt", filesPath, id)
	stdoutFile, err := os.Create(outPath)
	if err != nil {
		log.Printf("Failed to create stdout log %s: %v", outPath, err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	errPath := fmt.Sprintf("%s/.log/%s-err.txt", filesPath, id)
	stderrFile, err := os.Create(errPath)
	if err != nil {
		_ = stdoutFile.Close()
		log.Printf("Failed to create stderr log %s: %v", errPath, err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	job := &compileJob{done: make(chan struct{})}
	job.exitCode.Store(-1)
	compileJobs.Store(id, job)

	args := append([]string{"-mmcu=atmega328p", "-Wall", "-I", "./", "-o", "main.elf"}, sourceFiles...)
	cmd := exec.Command("avr-gcc", args...)
	cmd.Stdout = stdoutFile
	cmd.Stderr = stderrFile
	cmd.Dir = dirPath

	go func() {
		defer func() {
			_ = stdoutFile.Close()
			_ = stderrFile.Close()
		}()

		runErr := cmd.Run()
		code := 0
		if runErr != nil {
			if ee, ok := runErr.(*exec.ExitError); ok {
				code = ee.ExitCode()
			} else {
				code = 1
			}
			log.Printf("Compilation finished for id %s with error: %v", id, runErr)
		}
		job.exitCode.Store(int32(code))
		close(job.done)
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"status":"started"}`))
}

type ssePayload struct {
	Stage   string `json:"stage"`
	Message string `json:"message"`
	IsError bool   `json:"is_error"`
}

func writeSSE(w http.ResponseWriter, rc *http.ResponseController, p ssePayload) error {
	b, err := json.Marshal(p)
	if err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", b); err != nil {
		return err
	}
	return rc.Flush()
}

func StreamCompileLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	filesPath := utilites.GetEnv("FILES_PATH", "")
	if filesPath == "" {
		log.Print("Missing FILES_PATH environment variable")
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	dirPath := filepath.Join(filesPath, id)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	logDir := fmt.Sprintf("%s/.log", filesPath)
	outPath := fmt.Sprintf("%s/%s-out.txt", logDir, id)
	errPath := fmt.Sprintf("%s/%s-err.txt", logDir, id)

	rc := http.NewResponseController(w)
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Starts the SSE stream before any logs appear
	w.WriteHeader(http.StatusOK)
	if err := rc.Flush(); err != nil {
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("fsnotify: %v", err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	defer utilites.CloseResource(watcher)()

	if err := watcher.Add(logDir); err != nil {
		log.Printf("watch log dir: %v", err)
		http.Error(w, "There was an internal server error. Please try again", http.StatusInternalServerError)
		return
	}

	var (
		offsetOut, offsetErr int64       // How many bytes from each file have been read so far
		outCarry, errCarry   string      // Buffer for lines that haven't been emitted to the console yet
		mu                   sync.Mutex  // Mutex. Protects debounce timer
		debounceTimer        *time.Timer // Condenses multiple events into a single flush rather than multiple flushes
		lastFileHeartbeat    time.Time   // Tracks the last waiting time
	)

	emitLines := func(raw string, carry *string, isErr bool) error {
		s := *carry + raw
		for {
			// Extracting complete line one at a time
			i := strings.IndexByte(s, '\n')
			if i < 0 {
				*carry = s
				return nil
			}
			line := strings.TrimSuffix(s[:i], "\r") // Window style \r
			s = s[i+1:]
			if line != "" {
				if err := writeSSE(w, rc, ssePayload{Stage: stageCompile, Message: line, IsError: isErr}); err != nil {
					return err
				}
			}
		}
	}

	flushLogs := func() error {
		mu.Lock()
		defer mu.Unlock()

		// stdout first, then stderr
		if b, err := readFileFromOffset(outPath, offsetOut); err == nil && len(b) > 0 {
			offsetOut += int64(len(b))
			if err := emitLines(string(b), &outCarry, false); err != nil {
				return err
			}
		} else if err != nil && !os.IsNotExist(err) {
			log.Printf("read out log: %v", err)
		}

		if b, err := readFileFromOffset(errPath, offsetErr); err == nil && len(b) > 0 {
			offsetErr += int64(len(b))
			if err := emitLines(string(b), &errCarry, true); err != nil {
				return err
			}
		} else if err != nil && !os.IsNotExist(err) {
			log.Printf("read err log: %v", err)
		}

		return nil
	}

	scheduleFlush := func() {
		mu.Lock()
		if debounceTimer != nil {
			debounceTimer.Stop()
		}
		debounceTimer = time.AfterFunc(50*time.Millisecond, func() {
			if err := flushLogs(); err != nil {
				return
			}
		})
		mu.Unlock()
	}

	jobDoneCh := make(chan struct{})
	// Background job
	go func() {
		tick := time.NewTicker(200 * time.Millisecond)
		defer tick.Stop()
		for {
			select {
			case <-r.Context().Done():
				return
			case <-tick.C:
				if v, ok := compileJobs.Load(id); ok {
					j := v.(*compileJob)
					<-j.done
					close(jobDoneCh)
					return
				}
			}
		}
	}()

	if err := flushLogs(); err != nil {
		return
	}

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done(): // Client disconnects
			mu.Lock()
			if debounceTimer != nil {
				debounceTimer.Stop()
			}
			mu.Unlock()
			return

		case ev, ok := <-watcher.Events: // Smth has been written to stdout or stderr
			if !ok {
				return
			}
			base := filepath.Base(ev.Name)
			if base == filepath.Base(outPath) || base == filepath.Base(errPath) {
				if ev.Op&(fsnotify.Write|fsnotify.Create) != 0 {
					scheduleFlush()
				}
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			if err != nil {
				log.Printf("watcher error: %v", err)
			}

		case <-ticker.C:
			if _, ok := compileJobs.Load(id); !ok {
				if time.Since(lastFileHeartbeat) >= 2*time.Second {
					lastFileHeartbeat = time.Now()
					_ = writeSSE(w, rc, ssePayload{
						Stage:   stageFile,
						Message: "Waiting for compile to start",
						IsError: false,
					})
				}
			}

		case <-jobDoneCh:
			mu.Lock()
			if debounceTimer != nil {
				debounceTimer.Stop()
			}
			mu.Unlock()
			_ = flushLogs()
			if outCarry != "" {
				_ = writeSSE(w, rc, ssePayload{Stage: stageCompile, Message: outCarry, IsError: false})
				outCarry = ""
			}
			if errCarry != "" {
				_ = writeSSE(w, rc, ssePayload{Stage: stageCompile, Message: errCarry, IsError: true})
				errCarry = ""
			}
			v, ok := compileJobs.Load(id)
			exitCode := 0
			isErr := false
			if ok {
				j := v.(*compileJob)
				exitCode = int(j.exitCode.Load())
				isErr = exitCode != 0
			}
			msg := "Compilation finished"
			if isErr {
				msg = fmt.Sprintf("Compilation finished with exit code %d", exitCode)
			}
			_ = writeSSE(w, rc, ssePayload{Stage: stageDone, Message: msg, IsError: isErr})
			return
		}
	}
}

func readFileFromOffset(path string, off int64) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	defer utilites.CloseResource(file)()

	if _, err := file.Seek(off, 0); err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	_, err = buf.ReadFrom(file)
	return buf.Bytes(), err
}
