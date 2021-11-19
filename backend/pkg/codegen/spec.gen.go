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
