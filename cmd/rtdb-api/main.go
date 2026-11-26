package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const defaultDatabaseURL = "https://bizflow-dashboard-vlo72-default-rtdb.asia-southeast1.firebasedatabase.app"

type server struct {
	databaseURL string
	defaultPath string
	client      *http.Client
}

type firmwareResponse struct {
	Source    string          `json:"source"`
	Path      string          `json:"path"`
	FetchedAt string          `json:"fetchedAt"`
	LatencyMs int64           `json:"latencyMs"`
	Status    string          `json:"status"`
	Payload   json.RawMessage `json:"payload"`
	Error     string          `json:"error,omitempty"`
}

func main() {
	port := envOr("PORT", "3000")
	s := &server{
		databaseURL: strings.TrimRight(envOr("RTDB_DATABASE_URL", defaultDatabaseURL), "/"),
		defaultPath: cleanPath(envOr("RTDB_PATH", "firmware")),
		client:      &http.Client{Timeout: 12 * time.Second},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.health)
	mux.HandleFunc("/api/firmware", s.firmware)
	mux.HandleFunc("/", s.root)

	address := ":" + port
	log.Printf("[go-rtdb] listening on %s (default path /%s)", address, s.defaultPath)
	if err := http.ListenAndServe(address, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func (s *server) root(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "rtdb-go-api",
		"status":  "ok",
	})
}

func (s *server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "rtdb-go-api",
		"status":  "ok",
	})
}

func (s *server) firmware(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	path := cleanPath(r.URL.Query().Get("path"))
	if path == "" {
		path = s.defaultPath
	}
	if strings.Contains(path, "..") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid RTDB path"})
		return
	}

	started := time.Now()
	payload, err := s.readRTDB(r.Context(), path)
	latency := time.Since(started).Milliseconds()
	if err != nil {
		writeJSON(w, http.StatusBadGateway, firmwareResponse{
			Source:    "golang-rtdb-adapter",
			Path:      path,
			FetchedAt: time.Now().UTC().Format(time.RFC3339),
			LatencyMs: latency,
			Status:    "error",
			Payload:   json.RawMessage("null"),
			Error:     err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, firmwareResponse{
		Source:    "golang-rtdb-adapter",
		Path:      path,
		FetchedAt: time.Now().UTC().Format(time.RFC3339),
		LatencyMs: latency,
		Status:    "ok",
		Payload:   payload,
	})
}

func (s *server) readRTDB(ctx context.Context, path string) (json.RawMessage, error) {
	endpoint := s.databaseURL + "/" + escapeRTDBPath(path) + ".json"
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Accept", "application/json")

	response, err := s.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, readErr := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if readErr != nil {
		return nil, readErr
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("RTDB %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	if !json.Valid(body) {
		return nil, errors.New("RTDB returned invalid JSON")
	}
	return json.RawMessage(body), nil
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("[go-rtdb] response encode error: %v", err)
	}
}

func cleanPath(path string) string {
	return strings.Trim(path, " /")
}

func escapeRTDBPath(path string) string {
	segments := strings.Split(cleanPath(path), "/")
	escaped := make([]string, 0, len(segments))
	for _, segment := range segments {
		if segment != "" {
			escaped = append(escaped, url.PathEscape(segment))
		}
	}
	return strings.Join(escaped, "/")
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

var _ = strconv.IntSize
