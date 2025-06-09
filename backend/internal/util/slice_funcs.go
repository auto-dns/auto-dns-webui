package util

func Reverse[T any](slice []T) []T {
	reversed := make([]T, len(slice))
	length := len(slice)
	for i, v := range slice {
		reversed[length-1-i] = v
	}
	return reversed
}
