package game

import "math"

type SpatialGrid struct {
	cellSize float64
	cells    map[int64][]string
}

func NewSpatialGrid(cellSize float64) *SpatialGrid {
	return &SpatialGrid{
		cellSize: cellSize,
		cells:    make(map[int64][]string),
	}
}

func (sg *SpatialGrid) Clear() {
	sg.cells = make(map[int64][]string)
}

func (sg *SpatialGrid) getCellKey(x, y float64) int64 {
	cx := int64(math.Floor(x / sg.cellSize))
	cy := int64(math.Floor(y / sg.cellSize))
	return (cx << 32) ^ (cy & 0xFFFFFFFF)
}

func (sg *SpatialGrid) Insert(id string, x, y float64) {
	key := sg.getCellKey(x, y)
	sg.cells[key] = append(sg.cells[key], id)
}

func (sg *SpatialGrid) GetNearby(x, y, radius float64) []string {
	cellRadius := int64(math.Ceil(radius / sg.cellSize))
	cx := int64(math.Floor(x / sg.cellSize))
	cy := int64(math.Floor(y / sg.cellSize))

	resultMap := make(map[string]bool)
	var results []string

	for dx := -cellRadius; dx <= cellRadius; dx++ {
		for dy := -cellRadius; dy <= cellRadius; dy++ {
			key := ((cx + dx) << 32) ^ ((cy + dy) & 0xFFFFFFFF)
			if ids, exists := sg.cells[key]; exists {
				for _, id := range ids {
					if !resultMap[id] {
						resultMap[id] = true
						results = append(results, id)
					}
				}
			}
		}
	}
	return results
}
