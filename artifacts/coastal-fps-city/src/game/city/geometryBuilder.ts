import * as THREE from 'three';

type Vec3 = readonly [number, number, number];
type Rgba = readonly [number, number, number];

const boxFaces: { normal: Vec3; corners: [Vec3, Vec3, Vec3, Vec3] }[] = [
  {
    normal: [0, 0, 1],
    corners: [
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
    ],
  },
  {
    normal: [1, 0, 0],
    corners: [
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [-0.5, -0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [-0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
      [-0.5, -0.5, 0.5],
    ],
  },
];

function colorTuple(hex: number): Rgba {
  const color = new THREE.Color(hex);
  return [color.r, color.g, color.b];
}

function rotateXZ(x: number, z: number, yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x * c + z * s, -x * s + z * c] as const;
}

export class GeometryBuilder {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly colors: number[] = [];
  private readonly indices: number[] = [];

  private pushVertex(position: Vec3, normal: Vec3, color: Rgba) {
    const index = this.positions.length / 3;
    this.positions.push(position[0], position[1], position[2]);
    this.normals.push(normal[0], normal[1], normal[2]);
    this.colors.push(color[0], color[1], color[2]);
    return index;
  }

  private pushQuad(points: [Vec3, Vec3, Vec3, Vec3], normal: Vec3, color: Rgba) {
    const a = new THREE.Vector3(...points[0]);
    const b = new THREE.Vector3(...points[1]);
    const c = new THREE.Vector3(...points[2]);
    const cross = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (cross.dot(new THREE.Vector3(...normal)) < 0) {
      [points[1], points[3]] = [points[3], points[1]];
    }
    const base = this.pushVertex(points[0], normal, color);
    this.pushVertex(points[1], normal, color);
    this.pushVertex(points[2], normal, color);
    this.pushVertex(points[3], normal, color);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  private pushTriangle(points: [Vec3, Vec3, Vec3], color: Rgba) {
    const a = new THREE.Vector3(...points[0]);
    const b = new THREE.Vector3(...points[1]);
    const c = new THREE.Vector3(...points[2]);
    const normal = new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize();
    const base = this.pushVertex(points[0], [normal.x, normal.y, normal.z], color);
    this.pushVertex(points[1], [normal.x, normal.y, normal.z], color);
    this.pushVertex(points[2], [normal.x, normal.y, normal.z], color);
    this.indices.push(base, base + 1, base + 2);
  }

  addBox(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    hex: number,
    yaw = 0,
  ) {
    if (width <= 0 || height <= 0 || depth <= 0) return;
    const color = colorTuple(hex);
    for (const face of boxFaces) {
      const [nx, nz] = rotateXZ(face.normal[0], face.normal[2], yaw);
      const corners = face.corners.map((corner) => {
        const lx = corner[0] * width;
        const lz = corner[2] * depth;
        const [rx, rz] = rotateXZ(lx, lz, yaw);
        return [x + rx, y + corner[1] * height, z + rz] as Vec3;
      }) as [Vec3, Vec3, Vec3, Vec3];
      this.pushQuad(corners, [nx, face.normal[1], nz], color);
    }
  }

  addTriangle(a: Vec3, b: Vec3, c: Vec3, hex: number) {
    this.pushTriangle([a, b, c], colorTuple(hex));
  }

  addGeometry(source: THREE.BufferGeometry, matrix: THREE.Matrix4, hex: number) {
    const geometry = source.clone();
    geometry.applyMatrix4(matrix);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const index = geometry.getIndex();
    const color = colorTuple(hex);
    const triangleCount = index ? index.count / 3 : position.count / 3;
    for (let face = 0; face < triangleCount; face++) {
      const ids = index
        ? [index.getX(face * 3), index.getX(face * 3 + 1), index.getX(face * 3 + 2)]
        : [face * 3, face * 3 + 1, face * 3 + 2];
      const base = this.positions.length / 3;
      for (const id of ids) {
        this.positions.push(position.getX(id), position.getY(id), position.getZ(id));
        this.normals.push(normal.getX(id), normal.getY(id), normal.getZ(id));
        this.colors.push(color[0], color[1], color[2]);
      }
      this.indices.push(base, base + 1, base + 2);
    }
    geometry.dispose();
  }

  addCylinderBetween(
    from: THREE.Vector3,
    to: THREE.Vector3,
    radiusBottom: number,
    radiusTop: number,
    hex: number,
    segments = 6,
  ) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    if (length < 0.001) return;
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      length,
      segments,
      1,
      false,
    );
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion,
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);
    const color = colorTuple(hex);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const indexAttribute = geometry.getIndex();
    if (indexAttribute) {
      for (let face = 0; face < indexAttribute.count; face += 3) {
        const ia = indexAttribute.getX(face);
        const ib = indexAttribute.getX(face + 1);
        const ic = indexAttribute.getX(face + 2);
        const vertices = [ia, ib, ic] as const;
        const base = this.positions.length / 3;
        for (const vertex of vertices) {
          this.positions.push(
            position.getX(vertex),
            position.getY(vertex),
            position.getZ(vertex),
          );
          this.normals.push(
            normal.getX(vertex),
            normal.getY(vertex),
            normal.getZ(vertex),
          );
          this.colors.push(color[0], color[1], color[2]);
        }
        this.indices.push(base, base + 1, base + 2);
      }
    }
    geometry.dispose();
  }

  toGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setIndex(this.indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}

