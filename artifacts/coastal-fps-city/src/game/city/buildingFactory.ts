import * as THREE from 'three';
import { GeometryBuilder } from './geometryBuilder';
import type { BuildingKind } from './cityPlan';

export interface BuildingModel {
  kind: BuildingKind;
  width: number;
  depth: number;
  height: number;
  high: THREE.BufferGeometry;
  low: THREE.BufferGeometry;
}

interface BuildingProfile {
  width: number;
  depth: number;
  height: number;
  floors: number;
  body: number;
  roof: number;
  trim: number;
  glass: number;
  accent: number;
}

const profiles: Record<BuildingKind, BuildingProfile> = {
  villa: {
    width: 21, depth: 18, height: 8.2, floors: 2,
    body: 0xd5c5ac, roof: 0x59483d, trim: 0xf0e1c8, glass: 0x354b54, accent: 0xa65d43,
  },
  rowhouse: {
    width: 22, depth: 20, height: 12, floors: 3,
    body: 0xbba38e, roof: 0x504640, trim: 0xdccbb3, glass: 0x30464e, accent: 0x8e5b4d,
  },
  retail: {
    width: 26, depth: 22, height: 10.5, floors: 2,
    body: 0xb8ad9d, roof: 0x514c45, trim: 0xe5d6bd, glass: 0x29434c, accent: 0xc78257,
  },
  midrise: {
    width: 31, depth: 25, height: 25, floors: 6,
    body: 0xc1b7a7, roof: 0x57534c, trim: 0xe0d5c3, glass: 0x294653, accent: 0xa77a54,
  },
  tower: {
    width: 35, depth: 29, height: 47, floors: 12,
    body: 0x8e9997, roof: 0x3e4b4c, trim: 0xc2c8be, glass: 0x234651, accent: 0xc39a65,
  },
  warehouse: {
    width: 37, depth: 29, height: 12.5, floors: 2,
    body: 0x92958e, roof: 0x55544e, trim: 0xc4beb1, glass: 0x314b51, accent: 0xa55b43,
  },
  civic: {
    width: 36, depth: 29, height: 22, floors: 4,
    body: 0xd2c8b7, roof: 0x4b504b, trim: 0xf0e3ca, glass: 0x314a50, accent: 0x9d704d,
  },
};

function addWindow(
  builder: GeometryBuilder,
  x: number,
  y: number,
  z: number,
  yaw: number,
  windowWidth: number,
  windowHeight: number,
  profile: BuildingProfile,
  floor: number,
) {
  // The pane sits back from the projecting jambs; the layered pieces give
  // each opening a deep shadow line and an actual sill.
  builder.addBox(windowWidth + 0.28, windowHeight + 0.28, 0.12, x, y, z + 0.025, 0x413e38, yaw);
  builder.addBox(windowWidth, windowHeight, 0.07, x, y, z - 0.025, profile.glass, yaw);
  const frameZ = z - 0.13;
  const bar = 0.13;
  builder.addBox(bar, windowHeight + 0.35, 0.24, x - windowWidth / 2 - bar / 2, y, frameZ, profile.trim, yaw);
  builder.addBox(bar, windowHeight + 0.35, 0.24, x + windowWidth / 2 + bar / 2, y, frameZ, profile.trim, yaw);
  builder.addBox(windowWidth + 0.34, bar, 0.24, x, y + windowHeight / 2 + bar / 2, frameZ, profile.trim, yaw);
  builder.addBox(windowWidth + 0.42, 0.17, 0.38, x, y - windowHeight / 2 - 0.085, frameZ - 0.035, profile.accent, yaw);
  builder.addBox(0.08, windowHeight, 0.10, x, y, z - 0.18, 0x9daeb0, yaw);
  if (floor === 0) {
    builder.addBox(windowWidth + 0.12, 0.08, 0.12, x, y - 0.17, z - 0.17, 0x26343a, yaw);
  }
}

function addFrontWindows(
  builder: GeometryBuilder,
  profile: BuildingProfile,
  floors: number,
  yaw: number,
  faceZ: number,
  isRetail: boolean,
  isWarehouse: boolean,
) {
  const floorHeight = profile.height / floors;
  const columns = Math.max(2, Math.min(7, Math.floor((profile.width - 5) / 4)));
  const windowWidth = Math.min(2.05, (profile.width - 7) / columns - 0.9);
  const windowHeight = Math.min(1.85, floorHeight * (isWarehouse ? 0.35 : 0.5));
  for (let floor = 0; floor < floors; floor++) {
    const centerY = 1.65 + floor * floorHeight;
    if (isRetail && floor === 0) {
      for (let column = 0; column < columns; column++) {
        const x = -((columns - 1) * (profile.width / columns)) / 2 + column * (profile.width / columns);
        const width = profile.width / columns - 1.1;
        builder.addBox(width + 0.3, floorHeight * 0.69, 0.13, x, floorHeight * 0.48, faceZ - 0.02, 0x313b3a, yaw);
        builder.addBox(width, floorHeight * 0.58, 0.07, x, floorHeight * 0.48, faceZ - 0.095, 0x2a4650, yaw);
        builder.addBox(width + 0.25, 0.13, 0.26, x, 0.16, faceZ - 0.15, profile.accent, yaw);
      }
      continue;
    }
    if (isWarehouse && floor === 0) {
      for (let column = 0; column < 2; column++) {
        const x = (column === 0 ? -1 : 1) * profile.width * 0.25;
        builder.addBox(5.2, 4.7, 0.24, x, 2.7, faceZ - 0.1, 0x4c514e, yaw);
        builder.addBox(4.6, 4.1, 0.14, x, 2.7, faceZ - 0.24, profile.accent, yaw);
        builder.addBox(4.0, 3.6, 0.12, x, 2.7, faceZ - 0.31, 0x5c6761, yaw);
      }
      continue;
    }
    for (let column = 0; column < columns; column++) {
      const x = -((columns - 1) * (profile.width / columns)) / 2 + column * (profile.width / columns);
      addWindow(builder, x, centerY, faceZ, yaw, windowWidth, windowHeight, profile, floor);
      if (profile.height > 20 && column === 0 && floor > 0) {
        builder.addBox(0.11, windowHeight + 0.55, 0.18, x - windowWidth / 2 - 0.48, centerY, faceZ - 0.05, profile.accent, yaw);
      }
      if ((profile.height < 14 || isRetail) && floor > 0 && column % 2 === 0) {
        builder.addBox(0.1, windowHeight + 0.28, 0.2, x - windowWidth / 2 - 0.28, centerY, faceZ - 0.17, profile.roof, yaw);
        builder.addBox(0.1, windowHeight + 0.28, 0.2, x + windowWidth / 2 + 0.28, centerY, faceZ - 0.17, profile.roof, yaw);
      }
      if ((profile.height < 14 || profile.height > 20) && floor > 0 && column % 2 === 0) {
        builder.addBox(windowWidth + 1.2, 0.18, 1.25, x, centerY - 1.0, faceZ - 0.45, profile.body, yaw);
        builder.addBox(windowWidth + 0.8, 0.12, 0.12, x, centerY - 0.52, faceZ - 1.03, profile.trim, yaw);
        builder.addBox(0.1, 0.56, 0.1, x - windowWidth / 2 - 0.32, centerY - 0.24, faceZ - 1.03, 0x525550, yaw);
        builder.addBox(0.1, 0.56, 0.1, x + windowWidth / 2 + 0.32, centerY - 0.24, faceZ - 1.03, 0x525550, yaw);
      }
    }
  }
}

function addSideWindows(builder: GeometryBuilder, profile: BuildingProfile, floors: number) {
  const floorHeight = profile.height / floors;
  const count = Math.max(2, Math.min(5, Math.floor((profile.depth - 4) / 4.1)));
  const windowWidth = Math.min(1.8, profile.depth / count - 0.9);
  for (const side of [-1, 1]) {
    const faceX = side * profile.width / 2;
    const yaw = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let floor = 0; floor < floors; floor++) {
      if (profile.height < 14 && floor === 0) continue;
      const centerY = 1.65 + floor * floorHeight;
      for (let column = 0; column < count; column++) {
        const along = -((count - 1) * (profile.depth / count)) / 2 + column * (profile.depth / count);
        addWindow(
          builder,
          faceX,
          centerY,
          along,
          yaw,
          windowWidth,
          Math.min(1.7, floorHeight * 0.48),
          profile,
          floor,
        );
      }
    }
  }
}

function createHighDetail(profile: BuildingProfile, kind: BuildingKind) {
  const builder = new GeometryBuilder();
  const w = profile.width;
  const d = profile.depth;
  const h = profile.height;
  const retail = kind === 'retail';
  const industrial = kind === 'warehouse';
  const residential = kind === 'villa' || kind === 'rowhouse';

  builder.addBox(w, h, d, 0, h / 2, 0, profile.body);
  builder.addBox(w + 0.35, 0.45, d + 0.35, 0, 0.23, 0, profile.trim);
  builder.addBox(w + 0.55, 0.24, d + 0.55, 0, h - 0.14, 0, profile.trim);

  const floorHeight = h / profile.floors;
  for (let floor = 1; floor < profile.floors; floor++) {
    builder.addBox(w + 0.38, 0.16, d + 0.38, 0, floor * floorHeight, 0, profile.trim);
  }

  addFrontWindows(builder, profile, profile.floors, 0, -d / 2, retail, industrial);
  addFrontWindows(builder, profile, profile.floors, Math.PI, d / 2, false, false);
  addSideWindows(builder, profile, profile.floors);

  // Deep corner pilasters and a clearly modeled entrance establish a real
  // architectural rhythm instead of a bare cuboid.
  const pilasterHeight = Math.max(3.2, h - 0.8);
  for (const x of [-w / 2 + 0.55, w / 2 - 0.55]) {
    builder.addBox(0.48, pilasterHeight, 0.34, x, pilasterHeight / 2 + 0.4, -d / 2 - 0.05, profile.trim);
  }

  if (retail || kind === 'civic') {
    const entryWidth = retail ? 1.8 : 2.6;
    builder.addBox(entryWidth + 0.5, 3.0, 0.4, 0, 1.55, -d / 2 - 0.22, profile.roof);
    builder.addBox(entryWidth, 2.55, 0.18, 0, 1.42, -d / 2 - 0.44, 0x34484a);
    builder.addBox(entryWidth * 0.42, 2.3, 0.1, -entryWidth * 0.27, 1.42, -d / 2 - 0.55, 0x6d5946);
    builder.addBox(0.12, 2.35, 0.12, entryWidth * 0.1, 1.42, -d / 2 - 0.56, profile.trim);
    builder.addBox(entryWidth + 1.0, 0.36, 2.1, 0, 0.18, -d / 2 - 1.0, profile.trim);
    builder.addBox(entryWidth + 2.0, 0.28, 1.3, 0, 0.42, -d / 2 - 0.62, profile.accent);
  } else if (residential) {
    for (const x of [-2.1, 2.1]) {
      builder.addCylinderBetween(
        new THREE.Vector3(x, 0.6, -d / 2 - 1.1),
        new THREE.Vector3(x, 3.7, -d / 2 - 1.1),
        0.14,
        0.11,
        profile.trim,
        8,
      );
    }
    builder.addBox(6.0, 0.3, 2.8, 0, 3.9, -d / 2 - 1.0, profile.roof);
    builder.addBox(7.0, 0.28, 3.5, 0, 0.15, -d / 2 - 1.2, profile.trim);
  }

  if (kind === 'villa') {
    const roofRise = 3.0;
    const pitch = Math.atan2(roofRise, d / 2 + 0.5);
    builder.addBox(w + 2.2, 0.7, d / 2 + 2.0, 0, h + roofRise / 2, -d / 4, profile.roof, pitch);
    builder.addBox(w + 2.2, 0.7, d / 2 + 2.0, 0, h + roofRise / 2, d / 4, profile.roof, -pitch);
    builder.addBox(0.34, 0.34, d + 2.8, 0, h + roofRise, 0, profile.trim);
    builder.addTriangle([-w / 2, h, -d / 2], [w / 2, h, -d / 2], [0, h + roofRise, -d / 2], profile.accent);
    builder.addTriangle([w / 2, h, d / 2], [-w / 2, h, d / 2], [0, h + roofRise, d / 2], profile.accent);
  } else {
    // Parapets, machinery and rooftop setbacks break up the skyline.
    builder.addBox(w + 0.5, 0.9, 0.55, 0, h + 0.35, -d / 2 + 0.18, profile.trim);
    builder.addBox(w + 0.5, 0.9, 0.55, 0, h + 0.35, d / 2 - 0.18, profile.trim);
    builder.addBox(0.55, 0.9, d - 0.8, -w / 2 + 0.18, h + 0.35, 0, profile.trim);
    builder.addBox(0.55, 0.9, d - 0.8, w / 2 - 0.18, h + 0.35, 0, profile.trim);
    const rooftopCount = kind === 'tower' ? 5 : kind === 'warehouse' ? 3 : 2;
    for (let index = 0; index < rooftopCount; index++) {
      const x = -w * 0.31 + (w * 0.62 * index) / Math.max(1, rooftopCount - 1);
      const unitW = kind === 'tower' ? 3.1 : 2.5;
      const unitH = kind === 'tower' ? 1.8 : 1.15;
      builder.addBox(unitW, unitH, 2.4, x, h + 1.1 + unitH / 2, 0, 0x66675f);
      builder.addBox(unitW + 0.15, 0.12, 2.55, x, h + 1.1 + unitH, 0, profile.trim);
    }
  }

  if (kind === 'rowhouse') {
    for (let floor = 1; floor < profile.floors; floor++) {
      const centerY = floor * floorHeight + 0.2;
      for (const x of [-w * 0.22, w * 0.22]) {
        builder.addBox(4.2, 0.3, 1.5, x, centerY, -d / 2 - 0.7, profile.accent);
        builder.addBox(4.0, 0.1, 0.1, x, centerY + 1.05, -d / 2 - 1.48, profile.trim);
        for (const rail of [-1.8, -0.9, 0, 0.9, 1.8]) {
          builder.addBox(0.08, 0.95, 0.08, x + rail, centerY + 0.52, -d / 2 - 1.48, 0x555a56);
        }
      }
    }
  }

  if (kind === 'midrise' || kind === 'tower') {
    const finCount = kind === 'tower' ? 7 : 5;
    for (let index = 0; index < finCount; index++) {
      const x = -w * 0.4 + (w * 0.8 * index) / (finCount - 1);
      builder.addBox(0.32, h + 0.8, 0.42, x, h / 2, -d / 2 - 0.12, profile.accent);
    }
    if (kind === 'tower') {
      builder.addBox(w * 0.64, 2.1, d * 0.7, 0, h + 1.45, 0, profile.body);
      builder.addBox(w * 0.58, 1.0, d * 0.64, 0, h + 3.0, 0, profile.trim);
      builder.addCylinderBetween(
        new THREE.Vector3(0, h + 3.5, 0),
        new THREE.Vector3(0, h + 8.5, 0),
        0.35,
        0.07,
        profile.accent,
        8,
      );
    }
  }

  if (kind === 'warehouse') {
    for (let index = 0; index < 21; index++) {
      const x = -w / 2 + 1.0 + index * ((w - 2) / 20);
      builder.addBox(0.12, h - 0.8, 0.17, x, h / 2, -d / 2 - 0.13, 0x777b74);
      builder.addBox(0.12, h - 0.8, 0.17, x, h / 2, d / 2 + 0.13, 0x777b74);
    }
    builder.addBox(w * 0.54, 0.25, d * 0.8, 0, h + 0.18, 0, profile.roof);
    builder.addBox(w * 0.28, 1.5, d * 0.85, 0, h + 0.9, 0, 0x74756e);
    builder.addBox(10, 0.35, 1.8, 0, 0.25, -d / 2 - 1.1, profile.trim);
  }

  if (kind === 'civic') {
    for (const x of [-12, -7.5, -3, 3, 7.5, 12]) {
      builder.addCylinderBetween(
        new THREE.Vector3(x, 0.7, -d / 2 - 0.55),
        new THREE.Vector3(x, h - 1.0, -d / 2 - 0.55),
        0.38,
        0.32,
        profile.trim,
        10,
      );
      builder.addBox(1.05, 0.4, 1.0, x, 0.8, -d / 2 - 0.55, profile.accent);
      builder.addBox(1.1, 0.38, 1.0, x, h - 1.05, -d / 2 - 0.55, profile.trim);
    }
    builder.addBox(w * 0.68, 0.7, d * 0.6, 0, h + 0.3, 0, profile.accent);
    builder.addBox(w * 0.56, 1.6, d * 0.5, 0, h + 1.2, 0, profile.trim);
    builder.addBox(2.0, 3.2, 1.0, 0, h + 2.0, -0.2, profile.roof);
    builder.addBox(w + 3, 0.8, d + 3, 0, 0.4, 0, profile.trim);
  }

  return builder.toGeometry();
}

function createLowDetail(profile: BuildingProfile, kind: BuildingKind) {
  const builder = new GeometryBuilder();
  const w = profile.width;
  const d = profile.depth;
  const h = profile.height;
  builder.addBox(w, h, d, 0, h / 2, 0, profile.body);
  builder.addBox(w + 0.5, 0.55, d + 0.5, 0, h + 0.25, 0, profile.roof);
  builder.addBox(w + 0.3, 0.24, d + 0.3, 0, 0.12, 0, profile.trim);
  const bandCount = kind === 'tower' ? 9 : kind === 'midrise' ? 5 : 2;
  for (let row = 0; row < bandCount; row++) {
    const y = h * (row + 1) / (bandCount + 1);
    builder.addBox(w * 0.7, 0.45, 0.09, 0, y, -d / 2 - 0.06, profile.glass);
    builder.addBox(w * 0.68, 0.11, 0.18, 0, y - 0.27, -d / 2 - 0.12, profile.trim);
  }
  if (kind === 'villa') {
    builder.addBox(w + 2, 1.0, d + 2, 0, h + 0.5, 0, profile.roof);
  }
  return builder.toGeometry();
}

export function createBuildingModels(): Record<BuildingKind, BuildingModel> {
  return Object.fromEntries(
    Object.entries(profiles).map(([kind, profile]) => [
      kind,
      {
        kind: kind as BuildingKind,
        width: profile.width,
        depth: profile.depth,
        height: profile.height,
        high: createHighDetail(profile, kind as BuildingKind),
        low: createLowDetail(profile, kind as BuildingKind),
      },
    ]),
  ) as Record<BuildingKind, BuildingModel>;
}

