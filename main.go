package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

func main() {
	target, _ := url.Parse(os.Getenv("OPENAI_BASE_URL"))
	token := os.Getenv("OPENAI_API_KEY")

	if target.Host == "" {
		target, _ = url.Parse("https://api.openai.com/v1")
	}

	target.Path = strings.TrimRight(target.Path, "/")
	target.Path = strings.TrimRight(target.Path, "/v1")

	mux := http.NewServeMux()

	dist := os.DirFS("dist")

	mux.Handle("/", http.FileServerFS(dist))

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
