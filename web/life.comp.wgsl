struct Params {
	width: u32,
	height: u32,
};

@group(0) @binding(0) var<storage, read> src: array<u32>;
@group(0) @binding(1) var<storage, read_write> dst: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn comp_main(@builtin(global_invocation_id) gid: vec3<u32>) {
	let x = gid.x;
	let y = gid.y;
	if x >= params.width || y >= params.height { return; }

	var neighbours = 0u;
	for (var dy = -1; dy <= 1; dy++) {
		for (var dx = -1; dx <= 1; dx++) {
			if dx == 0 && dy == 0 { continue; }

			let nx = (i32(x) + dx + i32(params.width)) % i32(params.width);
			let ny = (i32(y) + dy + i32(params.height)) % i32(params.height);
			neighbours += select(0u, 1u, src[u32(ny) * params.width + u32(nx)] == 1u);
		}
	}

	let pos = y * params.width + x;
	let cur = src[pos];
	switch cur {
		case 0: { dst[pos] = select(0u, 1u, neighbours == 2u); }
		case 1: { dst[pos] = select(2u, 1u, neighbours == 3u || neighbours == 4u || neighbours == 5u); }
		default: { dst[pos] = (cur + 1) % 4; }
	}
}
