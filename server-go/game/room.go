package game

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"sync"
	"time"
)

type EventCallback func(msg WSOutputMessage, targetPlayerID string)

type Room struct {
	mu            sync.RWMutex
	worldRadius   float64
	step          uint64
	creatures     map[string]*Creature
	foods         map[string]*Food
	spatialGrid   *SpatialGrid
	botController *BotController
	broadcastCb   EventCallback
	startTime     time.Time
	lastTickTime  time.Time
	minBots       int
	maxFoods      int
	rnd           *rand.Rand
}

func NewRoom(worldRadius float64, minBots int, maxFoods int, cb EventCallback) *Room {
	r := &Room{
		worldRadius:   worldRadius,
		step:          0,
		creatures:     make(map[string]*Creature),
		foods:         make(map[string]*Food),
		spatialGrid:   NewSpatialGrid(10.0),
		botController: NewBotController(),
		broadcastCb:   cb,
		startTime:     time.Now(),
		lastTickTime:  time.Now(),
		minBots:       minBots,
		maxFoods:      maxFoods,
		rnd:           rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	r.initWorld()
	return r
}

func (r *Room) initWorld() {
	// Spawn initial food items on grid nodes
	for i := 0; i < r.maxFoods; i++ {
		r.spawnRandomFood()
	}

	// Spawn initial AI Bots
	bots := r.botController.SpawnInitialBots(r.minBots, r.worldRadius)
	for _, bot := range bots {
		b := bot
		r.creatures[b.ID] = &b
	}
}

func (r *Room) spawnRandomFood() {
	id := fmt.Sprintf("food-%d-%d", time.Now().UnixNano(), r.rnd.Intn(10000))
	angle := r.rnd.Float64() * math.Pi * 2
	dist := r.rnd.Float64() * (r.worldRadius - 2.0)
	x := math.Round(math.Cos(angle) * dist)
	y := math.Round(math.Sin(angle) * dist)

	foodType := FoodBerry
	val := 10
	typeRoll := r.rnd.Float64()
	if typeRoll > 0.85 {
		foodType = FoodGolden
		val = 25
	} else if typeRoll > 0.65 {
		foodType = FoodSuper
		val = 15
	}

	f := Food{
		ID:        id,
		X:         x,
		Y:         y,
		Value:     val,
		Type:      foodType,
		SpawnTime: time.Now().UnixMilli(),
	}
	r.foods[id] = &f
}

func (r *Room) AddPlayer(playerID, name, color string, elements []CreatureElement, presetIndex int, targetX *float64, targetY *float64, targetAngleDeg *float64) *Creature {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)

	if len(elements) == 0 {
		preset := DefaultPresets[presetIndex%len(DefaultPresets)]
		elements = make([]CreatureElement, len(preset.Elements))
		copy(elements, preset.Elements)
	}

	forces := CalculatePhysicsForces(elements, 0)
	angle := DetermineCreatureHeadAngle(elements)
	if targetAngleDeg != nil {
		angle = *targetAngleDeg
	}

	// Spawn near center or target position
	spawnX := 0.0
	spawnY := 0.0

	if targetX != nil && targetY != nil {
		spawnX = *targetX
		spawnY = *targetY
	} else {
		spawnRad := r.rnd.Float64() * math.Pi * 2
		spawnDist := r.rnd.Float64() * (r.worldRadius * 0.5)
		spawnX = math.Round(math.Cos(spawnRad) * spawnDist)
		spawnY = math.Round(math.Sin(spawnRad) * spawnDist)
	}

	if name == "" {
		name = "Игрок-Чудик"
	}
	if color == "" {
		color = "#6366f1"
	}

	creature := Creature{
		ID:             cID,
		PlayerID:       playerID,
		Name:           name,
		Color:          color,
		IsBot:          false,
		X:              spawnX,
		Y:              spawnY,
		AngleDeg:       angle,
		TargetAngleDeg: angle,
		TargetX:        spawnX,
		TargetY:        spawnY,
		Energy:         150,
		MaxEnergy:      200,
		FoodEaten:      0,
		Score:          100,
		StepsCount:     0,
		MuscleStep:     0,
		State:          "idle",
		Elements:       elements,
		Forces:         forces,
		PrevX:          spawnX,
		PrevY:          spawnY,
		PrevAngleDeg:   angle,
		Kills:          0,
		LastActive:     time.Now(),
	}

	r.creatures[cID] = &creature
	return &creature
}

func (r *Room) RemovePlayer(playerID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)
	delete(r.creatures, cID)
}

func (r *Room) HandleInput(playerID string, msg WSInputMessage) {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)
	c, exists := r.creatures[cID]
	if !exists {
		return
	}

	c.LastActive = time.Now()

	if msg.TargetAngleDeg != nil {
		c.TargetAngleDeg = *msg.TargetAngleDeg
	}
	if msg.TargetX != nil && msg.TargetY != nil {
		c.TargetX = *msg.TargetX
		c.TargetY = *msg.TargetY
	}

	if msg.MuscleContract {
		c.MuscleStep++
	}

	if msg.Dash && c.Energy > 15 {
		c.Energy -= 8
		c.State = "dashing"
	} else {
		c.State = "moving"
	}
}

func (r *Room) AddFoodAt(x, y float64, foodType FoodType) {
	r.mu.Lock()
	defer r.mu.Unlock()

	val := 10
	if foodType == FoodGolden {
		val = 25
	} else if foodType == FoodSuper {
		val = 15
	}

	id := fmt.Sprintf("food-custom-%d-%d", time.Now().UnixNano(), r.rnd.Intn(1000))
	r.foods[id] = &Food{
		ID:        id,
		X:         x,
		Y:         y,
		Value:     val,
		Type:      foodType,
		SpawnTime: time.Now().UnixMilli(),
	}
}

func (r *Room) StartLoop() {
	ticker := time.NewTicker(33 * time.Millisecond) // ~30 Hz tick rate
	go func() {
		for range ticker.C {
			r.Tick()
		}
	}()
}

func (r *Room) Tick() {
	r.mu.Lock()

	r.step++
	now := time.Now()

	// 1. Maintain minimum bots count
	currentBots := 0
	for _, c := range r.creatures {
		if c.IsBot {
			currentBots++
		}
	}
	if currentBots < r.minBots {
		newBots := r.botController.SpawnInitialBots(r.minBots-currentBots, r.worldRadius)
		for _, bot := range newBots {
			b := bot
			r.creatures[b.ID] = &b
		}
	}

	// 2. Maintain food density
	if len(r.foods) < r.maxFoods {
		r.spawnRandomFood()
	}

	// 3. Update Spatial Grid & Creature AI / Physics
	r.spatialGrid.Clear()
	for _, f := range r.foods {
		r.spatialGrid.Insert(f.ID, f.X, f.Y)
	}

	foodList := make([]Food, 0, len(r.foods))
	for _, f := range r.foods {
		foodList = append(foodList, *f)
	}

	allCreaturesList := make([]Creature, 0, len(r.creatures))
	for _, c := range r.creatures {
		allCreaturesList = append(allCreaturesList, *c)
	}

	// Process each creature
	for _, c := range r.creatures {
		c.PrevX = c.X
		c.PrevY = c.Y
		c.PrevAngleDeg = c.AngleDeg

		// AI bot logic
		if c.IsBot {
			r.botController.UpdateBot(c, foodList, allCreaturesList)
		}

		// Calculate physics forces
		c.Forces = CalculatePhysicsForces(c.Elements, c.MuscleStep)

		// Smooth angle rotation toward target angle
		angleDiff := c.TargetAngleDeg - c.AngleDeg
		for angleDiff > 180 {
			angleDiff -= 360
		}
		for angleDiff < -180 {
			angleDiff += 360
		}

		// Turn rate based on rotation forces
		turnRate := math.Max(2.0, math.Min(12.0, 5.0+math.Abs(c.Forces.NetRotationDeg)*0.15))
		if c.State == "dashing" {
			turnRate *= 1.4
		}

		if math.Abs(angleDiff) > turnRate {
			if angleDiff > 0 {
				c.AngleDeg += turnRate
			} else {
				c.AngleDeg -= turnRate
			}
		} else {
			c.AngleDeg = c.TargetAngleDeg
		}
		c.AngleDeg = math.Mod(c.AngleDeg+360.0, 360.0)

		// Step forward velocity
		speed := c.Forces.ForwardSpeed
		if speed < 0.05 {
			speed = 0.08
		}
		if c.State == "dashing" {
			speed *= 1.6
		}

		dx, dy := GetVectorFromAngle(c.AngleDeg)
		c.X += dx * speed
		c.Y += dy * speed

		// World boundary collision check
		distFromCenter := math.Hypot(c.X, c.Y)
		if distFromCenter > r.worldRadius {
			// Bounce off boundary
			c.X = c.PrevX
			c.Y = c.PrevY
			c.AngleDeg = math.Mod(c.AngleDeg+180.0, 360.0)
			c.TargetAngleDeg = c.AngleDeg
		}

		c.StepsCount++

		// Check food collision & eating
		eaten := FindEatenFood(c.PrevX, c.PrevY, c.PrevAngleDeg, c.X, c.Y, c.AngleDeg, c.Elements, foodList)
		if eaten != nil {
			delete(r.foods, eaten.ID)
			c.FoodEaten++
			c.Score += eaten.Value
			c.Energy = math.Min(c.MaxEnergy, c.Energy+float64(eaten.Value)*1.2)
		}
	}

	// 4. Resolve Creature Collisions (Slither.io style body-head crashes)
	deadCreatureIDs := make([]string, 0)
	creatureSlice := make([]Creature, 0, len(r.creatures))
	for _, c := range r.creatures {
		creatureSlice = append(creatureSlice, *c)
	}

	for i := 0; i < len(creatureSlice); i++ {
		for j := i + 1; j < len(creatureSlice); j++ {
			cA := &creatureSlice[i]
			cB := &creatureSlice[j]

			rA := CalculateCreatureRadius(cA.Elements)
			rB := CalculateCreatureRadius(cB.Elements)

			dist := math.Hypot(cB.X-cA.X, cB.Y-cA.Y)
			if dist < rA+rB {
				// Head-to-head or overlap crash
				if dist < 1.2 {
					if cA.Score > cB.Score {
						deadCreatureIDs = append(deadCreatureIDs, cB.ID)
						cA.Score += cB.Score / 2
						cA.Kills++
					} else {
						deadCreatureIDs = append(deadCreatureIDs, cA.ID)
						cB.Score += cA.Score / 2
						cB.Kills++
					}
				}
			}
		}
	}

	// Process defeated creatures -> drop food cluster!
	for _, deadID := range deadCreatureIDs {
		if dead, exists := r.creatures[deadID]; exists {
			// Drop food cluster
			dropCount := math.Min(15, math.Max(3.0, float64(dead.Score)/20.0))
			for k := 0; k < int(dropCount); k++ {
				ang := r.rnd.Float64() * math.Pi * 2
				d := r.rnd.Float64() * 3.0
				r.AddFoodAt(dead.X+math.Cos(ang)*d, dead.Y+math.Sin(ang)*d, FoodGolden)
			}

			if dead.IsBot {
				delete(r.creatures, deadID)
			} else {
				// Reset player to respawn state
				dead.X = r.rnd.Float64()*20 - 10
				dead.Y = r.rnd.Float64()*20 - 10
				dead.Score = 100
				dead.Energy = 150
			}
		}
	}

	// Build Leaderboard
	leaderboard := r.buildLeaderboard()

	// Build Server Stats
	stats := ServerStats{
		TickRate:       30.0,
		ActivePlayers:  len(r.creatures) - currentBots,
		ActiveBots:     currentBots,
		TotalCreatures: len(r.creatures),
		TotalFood:      len(r.foods),
		Step:           r.step,
		UptimeSeconds:  now.Sub(r.startTime).Seconds(),
	}

	// Prepare list snapshot for clients
	creaturesSnapshot := make([]Creature, 0, len(r.creatures))
	for _, c := range r.creatures {
		creaturesSnapshot = append(creaturesSnapshot, *c)
	}

	foodsSnapshot := make([]Food, 0, len(r.foods))
	for _, f := range r.foods {
		foodsSnapshot = append(foodsSnapshot, *f)
	}

	r.mu.Unlock()

	// Broadcast State
	if r.broadcastCb != nil {
		r.broadcastCb(WSOutputMessage{
			Type:        "state",
			WorldRadius: r.worldRadius,
			Tick:        r.step,
			Creatures:   creaturesSnapshot,
			Foods:       foodsSnapshot,
			Leaderboard: leaderboard,
			Stats:       &stats,
		}, "")
	}
}

func (r *Room) buildLeaderboard() []LeaderboardEntry {
	entries := make([]LeaderboardEntry, 0, len(r.creatures))
	for _, c := range r.creatures {
		entries = append(entries, LeaderboardEntry{
			ID:        c.ID,
			Name:      c.Name,
			Score:     c.Score,
			Color:     c.Color,
			IsBot:     c.IsBot,
			Kills:     c.Kills,
			FoodEaten: c.FoodEaten,
		})
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Score > entries[j].Score
	})

	for i := range entries {
		entries[i].Rank = i + 1
	}

	if len(entries) > 10 {
		return entries[:10]
	}
	return entries
}
