package utilites

import (
	"log"
	"os"
)

// Gets the value associated with the environment variable key
// If it doesn't exist, then it just returns the fallback
func GetEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Util function cause of golingolangci-lint bitch ass
func CloseResource(resource any) func() {
	return func() {
		if closer, ok := resource.(interface{ Close() error }); ok {
			if err := closer.Close(); err != nil {
				log.Printf("Failed to close resource: %v", err)
			}
		}
	}

}
