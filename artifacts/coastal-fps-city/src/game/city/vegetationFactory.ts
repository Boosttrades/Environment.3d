import * as THREE from 'three';
import { GeometryBuilder } from './geometryBuilder';

export interface VegetationModel {
  key: string;
  geometry: THREE.BufferGeometry;
  height: number;
  radius: number;
}

function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1103515245 + 12345) >>> 0;
    return state / 4294967296;
  };
}

function irregularIcosphere(seed: number) {
  const random = randomFrom(seed);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const factor = 0.83 + random() * 0.32;
    positions.setXYZ(
      index,
      positions.getX(index) * factor,
      positions.getY(index) * (0.86 + random() * 0.26),
      positions.getZ(index) * factor,
    );
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function broadleafTree(seed: number): VegetationModel {
  const random = randomFrom(seed);
  const builder = new GeometryBuilder();
  const barkPalette = [0x66503c, 0x71543d, 0x5a4a39];
  const leafPalette = [0x637e4a, 0x728b50, 0x82935b, 0x58764b, 0x91a365];
  const mainHeight = 4.8 + random() * 0.9;

  builder.addCylinderBetween(
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0.08, mainHeight * 0.52, 0.02),
    0.48,
    0.28,
    barkPalette[Math.floor(random() * barkPalette.length)]!,
    8,
  );
  builder.addCylinderBetween(
    new THREE.Vector3(0.08, mainHeight * 0.5, 0.02),
    new THREE.Vector3(-0.1, mainHeight, 0),
    0.29,
    0.11,
    barkPalette[Math.floor(random() * barkPalette.length)]!,
    7,
  );

  const branchCount = 7 + Math.floor(random() * 3);
  for (let branch = 0; branch < branchCount; branch++) {
    const angle = (Math.PI * 2 * branch) / branchCount + random() * 0.4;
    const y = mainHeight * (0.42 + random() * 0.39);
    const start = new THREE.Vector3(0.02, y, 0);
    const reach = 1.9 + random() * 1.05;
    const end = new THREE.Vector3(
      Math.cos(angle) * reach,
      y + 1.1 + random() * 1.15,
      Math.sin(angle) * reach,
    );
    const middle = new THREE.Vector3().lerpVectors(start, end, 0.56);
    builder.addCylinderBetween(start, middle, 0.17, 0.105, barkPalette[branch % barkPalette.length]!, 6);
    builder.addCylinderBetween(middle, end, 0.105, 0.045, barkPalette[branch % barkPalette.length]!, 5);
  }

  const crown = irregularIcosphere(seed * 71 + 31);
  const crownPositions = [
    [-1.45, mainHeight + 0.55, 0.25, 1.45, 1.65, 1.42],
    [1.1, mainHeight + 0.35, 0.95, 1.55, 1.35, 1.4],
    [0.1, mainHeight + 1.55, -0.85, 1.5, 1.4, 1.45],
    [-0.25, mainHeight + 1.9, 0.2, 1.55, 1.7, 1.6],
    [1.8, mainHeight + 1.45, -0.65, 1.3, 1.4, 1.35],
    [-1.65, mainHeight + 1.1, -0.8, 1.35, 1.45, 1.3],
    [0.7, mainHeight + 2.25, 0.95, 1.15, 1.25, 1.15],
    [-0.9, mainHeight + 2.35, 0.75, 1.2, 1.25, 1.15],
    [0, mainHeight + 0.85, 1.75, 1.15, 1.3, 1.1],
  ];
  for (let index = 0; index < crownPositions.length; index++) {
    const [x, y, z, sx, sy, sz] = crownPositions[index]!;
    const position = new THREE.Vector3(x! + (random() - 0.5) * 0.4, y! + (random() - 0.5) * 0.5, z! + (random() - 0.5) * 0.4);
    const scale = new THREE.Vector3(sx! * (0.9 + random() * 0.2), sy! * (0.88 + random() * 0.22), sz! * (0.9 + random() * 0.18));
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(random() * 0.6, random() * Math.PI, random() * 0.45));
    builder.addGeometry(crown, new THREE.Matrix4().compose(position, rotation, scale), leafPalette[index % leafPalette.length]!);
  }
  crown.dispose();

  return {
    key: `broadleaf-${seed}`,
    geometry: builder.toGeometry(),
    height: mainHeight + 4.1,
    radius: 3.8,
  };
}

function palmTree(seed: number): VegetationModel {
  const random = randomFrom(seed);
  const builder = new GeometryBuilder();
  const bark = 0x755941;
  const frondColors = [0x597949, 0x708d52, 0x819659];
  const height = 8.3 + random() * 1.1;
  let previous = new THREE.Vector3(0, 0, 0);
  for (let segment = 1; segment <= 7; segment++) {
    const t = segment / 7;
    const point = new THREE.Vector3(
      Math.sin(t * Math.PI * 0.72) * 0.58,
      height * t,
      Math.cos(t * Math.PI * 0.68) * 0.24,
    );
    builder.addCylinderBetween(previous, point, 0.33 - t * 0.19, 0.31 - t * 0.19, bark, 7);
    if (segment > 1) {
      builder.addBox(0.42, 0.14, 0.42, point.x, point.y, point.z, 0x98714b);
    }
    previous = point;
  }

  const crown = previous.clone();
  const frondCount = 9;
  for (let frond = 0; frond < frondCount; frond++) {
    const angle = (Math.PI * 2 * frond) / frondCount + random() * 0.16;
    const length = 3.2 + random() * 1.3;
    const rise = -1.25 - random() * 0.6;
    const end = new THREE.Vector3(
      crown.x + Math.cos(angle) * length,
      crown.y + rise,
      crown.z + Math.sin(angle) * length,
    );
    builder.addCylinderBetween(crown, end, 0.075, 0.018, frondColors[frond % 3]!, 5);
    for (let leaflet = 0; leaflet < 7; leaflet++) {
      const t = 0.2 + leaflet * 0.105;
      const stemPoint = new THREE.Vector3().lerpVectors(crown, end, t);
      const sweep = 1.15 * (1 - t * 0.24);
      for (const side of [-1, 1]) {
        const leafletEnd = new THREE.Vector3(
          stemPoint.x + Math.cos(angle + side * Math.PI / 2) * sweep,
          stemPoint.y - 0.62 * (1 - t * 0.18),
          stemPoint.z + Math.sin(angle + side * Math.PI / 2) * sweep,
        );
        builder.addCylinderBetween(stemPoint, leafletEnd, 0.035, 0.008, frondColors[(frond + leaflet) % 3]!, 4);
      }
    }
  }
  builder.addCylinderBetween(
    new THREE.Vector3(crown.x - 0.45, crown.y - 0.15, crown.z),
    new THREE.Vector3(crown.x + 0.45, crown.y - 0.15, crown.z),
    0.13,
    0.13,
    0x97714b,
    7,
  );

  return { key: `palm-${seed}`, geometry: builder.toGeometry(), height: height + 3.2, radius: 4.5 };
}

export function createVegetationModels() {
  const broadleaf = [11, 23, 37, 49].map((seed) => broadleafTree(seed));
  const palms = [17, 41, 67].map((seed) => palmTree(seed));
  const shrub = new GeometryBuilder();
  const shrubSphere = irregularIcosphere(902);
  const shrubMatrices = [
    [-0.65, 0.42, 0, 0.92, 0.62, 0.75],
    [0.35, 0.4, 0.26, 0.85, 0.72, 0.84],
    [0.85, 0.32, -0.12, 0.58, 0.5, 0.68],
    [-0.1, 0.56, -0.42, 0.67, 0.66, 0.73],
  ];
  shrubMatrices.forEach(([x, y, z, sx, sy, sz], index) => {
    const position = new THREE.Vector3(x!, y!, z!);
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1 * index, index * 0.7, 0.05));
    shrub.addGeometry(shrubSphere, new THREE.Matrix4().compose(position, rotation, new THREE.Vector3(sx!, sy!, sz!)), [0x587448, 0x6c8350, 0x7d8d56, 0x63794a][index]!);
  });
  shrubSphere.dispose();
  const shrubModel: VegetationModel = {
    key: 'coastal-shrub',
    geometry: shrub.toGeometry(),
    height: 1.2,
    radius: 1.1,
  };

  return { broadleaf, palms, shrub: shrubModel };
}

