export type DistrictKind = 'coast' | 'downtown' | 'residential' | 'harbor';
export type BuildingKind =
  | 'villa'
  | 'rowhouse'
  | 'retail'
  | 'midrise'
  | 'tower'
  | 'warehouse'
  | 'civic';

export interface BuildingPlacement {
  kind: BuildingKind;
  x: number;
  z: number;
  yaw: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  tint: number;
  district: DistrictKind;
  width: number;
  depth: number;
}

export interface TreePlacement {
  kind: 'broadleaf' | 'palm';
  x: number;
  z: number;
  scale: number;
  tint: number;
}

export interface PropPlacement {
  kind: 'lamp' | 'bench' | 'bin' | 'sign' | 'hydrant' | 'planter' | 'bollard';
  x: number;
  z: number;
  yaw: number;
  scale: number;
  tint: number;
}

export interface CarPlacement {
  x: number;
  z: number;
  yaw: number;
  tint: number;
}

export interface CityPlan {
  buildings: BuildingPlacement[];
  trees: TreePlacement[];
  props: PropPlacement[];
  cars: CarPlacement[];
  roadCenters: number[];
  blockCenters: number[];
  halfBlock: number;
  roadWidth: number;
  worldHalfExtent: number;
}

const BLOCK_COUNT = 5;
const BLOCK_STEP = 116;
const HALF_BLOCK = 48;
const ROAD_WIDTH = 20;
const SEED = 891_223;

const facadeTints = [
  0xcbb89c, 0xbca994, 0xd0c7b6, 0x9a9b91, 0xb3a090,
  0xc3b1a4, 0x9eaeb0, 0xd2bf9c, 0xa69b8c, 0xe0d3bf,
];

const carTints = [0xb74336, 0x2f5462, 0xd0c5ae, 0x6c7d69, 0x303941, 0xb58a50];

function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function choose<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function districtFor(i: number, j: number): DistrictKind {
  if (i === -2 || (i === -1 && j <= -1)) return 'coast';
  if (i >= 1 && j >= 1) return 'harbor';
  if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return 'downtown';
  return 'residential';
}

function kindsFor(district: DistrictKind): BuildingKind[] {
  if (district === 'downtown') {
    return ['retail', 'midrise', 'midrise', 'tower', 'civic', 'rowhouse'];
  }
  if (district === 'harbor') {
    return ['warehouse', 'warehouse', 'retail', 'midrise', 'rowhouse'];
  }
  if (district === 'coast') {
    return ['villa', 'villa', 'rowhouse', 'retail', 'midrise'];
  }
  return ['villa', 'rowhouse', 'rowhouse', 'retail', 'midrise'];
}

function footprintFor(kind: BuildingKind) {
  switch (kind) {
    case 'villa':
      return { width: 21, depth: 18 };
    case 'rowhouse':
      return { width: 22, depth: 20 };
    case 'retail':
      return { width: 26, depth: 22 };
    case 'midrise':
      return { width: 31, depth: 25 };
    case 'tower':
      return { width: 35, depth: 29 };
    case 'warehouse':
      return { width: 37, depth: 29 };
    case 'civic':
      return { width: 36, depth: 29 };
  }
}

function makeBuilding(
  random: () => number,
  kind: BuildingKind,
  x: number,
  z: number,
  yaw: number,
  district: DistrictKind,
  lotWidth: number,
): BuildingPlacement {
  const footprint = footprintFor(kind);
  const targetWidth = Math.min(footprint.width, lotWidth * 0.86);
  const scaleX = targetWidth / footprint.width;
  const scaleZ = 0.9 + random() * 0.18;
  return {
    kind,
    x,
    z,
    yaw,
    scaleX,
    scaleY: 0.93 + random() * 0.16,
    scaleZ,
    tint: choose(random, facadeTints),
    district,
    width: footprint.width * scaleX,
    depth: footprint.depth * scaleZ,
  };
}

export function createCityPlan(): CityPlan {
  const buildings: BuildingPlacement[] = [];
  const trees: TreePlacement[] = [];
  const props: PropPlacement[] = [];
  const cars: CarPlacement[] = [];
  const blockCenters = Array.from(
    { length: BLOCK_COUNT },
    (_, index) => (index - Math.floor(BLOCK_COUNT / 2)) * BLOCK_STEP,
  );
  const roadCenters = Array.from(
    { length: BLOCK_COUNT + 1 },
    (_, index) => (index - BLOCK_COUNT / 2) * BLOCK_STEP,
  );
  const worldHalfExtent = Math.max(...roadCenters) + ROAD_WIDTH / 2 + 20;
  const random = randomFrom(SEED);

  for (let row = 0; row < BLOCK_COUNT; row++) {
    for (let column = 0; column < BLOCK_COUNT; column++) {
      const bx = blockCenters[column]!;
      const bz = blockCenters[row]!;
      const district = districtFor(column - 2, row - 2);
      const selection = kindsFor(district);
      const plazaBlock = column === 2 && row === 2;

      if (!plazaBlock) {
        for (const side of [
          { xAxis: true, sign: -1, yaw: 0 },
          { xAxis: true, sign: 1, yaw: Math.PI },
          { xAxis: false, sign: 1, yaw: -Math.PI / 2 },
          { xAxis: false, sign: -1, yaw: Math.PI / 2 },
        ]) {
          const lotLength = HALF_BLOCK * 2 - 12;
          const count = 3 + (district === 'coast' && random() > 0.55 ? 1 : 0);
          const segment = lotLength / count;
          for (let lot = 0; lot < count; lot++) {
            const frontage = segment * (0.84 + random() * 0.08);
            const kind = choose(random, selection);
            const along = -HALF_BLOCK + 6 + segment * (lot + 0.5);
            const place = makeBuilding(
              random,
              kind,
              side.xAxis ? bx + along : bx + side.sign * (HALF_BLOCK - 5 - footprintFor(kind).depth / 2),
              side.xAxis ? bz + side.sign * (HALF_BLOCK - 5 - footprintFor(kind).depth / 2) : bz + along,
              side.yaw,
              district,
              frontage,
            );
            buildings.push(place);
          }
        }
      } else {
        // A civic hall opens onto a small plaza in the heart of the grid.
        buildings.push(makeBuilding(random, 'civic', bx, bz, 0, 'downtown', 39));
      }

      const treeRows = plazaBlock ? 2 : district === 'harbor' ? 1 : 2;
      for (let side = 0; side < 4; side++) {
        const vertical = side >= 2;
        const sign = side % 2 === 0 ? -1 : 1;
        const count = treeRows + (district === 'coast' ? 1 : 0);
        for (let n = 0; n < count; n++) {
          if (!plazaBlock && random() < 0.3) continue;
          const along = -HALF_BLOCK + 12 + ((HALF_BLOCK * 2 - 24) * (n + 0.5)) / count;
          const x = vertical ? bx + sign * (HALF_BLOCK - 2.4) : bx + along;
          const z = vertical ? bz + along : bz + sign * (HALF_BLOCK - 2.4);
          trees.push({
            kind: district === 'coast' && random() > 0.42 ? 'palm' : 'broadleaf',
            x,
            z,
            scale: 0.84 + random() * 0.34,
            tint: choose(random, [0x75905b, 0x658052, 0x84965f, 0x536f4b]),
          });
        }
      }
    }
  }

  // Long, connected streets get a shared rhythm of lights and street furniture.
  for (const road of roadCenters) {
    for (let distance = -278; distance <= 278; distance += 58) {
      for (const sign of [-1, 1]) {
        const useNorthSouth = Math.round((road + distance) / 58) % 2 === 0;
        const x = useNorthSouth ? road + sign * 12.2 : distance;
        const z = useNorthSouth ? distance : road + sign * 12.2;
        props.push({
          kind: 'lamp',
          x,
          z,
          yaw: useNorthSouth ? (sign < 0 ? 0 : Math.PI) : sign < 0 ? Math.PI / 2 : -Math.PI / 2,
          scale: 0.92 + random() * 0.16,
          tint: random() > 0.6 ? 0xe2d2a2 : 0xc8d3ce,
        });
      }
    }
  }

  for (let index = 0; index < 28; index++) {
    const roadIndex = Math.floor(random() * roadCenters.length);
    const street = roadCenters[roadIndex]!;
    const along = -265 + random() * 530;
    const horizontal = random() > 0.5;
    const side = random() > 0.5 ? 1 : -1;
    const position = horizontal
      ? { x: along, z: street + side * (ROAD_WIDTH / 2 + 2.8) }
      : { x: street + side * (ROAD_WIDTH / 2 + 2.8), z: along };
    const kind = choose(random, ['bench', 'bin', 'sign', 'hydrant'] as const);
    props.push({
      kind,
      ...position,
      yaw: horizontal ? 0 : Math.PI / 2,
      scale: 0.88 + random() * 0.24,
      tint: kind === 'hydrant' ? 0xd04a37 : 0x66716f,
    });
  }

  // A few ordinary cars make the curb lanes and parking areas feel occupied.
  for (let index = 0; index < 18; index++) {
    const road = choose(random, roadCenters);
    const along = -250 + random() * 500;
    const sign = random() > 0.5 ? 1 : -1;
    const horizontal = random() > 0.5;
    cars.push({
      x: horizontal ? along : road + sign * 6.6,
      z: horizontal ? road + sign * 6.6 : along,
      yaw: horizontal ? Math.PI / 2 : 0,
      tint: choose(random, carTints),
    });
  }

  for (let index = 0; index < 24; index++) {
    const x = -265 + random() * 530;
    const z = -265 + random() * 530;
    if (Math.abs(x) < 72 && Math.abs(z) < 72) continue;
    props.push({
      kind: choose(random, ['planter', 'bollard'] as const),
      x,
      z,
      yaw: random() * Math.PI * 2,
      scale: 0.8 + random() * 0.4,
      tint: choose(random, [0x84935b, 0x6d8054, 0x8d8672]),
    });
  }

  return {
    buildings,
    trees,
    props,
    cars,
    roadCenters,
    blockCenters,
    halfBlock: HALF_BLOCK,
    roadWidth: ROAD_WIDTH,
    worldHalfExtent,
  };
}

