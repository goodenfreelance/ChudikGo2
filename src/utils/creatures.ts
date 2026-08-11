import { Creature, CreatureElement, Food, PhysicsForces, JointPhysics, Point } from '../types';

// Новые пресеты чудиков, полностью соответствующие правилам: Ребра (вес 1), Шарниры (вес 0), Мышцы (импульс), Голова (направление)
export const DEFAULT_PRESETS: { name: string; description: string; elements: CreatureElement[] }[] = [
  {
    name: 'Чудик-Маятник (Шарнир + Голова + 2 Мышцы)',
    description: 'Центральный шарнир с головой вверху, симметричными ребрами и противоположными мышцами. Бежит вперед!',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-v1', relX: 0, relY: -1, type: 'edge-v', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: -1, type: 'muscle-left', weight: 0 },
      { id: 'muscle-r', relX: 1, relY: -1, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Асимметричный Вращатель',
    description: 'Имеет голову и больше ребер на левом плече. Легкое правое плечо совершает поворот на шарнире при сокращении.',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-l2', relX: -1, relY: 1, type: 'edge-v', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: -1, type: 'muscle-left', weight: 0 },
    ],
  },
  {
    name: 'Диагональный Бегун (45°)',
    description: 'Использует диагональные ребра (/) и (\\) с ведущей головой для быстрого перемещения по сетке.',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-d1', relX: -1, relY: -1, type: 'edge-d2', weight: 1 },
      { id: 'edge-d2', relX: 1, relY: -1, type: 'edge-d1', weight: 1 },
      { id: 'edge-d3', relX: -1, relY: 1, type: 'edge-d1', weight: 1 },
      { id: 'edge-d4', relX: 1, relY: 1, type: 'edge-d2', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: 0, type: 'muscle-left', weight: 0 },
      { id: 'muscle-r', relX: 1, relY: 0, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Двухшарнирный Сороконожка',
    description: 'Два шарнира на разных узлах сетки с мышцами сгибания и головой, создающими движение вперед.',
    elements: [
      { id: 'head-top', relX: 0, relY: -2, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-1', relX: 0, relY: -1, type: 'joint', weight: 0 },
      { id: 'joint-2', relX: 0, relY: 1, type: 'joint', weight: 0 },
      { id: 'edge-v', relX: 0, relY: 0, type: 'edge-v', weight: 1 },
      { id: 'edge-h1', relX: -1, relY: -1, type: 'edge-h', weight: 1 },
      { id: 'edge-h2', relX: 1, relY: -1, type: 'edge-h', weight: 1 },
      { id: 'edge-h3', relX: -1, relY: 1, type: 'edge-h', weight: 1 },
      { id: 'edge-h4', relX: 1, relY: 1, type: 'edge-h', weight: 1 },
      { id: 'muscle-1', relX: -1, relY: 0, type: 'muscle-left', weight: 0 },
      { id: 'muscle-2', relX: 1, relY: 0, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Хаотичный Бегун (Случайные Мышцы 🎲)',
    description: 'Использует случайные мышцы с вероятностью срабатывания (35%). Движение и повороты непредсказуемы каждый ход!',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-v1', relX: 0, relY: -1, type: 'edge-v', weight: 1 },
      { id: 'muscle-rnd-l', relX: -1, relY: -1, type: 'muscle-random-left', weight: 0, randomChance: 35 },
      { id: 'muscle-rnd-r', relX: 1, relY: -1, type: 'muscle-random-right', weight: 0, randomChance: 35 },
    ],
  },
];

// Детерминированная проверка срабатывания случайной мышцы для конкретного цикла
export function isRandomMuscleTriggered(el: CreatureElement, cycle: number): boolean {
  if (cycle <= 0) return true; // При сбросе / в редакторе показываем мышцу как способную сработать
  const chance = el.randomChance ?? 35;
  let hash = 0;
  const str = `${el.id}_c_${cycle}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const val = Math.abs(hash) % 100;
  return val < chance;
}

export interface RandomMuscleState {
  isFlexed: boolean;       // Мышца согнута (сокращена) в данный момент
  justFlexed: boolean;     // Произошел сгиб на данном шаге (однократный импульс поворота)
  justUnflexed: boolean;   // Произошел розгиб на данном шаге по вероятности
}

// Расчет состояния случайной мышцы (сгиб только по вероятности)
export function getRandomMuscleState(el: CreatureElement, step: number): RandomMuscleState {
  if (step <= 0) {
    return { isFlexed: false, justFlexed: false, justUnflexed: false };
  }

  const isTriggeredNow = isRandomMuscleTriggered(el, step);
  const isTriggeredPrev = isRandomMuscleTriggered(el, step - 1);

  return {
    isFlexed: isTriggeredNow,
    justFlexed: isTriggeredNow && !isTriggeredPrev,
    justUnflexed: !isTriggeredNow && isTriggeredPrev,
  };
}

export function determineCreatureHeadAngle(elements: CreatureElement[]): number {
  const headEl = elements.find((e) => e.type === 'head');
  if (headEl) {
    if (headEl.headAngle !== undefined) return headEl.headAngle;
    if (headEl.relX !== 0 || headEl.relY !== 0) {
      const rad = Math.atan2(headEl.relY, headEl.relX);
      let deg = Math.round((rad * 180) / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    }
  }
  return 270; // По умолчанию ВВЕРХ (270°)
}

// Вычисление физических сил, момента инерции, масс и угла разворота
export function calculatePhysicsForces(elements: CreatureElement[], muscleActiveStep: number = 0): PhysicsForces {
  const isMuscleContracted = muscleActiveStep % 2 === 1;

  const joints: { id: string; x: number; y: number }[] = [];
  const edgeElements: CreatureElement[] = [];
  const muscleElements: CreatureElement[] = [];

  let totalMass = 0;
  let totalInertia = 0;
  let totalLeftMass = 0;
  let totalRightMass = 0;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    let elWeight = el.weight ?? 0;

    if (el.type === 'joint') {
      joints.push({ id: el.id, x: el.relX, y: el.relY });
      elWeight = 1.0; // Базовая масса сустава / ядра
    } else if (el.type.startsWith('edge-')) {
      edgeElements.push(el);
      if (elWeight <= 0) elWeight = 1.0;
    } else if (el.type.startsWith('muscle-')) {
      muscleElements.push(el);
      elWeight = 0.3; // Небольшая масса мышцы
    } else if (el.type === 'head') {
      elWeight = 0.5; // Масса головы
    }

    totalMass += elWeight;

    // Расчет момента инерции масс относительно центра масс (0,0): I = sum(m * (r^2 + 0.5))
    const rSq = el.relX * el.relX + el.relY * el.relY;
    totalInertia += elWeight * (rSq + 0.5);

    if (el.relX < 0) totalLeftMass += elWeight;
    else if (el.relX > 0) totalRightMass += elWeight;
    else {
      totalLeftMass += elWeight * 0.5;
      totalRightMass += elWeight * 0.5;
    }
  }

  if (joints.length === 0) {
    joints.push({ id: 'center-joint', x: 0, y: 0 });
    totalMass += 1.0;
    totalInertia += 0.5;
  }

  totalMass = Math.max(1.0, totalMass);
  totalInertia = Math.max(1.0, totalInertia);

  const jointsPhysics: JointPhysics[] = [];
  let sumLeftTorque = 0;
  let sumRightTorque = 0;
  let totalActiveMusclesCount = 0;
  let motionActiveMusclesCount = 0;

  const hasMultipleJoints = joints.length > 1;

  for (let jIdx = 0; jIdx < joints.length; jIdx++) {
    const j = joints[jIdx];
    let jLeftMass = 0;
    let jRightMass = 0;
    let jLeftTorquePotential = 0;
    let jRightTorquePotential = 0;

    for (let eIdx = 0; eIdx < edgeElements.length; eIdx++) {
      const el = edgeElements[eIdx];
      const weight = el.weight || 1;
      const dx = el.relX - j.x;

      if (dx < 0) {
        const arm = -dx;
        const leverMultiplier = 1 + 0.5 * (arm - 1);
        jLeftMass += weight;
        jLeftTorquePotential += weight * leverMultiplier;
      } else if (dx > 0) {
        const arm = dx;
        const leverMultiplier = 1 + 0.5 * (arm - 1);
        jRightMass += weight;
        jRightTorquePotential += weight * leverMultiplier;
      } else {
        jLeftMass += weight * 0.5;
        jRightMass += weight * 0.5;
        jLeftTorquePotential += weight * 0.5;
        jRightTorquePotential += weight * 0.5;
      }
    }

    let activeLeftMuscles = 0;
    let activeRightMuscles = 0;

    for (let mIdx = 0; mIdx < muscleElements.length; mIdx++) {
      const el = muscleElements[mIdx];

      if (hasMultipleJoints) {
        const mdx = el.relX - j.x;
        const mdy = el.relY - j.y;
        if (mdx * mdx + mdy * mdy > 6.25) continue;
      }

      let providesTorque = false;
      let providesMotion = false;

      if (el.type === 'muscle-left' || el.type === 'muscle-right') {
        providesTorque = isMuscleContracted;
        providesMotion = true;
      } else if (el.type === 'muscle-random-left' || el.type === 'muscle-random-right') {
        const mState = getRandomMuscleState(el, muscleActiveStep);
        providesTorque = mState.justFlexed;
        providesMotion = mState.justFlexed || mState.justUnflexed;
      }

      if (providesTorque) {
        // Плечо рычага мышцы вдоль продольной оси
        const muscleArm = 1.0 + 0.4 * Math.abs(el.relY - j.y);
        const muscleForce = 1.5 * muscleArm;

        if (el.type.includes('left')) {
          activeLeftMuscles += muscleForce;
        } else if (el.type.includes('right')) {
          activeRightMuscles += muscleForce;
        }
      }

      if (providesMotion) {
        motionActiveMusclesCount++;
      }
    }

    const jointLeftForce = activeLeftMuscles;
    const jointRightForce = activeRightMuscles;
    const netJointTorque = jointLeftForce - jointRightForce;

    jointsPhysics.push({
      jointId: j.id,
      jx: j.x,
      jy: j.y,
      leftEdgeMass: jLeftMass,
      rightEdgeMass: jRightMass,
      leftTorquePotential: jLeftTorquePotential,
      rightTorquePotential: jRightTorquePotential,
      activeLeftMuscles: Math.round(activeLeftMuscles),
      activeRightMuscles: Math.round(activeRightMuscles),
      netJointTorque,
    });

    sumLeftTorque += jointLeftForce;
    sumRightTorque += jointRightForce;
    totalActiveMusclesCount += (activeLeftMuscles + activeRightMuscles > 0 ? 1 : 0);
  }

  const netTorque = sumLeftTorque - sumRightTorque;

  // 1. Угол разворота: w = (Torque / Inertia) * C_rotation
  // Чем больше момент инерции I, тем больше требуется крутящего момента Torque для разворота
  let netRotationDeg = 0;
  if (Math.abs(netTorque) > 0) {
    const rawRotation = (netTorque / totalInertia) * 28;
    netRotationDeg = Math.min(60, Math.max(-60, rawRotation));
  }

  const isLighterSideRotating = totalLeftMass !== totalRightMass && netTorque !== 0;

  // 2. Линейная скорость движения вперед: v = (Thrust / Mass) * C_speed
  // Чем тяжелее тело (больше Mass), тем больше мышц/тяги требуется для движения
  let forwardSpeed = 0;
  if (motionActiveMusclesCount > 0 || sumLeftTorque > 0 || sumRightTorque > 0) {
    let thrust = 0;
    if (sumLeftTorque > 0 && sumRightTorque > 0) {
      // Работают мышцы с обеих сторон (симметричная тяга вперед)
      thrust = sumLeftTorque + sumRightTorque;
    } else if (sumLeftTorque > 0 || sumRightTorque > 0) {
      // Работает только одна сторона (разворот с увлечением вперед)
      thrust = Math.max(sumLeftTorque, sumRightTorque) * 0.65;
    } else {
      thrust = 0.8 * motionActiveMusclesCount;
    }

    const calculatedSpeed = (thrust / totalMass) * 0.22;
    forwardSpeed = Math.min(0.40, Math.max(0.02, calculatedSpeed));
  }

  return {
    leftTorque: sumLeftTorque,
    rightTorque: sumRightTorque,
    netRotationDeg,
    forwardSpeed,
    leftMass: totalLeftMass,
    rightMass: totalRightMass,
    totalMass,
    totalInertia,
    isLighterSideRotating,
    jointsPhysics,
    activeMusclesCount: totalActiveMusclesCount,
  };
}

export function createCreature(
  id: string,
  name: string,
  x: number,
  y: number,
  presetIndex: number = 0,
  color: string = '#6366f1'
): Creature {
  const elements = JSON.parse(JSON.stringify(DEFAULT_PRESETS[presetIndex % DEFAULT_PRESETS.length].elements));
  const forces = calculatePhysicsForces(elements, 0);
  const initialAngle = determineCreatureHeadAngle(elements);

  return {
    id,
    name,
    color,
    x,
    y,
    elements,
    energy: 100,
    maxEnergy: 150,
    foodEaten: 0,
    stepsCount: 0,
    angleDeg: initialAngle,
    forces,
    state: 'idle',
    muscleStep: 0,
    moveProgress: 1,
    prevX: x,
    prevY: y,
    prevAngleDeg: initialAngle,
  };
}

// Найти ближайшую еду
export function findClosestFood(creature: Creature, foods: Food[]): Food | null {
  if (foods.length === 0) return null;
  let minDistanceSq = Infinity;
  let closest: Food | null = null;

  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    const dx = food.x - creature.x;
    const dy = food.y - creature.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = food;
    }
  }

  return closest;
}

// Перемещение вектора вперед с учетом угла поворота
export function getVectorFromAngle(angleDeg: number): { dx: number; dy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return { dx, dy };
}

export interface BentElementPosition {
  id: string;
  relX: number; // Bent X coordinate relative to creature center (0,0)
  relY: number; // Bent Y coordinate relative to creature center (0,0)
  rotationDeg: number; // Accumulated rotation angle of this element
}

// Иерархический расчет кинематических сгибов плеч и шарниров по весам и активным мышцам
export function calculateKinematicBends(
  elements: CreatureElement[],
  muscleStep: number = 0,
  precalculatedForces?: PhysicsForces
): Map<string, BentElementPosition> {
  const result = new Map<string, BentElementPosition>();
  if (elements.length === 0) return result;

  const forces = precalculatedForces || calculatePhysicsForces(elements, muscleStep);
  const jointsPhysicsMap = new Map(forces.jointsPhysics.map((jp) => [jp.jointId, jp]));

  // Быстрый поиск по ID элементов
  const elementMap = new Map<string, CreatureElement>();
  const jointEls: CreatureElement[] = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    elementMap.set(el.id, el);
    if (el.type === 'joint') {
      jointEls.push(el);
    }
  }

  const joints = jointEls.length > 0
    ? jointEls.map((j) => ({ id: j.id, x: j.relX, y: j.relY }))
    : [{ id: 'center-joint', x: 0, y: 0 }];

  // Найти корневой шарнир (ближайший к центру 0,0)
  let rootJoint = joints[0];
  let minDistSq = rootJoint.x * rootJoint.x + rootJoint.y * rootJoint.y;
  for (let i = 1; i < joints.length; i++) {
    const dSq = joints[i].x * joints[i].x + joints[i].y * joints[i].y;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      rootJoint = joints[i];
    }
  }

  // 2. Сортируем шарниры по удаленности от корневого
  const sortedJoints = joints.length > 1
    ? [...joints].sort((a, b) => {
        const dA = (a.x - rootJoint.x) ** 2 + (a.y - rootJoint.y) ** 2;
        const dB = (b.x - rootJoint.x) ** 2 + (b.y - rootJoint.y) ** 2;
        return dA - dB;
      })
    : joints;

  interface JointNode {
    id: string;
    x: number;
    y: number;
    parent: JointNode | null;
    leftBendDeg: number;
    rightBendDeg: number;
    accumulatedRotDeg: number;
    worldX: number;
    worldY: number;
  }

  const nodeMap = new Map<string, JointNode>();
  const nodeList: JointNode[] = [];

  for (let i = 0; i < sortedJoints.length; i++) {
    const j = sortedJoints[i];
    let parentNode: JointNode | null = null;
    if (j.id !== rootJoint.id) {
      let parentMinDistSq = Infinity;
      for (let k = 0; k < nodeList.length; k++) {
        const candidate = nodeList[k];
        const dSq = (j.x - candidate.x) ** 2 + (j.y - candidate.y) ** 2;
        if (dSq < parentMinDistSq) {
          parentMinDistSq = dSq;
          parentNode = candidate;
        }
      }
    }

    const jp = jointsPhysicsMap.get(j.id);
    let leftBendDeg = 0;
    let rightBendDeg = 0;

    if (jp) {
      if (jp.activeLeftMuscles > 0) {
        const mass = Math.max(0.5, jp.leftEdgeMass);
        const weightFactor = Math.min(2.0, Math.max(0.4, (1 + jp.activeLeftMuscles * 0.6) / (1 + mass * 0.35)));
        leftBendDeg = -9.0 * weightFactor;
      }
      if (jp.activeRightMuscles > 0) {
        const mass = Math.max(0.5, jp.rightEdgeMass);
        const weightFactor = Math.min(2.0, Math.max(0.4, (1 + jp.activeRightMuscles * 0.6) / (1 + mass * 0.35)));
        rightBendDeg = 9.0 * weightFactor;
      }
    }

    let accumulatedRotDeg = 0;
    let worldX = j.x;
    let worldY = j.y;

    if (parentNode) {
      const parentDx = j.x - parentNode.x;
      const parentSideBend = parentDx < 0 ? parentNode.leftBendDeg : parentDx > 0 ? parentNode.rightBendDeg : 0;
      accumulatedRotDeg = parentNode.accumulatedRotDeg + parentSideBend;

      const rad = (accumulatedRotDeg * Math.PI) / 180;
      const rotX = parentDx * Math.cos(rad) - (j.y - parentNode.y) * Math.sin(rad);
      const rotY = parentDx * Math.sin(rad) + (j.y - parentNode.y) * Math.cos(rad);
      worldX = parentNode.worldX + rotX;
      worldY = parentNode.worldY + rotY;
    }

    const node: JointNode = {
      id: j.id,
      x: j.x,
      y: j.y,
      parent: parentNode,
      leftBendDeg,
      rightBendDeg,
      accumulatedRotDeg,
      worldX,
      worldY,
    };

    nodeMap.set(j.id, node);
    nodeList.push(node);

    const jointEl = elementMap.get(j.id);
    if (jointEl) {
      result.set(jointEl.id, {
        id: jointEl.id,
        relX: worldX,
        relY: worldY,
        rotationDeg: accumulatedRotDeg,
      });
    }
  }

  // 3. Для всех не-шарнирных элементов привязываем их к ближайшему шарнирному узлу
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.type === 'joint') continue;

    let closestNode: JointNode = nodeList[0] || nodeMap.get(rootJoint.id)!;
    let closestDistSq = Infinity;

    for (let k = 0; k < nodeList.length; k++) {
      const node = nodeList[k];
      const dSq = (el.relX - node.x) ** 2 + (el.relY - node.y) ** 2;
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestNode = node;
      }
    }

    const dx = el.relX - closestNode.x;
    const dy = el.relY - closestNode.y;
    const sideBendDeg = dx < 0 ? closestNode.leftBendDeg : dx > 0 ? closestNode.rightBendDeg : 0;
    const totalElementRotDeg = closestNode.accumulatedRotDeg + sideBendDeg;

    const rad = (totalElementRotDeg * Math.PI) / 180;
    const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

    result.set(el.id, {
      id: el.id,
      relX: closestNode.worldX + rotX,
      relY: closestNode.worldY + rotY,
      rotationDeg: totalElementRotDeg,
    });
  }

  return result;
}

// Расчет всех точек чудика в мировых координатах с учетом изгибов
export function getCreatureElementWorldPositions(
  cx: number,
  cy: number,
  angleDeg: number,
  elements: CreatureElement[],
  muscleStep: number = 0,
  precalculatedForces?: PhysicsForces
): { x: number; y: number }[] {
  const baseHeadAngle = determineCreatureHeadAngle(elements);
  const rotRad = ((angleDeg - baseHeadAngle) * Math.PI) / 180;
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);

  const points: { x: number; y: number }[] = [{ x: cx, y: cy }];

  const bentMap = calculateKinematicBends(elements, muscleStep, precalculatedForces);

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const bent = bentMap.get(el.id) || { relX: el.relX, relY: el.relY, rotationDeg: 0 };
    const wx = cx + bent.relX * cos - bent.relY * sin;
    const wy = cy + bent.relX * sin + bent.relY * cos;
    points.push({ x: wx, y: wy });

    if (el.type.startsWith('edge-')) {
      points.push({
        x: cx + (bent.relX * cos - bent.relY * sin) * 0.5,
        y: cy + (bent.relX * sin + bent.relY * cos) * 0.5,
      });
    }
  }


  return points;
}

export interface ConnectivityResult {
  isConnected: boolean;
  connectedIds: Set<string>;
  disconnectedIds: Set<string>;
}

// Проверка связности всех элементов чудика (отсутствие оторванных элементов / "ребер в воздухе")
export function getCreatureConnectivity(elements: CreatureElement[]): ConnectivityResult {
  if (elements.length <= 1) {
    return {
      isConnected: true,
      connectedIds: new Set(elements.map((e) => e.id)),
      disconnectedIds: new Set(),
    };
  }

  // Выбор опорного элемента: сначала Голова, затем Шарнир, иначе первый элемент
  let rootIdx = elements.findIndex((e) => e.type === 'head');
  if (rootIdx === -1) rootIdx = elements.findIndex((e) => e.type === 'joint');
  if (rootIdx === -1) rootIdx = 0;

  const connectedIndices = new Set<number>();
  const queue: number[] = [rootIdx];
  connectedIndices.add(rootIdx);

  while (queue.length > 0) {
    const currIdx = queue.shift()!;
    const curr = elements[currIdx];

    for (let i = 0; i < elements.length; i++) {
      if (connectedIndices.has(i)) continue;
      const other = elements[i];
      const dx = Math.abs(curr.relX - other.relX);
      const dy = Math.abs(curr.relY - other.relY);

      // Связанные элементы находятся в соседних клетках сетки (dx <= 1, dy <= 1)
      if (dx <= 1 && dy <= 1) {
        connectedIndices.add(i);
        queue.push(i);
      }
    }
  }

  const connectedIds = new Set<string>();
  const disconnectedIds = new Set<string>();

  elements.forEach((el, idx) => {
    if (connectedIndices.has(idx)) {
      connectedIds.add(el.id);
    } else {
      disconnectedIds.add(el.id);
    }
  });

  return {
    isConnected: disconnectedIds.size === 0,
    connectedIds,
    disconnectedIds,
  };
}

// Расчет квадрата расстояния от точки (px, py) до отрезка (ax, ay) -> (bx, by)
export function pointToSegmentDistanceSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return (px - ax) ** 2 + (py - ay) ** 2;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) ** 2 + (py - projY) ** 2;
}

// Точная проверка столкновения с едой с учетом заметаемого траекторного отрезка чудика и всех его деталей
export function findEatenFood(
  prevX: number,
  prevY: number,
  prevAngleDeg: number,
  nextX: number,
  nextY: number,
  nextAngleDeg: number,
  elements: CreatureElement[],
  foods: Food[],
  ignoreIds: Set<string> = new Set(),
  muscleStep: number = 0,
  forces?: PhysicsForces,
  maxRadius: number = 0.7 // Радиус касания: 0.5 клетки (элемент) + 0.2 клетки (еда)
): Food | null {
  if (foods.length === 0) return null;

  const maxRadiusSq = maxRadius * maxRadius;

  // Точки чудика в начале движения
  const startPoints = getCreatureElementWorldPositions(prevX, prevY, prevAngleDeg, elements, muscleStep, forces);
  // Точки чудика в конце движения
  const endPoints = getCreatureElementWorldPositions(nextX, nextY, nextAngleDeg, elements, muscleStep, forces);

  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    if (ignoreIds.has(f.id)) continue;

    // 1. Проверка непрерывной траектории центра чудика
    if (pointToSegmentDistanceSq(f.x, f.y, prevX, prevY, nextX, nextY) <= maxRadiusSq) {
      return f;
    }

    // 2. Проверка непрерывных траекторий каждой физической детали (голова, щупальца, края)
    for (let p = 0; p < endPoints.length; p++) {
      const sp = startPoints[p] || { x: prevX, y: prevY };
      const ep = endPoints[p];
      if (pointToSegmentDistanceSq(f.x, f.y, sp.x, sp.y, ep.x, ep.y) <= maxRadiusSq) {
        return f;
      }
    }
  }

  return null;
}

export function calculateCreatureRadius(elements: CreatureElement[]): number {
  let maxR = 0.5; // Радиус касания отдельной детали = 0.5 клетки (полклетки)
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const r = Math.hypot(el.relX, el.relY) + 0.5;
    if (r > maxR) maxR = r;
  }
  return maxR;
}

export interface CreatureCollisionResult {
  creatures: Creature[];
  hasCollided: boolean;
  maxImpulse: number;
}

// Физический расчет столкновений чудиков с радиусом детали = 0.5 клетки и сохранением импульса (p = m*v)
export function resolveCreatureCollisions(creatures: Creature[]): CreatureCollisionResult {
  if (creatures.length < 2) {
    return { creatures, hasCollided: false, maxImpulse: 0 };
  }

  const ELEMENT_RADIUS = 0.5; // Радиус детали = полклетки
  const list = creatures.map((c) => ({ ...c }));
  let hasCollided = false;
  let maxImpulse = 0;

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const cA = list[i];
      const cB = list[j];

      const rA = calculateCreatureRadius(cA.elements);
      const rB = calculateCreatureRadius(cB.elements);

      const centerDist = Math.hypot(cB.x - cA.x, cB.y - cA.y);
      if (centerDist >= rA + rB) continue;

      // Вычисление точных мировых координат всех элементов
      const ptsA = getCreatureElementWorldPositions(cA.x, cA.y, cA.angleDeg, cA.elements, cA.muscleStep, cA.forces);
      const ptsB = getCreatureElementWorldPositions(cB.x, cB.y, cB.angleDeg, cB.elements, cB.muscleStep, cB.forces);

      let minElDist = Infinity;
      let contactPtA = { x: cA.x, y: cA.y };
      let contactPtB = { x: cB.x, y: cB.y };

      // Поиск минимального расстояния между элементами A и B
      for (let pa = 0; pa < ptsA.length; pa++) {
        for (let pb = 0; pb < ptsB.length; pb++) {
          const edx = ptsB[pb].x - ptsA[pa].x;
          const edy = ptsB[pb].y - ptsA[pa].y;
          const edist = Math.hypot(edx, edy);

          if (edist < minElDist) {
            minElDist = edist;
            contactPtA = ptsA[pa];
            contactPtB = ptsB[pb];
          }
        }
      }

      // Касание происходит, когда расстояния между деталями < 1.0 клетки (0.5 + 0.5)
      const touchDist = ELEMENT_RADIUS * 2;
      if (minElDist >= touchDist) continue;

      hasCollided = true;

      // Вектор от точки контакта A к точке контакта B
      let nx = contactPtB.x - contactPtA.x;
      let ny = contactPtB.y - contactPtA.y;
      let len = Math.hypot(nx, ny);

      if (len < 0.0001) {
        nx = cB.x - cA.x;
        ny = cB.y - cA.y;
        len = Math.hypot(nx, ny);
        if (len < 0.0001) {
          nx = 1;
          ny = 0;
          len = 1;
        }
      }

      nx /= len;
      ny /= len;

      const mA = Math.max(0.5, cA.forces?.totalMass || cA.elements.length * 1.2);
      const mB = Math.max(0.5, cB.forces?.totalMass || cB.elements.length * 1.2);

      // 1. Позиционное разделение при перекрытии (устраняет вклинивание деталей)
      const overlap = touchDist - minElDist;
      if (overlap > 0) {
        const pushA = overlap * (mB / (mA + mB));
        const pushB = overlap * (mA / (mA + mB));

        cA.x -= nx * pushA;
        cA.y -= ny * pushA;
        cB.x += nx * pushB;
        cB.y += ny * pushB;
      }

      // 2. Определение физических скоростей движения
      const speedA = (cA.forces?.forwardSpeed ?? 0.3) * 0.35;
      const speedB = (cB.forces?.forwardSpeed ?? 0.3) * 0.35;

      const radA = (cA.angleDeg * Math.PI) / 180;
      const radB = (cB.angleDeg * Math.PI) / 180;

      const vAx = speedA * Math.cos(radA);
      const vAy = speedA * Math.sin(radA);

      const vBx = speedB * Math.cos(radB);
      const vBy = speedB * Math.sin(radB);

      // Проекции скоростей на нормаль сближения n
      const vAn = vAx * nx + vAy * ny;
      const vBn = vBx * nx + vBy * ny;

      // Относительная скорость сближения
      const vRel = vAn - vBn;

      // Импульсный обмен происходит только при сближении (vRel > 0)
      if (vRel > 0) {
        const restitution = 0.5; // Коэффициент упругости
        const impulse = ((1 + restitution) * vRel) / (1 / mA + 1 / mB);

        if (impulse > maxImpulse) maxImpulse = impulse;

        // Вращательные моменты (Torque) от удара относительно центров масс
        const rxA = contactPtA.x - cA.x;
        const ryA = contactPtA.y - cA.y;
        const rxB = contactPtB.x - cB.x;
        const ryB = contactPtB.y - cB.y;

        // Векторы импульсов сил: на A действует (-impulse * n), на B (+impulse * n)
        const jAx = -impulse * nx;
        const jAy = -impulse * ny;
        const jBx = +impulse * nx;
        const jBy = +impulse * ny;

        // Крутящий момент τ = r_x * J_y - r_y * J_x
        const torqueA = rxA * jAy - ryA * jAx;
        const torqueB = rxB * jBy - ryB * jBx;

        // Моменты инерции чудиков
        const iA = Math.max(1, cA.forces?.totalInertia || mA * Math.pow(rA, 2) * 0.5);
        const iB = Math.max(1, cB.forces?.totalInertia || mB * Math.pow(rB, 2) * 0.5);

        // Поворот угла тела, пропорциональный крутящему моменту (torque)
        const dAngleA = (torqueA / iA) * (180 / Math.PI) * 1.2;
        const dAngleB = (torqueB / iB) * (180 / Math.PI) * 1.2;

        // Ограничиваем максимальный поворот от одного столкновения (не более 25°)
        const clampedDA = Math.max(-25, Math.min(25, dAngleA));
        const clampedDB = Math.max(-25, Math.min(25, dAngleB));

        cA.angleDeg = (cA.angleDeg + clampedDA + 360) % 360;
        cB.angleDeg = (cB.angleDeg + clampedDB + 360) % 360;
      }
    }
  }

  return { creatures: list, hasCollided, maxImpulse };
}
