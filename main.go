package main

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"unicode"

	"gopkg.in/yaml.v3"
)

func main() {
	title := os.Getenv("TITLE")

	if title == "" {
		title = "Wingman AI"
	}

	models := strings.FieldsFunc(os.Getenv("MODELS"), func(r rune) bool {
		return r == ',' || r == ';' || unicode.IsSpace(r)
	})

	token := os.Getenv("OPENAI_API_KEY")
	target, _ := url.Parse(os.Getenv("OPENAI_BASE_URL"))

	if target.Host == "" {
		target, _ = url.Parse("https://api.openai.com/v1")
	}

	target.Path = strings.TrimRight(target.Path, "/")
	target.Path = strings.TrimRight(target.Path, "/v1")

	mux := http.NewServeMux()
	dist := os.DirFS("dist")

	mux.Handle("/", http.FileServerFS(dist))

	mux.HandleFunc("GET /config.json", func(w http.ResponseWriter, r *http.Request) {
		type modelType struct {
			ID string `json:"id,omitempty" yaml:"id,omitempty"`

			Name        string `json:"name,omitempty" yaml:"name,omitempty"`
			Description string `json:"description,omitempty" yaml:"description,omitempty"`
		}

		type configType struct {
			Title string `json:"title,omitempty" yaml:"title,omitempty"`

			Models []modelType `json:"models,omitempty" yaml:"models,omitempty"`

			ModelsFilter []string `json:"modelsFilter,omitempty" yaml:"modelsFilter,omitempty"`
		}

		config := configType{
			Title: title,
		}

		if data, err := os.ReadFile("models.yaml"); err == nil {
			yaml.Unmarshal(data, &config.Models)
		}

		if len(models) > 0 {
			config.ModelsFilter = models
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(config)
	})

	mux.HandleFunc("GET /manifest.json", func(w http.ResponseWriter, r *http.Request) {
		manifest := map[string]any{
			"name":             title,
			"short_name":       title,
			"start_url":        "/",
			"display":          "standalone",
			"background_color": "rgb(14, 17, 23)",
			"icons": []map[string]any{
				{
					"src":   "/logo.svg",
					"type":  "image/svg+xml",
					"sizes": "any",
				},
				{
					"src":   "/icon.png",
					"type":  "image/png",
					"sizes": "512x512",
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(manifest)
	})

	mux.Handle("/api/", http.StripPrefix("/api", &httputil.ReverseProxy{
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(target)

			if token != "" {
				r.Out.Header.Set("Authorization", "Bearer "+token)
			}
		},
	}))

	http.ListenAndServe(":8000", mux)
}
