package game

import (
	"fmt"
	"math"
	"strings"
)

// Default Creature Presets
var DefaultPresets = []struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Elements    []CreatureElement `json:"elements"`
}{
	{
		Name:        "Чудик-Маятник",
		Description: "Центральный шарнир с головой вверху, симметричными ребрами и противоположными мышцами. Бежит вперед!",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-v1", RelX: 0, RelY: -1, Type: ElementEdgeV, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: -1, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-r", RelX: 1, RelY: -1, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Асимметричный Вращатель",
		Description: "Имеет голову и больше ребер на левом плече. Легкое правое плечо совершает поворот на шарнире при сокращении.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-l2", RelX: -1, RelY: 1, Type: ElementEdgeV, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: -1, Type: ElementMuscleLeft, Weight: 0},
		},
	},
	{
		Name:        "Диагональный Бегун (45°)",
		Description: "Использует диагональные ребра (/) и (\\) с ведущей головой для быстрого перемещения по сетке.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-d1", RelX: -1, RelY: -1, Type: ElementEdgeD2, Weight: 1},
			{ID: "edge-d2", RelX: 1, RelY: -1, Type: ElementEdgeD1, Weight: 1},
			{ID: "edge-d3", RelX: -1, RelY: 1, Type: ElementEdgeD1, Weight: 1},
			{ID: "edge-d4", RelX: 1, RelY: 1, Type: ElementEdgeD2, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: 0, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-r", RelX: 1, RelY: 0, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Двухшарнирный Сороконожка",
		Description: "Два шарнира на разных узлах сетки с мышцами сгибания и головой, создающими движение вперед.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -2, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-1", RelX: 0, RelY: -1, Type: ElementJoint, Weight: 0},
			{ID: "joint-2", RelX: 0, RelY: 1, Type: ElementJoint, Weight: 0},
			{ID: "edge-v", RelX: 0, RelY: 0, Type: ElementEdgeV, Weight: 1},
			{ID: "edge-h1", RelX: -1, RelY: -1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h2", RelX: 1, RelY: -1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h3", RelX: -1, RelY: 1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h4", RelX: 1, RelY: 1, Type: ElementEdgeH, Weight: 1},
			{ID: "muscle-1", RelX: -1, RelY: 0, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-2", RelX: 1, RelY: 0, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Хаотичный Бегун (Случайные Мышцы 🎲)",
		Description: "Использует случайные мышцы с вероятностью срабатывания (35%). Движение и повороты непредсказуемы каждый ход!",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-v1", RelX: 0, RelY: -1, Type: ElementEdgeV, Weight: 1},
			{ID: "muscle-rnd-l", RelX: -1, RelY: -1, Type: ElementMuscleRandomLeft, Weight: 0, RandomChance: floatPtr(35)},
			{ID: "muscle-rnd-r", RelX: 1, RelY: -1, Type: ElementMuscleRandomRight, Weight: 0, RandomChance: floatPtr(35)},
		},
	},
}

func floatPtr(v float64) *float64 {
	return &v
}

func IsRandomMuscleTriggered(el CreatureElement, cycle int) bool {
	if cycle <= 0 {
		return true
	}
	chance := 35.0
	if el.RandomChance != nil {
		chance = *el.RandomChance
	}
	hash := int32(0)
	str := fmt.Sprintf("%s_c_%d", el.ID, cycle)
	for i := 0; i < len(str); i++ {
		hash = (hash << 5) - hash + int32(str[i])
	}
	val := math.Abs(float64(hash))
	valMod := math.Mod(val, 100)
	return valMod < chance
}

type RandomMuscleState struct {
	IsFlexed     bool
	JustFlexed   bool
	JustUnflexed bool
}

func GetRandomMuscleState(el CreatureElement, step int) RandomMuscleState {
	if step <= 0 {
		return RandomMuscleState{}
	}
	isTriggeredNow := IsRandomMuscleTriggered(el, step)
	isTriggeredPrev := IsRandomMuscleTriggered(el, step-1)
	return RandomMuscleState{
		IsFlexed:     isTriggeredNow,
		JustFlexed:   isTriggeredNow && !isTriggeredPrev,
		JustUnflexed: !isTriggeredNow && isTriggeredPrev,
	}
}

func DetermineCreatureHeadAngle(elements []CreatureElement) float64 {
	for _, el := range elements {
		if el.Type == ElementHead {
			if el.HeadAngle != nil {
				return *el.HeadAngle
			}
			if el.RelX != 0 || el.RelY != 0 {
				rad := math.Atan2(el.RelY, el.RelX)
				deg := math.Round((rad * 180) / math.Pi)
				if deg < 0 {
					deg += 360
				}
				return deg
			}
		}
	}
	return 270.0
}

func CalculatePhysicsForces(elements []CreatureElement, muscleActiveStep int) PhysicsForces {
	isMuscleContracted := muscleActiveStep%2 == 1

	type JointNode struct {
		ID string
		X  float64
		Y  float64
	}

	joints := []JointNode{}
	edgeElements := []CreatureElement{}
	muscleElements := []CreatureElement{}

	totalMass := 0.0
	totalInertia := 0.0
	totalLeftMass := 0.0
	totalRightMass := 0.0

	for _, el := range elements {
		elWeight := el.Weight
		if el.Type == ElementJoint {
			joints = append(joints, JointNode{ID: el.ID, X: el.RelX, Y: el.RelY})
			elWeight = 1.0
		} else if strings.HasPrefix(string(el.Type), "edge-") {
			edgeElements = append(edgeElements, el)
			if elWeight <= 0 {
				elWeight = 1.0
			}
		} else if strings.HasPrefix(string(el.Type), "muscle-") {
			muscleElements = append(muscleElements, el)
			elWeight = 0.3
		} else if el.Type == ElementHead {
			elWeight = 0.5
		}

		totalMass += elWeight
		rSq := el.RelX*el.RelX + el.RelY*el.RelY
		totalInertia += elWeight * (rSq + 0.5)

		if el.RelX < 0 {
			totalLeftMass += elWeight
		} else if el.RelX > 0 {
			totalRightMass += elWeight
		} else {
			totalLeftMass += elWeight * 0.5
			totalRightMass += elWeight * 0.5
		}
	}

	if len(joints) == 0 {
		joints = append(joints, JointNode{ID: "center-joint", X: 0, Y: 0})
		totalMass += 1.0
		totalInertia += 0.5
	}

	totalMass = math.Max(1.0, totalMass)
	totalInertia = math.Max(1.0, totalInertia)

	jointsPhysics := []JointPhysics{}
	sumLeftTorque := 0.0
	sumRightTorque := 0.0
	totalActiveMusclesCount := 0
	motionActiveMusclesCount := 0

	hasMultipleJoints := len(joints) > 1

	for _, j := range joints {
		jLeftMass := 0.0
		jRightMass := 0.0
		jLeftTorquePotential := 0.0
		jRightTorquePotential := 0.0

		for _, el := range edgeElements {
			weight := el.Weight
			if weight <= 0 {
				weight = 1.0
			}
			dx := el.RelX - j.X

			if dx < 0 {
				arm := -dx
				leverMultiplier := 1.0 + 0.5*(arm-1.0)
				jLeftMass += weight
				jLeftTorquePotential += weight * leverMultiplier
			} else if dx > 0 {
				arm := dx
				leverMultiplier := 1.0 + 0.5*(arm-1.0)
				jRightMass += weight
				jRightTorquePotential += weight * leverMultiplier
			} else {
				jLeftMass += weight * 0.5
				jRightMass += weight * 0.5
				jLeftTorquePotential += weight * 0.5
				jRightTorquePotential += weight * 0.5
			}
		}

		activeLeftMuscles := 0.0
		activeRightMuscles := 0.0

		for _, el := range muscleElements {
			if hasMultipleJoints {
				mdx := el.RelX - j.X
				mdy := el.RelY - j.Y
				if mdx*mdx+mdy*mdy > 6.25 {
					continue
				}
			}

			providesTorque := false
			providesMotion := false

			if el.Type == ElementMuscleLeft || el.Type == ElementMuscleRight {
				providesTorque = isMuscleContracted
				providesMotion = true
			} else if el.Type == ElementMuscleRandomLeft || el.Type == ElementMuscleRandomRight {
				mState := GetRandomMuscleState(el, muscleActiveStep)
				providesTorque = mState.JustFlexed
				providesMotion = mState.JustFlexed || mState.JustUnflexed
			}

			if providesTorque {
				muscleArm := 1.0 + 0.4*math.Abs(el.RelY-j.Y)
				muscleForce := 1.5 * muscleArm

				if strings.Contains(string(el.Type), "left") {
					activeLeftMuscles += muscleForce
				} else if strings.Contains(string(el.Type), "right") {
					activeRightMuscles += muscleForce
				}
			}

			if providesMotion {
				motionActiveMusclesCount++
			}
		}

		netJointTorque := activeLeftMuscles - activeRightMuscles

		jointsPhysics = append(jointsPhysics, JointPhysics{
			JointID:              j.ID,
			JX:                   j.X,
			JY:                   j.Y,
			LeftEdgeMass:         jLeftMass,
			RightEdgeMass:        jRightMass,
			LeftTorquePotential:  jLeftTorquePotential,
			RightTorquePotential: jRightTorquePotential,
			ActiveLeftMuscles:    int(math.Round(activeLeftMuscles)),
			ActiveRightMuscles:   int(math.Round(activeRightMuscles)),
			NetJointTorque:       netJointTorque,
		})

		sumLeftTorque += activeLeftMuscles
		sumRightTorque += activeRightMuscles
		if activeLeftMuscles+activeRightMuscles > 0 {
			totalActiveMusclesCount++
		}
	}

	netTorque := sumLeftTorque - sumRightTorque

	netRotationDeg := 0.0
	if math.Abs(netTorque) > 0 {
		rawRotation := (netTorque / totalInertia) * 28.0
		netRotationDeg = math.Min(60.0, math.Max(-60.0, rawRotation))
	}

	isLighterSideRotating := totalLeftMass != totalRightMass && netTorque != 0

	forwardSpeed := 0.0
	if motionActiveMusclesCount > 0 || sumLeftTorque > 0 || sumRightTorque > 0 {
		thrust := 0.0
		if sumLeftTorque > 0 && sumRightTorque > 0 {
			thrust = sumLeftTorque + sumRightTorque
		} else if sumLeftTorque > 0 || sumRightTorque > 0 {
			thrust = math.Max(sumLeftTorque, sumRightTorque) * 0.65
		} else {
			thrust = 0.8 * float64(motionActiveMusclesCount)
		}

		calculatedSpeed := (thrust / totalMass) * 0.22
		forwardSpeed = math.Min(0.40, math.Max(0.02, calculatedSpeed))
	}

	return PhysicsForces{
		LeftTorque:            sumLeftTorque,
		RightTorque:           sumRightTorque,
		NetRotationDeg:        netRotationDeg,
		ForwardSpeed:          forwardSpeed,
		LeftMass:              totalLeftMass,
		RightMass:             totalRightMass,
		TotalMass:             totalMass,
		TotalInertia:          totalInertia,
		IsLighterSideRotating: isLighterSideRotating,
		JointsPhysics:         jointsPhysics,
		ActiveMusclesCount:    totalActiveMusclesCount,
	}
}

type Point struct {
	X float64
	Y float64
}

func GetVectorFromAngle(angleDeg float64) (float64, float64) {
	rad := (angleDeg * math.Pi) / 180.0
	return math.Cos(rad), math.Sin(rad)
}

func CalculateCreatureRadius(elements []CreatureElement) float64 {
	maxR := 0.5
	for _, el := range elements {
		r := math.Hypot(el.RelX, el.RelY) + 0.5
		if r > maxR {
			maxR = r
		}
	}
	return maxR
}

func PointToSegmentDistanceSq(px, py, ax, ay, bx, by float64) float64 {
	dx := bx - ax
	dy := by - ay
	if dx == 0 && dy == 0 {
		return (px-ax)*(px-ax) + (py-ay)*(py-ay)
	}
	t := math.Max(0, math.Min(1, ((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)))
	projX := ax + t*dx
	projY := ay + t*dy
	return (px-projX)*(px-projX) + (py-projY)*(py-projY)
}

func GetCreatureElementWorldPositions(cx, cy, angleDeg float64, elements []CreatureElement) []Point {
	baseHeadAngle := DetermineCreatureHeadAngle(elements)
	rotRad := ((angleDeg - baseHeadAngle) * math.Pi) / 180.0
	cos := math.Cos(rotRad)
	sin := math.Sin(rotRad)

	points := []Point{{X: cx, Y: cy}}
	for _, el := range elements {
		wx := cx + el.RelX*cos - el.RelY*sin
		wy := cy + el.RelX*sin + el.RelY*cos
		points = append(points, Point{X: wx, Y: wy})
	}
	return points
}

func FindEatenFood(prevX, prevY, prevAngleDeg, nextX, nextY, nextAngleDeg float64, elements []CreatureElement, foods []Food) *Food {
	if len(foods) == 0 {
		return nil
	}
	maxRadiusSq := 0.7 * 0.7

	startPts := GetCreatureElementWorldPositions(prevX, prevY, prevAngleDeg, elements)
	endPts := GetCreatureElementWorldPositions(nextX, nextY, nextAngleDeg, elements)

	for i := range foods {
		f := &foods[i]
		if PointToSegmentDistanceSq(f.X, f.Y, prevX, prevY, nextX, nextY) <= maxRadiusSq {
			return f
		}
		for p := range endPts {
			sp := Point{X: prevX, Y: prevY}
			if p < len(startPts) {
				sp = startPts[p]
			}
			ep := endPts[p]
			if PointToSegmentDistanceSq(f.X, f.Y, sp.X, sp.Y, ep.X, ep.Y) <= maxRadiusSq {
				return f
			}
		}
	}
	return nil
}
