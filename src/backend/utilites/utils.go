package utilites

import "os"

// Gets the value associated with the environment variable key
// If it doesn't exist, then it just returns the fallback
func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
