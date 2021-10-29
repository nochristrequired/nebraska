// Package codegen provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/deepmap/oapi-codegen version v1.9.0 DO NOT EDIT.
package codegen

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"net/url"
	"path"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
)

// Base64 encoded, gzipped, json marshaled Swagger object
var swaggerSpec = []string{

	"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",
	"MUKiDNCZS9SLxX8DAAD//7k70VOhiwAA",
}

// GetSwagger returns the content of the embedded swagger specification file
// or error if failed to decode
func decodeSpec() ([]byte, error) {
	zipped, err := base64.StdEncoding.DecodeString(strings.Join(swaggerSpec, ""))
	if err != nil {
		return nil, fmt.Errorf("error base64 decoding spec: %s", err)
	}
	zr, err := gzip.NewReader(bytes.NewReader(zipped))
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %s", err)
	}
	var buf bytes.Buffer
	_, err = buf.ReadFrom(zr)
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %s", err)
	}

	return buf.Bytes(), nil
}

var rawSpec = decodeSpecCached()

// a naive cached of a decoded swagger spec
func decodeSpecCached() func() ([]byte, error) {
	data, err := decodeSpec()
	return func() ([]byte, error) {
		return data, err
	}
}

// Constructs a synthetic filesystem for resolving external references when loading openapi specifications.
func PathToRawSpec(pathToFile string) map[string]func() ([]byte, error) {
	var res = make(map[string]func() ([]byte, error))
	if len(pathToFile) > 0 {
		res[pathToFile] = rawSpec
	}

	return res
}

// GetSwagger returns the Swagger specification corresponding to the generated code
// in this file. The external references of Swagger specification are resolved.
// The logic of resolving external references is tightly connected to "import-mapping" feature.
// Externally referenced files must be embedded in the corresponding golang packages.
// Urls can be supported but this task was out of the scope.
func GetSwagger() (swagger *openapi3.T, err error) {
	var resolvePath = PathToRawSpec("")

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = true
	loader.ReadFromURIFunc = func(loader *openapi3.Loader, url *url.URL) ([]byte, error) {
		var pathToFile = url.String()
		pathToFile = path.Clean(pathToFile)
		getSpec, ok := resolvePath[pathToFile]
		if !ok {
			err1 := fmt.Errorf("path not found: %s", pathToFile)
			return nil, err1
		}
		return getSpec()
	}
	var specData []byte
	specData, err = rawSpec()
	if err != nil {
		return
	}
	swagger, err = loader.LoadFromData(specData)
	if err != nil {
		return
	}
	return
}
